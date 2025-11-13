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
  const { limit = 5 } = req.query;

  try {
    const [preferences, progress] = await Promise.all([
      UserPreference.findOne({ userId }),
      LearningProgress.find({ userId }).sort({ lastStudied: -1 }),
    ]);

    let recommendations = [];
    let recommendationReason = "Default fallback recommendations.";

    if (preferences && preferences.answers) {
      const { interestCategory, learningLevel } = preferences.answers;

      // Strategy 1: Recommend based on user's stated interests
      if (interestCategory) {
        const interestedVocab = await BookWord.find({
          category: interestCategory,
        }).limit(limit);
        if (interestedVocab.length > 0) {
          recommendationReason = `Based on your interest in '${interestCategory}'.`;
          recommendations = interestedVocab.map((v) => ({
            id: v._id,
            title: v.title,
            description: `詞彙: ${v.content}`,
            image_url: v.image_url,
            type: "vocabulary",
            action: {
              type: "navigate",
              route: "/(tabs)/education/word-learning",
              params: { word: v.content },
            },
          }));
        }
      }

      // Strategy 2: If no items from interest, recommend based on level
      if (recommendations.length < limit && learningLevel) {
        const levelBasedVocab = await BookWord.find({
          level: learningLevel,
          category: { $ne: interestCategory },
        }).limit(limit - recommendations.length);
        if (levelBasedVocab.length > 0) {
          recommendationReason =
            recommendations.length > 0
              ? `${recommendationReason} Also showing items for '${learningLevel}' level.`
              : `Based on your level: '${learningLevel}'.`;
          recommendations.push(
            ...levelBasedVocab.map((v) => ({
              id: v._id,
              title: v.title,
              description: `詞彙: ${v.content}`,
              image_url: v.image_url,
              type: "vocabulary",
              action: {
                type: "navigate",
                route: "/(tabs)/education/word-learning",
                params: { word: v.content },
              },
            }))
          );
        }
      }
    }

    // Strategy 3: Recommend un-finished or new materials if other strategies fail
    if (recommendations.length < limit) {
      const studiedIds = progress.map((p) => p.materialId);
      const unstudied = allMaterials.filter(
        (m) => !studiedIds.includes(m.id.toString())
      );

      if (unstudied.length > 0) {
        recommendationReason = "Recommending new topics for you to explore.";
        recommendations.push(
          ...unstudied.slice(0, limit - recommendations.length).map((m) => ({
            ...m,
            action: {
              type: "navigate",
              route: "/(tabs)/education/word-learning",
              params: { category: m.category },
            },
          }))
        );
      }
    }

    // Final Fallback: If still no recommendations, return some default ones.
    if (recommendations.length === 0) {
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
      reason: recommendationReason,
      recommendations: recommendations.slice(0, limit),
    });
  } catch (error) {
    console.error("Error generating personalized recommendations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate recommendations.",
      error: error.message,
      // Fallback to default recommendations on error
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
