# SOUL/app/(tabs)/translation/backend/main.py
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 可限制為你的 IP
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/translate")
async def translate(file: UploadFile = File(...)):
    try:
        # 暫存影片到本地（可選）
        file_location = f"temp_videos/{file.filename}"
        os.makedirs("temp_videos", exist_ok=True)
        with open(file_location, "wb") as f:
            f.write(await file.read())

        # 👉 模型預測可接在這
        result = "這是一個模擬翻譯結果"

        # ✅ 回傳結果
        return JSONResponse(content={"translation": result})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
