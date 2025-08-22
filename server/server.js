// SOUL/server/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cloudinary = require("cloudinary").v2;

// 初始化 Cloudinary
cloudinary.config({
  cloud_name: "dbmrnpwxd",
  api_key: "861285683337524",
  api_secret: "gIQ_tgM4L33AeLXq_gNNFfB0Q3A",
});

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

mongoose
  .connect(
    "mongodb+srv://soulsignteam:souls115@soulsignteam.rff3iag.mongodb.net/tsl_app?retryWrites=true&w=majority"
  )
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

const VocabSchema = new mongoose.Schema({
  title: String,
  content: String,
  level: String,
  theme: String,
  image_url: String,
  video_url: String,
  created_by: String,
  created_at: Date,
});

// 使用 book_words collection
const BookWord = mongoose.model("BookWord", VocabSchema, "book_words");

app.get("/api/book_words", async (req, res) => {
  try {
    const { level, category, search } = req.query;
    let query = {};

    // 根據等級篩選
    if (level) {
      query.level = level;
    }

    // 根據分類篩選 (theme 欄位)
    if (category) {
      query.theme = category;
    }

    // 根據搜尋關鍵字篩選 (title 欄位)
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    console.log("搜尋條件:", query);
    const data = await BookWord.find(query);
    console.log(`找到 ${data.length} 筆資料`);
    res.json(data);
  } catch (err) {
    console.error("查詢失敗:", err);
    res.status(500).json({ error: "查詢失敗" });
  }
});

// 保留原本的 vocabularies API 以避免其他地方使用
const Vocabulary = mongoose.model("Vocabulary", VocabSchema);

app.get("/api/vocabularies", async (req, res) => {
  try {
    const { level, category, search } = req.query;
    let query = {};

    // 根據等級篩選
    if (level) {
      query.level = level;
    }

    // 根據分類篩選 (theme 欄位)
    if (category) {
      query.theme = category;
    }

    // 根據搜尋關鍵字篩選 (title 欄位)
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    console.log("搜尋條件:", query);
    const data = await Vocabulary.find(query);
    console.log(`找到 ${data.length} 筆資料`);
    res.json(data);
  } catch (err) {
    console.error("查詢失敗:", err);
    res.status(500).json({ error: "查詢失敗" });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Server is running at http://0.0.0.0:${port}`);
});
app.post("/api/vocabularies", async (req, res) => {
  try {
    console.log("✅ 收到請求內容：", req.body);  // 加入這一行

    const newVocab = new Vocabulary(req.body);
    await newVocab.save();

    console.log("✅ 寫入成功：", newVocab);  // 額外 log 確認成功

    res.status(201).json({ message: "新增成功！", data: newVocab });
  } catch (err) {
    console.error("❌ 儲存失敗：", err);  // 顯示實際錯誤
    res.status(500).json({ error: "新增失敗" });
  }
});

app.get("/api/cloudinary-images", async (req, res) => {
  try {
    const result = await cloudinary.search
      .expression("resource_type:image OR resource_type:video")
      .sort_by("created_at", "desc")
      .max_results(100)
      .execute();

    const urls = result.resources.map((item) => item.secure_url);
    res.json(urls);
  } catch (err) {
    res.status(500).json({ error: "Cloudinary 查詢失敗", detail: err });
  }
});
// === 教材模型 ===
const MaterialSchema = new mongoose.Schema(
  {
    unit: { type: String, required: true },
    volume: { type: Number, required: true },
    image: { type: String, default: "" },
    content: [
      {
        sign_text: { type: String, default: "" },
        spoken_text: { type: String, default: "" },
      },
    ],
  },
  { timestamps: true }
);

// 第三個參數指定 collection 名稱
const Material = mongoose.model("Material", MaterialSchema, "material_image");

app.get("/api/materials", async (req, res) => {
  try {
    const { volume } = req.query;
    let query = {};
    if (volume !== undefined) {
      const volNum = Number(volume);
      if (Number.isNaN(volNum)) {
        return res.status(400).json({ error: "volume 需為數字" });
      }
      query = { volume: volNum };
    }
    const list = await Material.find(query, "_id unit volume").lean();
    res.json(list);
  } catch (err) {
    console.error("讀取資料錯誤：", err);
    res.status(500).json({ error: "伺服器錯誤" });
  }
});

// 2) 直接回所有冊別（去重 + 排序）
app.get("/api/volumes", async (req, res) => {
  try {
    const volumes = await Material.distinct("volume");
    volumes.sort((a, b) => a - b);
    res.json(volumes);
  } catch (err) {
    console.error("取得冊別失敗：", err);
    res.status(500).json({ error: "伺服器錯誤" });
  }
});

// 3) 取得單一教材詳細
app.get("/api/material/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "無效的 ID 格式" });
    }

    const material = await Material.findById(id).lean();
    if (!material) {
      return res.status(404).json({ error: "找不到資料" });
    }
    res.json(material);
  } catch (err) {
    console.error("讀取教材失敗：", err);
    res.status(500).json({ error: "伺服器錯誤" });
  }
});

// === 全域錯誤處理 ===
app.use((err, req, res, next) => {
  console.error("未攔截錯誤：", err);
  res.status(500).json({ error: "伺服器錯誤" });
});

// ====== 啟動 ======
app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Server is running at http://0.0.0.0:${port}`);
});