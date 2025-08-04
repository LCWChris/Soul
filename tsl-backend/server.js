const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// 替換成你的 MongoDB Atlas 連線字串
const mongoURI = "mongodb+srv://soulsignteam:souls115@soulsignteam.rff3iag.mongodb.net/tsl_app?retryWrites=true&w=majority&appName=soulsignteam";

mongoose.connect(mongoURI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// 建立詞彙資料模型
const VocabSchema = new mongoose.Schema({
  title: String,
  content: String,
  level: String,
  theme: String,
  image_url: String,
  video_url: String,
  created_by: String,
  created_at: Date
});

const Vocabulary = mongoose.model("Vocabulary", VocabSchema);

// API: 取得所有詞彙
app.get("/api/vocabularies", async (req, res) => {
  try {
    const data = await Vocabulary.find({});
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "讀取資料失敗" });
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

// === 1️⃣ 列出所有教材（可用 volume 篩選） ===
// GET /api/materials?volume=1
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

    // 列表頁通常只需要基本欄位
    const list = await Material.find(query, "_id unit volume").lean();
    res.json(list);
  } catch (err) {
    console.error("讀取資料錯誤：", err);
    res.status(500).json({ error: "伺服器錯誤" });
  }
});

// === 2️⃣ 列出所有冊別（去重且排序） ===
// GET /api/volumes
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

// === 3️⃣ 取得單一教材 ===
// GET /api/material/:id
app.get("/api/material/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // 先驗證 ObjectId，避免非合法格式導致查詢例外或 404 誤判
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

// ===（可選）全域錯誤處理中介層 ===
app.use((err, req, res, next) => {
  console.error("未攔截錯誤：", err);
  res.status(500).json({ error: "伺服器錯誤" });
});

// 啟動伺服器
app.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
});
