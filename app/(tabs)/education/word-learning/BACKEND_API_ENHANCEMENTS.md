# 後端 API 增強建議

## 新增 API 端點

### 1. 詞彙測驗相關 API

```javascript
// 生成測驗題目
app.post('/api/quiz/generate', async (req, res) => {
  try {
    const { category, level, questionCount = 10 } = req.body;
    
    // 根據分類和級別獲取詞彙
    const vocabularies = await VocabularyModel.find({
      categories: category,
      learning_level: level
    }).limit(questionCount * 4); // 取更多詞彙用於生成選項
    
    const questions = vocabularies.slice(0, questionCount).map(vocab => {
      // 隨機選擇3個錯誤答案
      const wrongAnswers = vocabularies
        .filter(v => v._id !== vocab._id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map(v => v.definition);
      
      // 隨機排列選項
      const options = [vocab.definition, ...wrongAnswers]
        .sort(() => 0.5 - Math.random());
      
      return {
        question: `"${vocab.word}" 的意思是？`,
        options,
        correctAnswer: options.indexOf(vocab.definition),
        word: vocab.word,
        image: vocab.image_url
      };
    });
    
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 提交測驗結果
app.post('/api/quiz/submit', async (req, res) => {
  try {
    const { userId, quizResults, category, level } = req.body;
    
    // 保存測驗結果到用戶進度
    const result = await UserProgressModel.create({
      userId,
      activity: 'quiz',
      category,
      level,
      score: quizResults.score,
      total: quizResults.total,
      percentage: quizResults.percentage,
      timestamp: new Date()
    });
    
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 2. 智能搜索相關 API

```javascript
// 智能搜索
app.post('/api/search/smart', async (req, res) => {
  try {
    const { 
      query, 
      filters = {}, 
      includeDefinitions = true, 
      includeSynonyms = true,
      fuzzyMatch = true 
    } = req.body;
    
    let searchQuery = {};
    
    // 構建搜索條件
    if (query) {
      const searchConditions = [
        { word: { $regex: query, $options: 'i' } }
      ];
      
      if (includeDefinitions) {
        searchConditions.push({ definition: { $regex: query, $options: 'i' } });
      }
      
      if (includeSynonyms) {
        searchConditions.push({ synonyms: { $regex: query, $options: 'i' } });
      }
      
      searchQuery.$or = searchConditions;
    }
    
    // 應用篩選器
    if (filters.category) {
      searchQuery.categories = filters.category;
    }
    if (filters.level) {
      searchQuery.learning_level = filters.level;
    }
    if (filters.context) {
      searchQuery.context = filters.context;
    }
    
    const words = await VocabularyModel.find(searchQuery)
      .limit(20)
      .sort({ frequency: -1 });
    
    // 生成搜索建議
    const suggestions = await generateSearchSuggestions(query);
    
    res.json({ words, suggestions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 獲取熱門搜索詞
app.get('/api/search/popular', async (req, res) => {
  try {
    // 從搜索日誌中獲取熱門搜索詞
    const popularSearches = await SearchLogModel.aggregate([
      { $group: { _id: '$query', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { _id: 0, term: '$_id', count: 1 } }
    ]);
    
    res.json(popularSearches.map(item => item.term));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 3. 學習計劃相關 API

```javascript
// 獲取計劃模板
app.get('/api/plans/templates', async (req, res) => {
  try {
    const templates = [
      {
        id: 'beginner_daily',
        name: '初學者每日計劃',
        description: '適合初學者的輕鬆學習計劃，每天學習5個新詞彙',
        dailyGoal: 5,
        duration: 30,
        level: 'beginner',
        categories: ['daily', 'basic'],
        schedule: {
          mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false
        }
      },
      {
        id: 'intermediate_intensive',
        name: '中級強化計劃',
        description: '適合有基礎的學習者，每天學習10個詞彙',
        dailyGoal: 10,
        duration: 60,
        level: 'intermediate',
        categories: ['academic', 'professional'],
        schedule: {
          mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: false
        }
      },
      {
        id: 'advanced_comprehensive',
        name: '高級綜合計劃',
        description: '適合高級學習者的全面詞彙擴展計劃',
        dailyGoal: 15,
        duration: 90,
        level: 'advanced',
        categories: ['academic', 'professional', 'specialized'],
        schedule: {
          mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: true
        }
      }
    ];
    
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 創建學習計劃
app.post('/api/plans/create', async (req, res) => {
  try {
    const { userId, name, description, dailyGoal, duration, categories, level, schedule } = req.body;
    
    const plan = await LearningPlanModel.create({
      userId,
      name,
      description,
      dailyGoal,
      duration,
      categories,
      level,
      schedule,
      startDate: new Date(),
      status: 'active'
    });
    
    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 獲取今日進度
app.get('/api/plans/today-progress/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const plan = await LearningPlanModel.findOne({ 
      userId, 
      status: 'active' 
    });
    
    if (!plan) {
      return res.json({ completed: 0, target: 0, streak: 0 });
    }
    
    const todayProgress = await UserProgressModel.find({
      userId,
      timestamp: { $gte: today }
    });
    
    const completed = todayProgress.length;
    const target = plan.dailyGoal;
    
    // 計算連續天數
    const streak = await calculateStreak(userId);
    
    res.json({ completed, target, streak });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 4. 用戶進度追蹤 API

```javascript
// 獲取用戶詳細統計
app.get('/api/users/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // 總學習詞彙數
    const totalWordsLearned = await UserProgressModel.distinct('wordId', { userId }).length;
    
    // 本週學習統計
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStats = await UserProgressModel.find({
      userId,
      timestamp: { $gte: weekStart }
    });
    
    // 分類學習分佈
    const categoryStats = await UserProgressModel.aggregate([
      { $match: { userId } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // 學習準確率
    const quizResults = await UserProgressModel.find({
      userId,
      activity: 'quiz'
    });
    
    const averageAccuracy = quizResults.length > 0 
      ? quizResults.reduce((sum, result) => sum + result.percentage, 0) / quizResults.length 
      : 0;
    
    res.json({
      totalWordsLearned,
      weeklyLearned: weekStats.length,
      categoryDistribution: categoryStats,
      averageAccuracy: Math.round(averageAccuracy),
      streak: await calculateStreak(userId)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 記錄學習活動
app.post('/api/users/:userId/activity', async (req, res) => {
  try {
    const { userId } = req.params;
    const { activity, wordId, category, level, score, metadata } = req.body;
    
    const activityRecord = await UserProgressModel.create({
      userId,
      activity,
      wordId,
      category,
      level,
      score,
      metadata,
      timestamp: new Date()
    });
    
    res.json({ success: true, activity: activityRecord });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 5. 離線同步相關 API

```javascript
// 獲取所有詞彙（用於離線同步）
app.get('/api/vocabularies/all', async (req, res) => {
  try {
    const vocabularies = await VocabularyModel.find({})
      .select('word definition categories learning_level context frequency image_url')
      .sort({ frequency: -1 });
    
    res.json(vocabularies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 批量同步用戶進度
app.post('/api/sync/progress', async (req, res) => {
  try {
    const { userId, progressData } = req.body;
    
    // 批量插入或更新進度數據
    const syncResults = await Promise.all(
      progressData.map(async (data) => {
        return await UserProgressModel.findOneAndUpdate(
          { 
            userId, 
            activity: data.activity,
            wordId: data.wordId,
            timestamp: data.timestamp 
          },
          data,
          { upsert: true, new: true }
        );
      })
    );
    
    res.json({ 
      success: true, 
      synced: syncResults.length,
      lastSync: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 數據模型建議

### UserProgress 模型
```javascript
const userProgressSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  activity: { 
    type: String, 
    enum: ['learn', 'quiz', 'review', 'favorite'],
    required: true 
  },
  wordId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vocabulary' },
  category: String,
  level: String,
  score: Number,
  percentage: Number,
  metadata: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now }
});
```

### LearningPlan 模型
```javascript
const learningPlanSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  description: String,
  dailyGoal: { type: Number, required: true },
  duration: { type: Number, required: true }, // 天數
  categories: [String],
  level: String,
  schedule: {
    mon: Boolean,
    tue: Boolean,
    wed: Boolean,
    thu: Boolean,
    fri: Boolean,
    sat: Boolean,
    sun: Boolean
  },
  startDate: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['active', 'paused', 'completed'], 
    default: 'active' 
  }
});
```

### SearchLog 模型
```javascript
const searchLogSchema = new mongoose.Schema({
  query: { type: String, required: true },
  userId: String,
  filters: mongoose.Schema.Types.Mixed,
  resultCount: Number,
  timestamp: { type: Date, default: Date.now }
});
```

這些 API 增強將為前端新功能提供完整的後端支持，包括智能搜索、測驗系統、學習計劃和進度追蹤等功能。
