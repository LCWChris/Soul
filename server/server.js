// SOUL/server/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

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

const Vocabulary = mongoose.model("Vocabulary", VocabSchema);

app.get("/api/vocabularies", async (req, res) => {
  const data = await Vocabulary.find({});
  res.json(data);
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
