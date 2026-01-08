from github import Github
from dotenv import load_dotenv
import os
import re
from thefuzz import fuzz
import asyncio




load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")




def analyze_github_profile(username):
    """
    Fetches all repositories for the user to compare against the resume.
    """
    if not GITHUB_TOKEN:
        return {"status": "error", "message": "Missing GITHUB_TOKEN"}

    try:
        g = Github(GITHUB_TOKEN)
        user = g.get_user(username)


        repos = list(user.get_repos())
        repo_data = []

        print(f"   (Found {len(repos)} public repositories on GitHub)")

        for repo in repos:

            repo_info = {
                "name": repo.name,
                "url": repo.html_url,
                "description": repo.description,
                "stars": repo.stargazers_count,
                "pushed_at": repo.pushed_at,
                "match_reason": None,
                "audit": {}
            }
            repo_data.append(repo_info)

        return {"status": "success", "repos": repo_data}

    except Exception as e:
        return {"status": "error", "message": str(e)}




def audit_repo(repo_obj_name, username):
    """
    Performs the file quality checks (Code, Readme, Requirements).
    Returns a summary string and specific boolean flags.
    """
    try:
        g = Github(GITHUB_TOKEN)
        repo = g.get_repo(f"{username}/{repo_obj_name}")

        contents = repo.get_contents("")
        file_names = [c.name.lower() for c in contents]


        has_readme = any(bs in file_names for bs in ["readme.md", "readme.rst", "readme", "readme.txt"])


        req_files = ["requirements.txt", "package.json", "pyproject.toml", "gemfile", "pom.xml", "go.mod", "cargo.toml", "build.gradle", "environment.yml"]
        has_requirements = any(f in file_names for f in req_files)



        code_extensions = ['.py', '.js', '.jsx', '.ts', '.tsx', '.java', '.cpp', '.c', '.cs', '.go', '.rb', '.php', '.html', '.css', '.swift', '.kt', '.rs', '.dart', '.scala', '.sh', '.bat']
        has_code = False

        for c in contents:
            if c.type == "file":
                 if any(c.name.lower().endswith(ext) for ext in code_extensions):
                     has_code = True
                     break
            elif c.type == "dir" and not c.name.startswith("."):

                has_code = True
                break


        missing = []
        if not has_code: missing.append("Code Files")
        if not has_readme: missing.append("README")
        if not has_requirements: missing.append("Requirements File")

        if not missing:
            summary = "GitHub is perfect"
        else:
            summary = "Missing: " + ", ".join(missing)

        return {
            "summary": summary,
            "has_readme": has_readme,
            "has_requirements": has_requirements,
            "has_code": has_code
        }
    except Exception as e:
        return {
            "summary": "Error accessing repo (possibly private or deleted)",
            "has_readme": False,
            "has_requirements": False,
            "has_code": False,
            "error": str(e)
        }









def match_projects(resume_text, resume_urls, github_repos):
    """
    Matches Resume Items -> GitHub Repos
    """
    matches = []
    resume_lower = resume_text.lower()



    resume_slugs = []
    for url in resume_urls:
        match = re.search(r"github\.com/[\w-]+/([\w-]+)", url)
        if match:
            resume_slugs.append(match.group(1).lower())

    slug_set = set(resume_slugs)

    for repo in github_repos:
        name_raw = repo['name'].lower()
        name_clean = name_raw.replace("-", " ").replace("_", " ")
        desc = (repo['description'] or "").lower()

        match_reason = None


        if name_raw in slug_set:
            match_reason = "URL Link in Resume"


        if not match_reason:
            if name_clean in resume_lower or name_raw in resume_lower:
                match_reason = "Name Mentioned in Resume"
            elif fuzz.partial_ratio(name_clean, resume_lower) > 90:
                match_reason = f"Fuzzy Name Match"



        if not match_reason and len(desc) > 20:


            score = fuzz.token_set_ratio(desc, resume_lower)
            if score > 75:
                 match_reason = f"Description Match ({score}%)"

        if match_reason:
            repo['match_reason'] = match_reason
            matches.append(repo)

    return matches



