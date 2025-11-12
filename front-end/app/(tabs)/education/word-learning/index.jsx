// word-learning 頁面的入口點 - Material You 設計
// Barrel import brings in MaterialWordLearningScreen; add a runtime check to surface theme issues early during debugging.
import { MaterialWordLearningScreen, MaterialYouTheme } from "./ui";

if (!MaterialYouTheme || !MaterialYouTheme.primary) {
  console.warn(
    "[word-learning] MaterialYouTheme failed to load or missing primary colors"
  );
}

export default MaterialWordLearningScreen;
