from llama_parse import LlamaParse
import pdfplumber
import os
from dotenv import load_dotenv


load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))


if os.getenv("LLAMA_API_KEY"):
    os.environ["LLAMA_CLOUD_API_KEY"] = os.getenv("LLAMA_API_KEY")

def extract_resume_data(file_path):
    """
    1. LlamaParse: Get full text (Markdown) for semantic/name matching.
    2. pdfplumber: Get Hyperlinks (URLs) for 100% precision matching.
    """
    print("   🦙 Sending Resume to LlamaParse...")

    full_markdown = ""
    extracted_urls = set()


    try:
        parser = LlamaParse(result_type="markdown", verbose=True)
        documents = parser.load_data(file_path)
        full_markdown = "\n".join([doc.text for doc in documents])
    except Exception as e:
        print(f"   ❌ LlamaParse Error: {e}")


    print("   📄 Scanning PDF for Hyperlinks...")
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                if page.annots:
                    for annot in page.annots:
                        uri = annot.get('uri')
                        if uri and 'github.com' in uri:
                            extracted_urls.add(uri)
    except Exception as e:
        print(f"   ❌ PDF Banner Error: {e}")

    return full_markdown, list(extracted_urls)
