// SOUL/server/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cloudinary = require("cloudinary").v2;

// 匯入問卷路由
const preferencesRouter = require("./routes/preferences");

// 環境變數配置
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI ||
  "mongodb+srv://soulsignteam:souls115@soulsignteam.rff3iag.mongodb.net/tsl_app?retryWrites=true&w=majority";

// 初始化 Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dbmrnpwxd",
  api_key: process.env.CLOUDINARY_API_KEY || "861285683337524",
  api_secret: process.env.CLOUDINARY_API_SECRET || "gIQ_tgM4L33AeLXq_gNNFfB0Q3A",
});

const app = express();

// === 中間件配置 ===
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://yourdomain.com']
    : ['http://localhost:8081', 'http://172.20.10.3:8081'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 請求日誌中間件
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const startTime = Date.now();

  console.log(`📥 ${timestamp} - ${req.method} ${req.url}`);

  // 記錄響應時間
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`📤 ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
  });

  next();
});

// === 資料庫連接 ===
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected successfully"))
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

// === 根路由 ===
app.get('/', (req, res) => {
  res.json({
    message: 'Soul Learning Platform API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      words: '/api/book_words',
      preferences: '/api/preferences',
      categories: '/api/categories',
      recommendations: '/api/recommendations',
      stats: '/api/stats',
      materials: '/api/materials',
      status: '/api/status'
    }
  });
});

// === 掛載問卷相關 API ===
app.use("/api/preferences", preferencesRouter);

// === 詞彙相關 API ===

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

    // 根據分類篩選 (使用 category 欄位)
    if (category) {
      query.category = category;
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
      query.learning_level = level;
    }

    // 根據分類篩選 (使用 category 欄位)
    if (category) {
      query.category = category;
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

// 新增：獲取所有可用的分類
app.get("/api/categories", async (req, res) => {
  try {
    // 使用 category 欄位而不是 categories 陣列，避免 nan 值
    const categories = await BookWord.aggregate([
      {
        $match: {
          category: { $exists: true, $ne: null, $ne: "", $ne: "nan" }
        }
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const learning_levels = await BookWord.distinct("learning_level", {
      learning_level: { $exists: true, $ne: null, $ne: "", $ne: "nan" }
    });

    const contexts = await BookWord.distinct("context", {
      context: { $exists: true, $ne: null, $ne: "", $ne: "nan" }
    });

    const frequencies = await BookWord.distinct("frequency", {
      frequency: { $exists: true, $ne: null, $ne: "", $ne: "nan" }
    });

    const volumes = await BookWord.distinct("volume", {
      volume: { $exists: true, $ne: null, $ne: "", $ne: "nan" }
    });

    res.json({
      categories: categories.map(cat => ({ name: cat._id, count: cat.count })),
      learning_levels: learning_levels.filter(level => level && level !== "nan"),
      contexts: contexts.filter(context => context && context !== "nan"),
      frequencies: frequencies.filter(freq => freq && freq !== "nan"),
      volumes: volumes.filter(vol => vol && vol !== "nan")
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

// 新增：批量更新詞匯分級
app.post("/api/book_words/batch_update", async (req, res) => {
  try {
    const { updates } = req.body;

    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({ error: "需要提供updates陣列" });
    }

    let updated_count = 0;
    let error_count = 0;

    for (const updateRequest of updates) {
      try {
        const { filter, update } = updateRequest;
        const result = await BookWord.updateOne(filter, { $set: update });

        if (result.modifiedCount > 0) {
          updated_count++;
        }
      } catch (error) {
        error_count++;
        console.error("批量更新單個詞匯失敗:", error);
      }
    }

    res.json({
      updated_count,
      error_count,
      total_requested: updates.length
    });

  } catch (err) {
    console.error("批量更新失敗:", err);
    res.status(500).json({ error: "批量更新失敗" });
  }
});

// 新增：獲取分級統計
app.get("/api/book_words/level_stats", async (req, res) => {
  try {
    const stats = await BookWord.aggregate([
      {
        $group: {
          _id: "$learning_level",
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {};
    stats.forEach(stat => {
      result[stat._id] = stat.count;
    });

    res.json(result);
  } catch (err) {
    console.error("獲取分級統計失敗:", err);
    res.status(500).json({ error: "獲取分級統計失敗" });
  }
});

// === 新增詞彙 API ===
app.post("/api/vocabularies", async (req, res) => {
  try {
    console.log("✅ 收到請求內容：", req.body);

    const newVocab = new Vocabulary(req.body);
    await newVocab.save();

    console.log("✅ 寫入成功：", newVocab);

    res.status(201).json({ message: "新增成功！", data: newVocab });
  } catch (err) {
    console.error("❌ 儲存失敗：", err);
    res.status(500).json({ error: "新增失敗" });
  }
});

// === Cloudinary 圖片 API ===
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
  res.status(500).json({
    error: err.message || "伺服器錯誤",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
});

//  伺服器狀態檢查端點
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

// ====== 啟動伺服器 ======
const startServer = () => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server is running at http://0.0.0.0:${PORT}`);
    console.log(`🌐 Network access: http://172.20.10.3:${PORT}`);
    console.log(`📱 Mobile access: http://172.20.10.3:${PORT}`);
    console.log(`⏰ Started at: ${new Date().toISOString()}`);

    // 顯示可用的 API 端點
    console.log('\n📋 Available API endpoints:');
    console.log('  📚 GET  /api/book_words - 獲取單詞資料');
    console.log('  📝 POST /api/preferences - 儲存/更新問卷回答');
    console.log('  🔍 GET  /api/preferences/:userId - 查詢使用者問卷');
    console.log('  📊 GET  /api/categories - 獲取分類資料');
    console.log('  🎯 GET  /api/recommendations - 獲取推薦詞彙');
    console.log('  📈 GET  /api/stats - 獲取統計資料');
    console.log('  🔄 POST /api/book_words/batch_update - 批量更新');
    console.log('  📖 GET  /api/materials - 獲取教材資料');
    console.log('  🏥 GET  /api/status - 伺服器狀態檢查');
    console.log('  ☁️  GET  /api/cloudinary-images - Cloudinary 圖片');
  });
};

// 處理未捕獲的異常
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕獲的異常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未處理的 Promise 拒絕:', reason);
  process.exit(1);
});

// 優雅關閉
process.on('SIGTERM', () => {
  console.log('👋 接收到 SIGTERM 信號，正在關閉伺服器...');
  mongoose.connection.close(() => {
    console.log('✅ MongoDB 連接已關閉');
    process.exit(0);
  });
});

startServer();
