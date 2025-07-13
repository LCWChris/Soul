// app/scrollView_test.tsx
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native'; // 導入 StyleSheet

export default function ScrollViewTestScreen() {
  return (
    <ScrollView
      className="flex-1 bg-yellow-100 p-5" // ScrollView 自身的樣式
      // **關鍵修改：將內容居中樣式應用到 contentContainerStyle**
      contentContainerStyle={styles.contentContainer}
    >
      <View> {/* 這個 View 內部不再需要 justify-center 和 items-center */}
        <Text className="text-3xl text-yellow-800 font-bold mb-4">這是分頁二 (ScrollView 測試頁)</Text>
        <Text className="text-base text-gray-700 text-center mb-2">
          這是一個示範性的段落。您將在此處添加手語課程、詞彙列表或其他教學材料。
        </Text>
        <Text className="text-base text-gray-700 text-center mb-2">
          未來您可以根據需要，在這裡填充真實的教學內容，例如手語影片、圖片、文字說明等。確保您的內容足夠豐富，以充分利用滾動功能。
        </Text>
        <Text className="text-base text-gray-700 text-center">
          在 React Native 中，ScrollView 允許您顯示比屏幕更大的內容。
        </Text>
        {/* 添加更多內容以測試滾動 */}
        <Text className="text-base text-gray-700 text-center mt-5">底部內容...</Text>
        <Text className="text-base text-gray-700 text-center">再加一些行...</Text>
        <Text className="text-base text-gray-700 text-center">確保可以滾動。</Text>
        <Text className="text-base text-gray-700 text-center mt-5">底部內容...</Text>
        <Text className="text-base text-gray-700 text-center">再加一些行...</Text>
        <Text className="text-base text-gray-700 text-center">確保可以滾動。</Text>
        <Text className="text-base text-gray-700 text-center mt-5">底部內容...</Text>
        <Text className="text-base text-gray-700 text-center">再加一些行...</Text>
        <Text className="text-base text-gray-700 text-center">確保可以滾動。</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    // 應用內容的居中樣式到 contentContainerStyle
    // 注意：您不能直接在這裡寫 Tailwind 類名，需要用 StyleSheet.create 轉換
    // 或者使用 NativeWind 的 `useTailwind` Hook 或 `tw` 函數來轉換
    justifyContent: 'center',
    alignItems: 'center',
    flexGrow: 1, // 讓內容容器在內容不足時也能佔滿可用空間，以實現居中
  },
});