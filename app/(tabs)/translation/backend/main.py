# soul/app/(tabs)/translation/backend/main.py
from fastapi import FastAPI, UploadFile, File, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid
# 💥 確保能正確導入新的 model_infer.py
from model_infer import predict
from dotenv import load_dotenv
import motor.motor_asyncio
from datetime import datetime
import requests

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

        top3 = predict(file_path)
        os.remove(file_path)

        if top3 and "label" in top3[0] and "error" not in top3[0]:
            best = top3[0]
            # 🚨 注意: predict 函數現在返回的 confidence 已經是 float (0.xxxx)
            result_text = f"{best['label']}（信心值：{best['confidence']*100:.1f}%）"
        elif top3 and "error" in top3[0]:
            # 處理 model_infer.py 返回的錯誤
            result_text = top3[0]['error']
        else:
            result_text = "未知手語"

        print("🔍 Top-3 預測：", top3)
        return JSONResponse(content={"translation": result_text})
    except Exception as e:
        # 捕捉檔案上傳或寫入錯誤
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/translate-by-url")
async def translate_by_url(request: Request):
    try:
        data = await request.json()
        video_url = data.get("video_url")

        if not video_url:
            return JSONResponse(status_code=400, content={"error": "video_url 缺失"})

        filename = f"{uuid.uuid4()}.mp4"
        save_dir = "temp_videos"
        os.makedirs(save_dir, exist_ok=True)
        file_path = os.path.join(save_dir, filename)

        # 下載影片
        r = requests.get(video_url, timeout=30) # 設置下載超時
        with open(file_path, "wb") as f:
            f.write(r.content)

        top3 = predict(file_path)
        os.remove(file_path)

        if top3 and "label" in top3[0] and "error" not in top3[0]:
            best = top3[0]
            result_text = f"{best['label']}（信心值：{best['confidence']*100:.1f}%）"
        elif top3 and "error" in top3[0]:
            result_text = top3[0]['error']
        else:
            result_text = "未知手語"

        print("🌐 Cloudinary URL 翻譯 Top-3：", top3)
        return JSONResponse(content={"translation": result_text})
    except Exception as e:
        # 捕捉下載或伺服器錯誤
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/save-cloudinary-url")
async def save_cloudinary_url(request: Request):
    # 此函數與模型推論無關，保持不變
    try:
        data = await request.json()
        title = data.get("title")
        video_url = data.get("video_url")

        print(f"✅ 收到影片標題：{title}")
        print(f"✅ Cloudinary 影片網址：{video_url}")

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