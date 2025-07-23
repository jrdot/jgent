# server/main.py
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from agent_handler import call_ollama

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class AgentRequest(BaseModel):
    prompt: str
    code: str
    mode: str = "chat"
    model: str = "deepseek-coder:33b"

@app.post("/agent")
async def agent(data: AgentRequest):
    prompt_full = f"{data.prompt}\n\n```code\n{data.code}\n```"
    try:
        response = call_ollama(prompt_full, data.model)
        return { "response": response }
    except Exception as e:
        return { "error": str(e) }
