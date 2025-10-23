// SOUL/server/routes/learningStats.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const LearningProgress = require('../models/LearningProgress');

// 嘗試獲取已存在的 BookWord 模型，如果不存在則定義
let BookWord;
try {
  BookWord = mongoose.model('BookWord');
} catch (error) {
  // 如果模型不存在，則定義新的
  const VocabSchema = new mongoose.Schema({
    title: String,
    content: String,
    level: String,
    theme: String,
    image_url: String,
    video_url: String,
    created_by: String,
    created_at: Date,
    category: String,
    categories: [String],
    learning_level: String,
    context: String,
    frequency: String,
    searchable_text: String,
    volume: Number,
    lesson: Number,
    page: Number,
  });

  BookWord = mongoose.model("BookWord", VocabSchema, "book_words");
}

// 獲取用戶學習統計
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // 獲取用戶學習進度
    const userStats = await LearningProgress.getUserStats(userId);
    
    if (!userStats) {
      return res.json({
        overall: {
          totalWords: 0,
          learnedWords: 0,
          masteredWords: 0,
          progressPercentage: 0,
          streak: 0,
          totalStudyTime: 0
        },
        categories: [],
        levels: [],
        recentActivity: []
      });
    }
    
    // 獲取總詞彙數量
    const totalWordsCount = await BookWord.countDocuments();
    
    // 獲取分類總數 - 先清理陣列中的無效值，然後展開
    const allCategories = await BookWord.aggregate([
      // 首先過濾出有 categories 陣列的文檔
      { 
        $match: { 
          categories: { $exists: true, $type: "array", $ne: [] } 
        } 
      },
      // 清理 categories 陣列，移除無效值
      {
        $addFields: {
          cleanCategories: {
            $filter: {
              input: "$categories",
              cond: {
                $and: [
                  { $ne: ["$$this", null] },
                  { $ne: ["$$this", ""] },
                  { $ne: ["$$this", " "] },
                  { $ne: ["$$this", "NaN"] },
                  { $ne: ["$$this", "null"] },
                  { $ne: ["$$this", "undefined"] },
                  { $type: ["$$this", "string"] },
                  { $not: { $regexMatch: { input: "$$this", regex: /^[\s\[\]'"]*$/ } } }
                ]
              }
            }
          }
        }
      },
      // 只處理有有效分類的文檔
      { $match: { cleanCategories: { $ne: [] } } },
      // 展開清理後的分類陣列
      { $unwind: '$cleanCategories' },
      // 按分類分組並計數
      { $group: { _id: '$cleanCategories', total: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]);
    
    // 獲取等級總數 - 過濾空值和無效等級
    const allLevels = await BookWord.aggregate([
      { 
        $match: { 
          learning_level: { 
            $exists: true, 
            $ne: null, 
            $ne: "", 
            $ne: " ",
            $ne: "NaN",
            $ne: "null",
            $ne: "undefined",
            $not: { $regex: /^[\s\[\]'"]*$/ }, // 排除只包含空白字符、括號、引號的字符串
            $type: "string", // 確保是字符串類型
            $regex: /^[^\s].+[^\s]$/ // 確保開頭和結尾不是空白字符，且有實際內容
          } 
        } 
      },
      { $group: { _id: '$learning_level', total: { $sum: 1 } } }
    ]);
    
    // 構建分類統計
    const categoryProgress = allCategories.map(cat => {
      const userCatStats = userStats.categoryStats[cat._id] || { learned: 0, mastered: 0 };
      return {
        name: cat._id,
        total: cat.total,
        learned: userCatStats.learned,
        mastered: userCatStats.mastered,
        percentage: cat.total > 0 ? Math.round((userCatStats.learned / cat.total) * 100) : 0
      };
    });
    
    console.log('📊 清理後的分類數據:', categoryProgress.map(cat => cat.name));
    
    // 構建等級統計
    const levelProgress = allLevels.map(level => {
      const userLevelStats = userStats.levelStats[level._id] || { learned: 0, mastered: 0 };
      const displayNames = {
        'beginner': '初學',
        'intermediate': '進階',
        'advanced': '熟練'
      };
      
      return {
        name: level._id,
        displayName: displayNames[level._id] || level._id,
        total: level.total,
        learned: userLevelStats.learned,
        percentage: level.total > 0 ? Math.round((userLevelStats.learned / level.total) * 100) : 0
      };
    });
    
    // 構建最近活動
    const recentActivity = userStats.recentActivity.slice(0, 5).map((activity, index) => {
      const daysAgo = index;
      let dateLabel;
      
      if (daysAgo === 0) dateLabel = '今天';
      else if (daysAgo === 1) dateLabel = '昨天';
      else dateLabel = `${daysAgo}天前`;
      
      return {
        date: dateLabel,
        wordsLearned: activity.action === 'learn' ? 1 : 0,
        timeSpent: Math.round(activity.timeSpent / 60) // 轉換為分鐘
      };
    });
    
    // 計算進度百分比
    const progressPercentage = totalWordsCount > 0 ? 
      Math.round((userStats.totalWordsLearned / totalWordsCount) * 100) : 0;
    
    const response = {
      overall: {
        totalWords: totalWordsCount,
        learnedWords: userStats.totalWordsLearned,
        masteredWords: userStats.totalWordsMastered,
        progressPercentage,
        streak: userStats.streak,
        totalStudyTime: userStats.totalStudyTime
      },
      categories: categoryProgress,
      levels: levelProgress,
      recentActivity
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('獲取用戶學習統計失敗:', error);
    res.status(500).json({ error: '獲取統計數據失敗' });
  }
});

// 記錄學習活動
router.post('/activity', async (req, res) => {
  try {
    const { userId, wordId, action, difficulty, timeSpent, isCorrect } = req.body;
    
    if (!userId || !wordId || !action) {
      return res.status(400).json({ error: '缺少必要參數' });
    }
    
    const progress = await LearningProgress.recordLearningActivity(
      userId, 
      wordId, 
      action, 
      { difficulty, timeSpent, isCorrect }
    );
    
    res.json({ 
      success: true, 
      message: '學習活動記錄成功',
      stats: {
        totalWordsLearned: progress.stats.totalWordsLearned,
        totalStudyTime: progress.stats.totalStudyTime,
        streak: progress.stats.streak
      }
    });
    
  } catch (error) {
    console.error('記錄學習活動失敗:', error);
    res.status(500).json({ error: '記錄學習活動失敗' });
  }
});

// 獲取學習記錄歷史
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const progress = await LearningProgress.findOne({ userId })
      .populate('learningRecords.wordId');
    
    if (!progress) {
      return res.json({ records: [], total: 0 });
    }
    
    const records = progress.learningRecords
      .slice(offset, offset + parseInt(limit))
      .map(record => ({
        id: record._id,
        word: record.wordId?.title || '未知單詞',
        action: record.action,
        difficulty: record.difficulty,
        timeSpent: record.timeSpent,
        isCorrect: record.isCorrect,
        timestamp: record.timestamp
      }));
    
    res.json({
      records,
      total: progress.learningRecords.length
    });
    
  } catch (error) {
    console.error('獲取學習記錄失敗:', error);
    res.status(500).json({ error: '獲取學習記錄失敗' });
  }
});

// 獲取學習成就
router.get('/achievements/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const userStats = await LearningProgress.getUserStats(userId);
    
    if (!userStats) {
      return res.json({ achievements: [] });
    }
    
    const achievements = [];
    
    // 首次學習成就
    if (userStats.totalWordsLearned >= 1) {
      achievements.push({
        id: 'first_word',
        title: '初次學習',
        description: '學習第一個單詞',
        icon: 'school',
        earned: true,
        earnedAt: userStats.firstStudyDate || new Date()
      });
    }
    
    // 首次掌握成就
    if (userStats.totalWordsMastered >= 1) {
      achievements.push({
        id: 'first_mastered',
        title: '初次掌握',
        description: '完全掌握第一個單詞',
        icon: 'checkmark-circle',
        earned: true,
        earnedAt: userStats.lastStudyDate
      });
    }
    
    // 學習天數成就
    if (userStats.streak >= 1) {
      achievements.push({
        id: 'daily_streak',
        title: '開始學習',
        description: '開始你的學習之旅',
        icon: 'play-circle',
        earned: true,
        earnedAt: userStats.lastStudyDate
      });
    }
    
    if (userStats.streak >= 7) {
      achievements.push({
        id: 'week_streak',
        title: '堅持一週',
        description: '連續學習7天',
        icon: 'calendar',
        earned: true,
        earnedAt: userStats.lastStudyDate
      });
    }
    
    if (userStats.streak >= 30) {
      achievements.push({
        id: 'month_streak',
        title: '學習達人',
        description: '連續學習30天',
        icon: 'trophy',
        earned: true,
        earnedAt: userStats.lastStudyDate
      });
    }
    
    // 單詞學習成就
    if (userStats.totalWordsLearned >= 3) {
      achievements.push({
        id: 'words_3',
        title: '小小收穫',
        description: '學習3個單詞',
        icon: 'book-outline',
        earned: true
      });
    }
    
    if (userStats.totalWordsLearned >= 10) {
      achievements.push({
        id: 'words_10',
        title: '學習新手',
        description: '學習10個單詞',
        icon: 'book',
        earned: true
      });
    }
    
    if (userStats.totalWordsLearned >= 50) {
      achievements.push({
        id: 'words_50',
        title: '詞彙新手',
        description: '學習50個單詞',
        icon: 'library-outline',
        earned: true
      });
    }
    
    if (userStats.totalWordsLearned >= 200) {
      achievements.push({
        id: 'words_200',
        title: '詞彙高手',
        description: '學習200個單詞',
        icon: 'library',
        earned: true
      });
    }
    
    // 掌握成就
    if (userStats.totalWordsMastered >= 5) {
      achievements.push({
        id: 'mastered_5',
        title: '掌握新手',
        description: '完全掌握5個單詞',
        icon: 'checkmark-done-circle-outline',
        earned: true
      });
    }
    
    if (userStats.totalWordsMastered >= 20) {
      achievements.push({
        id: 'mastered_20',
        title: '掌握專家',
        description: '完全掌握20個單詞',
        icon: 'checkmark-done-circle',
        earned: true
      });
    }
    
    res.json({ achievements });
    
  } catch (error) {
    console.error('獲取學習成就失敗:', error);
    res.status(500).json({ error: '獲取學習成就失敗' });
  }
});

module.exports = router;
