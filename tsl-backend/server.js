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

// 啟動伺服器
app.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
});
