const mongoose = require("mongoose");

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

// 使用 'book_words' collection
// 這個模式可以避免在其他地方重複編譯模型時出現 "OverwriteModelError"
const BookWord =
  mongoose.models.BookWord ||
  mongoose.model("BookWord", VocabSchema, "book_words");

module.exports = BookWord;
