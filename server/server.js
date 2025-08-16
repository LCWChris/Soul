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

// 添加請求日誌中間件
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url}`);
  next();
});

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
  // 新增的分類欄位
  categories: [String],        // 主題分類陣列
  learning_level: String,      // 學習難度 (beginner/intermediate/advanced)
  context: String,            // 使用情境
  frequency: String,          // 使用頻率 (high/medium/low)
  searchable_text: String,    // 搜尋文字
  volume: String,             // 冊數
  lesson: String,             // 課數
  page: Number               // 頁數
});

// 使用 book_words collection
const BookWord = mongoose.model("BookWord", VocabSchema, "book_words");

app.get("/api/book_words", async (req, res) => {
  try {
    const { level, category, search, learning_level, context, frequency, volume, lesson } = req.query;
    let query = {};

    // 根據舊的等級篩選 (level 欄位)
    if (level) {
      query.level = level;
    }

    // 根據新的學習難度篩選 (learning_level 欄位)
    if (learning_level) {
      query.learning_level = learning_level;
    }

    // 根據分類篩選 (categories 陣列)
    if (category) {
      query.categories = { $in: [category] };
    }

    // 根據情境篩選
    if (context) {
      query.context = context;
    }

    // 根據頻率篩選
    if (frequency) {
      query.frequency = frequency;
    }

    // 根據冊數篩選
    if (volume) {
      query.volume = volume;
    }

    // 根據課數篩選
    if (lesson) {
      query.lesson = lesson;
    }

    // 根據搜尋關鍵字篩選 (使用 searchable_text 和 title)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { searchable_text: { $regex: search, $options: "i" } }
      ];
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

// 新增：獲取所有可用的分類
app.get("/api/categories", async (req, res) => {
  try {
    const categories = await BookWord.aggregate([
      { $unwind: "$categories" },
      { $group: { _id: "$categories", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const learning_levels = await BookWord.distinct("learning_level");
    const contexts = await BookWord.distinct("context");
    const frequencies = await BookWord.distinct("frequency");
    const volumes = await BookWord.distinct("volume");
    
    res.json({
      categories: categories.map(cat => ({ name: cat._id, count: cat.count })),
      learning_levels,
      contexts,
      frequencies,
      volumes
    });
  } catch (err) {
    console.error("獲取分類失敗:", err);
    res.status(500).json({ error: "獲取分類失敗" });
  }
});

// 新增：獲取推薦詞彙
app.get("/api/recommendations", async (req, res) => {
  try {
    const { learning_level = 'beginner', limit = 10 } = req.query;
    
    // 獲取高頻詞彙
    const highFrequencyWords = await BookWord.find({
      learning_level,
      frequency: 'high'
    }).limit(parseInt(limit));
    
    // 如果高頻詞彙不足，補充中頻詞彙
    if (highFrequencyWords.length < limit) {
      const remaining = parseInt(limit) - highFrequencyWords.length;
      const mediumFrequencyWords = await BookWord.find({
        learning_level,
        frequency: 'medium'
      }).limit(remaining);
      
      res.json([...highFrequencyWords, ...mediumFrequencyWords]);
    } else {
      res.json(highFrequencyWords);
    }
  } catch (err) {
    console.error("獲取推薦詞彙失敗:", err);
    res.status(500).json({ error: "獲取推薦詞彙失敗" });
  }
});

// 新增：獲取學習統計
app.get("/api/stats", async (req, res) => {
  try {
    const totalWords = await BookWord.countDocuments();
    
    const levelStats = await BookWord.aggregate([
      { $group: { _id: "$learning_level", count: { $sum: 1 } } }
    ]);
    
    const categoryStats = await BookWord.aggregate([
      { $unwind: "$categories" },
      { $group: { _id: "$categories", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    res.json({
      total: totalWords,
      by_level: levelStats,
      by_category: categoryStats
    });
  } catch (err) {
    console.error("獲取統計失敗:", err);
    res.status(500).json({ error: "獲取統計失敗" });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
  console.log(`🌐 Network access: http://172.20.10.3:${port}`);
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
// 🔧 API 連接測試端點
app.get("/api/test", (req, res) => {
  res.json({
    status: "success",
    message: "伺服器連接正常",
    timestamp: new Date().toISOString(),
    server: "Soul Learning App API",
  });
});

// 📊 伺服器狀態檢查端點
app.get("/api/status", async (req, res) => {
  try {
    // 檢查資料庫連接
    const dbStatus =
      mongoose.connection.readyState === 1 ? "connected" : "disconnected";

    // 獲取單詞數量
    const wordCount = await BookWord.countDocuments();

    res.json({
      status: "healthy",
      database: dbStatus,
      wordCount: wordCount,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// 移除重複的 app.listen
