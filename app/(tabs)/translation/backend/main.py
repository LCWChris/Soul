# SOUL/app/(tabs)/translation/backend/main.py
from fastapi import FastAPI, UploadFile, File, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/translate")
async def translate(file: UploadFile = File(...)):
    try:
        # ① 產生唯一檔名
        filename = f"{uuid.uuid4()}.mp4"
        save_dir = "temp_videos"
        os.makedirs(save_dir, exist_ok=True)
        file_path = os.path.join(save_dir, filename)

        # ② 儲存檔案
        with open(file_path, "wb") as f:
            f.write(await file.read())

        # ③ 執行模型推論（目前假設回傳固定文字）
        result = "這是翻譯結果（模擬）"

        # ④ 可選：刪除檔案（若不需要保留）
        os.remove(file_path)

        return JSONResponse(content={"translation": result})

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
@app.post("/save-cloudinary-url")
async def save_cloudinary_url(request: Request):
    data = await request.json()
    title = data.get("title")
    video_url = data.get("video_url")

    # ✅ 你可以在這裡存進資料庫，或列印
    print(f"收到影片標題：{title}")
    print(f"Cloudinary 影片網址：{video_url}")

    return JSONResponse(content={"message": "URL 已儲存"})
#cd app/(tabs)/translation/backend
#uvicorn main:app --reload
