# SOUL/app/(tabs)/translation/backend/main.py

from fastapi import FastAPI, UploadFile, File, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid
from model_infer import predict  # ✅ 模型推論
from dotenv import load_dotenv
import motor.motor_asyncio
from datetime import datetime

# 讀取 .env（可設定 MONGO_URL）
load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ MongoDB 設定（選擇性）
MONGO_URL = os.getenv("MONGO_URL")
if MONGO_URL:
    mongo_client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
    db = mongo_client.tsl_app
    vocab_collection = db.vocabularies

@app.post("/translate")
async def translate(file: UploadFile = File(...)):
    try:
        filename = f"{uuid.uuid4()}.mp4"
        save_dir = "temp_videos"
        os.makedirs(save_dir, exist_ok=True)
        file_path = os.path.join(save_dir, filename)

        with open(file_path, "wb") as f:
            f.write(await file.read())

        top3 = predict(file_path)  # 返回 list[dict]
        os.remove(file_path)

        if top3:
            best = top3[0]
            result_text = f"{best['label']}（信心值：{best['confidence']*100:.1f}%）"
        else:
            result_text = "未知手語"

        print("🔍 Top-3 預測：", top3)
        return JSONResponse(content={"translation": result_text})

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/save-cloudinary-url")
async def save_cloudinary_url(request: Request):
    try:
        data = await request.json()
        title = data.get("title")
        video_url = data.get("video_url")

        print(f"✅ 收到影片標題：{title}")
        print(f"✅ Cloudinary 影片網址：{video_url}")

        # ✅ 儲存進 MongoDB（若已設定）
        if MONGO_URL:
            record = {
                "title": title,
                "video_url": video_url,
                "created_by": "frontend",
                "created_at": datetime.utcnow().isoformat(),
            }
            result = await vocab_collection.insert_one(record)
            print(f"✅ MongoDB 已儲存，_id: {result.inserted_id}")

        return JSONResponse(content={"message": "URL 已儲存"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
