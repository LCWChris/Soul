#translate_backend/main.py
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
import os
from datetime import datetime

app = FastAPI()

# CORS 設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 建議可限制為 ["http://localhost:8081"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 定義接收的 JSON 結構
class Base64VideoInput(BaseModel):
    filename: str
    content_base64: str

@app.post("/translate-video")
async def translate_video(payload: Base64VideoInput):
    try:
        # 取出 base64 內容（去除 data:video/mp4;base64, 前綴）
        base64_data = payload.content_base64.split(",")[-1]
        video_bytes = base64.b64decode(base64_data)

        # 儲存影片
        save_dir = "uploads"
        os.makedirs(save_dir, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        file_path = os.path.join(save_dir, f"{timestamp}_{payload.filename}")
        with open(file_path, "wb") as f:
            f.write(video_bytes)

        # 模擬翻譯結果
        return {"translation": "你好，這是模擬的翻譯結果"}

    except Exception as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

#uvicorn main:app --reload --host 0.0.0.0 --port 8000