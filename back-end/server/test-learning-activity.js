// 測試腳本:添加學習活動記錄
const mongoose = require('mongoose');
const LearningProgress = require('./models/LearningProgress');

// MongoDB 連接
const MONGODB_URI = 'mongodb+srv://soulteam529:soulteam529@cluster0.xzifv.mongodb.net/SoulDB?retryWrites=true&w=majority&appName=Cluster0';

async function addTestLearningActivities() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB 連接成功');

    const userId = 'test-user';
    
    // 獲取一些單詞 ID
    const BookWord = mongoose.model('BookWord');
    const words = await BookWord.find().limit(20);
    
    if (words.length === 0) {
      console.log('❌ 沒有找到單詞數據');
      return;
    }

    console.log(`📚 找到 ${words.length} 個單詞`);

    // 創建或獲取用戶的學習進度
    let progress = await LearningProgress.findOne({ userId });
    
    if (!progress) {
      progress = new LearningProgress({
        userId,
        learningRecords: [],
        learnedWords: [],
        stats: {
          totalWordsLearned: 0,
          totalWordsMastered: 0,
          totalStudyTime: 0,
          streak: 0,
          lastStudyDate: null
        }
      });
    }

    // 添加過去7天的學習記錄
    const today = new Date();
    const activities = [];

    for (let daysAgo = 0; daysAgo < 7; daysAgo++) {
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);
      date.setHours(10 + daysAgo, 0, 0, 0); // 設置不同的時間

      // 每天學習 3-8 個單詞
      const wordsPerDay = Math.floor(Math.random() * 6) + 3;
      
      for (let i = 0; i < wordsPerDay && i < words.length; i++) {
        const wordIndex = (daysAgo * 3 + i) % words.length;
        const word = words[wordIndex];
        
        // 隨機生成學習時間 (30-180秒)
        const timeSpent = Math.floor(Math.random() * 150) + 30;
        
        activities.push({
          wordId: word._id,
          action: 'learn',
          difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)],
          timeSpent,
          isCorrect: Math.random() > 0.3, // 70% 正確率
          timestamp: date
        });

        // 添加到已學習單詞列表
        const existingWord = progress.learnedWords.find(
          w => w.wordId.toString() === word._id.toString()
        );
        
        if (!existingWord) {
          progress.learnedWords.push({
            wordId: word._id,
            learnedAt: date,
            masteredAt: Math.random() > 0.7 ? date : null, // 30% 掌握率
            reviewCount: 1,
            lastReviewedAt: date,
            difficulty: 'medium'
          });
        }
      }
    }

    console.log(`📝 準備添加 ${activities.length} 條學習記錄`);

    // 添加學習記錄
    progress.learningRecords.push(...activities);

    // 更新統計數據
    progress.stats.totalWordsLearned = progress.learnedWords.length;
    progress.stats.totalWordsMastered = progress.learnedWords.filter(w => w.masteredAt).length;
    progress.stats.totalStudyTime = activities.reduce((sum, a) => sum + a.timeSpent, 0);
    progress.stats.lastStudyDate = today;
    progress.stats.streak = 7; // 連續7天

    await progress.save();

    console.log('✅ 學習記錄添加成功!');
    console.log(`📊 總學習單詞: ${progress.stats.totalWordsLearned}`);
    console.log(`📊 總掌握單詞: ${progress.stats.totalWordsMastered}`);
    console.log(`📊 總學習時間: ${Math.round(progress.stats.totalStudyTime / 60)} 分鐘`);
    console.log(`📊 連續天數: ${progress.stats.streak} 天`);
    console.log(`📊 學習記錄數: ${progress.learningRecords.length}`);

  } catch (error) {
    console.error('❌ 錯誤:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 MongoDB 連接已關閉');
  }
}

addTestLearningActivities();
