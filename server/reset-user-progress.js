// 重置用戶學習進度
const mongoose = require('mongoose');

// MongoDB 連接
const MONGODB_URI = 'mongodb+srv://soulteam529:soulteam529@cluster0.xzifv.mongodb.net/SoulDB?retryWrites=true&w=majority&appName=Cluster0';

async function resetUserProgress(userId) {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB 連接成功');

    const LearningProgress = mongoose.model('LearningProgress', new mongoose.Schema({}, { strict: false }));

    // 刪除用戶的學習進度
    const result = await LearningProgress.deleteOne({ userId });

    if (result.deletedCount > 0) {
      console.log(`✅ 成功刪除用戶 ${userId} 的學習進度`);
      console.log('💡 現在可以重新開始學習,時間計算將是正確的');
    } else {
      console.log(`⚠️ 未找到用戶 ${userId} 的學習記錄`);
    }

  } catch (error) {
    console.error('❌ 錯誤:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 MongoDB 連接已關閉');
  }
}

// 使用你的用戶 ID
const userId = 'user_30cUsplQrH5UTyQMSfLfY9BwYph';
resetUserProgress(userId);
