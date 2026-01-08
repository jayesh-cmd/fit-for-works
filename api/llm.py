import os
import re
import json
import requests
from groq import Groq
from dotenv import load_dotenv


try:
    from parsing_service import extract_resume_data
    from github_get import analyze_github_profile, match_projects, audit_repo
except ImportError:
    import sys
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from parsing_service import extract_resume_data
    from github_get import analyze_github_profile, match_projects, audit_repo

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

def extract_username_from_links(links):
    """
    Attempts to extract a GitHub username from a list of GitHub URLs.
    Returns the first valid username found.
    """
    for link in links:
        match = re.search(r"github\.com/([a-zA-Z0-9-]+)(?:/|$)", link)
        if match:
            return match.group(1)
    return None

def call_gemini_rest_api(prompt, api_key):
    """
    Calls Gemini 1.5 Flash via REST API to avoid heavy google-generativeai SDK.
    """
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    headers = {'Content-Type': 'application/json'}
    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }],
        "generationConfig": {
            "response_mime_type": "application/json",
            "temperature": 0
        }
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        result = response.json()
        
        # Extract text from response structure
        # { "candidates": [ { "content": { "parts": [ { "text": "..." } ] } } ] }
        if 'candidates' in result and result['candidates']:
            candidate = result['candidates'][0]
            if 'content' in candidate and 'parts' in candidate['content']:
                return candidate['content']['parts'][0]['text']
        
        return f'{{"error": "Empty or unexpected response from Gemini API", "details": "{str(result)}"}}'
        
    except Exception as e:
        print(f"   ⚠️ Gemini REST API failed: {e}")
        raise e

def analyze_career_profile(resume_text, github_projects=None, user_context=None):
    """
    Analyzes the candidate's profile using Gemini (primary) with Groq as fallback.
    """
    gemini_key = os.getenv("GEMINI_API_KEY")
    groq_key = os.getenv("GROQ_API_KEY")

    if not gemini_key and not groq_key:
        return "⚠️  No API keys found. Please set GEMINI_API_KEY or GROQ_API_KEY in .env."


    context_str = ""
    if user_context:
        role = user_context.get('role') or "Software Engineer"
        level = user_context.get('level') or "Mid-Level"
        category = user_context.get('category') or "Tech"
        context_str = (
            f"CONTEXT: The candidate is applying for a '{role}' role at the '{level}' level in '{category}'. "
            "Evaluate them strictly according to the expectations of this specific level and role."
        )

    if github_projects:

        project_summaries = []
        for p in github_projects:
            project_summaries.append(
                f"- **{p['name']}**: {p.get('description', 'No description')}\n"
                f"  Tech: {', '.join(p.get('languages', []))}\n"
                f"  Stars: {p['stars']}\n"
                f"  Match Reason: {p['match_reason']}\n"
                f"  Audit: {p.get('audit', {}).get('summary', 'Not Audited')}"
            )
        projects_str = "\n".join(project_summaries)

        prompt = (
            "You are a helpful Mentor and expert Technical Recruiter. "
            "I will provide you with a candidate's Resume (parsed text) and a list of their verified GitHub projects.\n\n"
            f"{context_str}\n\n"
            "IMPORTANT: You must output JSON.\n\n"

            "YOUR TASK:\n"
            "1. **Domain Match Check**: First, determine if the resume matches the target role/domain. Consider: Does the candidate have relevant experience, skills, or education for the target role?\n"
            "2. **ATS Score**: Calculate a fair ATS score (0-100) based on relevance and formatting.\n"
            "3. **Strengths**: What is this candidate doing well? (e.g. good action verbs, clear layout).\n"
            "4. **Detailed Improvements**:\n"
            "   - IF ATS SCORE < 90: Provide 5-10 SPECIFIC, ACTIONABLE improvements.\n"
            "   - IF ATS SCORE >= 90: Provide 0-3 improvements only if strictly necessary.\n"
            "   - For each improvement:\n"
            "     - Specify the EXACT section (e.g., 'Experience', 'Projects')\n"
            "     - Specify the EXACT item/entry name\n"
            "     - Quote the ORIGINAL text that needs changing\n"
            "     - Provide the SUGGESTED replacement text\n"
            "     - Explain WHY this change improves the resume\n"
            "5. **GitHub Feedback**: Review the projects. Do they have READMEs? Requirements? Are they complex enough?\n"
            "6-10. Rate various aspects out of 10.\n"
            "11. **Summary**: A kind, guiding summary of their profile.\n\n"

            "DOMAIN MISMATCH HANDLING:\n"
            "- If the resume background doesn't align with the target role, set domain_mismatch to true.\n"
            "- Provide helpful guidance on how to transition.\n"
            "- Focus improvements on bridging the gap, not on what's 'wrong'.\n\n"

            "SCORING RULES (STRICTLY FOLLOW):\n"
            "- Be GENUINE and HONEST with all scores. Do NOT give inflated scores.\n"
            "- Score 9-10: Exceptional, professional-level quality\n"
            "- Score 7-8: Good, meets industry standards\n"
            "- Score 5-6: Average, needs improvement\n"
            "- Score 3-4: Below average, significant issues\n"
            "- Score 1-2: Poor, major problems\n\n"

            "=== RESUME CONTENT ===\n"
            f"{resume_text[:15000]}\n\n"

            "=== VERIFIED GITHUB PROJECTS ===\n"
            f"{projects_str}\n\n"

            "OUTPUT FORMAT:\n"
            "STRICTLY return a valid JSON object. No Markdown.\n"
            "Schema:\n"
            "{\n"
            "  \"ats_score\": <0-100 integer>,\n"
            "  \"domain_mismatch\": <true/false>,\n"
            "  \"domain_mismatch_advice\": \"<if mismatch, provide helpful career transition advice, otherwise null>\",\n"
            "  \"summary\": \"<helpful, encouraging summary string>\",\n"
            "  \"strengths\": [\"<strength 1>\", \"<strength 2>\", \"<strength 3>\"],\n"
            "  \"improvements\": [\"<brief summary tip 1>\", \"<tip 2>\", \"<tip 3>\"],\n"
            "  \"detailed_improvements\": [\n"
            "    {\n"
            "      \"section\": \"<e.g., Projects, Experience, Skills, Education, Summary>\",\n"
            "      \"item\": \"<e.g., InsightLens, Software Engineer at Google, Python skill>\",\n"
            "      \"location\": \"<e.g., Bullet point 2, Line 1, Skills list>\",\n"
            "      \"original_text\": \"<exact text from resume that needs change>\",\n"
            "      \"suggested_text\": \"<improved replacement text>\",\n"
            "      \"reason\": \"<why this change helps - e.g., adds quantifiable impact, uses action verbs>\"\n"
            "    }\n"
            "  ],\n"
            "  \"github_feedback\": \"<specific feedback about repos>\",\n"
            "  \"content_quality\": <1-10>,\n"
            "  \"ats_structure\": <1-10>,\n"
            "  \"job_optimization\": <1-10>,\n"
            "  \"writing_quality\": <1-10>,\n"
            "  \"application_ready\": <1-10>\n"
            "}"
        )
    else:

        prompt = (
            "You are a helpful Mentor and expert Technical Recruiter. "
            "I will provide you with a candidate's Resume (parsed text). No verified GitHub projects were found linked in the resume.\n\n"
            f"{context_str}\n\n"
            "IMPORTANT: You must output JSON.\n\n"

            "YOUR TASK:\n"
            "1. **Domain Match Check**: Determine if the resume matches the target role/domain.\n"
            "2. **ATS Score**: Calculate a fair ATS score (0-100).\n"
            "3. **Strengths**: What is this candidate doing well?\n"
            "4. **Detailed Improvements**:\n"
            "   - IF ATS SCORE < 90: Provide 5-10 SPECIFIC, ACTIONABLE improvements.\n"
            "   - IF ATS SCORE >= 90: Provide 0-3 improvements only if strictly necessary.\n"
            "   - For each improvement:\n"
            "     - Specify the EXACT section (e.g., 'Experience', 'Projects')\n"
            "     - Specify the EXACT item/entry name\n"
            "     - Quote the ORIGINAL text that needs changing\n"
            "     - Provide the SUGGESTED replacement text\n"
            "     - Explain WHY this change improves the resume\n"
            "5. **GitHub Feedback**: Mention that no projects were linked and why that matters.\n"
            "6-10. Rate various aspects out of 10.\n"
            "11. **Summary**: A kind, encouraging summary.\n\n"

            "DOMAIN MISMATCH HANDLING:\n"
            "- If the resume background doesn't align with the target role, set domain_mismatch to true.\n"
            "- Provide helpful guidance on how to transition careers.\n"
            "- Focus improvements on bridging the gap.\n\n"

            "SCORING RULES:\n"
            "- Be GENUINE and HONEST with all scores.\n"
            "- Score 9-10: Exceptional | 7-8: Good | 5-6: Average | 3-4: Below average | 1-2: Poor\n\n"

            "=== RESUME CONTENT ===\n"
            f"{resume_text[:15000]}\n\n"

            "OUTPUT FORMAT:\n"
            "STRICTLY return a valid JSON object. No Markdown.\n"
            "Schema:\n"
            "{\n"
            "  \"ats_score\": <0-100 integer>,\n"
            "  \"domain_mismatch\": <true/false>,\n"
            "  \"domain_mismatch_advice\": \"<if mismatch, provide helpful career transition advice, otherwise null>\",\n"
            "  \"summary\": \"<helpful, encouraging summary string>\",\n"
            "  \"strengths\": [\"<strength 1>\", \"<strength 2>\", \"<strength 3>\"],\n"
            "  \"improvements\": [\"<brief summary tip 1>\", \"<tip 2>\", \"<tip 3>\"],\n"
            "  \"detailed_improvements\": [\n"
            "    {\n"
            "      \"section\": \"<e.g., Projects, Experience, Skills, Education, Summary>\",\n"
            "      \"item\": \"<e.g., InsightLens, Software Engineer at Google>\",\n"
            "      \"location\": \"<e.g., Bullet point 2, Line 1>\",\n"
            "      \"original_text\": \"<exact text from resume that needs change>\",\n"
            "      \"suggested_text\": \"<improved replacement text>\",\n"
            "      \"reason\": \"<why this change helps>\"\n"
            "    }\n"
            "  ],\n"
            "  \"github_feedback\": \"<advice on adding projects>\",\n"
            "  \"content_quality\": <1-10>,\n"
            "  \"ats_structure\": <1-10>,\n"
            "  \"job_optimization\": <1-10>,\n"
            "  \"writing_quality\": <1-10>,\n"
            "  \"application_ready\": <1-10>\n"
            "}"
        )


    if gemini_key:
        try:
            print("   🤖 Using Gemini 1.5 Flash (primary - REST)...")
            return call_gemini_rest_api(prompt, gemini_key)

        except Exception as gemini_error:
            print(f"   ⚠️ Gemini failed: {gemini_error}")
            print("   🔄 Falling back to Groq...")


    if groq_key:
        try:
            print("   🦙 Using Groq/Llama (fallback)...")
            client = Groq(api_key=groq_key)

            chat_completion = client.chat.completions.create(
                messages=[{
                    "role": "user",
                    "content": prompt,
                }],
                model="llama-3.3-70b-versatile",
                temperature=0,
                response_format={"type": "json_object"}
            )

            return chat_completion.choices[0].message.content

        except Exception as groq_error:
            return f'{{ "error": "LLM Analysis Failed", "details": "{str(groq_error)}" }}'

    return '{ "error": "No LLM API keys available" }'

def compare_resume_to_job(resume_text, job_description):
    """
    Compares a resume against a specific job description using Gemini (primary) with Groq as fallback.
    """
    gemini_key = os.getenv("GEMINI_API_KEY")
    groq_key = os.getenv("GROQ_API_KEY")

    if not gemini_key and not groq_key:
        return "⚠️  No API keys found."

    prompt = (
        "You are an expert Technical Recruiter. I will provide a Candidate's Resume and a Job Description (JD).\n\n"

        "YOUR TASK:\n"
        "Analyze how well the candidate fits this SPECIFIC role.\n"
        "1. Calculate Match Score (0-100).\n"
        "2. IF SCORE < 75:\n"
        "   - Set 'detailed_improvements' to empty list [].\n"
        "   - In 'recommendation', explain clearly why the match is low (e.g. missing critical skills).\n"
        "3. IF SCORE >= 75:\n"
        "   - Provide 5-10 SPECIFIC, ACTIONABLE 'detailed_improvements' to perfect the resume.\n\n"

        "OUTPUT FORMAT:\n"
        "STRICTLY return a valid JSON object. No Markdown.\n"
        "Schema:\n"
        "{\n"
        "  \"match_score\": 0,\n"
        "  \"potential_score\": 0,\n"
        "  \"recommendation\": \"Summary verdict.\",\n"
        "  \"missing_keywords\": [\"List\", \"missing\"],\n"
        "  \"matching_keywords\": [\"List\", \"matching\"],\n"
        "  \"improvements\": [\"General tip 1\", \"General tip 2\"],\n"
        "  \"detailed_improvements\": [\n"
        "    {\n"
        "      \"section\": \"<e.g., Experience, Projects, Skills>\",\n"
        "      \"item\": \"<e.g., Project name, Job title>\",\n"
        "      \"location\": \"<e.g., Bullet point 2, Skills list>\",\n"
        "      \"original_text\": \"<exact text from resume that needs change>\",\n"
        "      \"suggested_text\": \"<improved text that includes JD keywords>\",\n"
        "      \"reason\": \"<why this helps match the JD better>\"\n"
        "    }\n"
        "  ],\n"
        "  \"gap_analysis\": {\n"
        "     \"technical_gaps\": [\"Specific missing tech\"],\n"
        "     \"soft_skill_gaps\": [\"Missing soft skills\"]\n"
        "  },\n"
        "  \"tailoring_advice\": [\"3-4 bullet points on how to tweak the resume for this specific JD\"]\n"
        "}\n\n"

        "=== JOB DESCRIPTION ===\n"
        f"{job_description[:5000]}\n\n"

        "=== RESUME ===\n"
        f"{resume_text[:10000]}\n"
    )


    if gemini_key:
        try:
            print("   🤖 Using Gemini 1.5 Flash (primary - REST)...")
            return call_gemini_rest_api(prompt, gemini_key)

        except Exception as gemini_error:
            print(f"   ⚠️ Gemini failed: {gemini_error}")
            print("   🔄 Falling back to Groq...")


    if groq_key:
        try:
            print("   🦙 Using Groq/Llama (fallback)...")
            client = Groq(api_key=groq_key)

            chat_completion = client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama-3.3-70b-versatile",
                temperature=0.1,
                response_format={"type": "json_object"}
            )

            return chat_completion.choices[0].message.content

        except Exception as groq_error:
            return f'{{ "error": "LLM Match Failed", "details": "{str(groq_error)}" }}'

    return '{ "error": "No LLM API keys available" }'

def main():

    resume_path = r"/Users/jayeshvishwakarma/Documents/Documents/Stuffs/Solo Build/backend/services/Jayesh SWE Resume.pdf"

    if not os.path.exists(resume_path):
        print(f"❌ Resume not found at: {resume_path}")
        return

    print(f"📄 1. Parsing Resume: {os.path.basename(resume_path)}...")
    resume_text, resume_urls = extract_resume_data(resume_path)
    print(f"   (Extracted {len(resume_urls)} GitHub links)")


    username = extract_username_from_links(resume_urls)
    verified_projects = []

    if username is None:
        print("⚠️  No GitHub username found in links. Cannot fuzzy match projects.")
        print("   (Will proceed with Resume-Only analysis)")
    else:
        print(f"🔍 2. Detected GitHub Username: {username}")
        print(f"   Fetching metadata from GitHub...")


        gh_data = analyze_github_profile(username)

        if gh_data['status'] == 'success':
            print("   Matching projects against Resume...")
            verified_projects = match_projects(resume_text, resume_urls, gh_data['repos'])

            if verified_projects:
                 # Run the Audit Quality Check on matched projects
                for project in verified_projects:
                    audit = audit_repo(project['name'], username)
                    project['audit'] = audit
        else:
             print(f"   ❌ GitHub Fetch Error: {gh_data['message']}")


    print("\n" + "="*60)
    print(f"   🚀 AUTO-GENERATED AUDIT REPORT")
    print("="*60)

    if verified_projects:
        print(f"✅ Found and Verified {len(verified_projects)} Projects:")
        for p in verified_projects:
            print(f"   - {p['name']} ({p['match_reason']})")
    else:
        print("ℹ️  No specific projects verified (Resume Analysis Only).")

    print("\n🤖 4. AI Career Analysis (Groq)...")
    analysis = analyze_career_profile(resume_text, verified_projects)
    print("\n" + analysis)

if __name__ == "__main__":
    main()
