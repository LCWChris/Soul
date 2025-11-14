const express = require("express");
const router = express.Router();
const UserPreference = require("../models/UserPreference");
const LearningProgress = require("../models/LearningProgress");
const BookWord = require("../models/Vocabulary");

/**
 * Helper function: Get a random image from a category
 * @param {string} category - Category name
 * @returns {Promise<string|null>} - Image URL or null
 */
async function getCategoryImage(category) {
  try {
    const words = await BookWord.find({ category }).limit(10);
    if (words.length === 0) return null;

    // Try to find a word with an image
    const wordsWithImages = words.filter((w) => w.image_url || w.gif);
    if (wordsWithImages.length > 0) {
      const randomWord =
        wordsWithImages[Math.floor(Math.random() * wordsWithImages.length)];
      return randomWord.image_url || randomWord.gif;
    }

    return null;
  } catch (error) {
    console.error(`Failed to get category image for ${category}:`, error);
    return null;
  }
}

// A simple list of all available learning materials/categories for fallback
const allMaterials = [
  {
    id: "cat-1",
    title: "人物關係",
    category: "人物關係",
    type: "material",
  },
  {
    id: "cat-2",
    title: "動物自然",
    category: "動物自然",
    type: "material",
  },
  {
    id: "cat-3",
    title: "地點場所",
    category: "地點場所",
    type: "material",
  },
  {
    id: "cat-4",
    title: "家庭生活",
    category: "家庭生活",
    type: "material",
  },
  {
    id: "cat-5",
    title: "情感表達",
    category: "情感表達",
    type: "material",
  },
  {
    id: "cat-6",
    title: "數字時間",
    category: "數字時間",
    type: "material",
  },
  {
    id: "cat-7",
    title: "日常動作",
    category: "日常動作",
    type: "material",
  },
  {
    id: "cat-8",
    title: "物品工具",
    category: "物品工具",
    type: "material",
  },
  {
    id: "cat-9",
    title: "身體健康",
    category: "身體健康",
    type: "material",
  },
  {
    id: "cat-10",
    title: "食物飲品",
    category: "食物飲品",
    type: "material",
  },
  {
    id: "cat-11",
    title: "其他",
    category: "其他",
    type: "material",
  },
];

/**
 * GET /api/recommendations/personalized/:userId
 * Generates personalized recommendations for a user.
 */
router.get("/personalized/:userId", async (req, res) => {
  const { userId } = req.params;
  const { limit = 8 } = req.query;
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
      if (p.completedWords && Array.isArray(p.completedWords)) {
        p.completedWords.forEach((word) => studiedWordsSet.add(word));
      }
    });
    const studiedWords = Array.from(studiedWordsSet);

    // Calculate time-based recommendations
    const now = new Date();
    const recentProgress = progress.filter((p) => {
      if (!p.lastStudied) return false;
      const daysSince = (now - new Date(p.lastStudied)) / (1000 * 60 * 60 * 24);
      return daysSince >= 1 && daysSince <= 7; // 1-7 days ago
    });

    // --- Strategy 1: Quick Review (時間導向複習) ---
    if (recommendations.length < limit && recentProgress.length > 0) {
      const reviewItem =
        recentProgress[Math.floor(Math.random() * recentProgress.length)];
      if (reviewItem.completedWords && reviewItem.completedWords.length > 0) {
        const wordToReview =
          reviewItem.completedWords[
            Math.floor(Math.random() * reviewItem.completedWords.length)
          ];
        const vocab = await BookWord.findOne({ content: wordToReview });
        if (vocab) {
          const categoryImg = await getCategoryImage(vocab.category);
          recommendations.push({
            id: `quick-review-${vocab._id}`,
            title: `快速複習：${vocab.content}`,
            description: `記憶黃金期！複習效果最佳`,
            image_url: vocab.image_url || vocab.gif || categoryImg,
            type: "vocabulary",
            action: {
              type: "navigate",
              route: "/(tabs)/education/word-learning",
              params: { word: vocab.content },
            },
          });
          recommendationReason += "Added 'Quick Review' card. ";
        }
      }
    }

    // --- Strategy 2: Hot Topics (熱門主題) ---
    if (recommendations.length < limit) {
      const preferredCategories =
        preferences?.answers?.preferredCategories || [];
      let hotCategory = null;

      if (preferredCategories.length > 0) {
        hotCategory =
          preferredCategories[
            Math.floor(Math.random() * preferredCategories.length)
          ];
      } else {
        // Fallback to popular categories
        const popularCategories = ["日常用語", "情感表達", "家庭生活"];
        hotCategory =
          popularCategories[
            Math.floor(Math.random() * popularCategories.length)
          ];
      }

      const hotWords = await BookWord.find({
        category: hotCategory,
        content: { $nin: studiedWords },
      }).limit(5);

      if (hotWords.length > 0) {
        const hotWord = hotWords[Math.floor(Math.random() * hotWords.length)];
        const categoryImg = await getCategoryImage(hotCategory);
        recommendations.push({
          id: `hot-topic-${hotWord._id}`,
          title: `熱門主題：${hotCategory}`,
          description: `探索「${hotWord.content}」等熱門手語`,
          image_url: hotWord.image_url || hotWord.gif || categoryImg,
          type: "vocabulary",
          action: {
            type: "navigate",
            route: "/(tabs)/education/word-learning",
            params: { category: hotCategory },
          },
        });
        recommendationReason += "Added 'Hot Topic' card. ";
      }
    }

    // --- Strategy 3: 5-Min Challenge (挑戰新詞) ---
    if (recommendations.length < limit) {
      const learningLevel = preferences?.answers?.learningLevel || "初級";
      const challengeWords = await BookWord.find({
        content: { $nin: studiedWords },
        level: learningLevel,
      }).limit(10);

      if (challengeWords.length > 0) {
        const challengeWord =
          challengeWords[Math.floor(Math.random() * challengeWords.length)];
        const categoryImg = await getCategoryImage(challengeWord.category);
        recommendations.push({
          id: `challenge-${challengeWord._id}`,
          title: `5分鐘挑戰：${challengeWord.content}`,
          description: `${learningLevel}難度，來挑戰新單字！`,
          image_url:
            challengeWord.image_url || challengeWord.gif || categoryImg,
          type: "vocabulary",
          action: {
            type: "navigate",
            route: "/(tabs)/education/word-learning",
            params: { word: challengeWord.content },
          },
        });
        recommendationReason += "Added '5-Min Challenge' card. ";
      }
    }

    // --- Strategy 4: Favorites Reminder (收藏複習) ---
    if (recommendations.length < limit && studiedWords.length > 0) {
      // Pick a random studied word as "favorite"
      const favoriteWord =
        studiedWords[Math.floor(Math.random() * studiedWords.length)];
      const vocab = await BookWord.findOne({ content: favoriteWord });
      if (vocab) {
        const categoryImg = await getCategoryImage(vocab.category);
        recommendations.push({
          id: `favorite-${vocab._id}`,
          title: `溫故知新：${vocab.content}`,
          description: `複習你學過的「${vocab.category}」`,
          image_url: vocab.image_url || vocab.gif || categoryImg,
          type: "vocabulary",
          action: {
            type: "navigate",
            route: "/(tabs)/education/word-learning",
            params: { word: vocab.content },
          },
        });
        recommendationReason += "Added 'Favorites Reminder' card. ";
      }
    }

    // --- Strategy 5: Scenario Learning (情境學習) ---
    if (recommendations.length < limit) {
      const scenarioCategories = [
        {
          category: "餐廳",
          title: "餐廳點餐",
          description: "學會在餐廳溝通的實用手語",
        },
        {
          category: "交通",
          title: "交通出行",
          description: "掌握搭車問路的必備手語",
        },
        {
          category: "購物",
          title: "購物消費",
          description: "輕鬆應對購物場景",
        },
        {
          category: "醫療",
          title: "醫療就診",
          description: "醫院看病不再煩惱",
        },
      ];

      const scenario =
        scenarioCategories[
          Math.floor(Math.random() * scenarioCategories.length)
        ];
      const scenarioWords = await BookWord.find({
        category: scenario.category,
      }).limit(1);

      if (scenarioWords.length > 0) {
        const categoryImg = await getCategoryImage(scenario.category);
        recommendations.push({
          id: `scenario-${scenario.category}`,
          title: `情境學習：${scenario.title}`,
          description: scenario.description,
          image_url:
            scenarioWords[0].image_url || scenarioWords[0].gif || categoryImg,
          type: "material",
          action: {
            type: "navigate",
            route: "/(tabs)/education/word-learning",
            params: { category: scenario.category },
          },
        });
        recommendationReason += "Added 'Scenario Learning' card. ";
      }
    }

    // --- Strategy 6: Category Exploration (分類探索) ---
    if (recommendations.length < limit) {
      const studiedCategories = new Set(
        progress.map((p) => p.category).filter(Boolean)
      );
      const unstudied = allMaterials.filter(
        (m) => !studiedCategories.has(m.category)
      );

      if (unstudied.length > 0) {
        const exploreCategory =
          unstudied[Math.floor(Math.random() * unstudied.length)];
        const categoryImg = await getCategoryImage(exploreCategory.category);
        recommendations.push({
          id: `explore-${exploreCategory.id}`,
          title: `探索新領域：${exploreCategory.title}`,
          description: `發現「${exploreCategory.category}」的手語世界`,
          image_url: exploreCategory.image_url || categoryImg,
          type: "material",
          action: {
            type: "navigate",
            route: "/(tabs)/education/word-learning",
            params: { category: exploreCategory.category },
          },
        });
        recommendationReason += "Added 'Category Exploration' card. ";
      }
    }

    // --- Fill remaining slots with categories ---
    if (recommendations.length < limit) {
      const studiedCategories = new Set(
        progress.map((p) => p.category).filter(Boolean)
      );
      const remaining = allMaterials.filter(
        (m) => !studiedCategories.has(m.category)
      );

      if (remaining.length > 0) {
        const categoriesWithImages = await Promise.all(
          remaining.slice(0, limit - recommendations.length).map(async (m) => {
            const categoryImg = await getCategoryImage(m.category);
            return {
              id: `category-${m.id}`,
              title: m.title,
              description: `探索「${m.title}」主題`,
              image_url: m.image_url || categoryImg,
              type: "material",
              action: {
                type: "navigate",
                route: "/(tabs)/education/word-learning",
                params: { category: m.category },
              },
            };
          })
        );
        recommendations.push(...categoriesWithImages);
        recommendationReason += "Filled with additional categories. ";
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
