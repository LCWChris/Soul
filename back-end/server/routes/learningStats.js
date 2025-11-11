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
    
    console.log('📊 請求學習統計,userId:', userId);
    
    // 先檢查數據庫中是否有這個用戶的記錄
    const rawProgress = await LearningProgress.findOne({ userId });
    console.log('📊 數據庫原始記錄:', rawProgress ? {
      userId: rawProgress.userId,
      recordsCount: rawProgress.learningRecords?.length || 0,
      learnedWordsCount: rawProgress.learnedWords?.length || 0,
      stats: rawProgress.stats
    } : null);
    
    // 獲取用戶學習進度
    const userStats = await LearningProgress.getUserStats(userId);
    
    if (!userStats) {
      console.log('⚠️ 用戶無學習記錄,返回空統計');
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
    
    console.log('📊 getUserStats 返回:', {
      totalWordsLearned: userStats.totalWordsLearned,
      totalWordsMastered: userStats.totalWordsMastered,
      totalStudyTime: userStats.totalStudyTime,
      streak: userStats.streak,
      recentActivityCount: userStats.recentActivity?.length || 0
    });
    
    // 獲取總詞彙數量
    const totalWordsCount = await BookWord.countDocuments();
    
    // 簡化的分類統計 - 先獲取所有單詞，然後在 JavaScript 中處理
    console.log('📊 開始處理分類統計...');
    const allWords = await BookWord.find({ categories: { $exists: true } }).lean();
    
    const categoryMap = {};
    allWords.forEach(word => {
      if (Array.isArray(word.categories)) {
        word.categories.forEach(cat => {
          // 過濾無效值
          if (cat && 
              typeof cat === 'string' && 
              cat.trim() !== '' &&
              cat !== 'NaN' &&
              cat !== 'null' &&
              cat !== 'undefined' &&
              !cat.match(/^[\s\[\]'"]*$/)) {
            categoryMap[cat] = (categoryMap[cat] || 0) + 1;
          }
        });
      }
    });
    
    const allCategories = Object.entries(categoryMap)
      .map(([name, total]) => ({ _id: name, total }))
      .sort((a, b) => b.total - a.total);
    
    console.log('📊 處理完成，找到分類:', allCategories.length);
    
    // 簡化的等級統計
    const levelMap = {};
    const levelWords = await BookWord.find({ learning_level: { $exists: true, $ne: null, $ne: '' } }).lean();
    
    levelWords.forEach(word => {
      const level = word.learning_level;
      if (level && 
          typeof level === 'string' && 
          level.trim() !== '' &&
          level !== 'NaN' &&
          level !== 'null' &&
          level !== 'undefined') {
        levelMap[level] = (levelMap[level] || 0) + 1;
      }
    });
    
    const allLevels = Object.entries(levelMap)
      .map(([name, total]) => ({ _id: name, total }));
    
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
    
    // 構建最近活動 - 按日期聚合學習記錄
    console.log('📊 開始處理最近活動數據...');
    const activityByDate = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 初始化最近7天的數據
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      activityByDate[dateKey] = {
        wordsLearned: 0,
        timeSpent: 0,
        wordIds: new Set() // 用於去重單詞
      };
    }
    
    // 聚合學習記錄
    if (userStats.recentActivity && Array.isArray(userStats.recentActivity)) {
      userStats.recentActivity.forEach(record => {
        if (!record.date) return;
        
        const recordDate = new Date(record.date);
        recordDate.setHours(0, 0, 0, 0);
        const dateKey = recordDate.toISOString().split('T')[0];
        
        if (activityByDate[dateKey]) {
          // 只統計 'learn' 動作的單詞
          if (record.action === 'learn' && record.wordId) {
            activityByDate[dateKey].wordIds.add(record.wordId.toString());
          }
          // 累加學習時間(秒) - 自動修正舊數據(毫秒→秒)
          if (record.timeSpent) {
            let timeInSeconds = record.timeSpent;
            // 如果時間大於 1000 秒(約 16 分鐘),很可能是毫秒格式的舊數據
            if (timeInSeconds > 1000) {
              timeInSeconds = Math.round(timeInSeconds / 1000);
              console.log(`⚠️ 自動修正舊時間數據: ${record.timeSpent}ms → ${timeInSeconds}秒`);
            }
            activityByDate[dateKey].timeSpent += timeInSeconds;
          }
        }
      });
    }
    
    // 轉換為數組並格式化
    const recentActivity = Object.keys(activityByDate)
      .sort((a, b) => new Date(b) - new Date(a)) // 降序排列
      .slice(0, 7) // 只取最近7天
      .map((dateKey, index) => {
        const activity = activityByDate[dateKey];
        let dateLabel;
        
        if (index === 0) dateLabel = '今天';
        else if (index === 1) dateLabel = '昨天';
        else dateLabel = `${index}天前`;
        
        return {
          date: dateLabel,
          wordsLearned: activity.wordIds.size, // 去重後的單詞數
          timeSpent: Math.round(activity.timeSpent / 60) || 0 // 轉換為分鐘
        };
      })
      .filter(activity => activity.wordsLearned > 0 || activity.timeSpent > 0); // 過濾掉沒有活動的日期
    
    console.log('📊 最近活動數據處理完成，共', recentActivity.length, '天有學習記錄');
    
    // 計算進度百分比
    const progressPercentage = totalWordsCount > 0 ? 
      Math.round((userStats.totalWordsLearned / totalWordsCount) * 100) : 0;
    
    // 修正總學習時間 - 如果數值異常大,可能是舊數據(毫秒當成秒存儲了)
    let correctedTotalStudyTime = userStats.totalStudyTime || 0;
    if (correctedTotalStudyTime > 10000) {
      // 超過 10000 分鐘(約 166 小時)不合理,可能是毫秒數據
      console.log(`⚠️ 檢測到異常的總學習時間: ${correctedTotalStudyTime}分鐘,暫時顯示為 0`);
      correctedTotalStudyTime = 0; // 暫時顯示為 0,等待用戶重新學習累積正確數據
    }
    
    const response = {
      overall: {
        totalWords: totalWordsCount,
        learnedWords: userStats.totalWordsLearned || 0,
        masteredWords: userStats.totalWordsMastered || 0,
        progressPercentage,
        streak: userStats.streak || 0,
        totalStudyTime: Math.round(correctedTotalStudyTime) || 0 // 四捨五入到整數分鐘
      },
      categories: categoryProgress,
      levels: levelProgress,
      recentActivity
    };
    
    console.log('✅ 成功獲取學習統計');
    res.json(response);
    
  } catch (error) {
    console.error('❌ 獲取用戶學習統計失敗:', error);
    console.error('錯誤堆疊:', error.stack);
    res.status(500).json({ 
      error: '獲取統計數據失敗',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 記錄學習活動
router.post('/activity', async (req, res) => {
  try {
    const { userId, wordId, action, difficulty, timeSpent, isCorrect } = req.body;
    
    console.log('📝 收到學習活動記錄請求:', {
      userId,
      wordId,
      action,
      difficulty,
      timeSpent,
      isCorrect
    });
    
    if (!userId || !wordId || !action) {
      console.log('❌ 缺少必要參數');
      return res.status(400).json({ error: '缺少必要參數' });
    }
    
    const progress = await LearningProgress.recordLearningActivity(
      userId, 
      wordId, 
      action, 
      { difficulty, timeSpent, isCorrect }
    );
    
    console.log('✅ 學習活動記錄成功:', {
      userId,
      totalRecords: progress.learningRecords.length,
      totalWordsLearned: progress.stats.totalWordsLearned
    });
    
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
    console.error('❌ 記錄學習活動失敗:', error);
    console.error('錯誤堆疊:', error.stack);
    res.status(500).json({ error: '記錄學習活動失敗', message: error.message });
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
