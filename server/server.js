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

app.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
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
