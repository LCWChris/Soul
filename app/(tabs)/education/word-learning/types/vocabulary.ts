// TypeScript 類型定義（如果項目使用 TypeScript）
export interface VocabularyWord {
  _id: string;
  title: string;
  content?: string;
  image_url?: string;
  volume?: string;
  lesson?: number;
  level?: 'beginner' | 'intermediate' | 'advanced';
  learning_level?: 'beginner' | 'intermediate' | 'advanced';
  categories?: string[];
  context?: 'daily' | 'formal' | 'educational';
  frequency?: 'high' | 'medium' | 'low';
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  name: string;
  count: number;
  icon?: string;
}

export interface CategoryData {
  categories: Category[];
  learning_levels: string[];
  volumes?: string[];
}

export interface VocabularyFilters {
  level?: string;
  category?: string;
  learning_level?: string;
  search?: string;
  volume?: string;
  lesson?: number;
  frequency?: string;
  limit?: number;
  offset?: number;
}

export interface RecommendationParams {
  learning_level: string;
  limit?: number;
  categories?: string[];
}

export interface VocabularyStats {
  total: number;
  by_level: Array<{
    _id: string;
    count: number;
  }>;
  by_category: Array<{
    _id: string;
    count: number;
  }>;
}
