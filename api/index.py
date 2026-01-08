from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import json
import tempfile
from dotenv import load_dotenv


load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))



# Imports moved inside handlers to prevent startup crashes
# try:
#     from parsing_service import extract_resume_data
#     from github_get import analyze_github_profile, match_projects, audit_repo
#     from llm import analyze_career_profile, extract_username_from_links
# except ImportError:
#     import sys
#     sys.path.append(os.path.dirname(os.path.abspath(__file__)))
#     from parsing_service import extract_resume_data
#     from github_get import analyze_github_profile, match_projects, audit_repo
#     from llm import analyze_career_profile, extract_username_from_links

app = FastAPI(title="Resume Analyzer API")

from fastapi.requests import Request
from fastapi.responses import JSONResponse
import traceback

@app.exception_handler(500)
async def internal_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"message": "Internal Server Error", "detail": str(exc), "traceback": traceback.format_exc()},
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/analyze")
async def analyze_resume(
    file: UploadFile = File(...),
    job_category: str = Form(None),
    job_role: str = Form(None),
    experience_level: str = Form(None)
):
    """
    Endpoint to upload a PDF resume and get a JSON analysis.
    """

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")



    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
        shutil.copyfileobj(file.file, tmp_file)
        tmp_path = tmp_file.name

    try:
        print(f"Processing file: {file.filename}")



        try:
            from parsing_service import extract_resume_data
            from llm import analyze_career_profile, extract_username_from_links
            from github_get import analyze_github_profile, match_projects, audit_repo
        except ImportError as e:
            raise HTTPException(status_code=500, detail=f"Import Error: {str(e)}")

        resume_text, resume_urls = extract_resume_data(tmp_path)


        username = extract_username_from_links(resume_urls)
        verified_projects = []

        if username:
            print(f"Detected Username: {username}")
            gh_data = analyze_github_profile(username)
            if gh_data.get('status') == 'success':
                verified_projects = match_projects(resume_text, resume_urls, gh_data['repos'])
                # Run Audit
                for project in verified_projects:
                    audit = audit_repo(project['name'], username)
                    project['audit'] = audit
            else:
                print(f"GitHub Error: {gh_data.get('message')}")



        user_context = {
            "category": job_category,
            "role": job_role,
            "level": experience_level
        }
        analysis_json_str = analyze_career_profile(resume_text, verified_projects, user_context)


        try:

            clean_str = analysis_json_str.strip()
            if clean_str.startswith("```json"):
                clean_str = clean_str[7:]
            elif clean_str.startswith("```"):
                clean_str = clean_str[3:]

            if clean_str.endswith("```"):
                clean_str = clean_str[:-3]

            analysis_data = json.loads(clean_str.strip())
        except json.JSONDecodeError:

            print("Failed to parse JSON from LLM response. Returning raw output.")
            analysis_data = {
                "raw_output": analysis_json_str,
                "error": "Failed to parse JSON response from LLM"
            }

        return JSONResponse(content=analysis_data)

    except Exception as e:
        print(f"Error processing resume: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:

        if os.path.exists(tmp_path):
            os.remove(tmp_path)

@app.get("/")
def read_root():
    return {"message": "Resume Analyzer API is running. POST to /analyze to parse a resume."}

@app.post("/api/match")
async def match_resume(file: UploadFile = File(...), jd: str = Form(...)):
    """
    Endpoint to upload a PDF resume AND a Job Description string.
    Returns a match analysis JSON.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
        shutil.copyfileobj(file.file, tmp_file)
        tmp_path = tmp_file.name

    try:

        resume_text, _ = extract_resume_data(tmp_path)




        if 'compare_resume_to_job' not in globals():
             from llm import compare_resume_to_job

        match_json_str = compare_resume_to_job(resume_text, jd)


        try:
             clean_str = match_json_str.strip()
             if clean_str.startswith("```json"): clean_str = clean_str[7:]
             if clean_str.endswith("```"): clean_str = clean_str[:-3]
             match_data = json.loads(clean_str.strip())
        except:
             match_data = {"raw": match_json_str, "error": "JSON Parse Error"}

        return JSONResponse(content=match_data)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
