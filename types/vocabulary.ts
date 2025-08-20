// 單詞型別定義
export type Vocabulary = {
  _id: string;
  word: string;
  definition: string;
  image_url?: string;
  imageUrls?: string[];
  isFavorite?: boolean;
  [key: string]: any;
};
