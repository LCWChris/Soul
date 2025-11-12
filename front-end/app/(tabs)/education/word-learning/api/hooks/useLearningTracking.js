// SOUL/app/(tabs)/education/word-learning/hooks/useLearningTracking.js
import { useState } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { VocabularyService } from '../services/VocabularyService';

export const useLearningTracking = () => {
  const { user } = useUser();
  const [recording, setRecording] = useState(false);

  // 記錄學習活動
  const recordActivity = async (wordId, action, options = {}) => {
    if (!user?.id || !wordId || !action) {
      console.warn('缺少必要的參數來記錄學習活動');
      return false;
    }

    try {
      setRecording(true);
      
      const result = await VocabularyService.recordLearningActivity(
        user.id,
        wordId,
        action,
        options,
      );
      
      console.log('學習活動記錄成功:', result);
      return true;
    } catch (error) {
      console.error('記錄學習活動失敗:', error);
      return false;
    } finally {
      setRecording(false);
    }
  };

  // 記錄查看單詞
  const recordWordView = (wordId, timeSpent = 0) => {
    return recordActivity(wordId, 'view', { timeSpent });
  };

  // 記錄學習單詞
  const recordWordLearned = (wordId, timeSpent = 0, difficulty = 'medium') => {
    return recordActivity(wordId, 'learn', { timeSpent, difficulty });
  };

  // 記錄練習活動
  const recordWordPractice = (wordId, timeSpent = 0, isCorrect = null, difficulty = 'medium') => {
    return recordActivity(wordId, 'practice', { timeSpent, isCorrect, difficulty });
  };

  // 記錄掌握單詞
  const recordWordMastered = (wordId, timeSpent = 0) => {
    return recordActivity(wordId, 'master', { timeSpent });
  };

  // 記錄複習活動
  const recordWordReview = (wordId, timeSpent = 0, isCorrect = null) => {
    return recordActivity(wordId, 'review', { timeSpent, isCorrect });
  };

  return {
    recording,
    recordActivity,
    recordWordView,
    recordWordLearned,
    recordWordPractice,
    recordWordMastered,
    recordWordReview,
  };
};
