// 全域字體大小常數 - 統一管理字體大小
export const FONT_SIZES = {
  // 標題
  xxlarge: 30, // 主標題
  xlarge: 26, // 副標題
  large: 22, // 大標題
  title: 20, // 區塊標題

  // 內容
  regular: 17, // 一般文字
  medium: 16, // 中等文字
  small: 15, // 小文字

  // 輔助
  caption: 14, // 標註
  tiny: 13, // 微小文字
  mini: 12, // 極小文字
} as const;

// 行高對照表
export const LINE_HEIGHTS = {
  xxlarge: 36,
  xlarge: 32,
  large: 28,
  title: 26,
  regular: 24,
  medium: 22,
  small: 20,
  caption: 18,
  tiny: 16,
  mini: 14,
} as const;
