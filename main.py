from fastapi import FastAPI
from pydantic import BaseModel
from chatbot_logic import chat,  messages  
from fastapi.middleware.cors import CORSMiddleware
from fastapi import UploadFile,File
from resume_parser_logic import read_pdf, read_docx, match_jd
from pathlib import Path
import json
from fastapi.responses import StreamingResponse


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
    file_path = Path(file.filename)
    with open(file_path, "wb") as f:
        f.write(file.file.read())
    if file_path.suffix.lower() == ".pdf":
        jd_text = read_pdf(file_path)

    elif file_path.suffix.lower() == ".docx":
        jd_text = read_docx(file_path)

    else:
        return {"error": "Only PDF and DOCX files are supported."}
    
    with open("candidate_profile.json", "r", encoding="utf-8") as f:
        candidate_profile = json.load(f)
    result=match_jd(jd_text,candidate_profile)
    return result
    
    