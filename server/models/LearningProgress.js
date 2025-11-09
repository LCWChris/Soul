// SOUL/server/models/LearningProgress.js
const mongoose = require("mongoose");

// 學習記錄 Schema
const LearningRecordSchema = new mongoose.Schema({
  wordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BookWord',
    required: true
  },
  action: {
    type: String,
    enum: ['view', 'learn', 'practice', 'master', 'review'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  timeSpent: {
    type: Number, // 秒數
    default: 0
  },
  isCorrect: {
    type: Boolean,
    default: null // null 表示不適用 (如 view 動作)
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// 用戶學習進度 Schema
const LearningProgressSchema = new mongoose.Schema({
  userId: {
    type: String, // Clerk User ID
    required: true,
    unique: true
  },
  // 學習記錄
  learningRecords: [LearningRecordSchema],
  
  // 已學習的單詞 ID
  learnedWords: [{
    wordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BookWord'
    },
    firstLearnedAt: {
      type: Date,
      default: Date.now
    },
    masteredAt: {
      type: Date,
      default: null
    },
    reviewCount: {
      type: Number,
      default: 0
    },
    lastReviewedAt: {
      type: Date,
      default: null
    }
  }],
  
  // 統計資料
  stats: {
    totalStudyTime: { type: Number, default: 0 }, // 總學習時間 (分鐘)
    streak: { type: Number, default: 0 }, // 連續學習天數
    lastStudyDate: { type: Date, default: null },
    totalWordsLearned: { type: Number, default: 0 },
    totalWordsMastered: { type: Number, default: 0 },
    
    // 分類統計
    categoryProgress: [{
      category: String,
      wordsLearned: { type: Number, default: 0 },
      wordsMastered: { type: Number, default: 0 },
      totalTime: { type: Number, default: 0 }
    }],
    
    // 等級統計
    levelProgress: [{
      level: String,
      wordsLearned: { type: Number, default: 0 },
      wordsMastered: { type: Number, default: 0 },
      totalTime: { type: Number, default: 0 }
    }]
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 更新 updatedAt 時間戳
LearningProgressSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 靜態方法：記錄學習活動
LearningProgressSchema.statics.recordLearningActivity = async function(userId, wordId, action, options = {}) {
  const { difficulty = 'medium', timeSpent = 0, isCorrect = null } = options;
  
  try {
    let progress = await this.findOne({ userId });
    
    if (!progress) {
      progress = new this({ userId });
    }
    
    // 添加學習記錄
    progress.learningRecords.push({
      wordId,
      action,
      difficulty,
      timeSpent,
      isCorrect,
      timestamp: new Date()
    });
    
    // 更新統計
    if (action === 'learn') {
      const existingWord = progress.learnedWords.find(w => w.wordId.toString() === wordId.toString());
      
      if (!existingWord) {
        progress.learnedWords.push({
          wordId,
          firstLearnedAt: new Date()
        });
        progress.stats.totalWordsLearned += 1;
      }
    } else if (action === 'master') {
      const wordIndex = progress.learnedWords.findIndex(w => w.wordId.toString() === wordId.toString());
      
      if (wordIndex !== -1) {
        progress.learnedWords[wordIndex].masteredAt = new Date();
        progress.stats.totalWordsMastered += 1;
      }
    }
    
    // 更新學習時間(timeSpent 是秒數,stats.totalStudyTime 存儲分鐘數)
    const timeSpentInMinutes = timeSpent / 60;
    progress.stats.totalStudyTime += timeSpentInMinutes;
    console.log(`⏱️ 更新學習時間: +${timeSpent}秒 (${timeSpentInMinutes.toFixed(2)}分鐘), 累計: ${progress.stats.totalStudyTime.toFixed(2)}分鐘`);
    
    // 更新連續學習天數
    const today = new Date();
    const lastStudyDate = progress.stats.lastStudyDate;
    
    if (!lastStudyDate || !isSameDay(lastStudyDate, today)) {
      if (lastStudyDate && isYesterday(lastStudyDate, today)) {
        progress.stats.streak += 1;
      } else if (!lastStudyDate || !isSameDay(lastStudyDate, today)) {
        progress.stats.streak = 1;
      }
      progress.stats.lastStudyDate = today;
    }
    
    await progress.save();
    return progress;
  } catch (error) {
    console.error('記錄學習活動失敗:', error);
    throw error;
  }
};

// 靜態方法：獲取用戶統計
LearningProgressSchema.statics.getUserStats = async function(userId) {
  try {
    const progress = await this.findOne({ userId })
      .populate('learnedWords.wordId');
    
    if (!progress) {
      return null;
    }
    
    // 計算分類和等級統計
    const categoryStats = {};
    const levelStats = {};
    
    for (const learnedWord of progress.learnedWords) {
      if (learnedWord.wordId && learnedWord.wordId.categories) {
        // 過濾無效的分類值
        const validCategories = (learnedWord.wordId.categories || []).filter(category => 
          category && 
          typeof category === 'string' && 
          category.trim() !== '' &&
          category !== 'NaN' &&
          category !== 'null' &&
          category !== 'undefined' &&
          !category.match(/^[\s\[\]'"]*$/)
        );
        
        for (const category of validCategories) {
          if (!categoryStats[category]) {
            categoryStats[category] = { learned: 0, mastered: 0 };
          }
          categoryStats[category].learned += 1;
          if (learnedWord.masteredAt) {
            categoryStats[category].mastered += 1;
          }
        }
      }
      
      if (learnedWord.wordId && learnedWord.wordId.learning_level) {
        const level = learnedWord.wordId.learning_level;
        // 過濾無效的等級值
        if (level && 
            typeof level === 'string' && 
            level.trim() !== '' &&
            level !== 'NaN' &&
            level !== 'null' &&
            level !== 'undefined') {
          if (!levelStats[level]) {
            levelStats[level] = { learned: 0, mastered: 0 };
          }
          levelStats[level].learned += 1;
          if (learnedWord.masteredAt) {
            levelStats[level].mastered += 1;
          }
        }
      }
    }
    
    return {
      ...progress.stats.toObject(),
      categoryStats,
      levelStats,
      recentActivity: progress.learningRecords
        .slice(-10)
        .reverse()
        .map(record => ({
          date: record.timestamp,
          action: record.action,
          timeSpent: record.timeSpent,
          wordId: record.wordId
        }))
    };
  } catch (error) {
    console.error('獲取用戶統計失敗:', error);
    throw error;
  }
};

// 輔助函數
function isSameDay(date1, date2) {
  return date1.toDateString() === date2.toDateString();
}

function isYesterday(date1, today) {
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(date1, yesterday);
}

module.exports = mongoose.model('LearningProgress', LearningProgressSchema);
