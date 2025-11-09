// 修正數據庫中錯誤的時間數據
const mongoose = require('mongoose');
const LearningProgress = require('./models/LearningProgress');

// MongoDB 連接 - 使用正確的連接字符串
const MONGODB_URI = "mongodb+srv://soulsignteam:souls115@soulsignteam.rff3iag.mongodb.net/tsl_app?retryWrites=true&w=majority";

async function fixTimeData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB 連接成功');

    const userId = 'user_30cUsplQrH5UTyQMSfLfY9BwYph';
    
    const progress = await LearningProgress.findOne({ userId });
    
    if (!progress) {
      console.log('❌ 找不到用戶記錄');
      return;
    }

    console.log('\n📊 修正前的數據:');
    console.log('  總學習時間:', progress.stats.totalStudyTime, '分鐘');
    console.log('  學習記錄數:', progress.learningRecords.length);
    console.log('  已學習單詞:', progress.learnedWords.length);

    // 方案 A: 完全重置時間數據
    console.log('\n🔧 選擇修復方案:');
    console.log('1. 重置所有時間數據為 0 (保留學習記錄)');
    console.log('2. 根據學習記錄重新計算時間 (假設每個動作 5 秒)');
    console.log('3. 刪除所有學習記錄,從頭開始');
    
    // 這裡使用方案 1: 重置時間
    progress.stats.totalStudyTime = 0;
    
    // 修正 learningRecords 中的 timeSpent (將毫秒轉為秒)
    let correctedRecords = 0;
    for (let record of progress.learningRecords) {
      // 如果 timeSpent 大於 1000,很可能是毫秒
      if (record.timeSpent > 1000) {
        record.timeSpent = Math.round(record.timeSpent / 1000);
        correctedRecords++;
      }
    }
    
    await progress.save();

    console.log('\n✅ 修正完成!');
    console.log('  總學習時間已重置為:', progress.stats.totalStudyTime, '分鐘');
    console.log('  修正了', correctedRecords, '條學習記錄的時間');
    console.log('\n💡 建議: 現在重新學習幾個單詞來累積正確的時間數據');

  } catch (error) {
    console.error('❌ 錯誤:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 MongoDB 連接已關閉');
  }
}

fixTimeData();
