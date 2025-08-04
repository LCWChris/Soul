const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cloudinary = require('cloudinary').v2;

// 初始化 Cloudinary
cloudinary.config({
  cloud_name: 'dbmrnpwxd',
  api_key: '861285683337524',
  api_secret: 'gIQ_tgM4L33AeLXq_gNNFfB0Q3A',
});

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

mongoose.connect("mongodb+srv://soulsignteam:souls115@soulsignteam.rff3iag.mongodb.net/tsl_app?retryWrites=true&w=majority")
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
  created_at: Date
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
      query.title = { $regex: search, $options: 'i' };
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
      query.title = { $regex: search, $options: 'i' };
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

app.post("/api/vocabularies", async (req, res) => {
  try {
    const newVocab = new Vocabulary(req.body);
    await newVocab.save();
    res.status(201).json({ message: "新增成功！", data: newVocab });
  } catch (err) {
    res.status(500).json({ error: "新增失敗" });
  }
});

app.get('/api/cloudinary-images', async (req, res) => {
  try {
    const result = await cloudinary.search
      .expression('resource_type:image OR resource_type:video')
      .sort_by('created_at','desc')
      .max_results(100)
      .execute();

    const urls = result.resources.map(item => item.secure_url);
    res.json(urls);
  } catch (err) {
    res.status(500).json({ error: 'Cloudinary 查詢失敗', detail: err });
  }
});

// 🔧 API 連接測試端點
app.get("/api/test", (req, res) => {
  res.json({ 
    status: 'success', 
    message: '伺服器連接正常',
    timestamp: new Date().toISOString(),
    server: 'Soul Learning App API'
  });
});

// 📊 伺服器狀態檢查端點
app.get("/api/status", async (req, res) => {
  try {
    // 檢查資料庫連接
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // 獲取單詞數量
    const wordCount = await BookWord.countDocuments();
    
    res.json({
      status: 'healthy',
      database: dbStatus,
      wordCount: wordCount,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server is running at http://172.20.10.3:3001`);
});


