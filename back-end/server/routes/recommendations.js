const express = require("express");
const router = express.Router();
const UserPreference = require("../models/UserPreference");
const LearningProgress = require("../models/LearningProgress");
const BookWord = require("../models/Vocabulary");

// A simple list of all available learning materials/categories for fallback
const allMaterials = [
  {
    id: 1,
    title: "日常對話",
    category: "日常用語",
    description: "學習常見日常手勢",
    type: "material",
  },
  {
    id: 2,
    title: "餐廳用語",
    category: "餐廳",
    description: "掌握餐廳常用手語",
    type: "material",
  },
  {
    id: 3,
    title: "交通出行",
    category: "交通",
    description: "學會出行相關手語",
    type: "material",
  },
  {
    id: 4,
    title: "數字與時間",
    category: "數字",
    description: "學習數字和時間的表達",
    type: "material",
  },
  {
    id: 5,
    title: "家庭稱謂",
    category: "家庭",
    description: "認識家庭成員的稱呼",
    type: "material",
  },
];

/**
 * GET /api/recommendations/personalized/:userId
 * Generates personalized recommendations for a user.
 */
router.get("/personalized/:userId", async (req, res) => {
  const { userId } = req.params;
  const { limit = 4 } = req.query;
  let recommendations = [];
  let recommendationReason = "";

  try {
    // Fetch user progress and preferences in parallel
    const [progress, preferences] = await Promise.all([
      LearningProgress.find({ userId }).sort({ lastStudied: -1 }),
      UserPreference.findOne({ userId }),
    ]);

    const studiedWordsSet = new Set();
    progress.forEach((p) => {
      p.completedWords.forEach((word) => studiedWordsSet.add(word));
    });
    const studiedWords = Array.from(studiedWordsSet);

    // --- Strategy 1: Continue Learning ---
    if (recommendations.length < limit) {
      const lastLesson = await LearningProgress.getLastLesson(userId);
      if (lastLesson && !lastLesson.isNewUser && lastLesson.progress < 1) {
        recommendations.push({
          id: `continue-${lastLesson.lastLesson.volume}-${lastLesson.lastLesson.lesson}`,
          title: `繼續學習: ${lastLesson.lastLesson.title}`,
          description: `第 ${lastLesson.lastLesson.volume} 冊 · 第 ${lastLesson.lastLesson.lesson} 單元`,
          type: "material",
          image_url:
            "https://images.unsplash.com/photo-1517842645767-c6f90405774b?q=80&w=2070",
          action: {
            type: "navigate",
            route: "(tabs)/education",
            params: {
              screen: "teach-screen",
              params: {
                volume: lastLesson.lastLesson.volume,
                lesson: lastLesson.lastLesson.lesson,
              },
            },
          },
        });
        recommendationReason += "Added 'Continue Learning' card. ";
      }
    }

    // --- Strategy 2: Review a Studied Word ---
    if (recommendations.length < limit && studiedWords.length > 0) {
      const wordToReview =
        studiedWords[Math.floor(Math.random() * studiedWords.length)];
      const vocab = await BookWord.findOne({ content: wordToReview });
      if (vocab) {
        recommendations.push({
          id: `review-${vocab._id}`,
          title: `複習單字: ${vocab.content}`,
          description: `分類: ${vocab.category}`,
          image_url: vocab.image_url,
          type: "vocabulary",
          action: {
            type: "navigate",
            route: "/(tabs)/education/word-learning",
            params: { word: vocab.content },
          },
        });
        recommendationReason += "Added 'Review Word' card. ";
      }
    }

    // --- Strategy 3: Learn a New Word ---
    if (recommendations.length < limit) {
      const learningLevel = preferences?.answers?.learningLevel || "初級";
      const newWords = await BookWord.find({
        content: { $nin: studiedWords },
        level: learningLevel,
      }).limit(10);

      if (newWords.length > 0) {
        const wordToLearn =
          newWords[Math.floor(Math.random() * newWords.length)];
        recommendations.push({
          id: `learn-${wordToLearn._id}`,
          title: `挑戰新單字: ${wordToLearn.content}`,
          description: `來自 '${wordToLearn.category}' 分類`,
          image_url: wordToLearn.image_url,
          type: "vocabulary",
          action: {
            type: "navigate",
            route: "/(tabs)/education/word-learning",
            params: { word: wordToLearn.content },
          },
        });
        recommendationReason += "Added 'Learn New Word' card. ";
      }
    }

    // --- Strategy 4: Fill with unstudied categories ---
    if (recommendations.length < limit) {
      const studiedCategories = new Set(
        progress.map((p) => p.category).filter(Boolean)
      );
      const unstudied = allMaterials.filter(
        (m) => !studiedCategories.has(m.category)
      );

      if (unstudied.length > 0) {
        recommendations.push(
          ...unstudied.slice(0, limit - recommendations.length).map((m) => ({
            ...m,
            description: `探索 '${m.title}' 主題`,
            action: {
              type: "navigate",
              route: "/(tabs)/education/word-learning",
              params: { category: m.category },
            },
          }))
        );
        recommendationReason += "Filled with new categories. ";
      }
    }

    // --- Final Fallback ---
    if (recommendations.length === 0) {
      recommendationReason =
        "No specific recommendations, showing default topics.";
      recommendations = allMaterials.slice(0, limit).map((m) => ({
        ...m,
        action: {
          type: "navigate",
          route: "/(tabs)/education/word-learning",
          params: { category: m.category },
        },
      }));
    }

    res.json({
      success: true,
      message: "Personalized recommendations generated successfully.",
      reason: recommendationReason.trim(),
      recommendations: recommendations.slice(0, limit),
    });
  } catch (error) {
    console.error("Error generating personalized recommendations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate recommendations.",
      error: error.message,
      recommendations: allMaterials.slice(0, limit).map((m) => ({
        ...m,
        action: {
          type: "navigate",
          route: "/(tabs)/education/word-learning",
          params: { category: m.category },
        },
      })),
    });
  }
});

module.exports = router;
