// SOUL/server/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cloudinary = require("cloudinary").v2;
const { Webhook } = require("svix"); // 新增
require("dotenv").config({ path: "../.env" });
const User = require("./models/User"); // 引入 User 模型 (修正大小寫)
// 匯入問卷路由
const preferencesRouter = require("./routes/preferences");
// 匯入學習統計路由
const learningStatsRouter = require("./routes/learningStats");

// 環境變數配置
const PORT = process.env.PORT || 3001;
const MONGODB_URI =
  process.env.MONGO_URL ||
  "mongodb+srv://soulsignteam:souls115@soulsignteam.rff3iag.mongodb.net/tsl_app?retryWrites=true&w=majority";

// 初始化 Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dbmrnpwxd",
  api_key: process.env.CLOUDINARY_API_KEY || "861285683337524",
  api_secret:
    process.env.CLOUDINARY_API_SECRET || "gIQ_tgM4L33AeLXq_gNNFfB0Q3A",
});
// 輔助函數：洗牌（Fisher-Yates 算法）
const shuffle = (array) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

// 輔助函數：從所有詞彙中隨機生成選項
const generateRandomOptions = (correctTitle, allTitles, count = 4) => {
  const distractors = allTitles.filter(title => title !== correctTitle);
  const randomDistractors = shuffle(distractors).slice(0, Math.min(count - 1, distractors.length));
  const options = [correctTitle, ...randomDistractors];

  const shuffledOptions = shuffle(options).map((title, index) => ({
    id: String.fromCharCode(65 + index),
    label: title
  }));
  return shuffledOptions;
};
// 【新功能：輔助函數：從所有詞彙的圖片中隨機生成選項】
const generateRandomImageOptions = (correctItem, allImageUrls, count = 4) => {
  const correctUrl = correctItem.image_url;
  const correctTitle = correctItem.title;

  // 從所有圖片中排除正確答案的圖片
  const distractors = allImageUrls.filter(url => url !== correctUrl);

  // 隨機選取干擾項
  const randomDistractorsUrls = shuffle(distractors).slice(0, Math.min(count - 1, distractors.length));

  const optionsUrls = shuffle([correctUrl, ...randomDistractorsUrls]);

  // 將圖片 URL 轉換為選項格式
  const options = optionsUrls.map((url, index) => ({
    id: `img_${String.fromCharCode(97 + index)}`, // 使用 img_a, img_b... 作為 ID
    // 圖片選項的 label 不重要，但為了結構完整可以放 title 或空字串
    label: url === correctUrl ? correctTitle : "",
    media: {
      image: url
    }
  }));

  return options;
};
const app = express();
// === Webhook 路由必須在其他中間件之前 ===
app.post(
  "/api/webhook",
  express.raw({ type: "application/json" }),
  async function (req, res) {
    try {
      const payloadString = req.body.toString();
      const svixHeaders = req.headers;

      const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET_KEY);
      const evt = wh.verify(payloadString, svixHeaders);
      const { id, ...attributes } = evt.data;

      const eventType = evt.type;

      if (eventType === "user.created") {
        console.log(`👤 User ${id} was ${eventType}`);

        const user = new User({
          clerkUserId: id,
          firstName: attributes.first_name,
          lastName: attributes.last_name,
          email: attributes.email_addresses[0]?.email_address,
        });

        await user.save();
        console.log("✅ User saved to MongoDB");
      }

      if (eventType === "user.updated") {
        console.log(`👤 User ${id} was ${eventType}`);

        await User.updateOne(
          { clerkUserId: id },
          {
            $set: {
              firstName: attributes.first_name,
              lastName: attributes.last_name,
              email: attributes.email_addresses[0]?.email_address,
              identity: attributes.identity,
              proficiency_level: attributes.proficiency_level,
            },
          }
        );
        console.log("✅ User updated in MongoDB");
      }

      res.status(200).json({
        success: true,
        message: "Webhook received",
      });
    } catch (err) {
      console.error("❌ Webhook error:", err.message);
      res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }
);

// === 中間件配置 ===
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production" ? ["https://yourdomain.com"] : true, // 開發環境允許所有來源
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 請求日誌中間件
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const startTime = Date.now();

  console.log(`📥 ${timestamp} - ${req.method} ${req.url}`);

  // 記錄響應時間
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    console.log(
      `📤 ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`
    );
  });

  next();
});

// === 資料庫連接 ===
mongoose
  .connect(MONGODB_URI)
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
  category: String, // 主分類
  categories: [String], // 主題分類陣列
  learning_level: String, // 學習難度 (beginner/intermediate/advanced)
  context: String, // 使用情境
  frequency: String, // 使用頻率 (high/medium/low)
  searchable_text: String, // 搜尋文字
  volume: Number, // 冊數
  lesson: Number, // 課數
  page: Number, // 頁數
});

// 使用 book_words collection (安全的模型定義)
let BookWord;
try {
  BookWord = mongoose.model("BookWord");
} catch (error) {
  BookWord = mongoose.model("BookWord", VocabSchema, "book_words");
}

// === 根路由 ===
app.get("/", (req, res) => {
  res.json({
    message: "Soul Learning Platform API",
    version: "1.0.0",
    status: "running",
    endpoints: {
      words: "/api/book_words",
      preferences: "/api/preferences",
      categories: "/api/categories",
      recommendations: "/api/recommendations",
      personalizedRecommendations: "/api/recommendations/personalized/:userId",
      stats: "/api/stats",
      materials: "/api/materials",
      status: "/api/status",
      // 學習統計相關
      learningStats: "/api/learning-stats",
      userStats: "/api/learning-stats/user/:userId",
      learningActivity: "/api/learning-stats/activity",
      learningHistory: "/api/learning-stats/history/:userId",
      achievements: "/api/learning-stats/achievements/:userId",
    },
  });
});

// === 掛載問卷相關 API ===
app.use("/api/preferences", preferencesRouter);

// === 掛載學習統計相關 API ===
app.use("/api/learning-stats", learningStatsRouter);

// === 詞彙相關 API ===

// 根據 MongoDB ID 獲取單一單字詳細資料（必須放在 /api/book_words 之前）
app.get("/api/book_words/id/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📝 查詢單字 ID: ${id}`);

    const word = await BookWord.findById(id);

    if (!word) {
      console.log(`❌ 找不到 ID 為 ${id} 的單字`);
      return res.status(404).json({ error: "找不到該單字" });
    }

    console.log(`✅ 找到單字: ${word.title}`);
    res.json(word);
  } catch (err) {
    console.error("❌ 查詢單字失敗:", err);
    res.status(500).json({ error: "查詢失敗" });
  }
});

// 根據單字名稱獲取單一單字詳細資料（必須放在 /api/book_words 之前）
app.get("/api/book_words/word/:word", async (req, res) => {
  try {
    const { word } = req.params;
    console.log(`📝 查詢單字名稱: ${word}`);

    const wordData = await BookWord.findOne({ title: word });

    if (!wordData) {
      console.log(`❌ 找不到名稱為「${word}」的單字`);
      return res.status(404).json({ error: "找不到該單字" });
    }

    console.log(`✅ 找到單字: ${wordData.title}`);
    res.json(wordData);
  } catch (err) {
    console.error("❌ 查詢單字失敗:", err);
    res.status(500).json({ error: "查詢失敗" });
  }
});

// 獲取所有單字（帶篩選條件）
app.get("/api/book_words", async (req, res) => {
  try {
    const {
      level,
      category,
      search,
      learning_level,
      context,
      frequency,
      volume,
      lesson,
    } = req.query;
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
      const volNum = Number(volume);
      if (!Number.isNaN(volNum)) {
        query.volume = volNum;
      }
    }

    // 根據課數篩選
    if (lesson) {
      const lessonNum = Number(lesson);
      if (!Number.isNaN(lessonNum)) {
        query.lesson = lessonNum;
      }
    }

    // 根據搜尋關鍵字篩選 (使用 searchable_text 和 title)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { searchable_text: { $regex: search, $options: "i" } },
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
    console.log("🔍 開始獲取分類資料...");

    // 使用聚合管道來獲取所有唯一值，並過濾掉無效值
    const [categories, learning_levels, contexts, frequencies, volumes] =
      await Promise.all([
        // 獲取所有分類
        BookWord.aggregate([
          { $match: { category: { $exists: true, $ne: null, $ne: "" } } },
          { $group: { _id: "$category" } },
          { $sort: { _id: 1 } },
        ]),

        // 獲取所有學習等級
        BookWord.aggregate([
          { $match: { learning_level: { $exists: true, $ne: null, $ne: "" } } },
          { $group: { _id: "$learning_level" } },
          { $sort: { _id: 1 } },
        ]),

        // 獲取所有上下文
        BookWord.aggregate([
          { $match: { context: { $exists: true, $ne: null, $ne: "" } } },
          { $group: { _id: "$context" } },
          { $sort: { _id: 1 } },
        ]),

        // 獲取所有頻率
        BookWord.aggregate([
          { $match: { frequency: { $exists: true, $ne: null, $ne: "" } } },
          { $group: { _id: "$frequency" } },
          { $sort: { _id: 1 } },
        ]),

        // 獲取所有冊數，過濾掉 "nan" 和無效值
        BookWord.aggregate([
          {
            $match: {
              volume: {
                $exists: true,
                $ne: null,
                $ne: "",
                $ne: "nan",
                $type: ["number", "string"],
              },
            },
          },
          {
            $addFields: {
              volumeNum: {
                $cond: {
                  if: { $eq: [{ $type: "$volume" }, "string"] },
                  then: {
                    $cond: {
                      if: { $eq: ["$volume", "nan"] },
                      then: null,
                      else: { $toInt: "$volume" },
                    },
                  },
                  else: "$volume",
                },
              },
            },
          },
          { $match: { volumeNum: { $ne: null, $type: "number" } } },
          { $group: { _id: "$volumeNum" } },
          { $sort: { _id: 1 } },
        ]),
      ]);

    const result = {
      categories: categories.map((item) => item._id).filter(Boolean),
      learning_levels: learning_levels.map((item) => item._id).filter(Boolean),
      contexts: contexts.map((item) => item._id).filter(Boolean),
      frequencies: frequencies.map((item) => item._id).filter(Boolean),
      volumes: volumes
        .map((item) => item._id)
        .filter((v) => v !== null && !isNaN(v)),
    };

    console.log("✅ 成功獲取分類資料:", {
      categories: result.categories.length,
      learning_levels: result.learning_levels.length,
      contexts: result.contexts.length,
      frequencies: result.frequencies.length,
      volumes: result.volumes.length,
    });

    res.json(result);
  } catch (err) {
    console.error("❌ 獲取分類失敗:", err);
    console.error("錯誤堆棧:", err.stack);
    res.status(500).json({ error: "獲取分類失敗", message: err.message });
  }
});

// 新增：獲取推薦詞彙
app.get("/api/recommendations", async (req, res) => {
  try {
    const { learning_level = "beginner", limit = 10 } = req.query;

    // 獲取高頻詞彙
    const highFrequencyWords = await BookWord.find({
      learning_level,
      frequency: "high",
    }).limit(parseInt(limit));

    // 如果高頻詞彙不足，補充中頻詞彙
    if (highFrequencyWords.length < limit) {
      const remaining = parseInt(limit) - highFrequencyWords.length;
      const mediumFrequencyWords = await BookWord.find({
        learning_level,
        frequency: "medium",
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

// 新增：個人化推薦 API
app.get("/api/recommendations/personalized/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 5 } = req.query;

    console.log(`🎯 開始為用戶 ${userId} 生成個人化推薦...`);

    // 1. 獲取用戶偏好
    const UserPreference = require("./models/UserPreference");
    const userPreference = await UserPreference.findOne({ userId });

    if (!userPreference) {
      console.log(`⚠️ 用戶 ${userId} 尚未填寫問卷，返回預設推薦`);
      return res.json({ recommendations: [] });
    }

    // 2. 基於偏好生成推薦
    const recommendations = await generatePersonalizedRecommendations(
      userPreference.answers,
      parseInt(limit)
    );

    console.log(`✅ 為用戶 ${userId} 生成 ${recommendations.length} 個推薦`);
    res.json({ recommendations });
  } catch (error) {
    console.error("❌ 獲取個人化推薦失敗:", error);
    res.status(500).json({ error: "推薦系統暫時無法使用" });
  }
});

// 推薦演算法核心函數
async function generatePersonalizedRecommendations(preferences, limit) {
  const recommendations = [];

  try {
    console.log("🔍 用戶偏好:", preferences);

    // 將 Map 轉換為普通物件
    const prefs = {};
    if (preferences instanceof Map) {
      preferences.forEach((value, key) => {
        prefs[key] = value;
      });
    } else {
      Object.assign(prefs, preferences);
    }

    // 1. 詞彙推薦 (基於興趣主題和學習程度)
    if (prefs.interestCategory && prefs.learningLevel) {
      console.log(
        `🎯 基於興趣主題: ${prefs.interestCategory}, 學習程度: ${prefs.learningLevel}`
      );

      const vocabularyRecs = await BookWord.find({
        $or: [
          { category: prefs.interestCategory },
          { theme: prefs.interestCategory },
        ],
        learning_level: prefs.learningLevel,
        $or: [{ frequency: "high" }, { frequency: "medium" }],
      })
        .limit(2)
        .lean();

      console.log(`📚 找到 ${vocabularyRecs.length} 個詞彙推薦`);

      vocabularyRecs.forEach((word) => {
        recommendations.push({
          type: "vocabulary",
          title: `學習「${word.title}」`,
          subtitle: `${word.category || word.theme || "詞彙學習"} • ${
            word.learning_level || "初級"
          }`,
          description:
            word.content || `學習手語詞彙「${word.title}」，提升你的表達能力`,
          image: word.image_url,
          action: {
            type: "navigate",
            route: "/education/word-learning",
            params: {
              category: word.category || word.theme,
              level: word.learning_level,
              word: word.title,
            },
          },
          priority: calculatePriority(word, prefs),
        });
      });
    }

    // 2. 教材單元推薦 (基於學習程度和使用情境)
    try {
      const materialRecs = await Material.find({}).limit(2).lean();
      console.log(`📖 找到 ${materialRecs.length} 個教材推薦`);

      materialRecs.forEach((material) => {
        recommendations.push({
          type: "material",
          title: material.unitname || `第${material.lesson}課`,
          subtitle: `第${material.volume}冊 第${material.lesson}課`,
          description: `繼續學習「${
            material.unitname || "手語基礎"
          }」，掌握更多實用技能`,
          image: material.image,
          action: {
            type: "navigate",
            route: `/education/teach/${material.volume}/${material.lesson}`,
            params: {},
          },
          priority: calculateMaterialPriority(material, prefs),
        });
      });
    } catch (materialError) {
      console.warn("⚠️ 載入教材推薦時發生錯誤:", materialError.message);
    }

    // 3. 基於使用目的的推薦
    if (prefs.purpose) {
      if (prefs.purpose.includes("翻譯")) {
        recommendations.push({
          type: "feature",
          title: "即時手語翻譯",
          subtitle: "根據你的使用目的推薦",
          description: "體驗即時手語翻譯功能，讓溝通更順暢",
          image: null,
          action: {
            type: "navigate",
            route: "/translation",
            params: {},
          },
          priority: 80,
        });
      }

      if (prefs.purpose.includes("學習")) {
        recommendations.push({
          type: "feature",
          title: "開始學習之旅",
          subtitle: "根據你的學習需求推薦",
          description: "從基礎開始，循序漸進學習手語",
          image: null,
          action: {
            type: "navigate",
            route: "/education",
            params: {},
          },
          priority: 75,
        });
      }
    }

    // 4. 依據優先級排序並限制數量
    const finalRecommendations = recommendations
      .sort((a, b) => b.priority - a.priority)
      .slice(0, limit);

    console.log(
      `🎯 最終推薦 ${finalRecommendations.length} 項，優先級排序完成`
    );
    return finalRecommendations;
  } catch (error) {
    console.error("❌ 生成推薦時發生錯誤:", error);
    return [];
  }
}

function calculatePriority(item, preferences) {
  let priority = 50; // 基礎分數

  try {
    // 根據興趣主題加分
    if (
      item.category === preferences.interestCategory ||
      item.theme === preferences.interestCategory
    ) {
      priority += 30;
    }

    // 根據學習程度匹配度加分
    if (item.learning_level === preferences.learningLevel) {
      priority += 25;
    }

    // 根據使用情境加分
    if (item.context === preferences.useContext) {
      priority += 20;
    }

    // 根據頻率加分
    if (item.frequency === "high") {
      priority += 15;
    } else if (item.frequency === "medium") {
      priority += 10;
    }

    return priority;
  } catch (error) {
    console.warn("⚠️ 計算優先級時發生錯誤:", error);
    return priority;
  }
}

function calculateMaterialPriority(material, preferences) {
  let priority = 60; // 教材基礎分數稍高

  try {
    // 根據學習程度調整 (初級用戶優先推薦低冊數)
    if (preferences.learningLevel === "beginner" && material.volume <= 2) {
      priority += 20;
    } else if (
      preferences.learningLevel === "intermediate" &&
      material.volume >= 2 &&
      material.volume <= 4
    ) {
      priority += 20;
    } else if (
      preferences.learningLevel === "advanced" &&
      material.volume >= 3
    ) {
      priority += 20;
    }

    // 根據學習時間偏好調整
    if (preferences.studyTime) {
      if (preferences.studyTime.includes("20") && material.lesson > 5) {
        priority += 10; // 願意學習較長時間的用戶推薦較複雜內容
      }
    }

    return priority;
  } catch (error) {
    console.warn("⚠️ 計算教材優先級時發生錯誤:", error);
    return priority;
  }
}

// 新增：每日一句 API
app.get("/api/daily-sign", async (req, res) => {
  try {
    console.log("🎯 請求每日一句");

    // 從資料庫隨機選一個詞彙作為每日一句
    const randomWord = await BookWord.aggregate([{ $sample: { size: 1 } }]);

    if (!randomWord || randomWord.length === 0) {
      console.log("📋 沒有找到詞彙，返回預設");
      return res.json({
        word: "謝謝",
        chinese: "謝謝 (Thank you)",
        image: null,
        description: "表達感謝的基本手語",
        category: "日常用語",
      });
    }

    const word = randomWord[0];
    console.log(`✅ 選中每日一句: ${word.title}`);

    // 回傳每日一句數據
    res.json({
      word: word.title,
      chinese: word.title,
      image: word.image_url || word.gif_url,
      description: word.description || `學習「${word.title}」這個手語`,
      category:
        word.categories && word.categories.length > 0
          ? word.categories[0]
          : "手語詞彙",
      volume: word.volume,
      lesson: word.lesson,
    });
  } catch (error) {
    console.error("❌ 載入每日一句失敗:", error);

    // 返回預設數據
    res.json({
      word: "謝謝",
      chinese: "謝謝 (Thank you)",
      image: null,
      description: "表達感謝的基本手語",
      category: "日常用語",
    });
  }
});

// 新增：獲取學習統計
app.get("/api/stats", async (req, res) => {
  try {
    const totalWords = await BookWord.countDocuments();

    const levelStats = await BookWord.aggregate([
      { $group: { _id: "$learning_level", count: { $sum: 1 } } },
    ]);

    const categoryStats = await BookWord.aggregate([
      { $unwind: "$categories" },
      { $group: { _id: "$categories", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      total: totalWords,
      by_level: levelStats,
      by_category: categoryStats,
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
      total_requested: updates.length,
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
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {};
    stats.forEach((stat) => {
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
let QuizWord;
// 💡 Collection 名稱確認為 'Quiz_img'
const QUIZ_IMG_COLLECTION_NAME = "Quiz_img";

// 解決 Model 衝突：克隆 VocabSchema
const QuizWordSchema = VocabSchema.clone();

// 嚴謹地定義 Model
QuizWord = mongoose.models.QuizWord || mongoose.model(
  "QuizWord",
  QuizWordSchema,
  QUIZ_IMG_COLLECTION_NAME
);


// === 測驗 API：動態生成題目 (使用 QuizWord Model) ===
app.get('/api/quiz/:volume/:lesson', async (req, res) => {
  const { volume, lesson } = req.params;

  try {
    const volNum = Number(volume);
    const lessonNum = Number(lesson);

    if (Number.isNaN(volNum) || Number.isNaN(lessonNum)) {
      return res.status(400).json({ error: "冊數 (volume) 和課數 (lesson) 必須是數字" });
    }

    // 1. 查詢該單元的所有測驗詞彙 (Quiz Items)
    const quizItems = await QuizWord.find({
      volume: volNum,
      lesson: lessonNum
    }).lean();

    if (quizItems.length === 0) {
      return res.status(404).json({ error: `找不到第 ${volNum} 冊 第 ${lessonNum} 課的測驗詞彙。` });
    }

    // 2. 獲取所有 QuizWord 詞彙的中文意思 (使用 distinct 查詢，效率高且安全)
    const allTitles = await QuizWord.distinct('title', {
      title: { $exists: true, $ne: null, $ne: '', $ne: 'nan' }
    });
    // 【新功能】: 2.5 獲取所有 QuizWord 詞彙的圖片 URL (為 "看字選圖" 準備干擾項)
    const allImageUrls = await QuizWord.distinct('image_url', {
      image_url: { $exists: true, $ne: null, $ne: '', $ne: 'nan' }
    });

    // 3. 從當前單元詞彙中隨機選取最多 10 題，並過濾掉沒有 title 的項目
    const validQuizItems = quizItems.filter(item => item.title && item.title.trim() !== '');
    const selectedItems = shuffle(validQuizItems).slice(0, 10);

    if (!selectedItems || selectedItems.length === 0) {
      return res.status(404).json({ error: "選取題目失敗，該單元詞彙可能無有效中文標題。" });
    }

    if (allTitles.length < 4) {
      console.warn(`⚠️ 資料庫中的有效詞彙總數不足 (${allTitles.length} 個)，無法生成足夠的干擾項。`);
    }

    // SOUL/server/server.js (替換原本的第 4 步驟)

    // 4. 針對每個詞彙隨機生成「看圖選字」或「看字選圖」題
    const generatedQuestions = selectedItems.map((data, index) => {
      // 隨機決定題型：例如 50% 圖片選字 (single_choice)，50% 文字選圖 (image_select)
      const isImageSelect = Math.random() < 0.5; // 50% 機率

      // 確保該詞彙有圖片才能出題
      if (!data.image_url) return null;

      if (isImageSelect) {
        // 【新功能】：生成「看文字敘述選圖」 (image_select) 題型
        const options = generateRandomImageOptions(data, allImageUrls, 4);
        const correctOption = options.find(opt => opt.media.image === data.image_url);

        if (!correctOption) return null;

        return {
          id: `q${index + 1}_${data._id}`,
          type: "image_select", // 【新題型】
          prompt: `請選出「${data.title}」的手語圖片`,
          media: {}, // 圖片在選項中，本體不需要 media
          options: options,
          answer: [correctOption.id],
        };

      } else {
        // 原始邏輯：生成「看圖選中文意思」 (single_choice) 題型
        const options = generateRandomOptions(data.title, allTitles, 4);
        const correctOption = options.find(opt => opt.label === data.title);

        if (!correctOption) return null;

        return {
          id: `q${index + 1}_${data._id}`,
          type: "single_choice",
          prompt: "請問這張圖的手語是什麼意思？",
          media: { image: data.image_url || "https://placehold.co/800x400?text=No+Image" },
          options: options,
          answer: [correctOption.id],
        };
      }
    }).filter(q => q !== null);

    const quizResponse = {
      title: `第 ${volNum} 冊 第 ${lessonNum} 單元測驗`,
      questions: generatedQuestions
    };

    res.json(quizResponse);

  } catch (err) {
    // 捕捉任何運行時錯誤並返回 500
    console.error("❌ 生成測驗時發生未預期錯誤:", err);
    console.error("錯誤詳情:", err.stack); // 打印堆棧幫助您調試
    res.status(500).json({ error: "伺服器內部錯誤", detail: err.message });
  }
});
// === 教材模型 ===
const MaterialSchema = new mongoose.Schema(
  {
    unitname: { type: String, required: true }, // 改成 unitname
    volume: { type: Number, required: true },
    lesson: { type: Number, required: true },
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

// 1) 取得某冊所有單元（只回 id + unitname + volume + lesson）
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
    // ✅ 回傳 unitname + lesson
    const list = await Material.find(
      query,
      "_id unitname volume lesson"
    ).lean();
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
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
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
    console.log("\n📋 Available API endpoints:");
    console.log("  🔗 POST /api/webhook - Clerk 用戶 webhook"); // 添加這行
    console.log("  📚 GET  /api/book_words - 獲取單詞資料");
    console.log("  📊 GET  /api/categories - 獲取分類資料");
    console.log("  📝 POST /api/preferences - 儲存/更新問卷回答");
    console.log("  🔍 GET  /api/preferences/:userId - 查詢使用者問卷");
    console.log("  🎯 GET  /api/recommendations - 獲取推薦詞彙");
    console.log(
      "  🎯 GET  /api/recommendations/personalized/:userId - 獲取個人化推薦"
    );
    console.log("  📈 GET  /api/stats - 獲取統計資料");
    console.log("  🔄 POST /api/book_words/batch_update - 批量更新");
    console.log("  📖 GET  /api/materials - 獲取教材資料");
    console.log("  🏥 GET  /api/status - 伺服器狀態檢查");
    console.log("  ☁️  GET  /api/cloudinary-images - Cloudinary 圖片");
    // 檢查重要環境變數
    // 延遲檢查環境變數，等待 MongoDB 連接
    setTimeout(() => {
      console.log("\n🔧 Environment check:");
      console.log(
        `  DATABASE: ${mongoose.connection.readyState === 1 ? "✅" : "❌"}`
      );
      console.log(
        `  WEBHOOK_SECRET: ${
          process.env.CLERK_WEBHOOK_SECRET_KEY ? "✅" : "❌ Missing"
        }`
      );
      console.log(
        `  CLOUDINARY: ${
          process.env.CLOUDINARY_CLOUD_NAME ? "✅" : "❌ Missing"
        }`
      );
    }, 1000); // 延遲 1 秒檢查
  });
};

// 處理未捕獲的異常
process.on("uncaughtException", (error) => {
  console.error("❌ 未捕獲的異常:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ 未處理的 Promise 拒絕:", reason);
  process.exit(1);
});

// 優雅關閉
process.on("SIGTERM", () => {
  console.log("👋 接收到 SIGTERM 信號，正在關閉伺服器...");
  mongoose.connection.close(() => {
    console.log("✅ MongoDB 連接已關閉");
    process.exit(0);
  });
});

startServer();
