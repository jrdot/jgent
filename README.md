# JGent – VS Code Custom Agent

Cursor IDE의 Auto Agent 기능을 VS Code에서 재현하는 확장 앱입니다.

---

## 📦 기능

- 선택한 코드 + 자연어 프롬프트 → LLM 전송
- 로컬 Ollama LLM과 연동 (e.g. deepseek-coder:33b)
- Auto Mode: 응답 코드 자동 삽입
- Chat Mode: 사용자 승인 후 코드 적용
- 결과는 Webview UI에 표시

---

## 🚀 설치 및 실행

### 1. FastAPI 서버 실행

```bash
cd agent-server
pip install fastapi uvicorn requests
uvicorn main:app --reload --port 8000
