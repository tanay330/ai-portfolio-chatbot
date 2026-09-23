from fastapi import FastAPI
from pydantic import BaseModel
from chatbot_logic import chat,  messages  
from fastapi.middleware.cors import CORSMiddleware
from fastapi import UploadFile,File
from resume_parser_logic import read_pdf, read_docx, match_jd
from pathlib import Path
import json
from fastapi.responses import StreamingResponse
import tempfile
import os


app=FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://ai-portfolio-chatbot-sandy.vercel.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message:str
    

@app.post("/chat")
def chat_endpoint(request:ChatRequest):
    return StreamingResponse(chat(request.message,messages),media_type="text/plain")

@app.post("/match-jd")
def match_jd_endpoint(file:UploadFile=File(...)):
    suffix = Path(file.filename).suffix.lower()

    if suffix not in [".pdf", ".docx"]:
        return {"error": "Only PDF and DOCX files are supported."}

    file_path = None

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_file.write(file.file.read())
            file_path = Path(temp_file.name)

        if suffix == ".pdf":
            jd_text = read_pdf(file_path)

        elif suffix == ".docx":
            jd_text = read_docx(file_path)

        with open("candidate_profile.json", "r", encoding="utf-8") as f:
            candidate_profile = json.load(f)

        result = match_jd(jd_text, candidate_profile)

        return result

    finally:
        if file_path and file_path.exists():
            os.remove(file_path)
    
    