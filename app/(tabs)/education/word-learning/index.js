// 詞彙學習模組的統一導出文件
export { default as VocabularyCategories } from './components/VocabularyCategories';
export { default as RecommendedWords } from './components/RecommendedWords';

export { VocabularyService } from './services/VocabularyService';
export { 
  useVocabulary, 
  useCategories, 
  useRecommendations, 
  useVocabularySearch 
} from './hooks/useVocabulary';

export * from './types/vocabulary';
