# //jgent/server/agent_handler.py# server/agent_handler.py
import requests

def call_ollama(prompt, model):
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False
    }
    res = requests.post("http://localhost:11434/api/generate", json=payload)
    res.raise_for_status()
    return res.json().get("response", "")
