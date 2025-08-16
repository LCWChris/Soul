# UX/UI 改進建議

## 界面設計增強

### 1. 深色模式支持

建議添加深色模式切換功能，提升用戶體驗：

```javascript
// themes/DarkModeContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DarkModeContext = createContext();

export const useDarkMode = () => useContext(DarkModeContext);

export const DarkModeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme_preference');
      if (savedTheme) {
        setIsDark(savedTheme === 'dark');
      } else {
        // 使用系統設置
        const systemTheme = Appearance.getColorScheme();
        setIsDark(systemTheme === 'dark');
      }
    } catch (error) {
      console.error('載入主題設置失敗:', error);
    }
  };

  const toggleDarkMode = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    await AsyncStorage.setItem('theme_preference', newTheme ? 'dark' : 'light');
  };

  const theme = {
    isDark,
    colors: isDark ? darkColors : lightColors,
    toggleDarkMode
  };

  return (
    <DarkModeContext.Provider value={theme}>
      {children}
    </DarkModeContext.Provider>
  );
};

const lightColors = {
  background: '#f8f9fa',
  surface: '#ffffff',
  primary: '#4A90E2',
  text: '#333333',
  textSecondary: '#666666',
  border: '#e0e0e0'
};

const darkColors = {
  background: '#121212',
  surface: '#1e1e1e',
  primary: '#5aa3f0',
  text: '#ffffff',
  textSecondary: '#b3b3b3',
  border: '#333333'
};
```

### 2. 動畫增強組件

```javascript
// components/AnimatedCard.jsx
import React from 'react';
import { Animated, TouchableOpacity } from 'react-native';

const AnimatedCard = ({ children, onPress, style, ...props }) => {
  const scaleValue = new Animated.Value(1);
  const opacityValue = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 0.95,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      activeOpacity={1}
      {...props}
    >
      <Animated.View
        style={[
          style,
          {
            transform: [{ scale: scaleValue }],
            opacity: opacityValue,
          },
        ]}
      >
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

export default AnimatedCard;
```

### 3. 游戲化元素

```javascript
// components/AchievementBadge.jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useDarkMode } from '../themes/DarkModeContext';

const AchievementBadge = ({ achievement, isUnlocked, size = 'medium' }) => {
  const { colors } = useDarkMode();

  const badges = {
    'first_word': { emoji: '🎯', name: '初學者', description: '學習第一個單字' },
    'week_streak': { emoji: '🔥', name: '持之以恆', description: '連續學習7天' },
    'quiz_master': { emoji: '🏆', name: '測驗達人', description: '測驗平均90%以上' },
    'category_explorer': { emoji: '🗺️', name: '探索者', description: '學習5個不同分類' },
    'speed_learner': { emoji: '⚡', name: '速學者', description: '單日學習20個單字' },
  };

  const badge = badges[achievement] || { emoji: '📚', name: '未知成就', description: '' };
  
  const sizeStyles = {
    small: styles.badgeSmall,
    medium: styles.badgeMedium,
    large: styles.badgeLarge,
  };

  return (
    <View style={[
      styles.badgeContainer,
      sizeStyles[size],
      { backgroundColor: colors.surface, borderColor: colors.border },
      !isUnlocked && styles.lockedBadge
    ]}>
      <Text style={[
        styles.badgeEmoji,
        size === 'large' ? styles.emojiLarge : size === 'small' ? styles.emojiSmall : styles.emojiMedium,
        !isUnlocked && styles.lockedEmoji
      ]}>
        {badge.emoji}
      </Text>
      <Text style={[
        styles.badgeName,
        { color: colors.text },
        !isUnlocked && styles.lockedText
      ]}>
        {badge.name}
      </Text>
      {size === 'large' && (
        <Text style={[
          styles.badgeDescription,
          { color: colors.textSecondary },
          !isUnlocked && styles.lockedText
        ]}>
          {badge.description}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badgeContainer: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    margin: 4,
  },
  badgeSmall: {
    width: 60,
    height: 60,
  },
  badgeMedium: {
    width: 80,
    height: 80,
  },
  badgeLarge: {
    width: 120,
    minHeight: 120,
  },
  badgeEmoji: {
    marginBottom: 4,
  },
  emojiSmall: {
    fontSize: 20,
  },
  emojiMedium: {
    fontSize: 24,
  },
  emojiLarge: {
    fontSize: 32,
  },
  badgeName: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  badgeDescription: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
  },
  lockedBadge: {
    opacity: 0.5,
  },
  lockedEmoji: {
    opacity: 0.3,
  },
  lockedText: {
    opacity: 0.6,
  },
});

export default AchievementBadge;
```

### 4. 智能通知系統

```javascript
// services/NotificationService.js
import PushNotification from 'react-native-push-notification';
import AsyncStorage from '@react-native-async-storage/async-storage';

class NotificationService {
  static async setupNotifications() {
    PushNotification.configure({
      onNotification: function(notification) {
        console.log('Notification received:', notification);
      },
      requestPermissions: Platform.OS === 'ios',
    });
  }

  static async scheduleStudyReminder(time = '19:00') {
    try {
      const isEnabled = await AsyncStorage.getItem('study_reminder_enabled');
      if (isEnabled === 'false') return;

      PushNotification.localNotificationSchedule({
        title: '📚 學習時間到了！',
        message: '今天還沒有學習新單字，來完成每日目標吧！',
        date: new Date(Date.now() + 60 * 1000), // 測試用：1分鐘後
        repeatType: 'day',
        id: 'daily_study_reminder',
      });
    } catch (error) {
      console.error('設置學習提醒失敗:', error);
    }
  }

  static async scheduleStreakReminder() {
    try {
      PushNotification.localNotificationSchedule({
        title: '🔥 保持學習連續記錄！',
        message: '您已經連續學習了幾天，不要讓連續記錄中斷！',
        date: new Date(Date.now() + 2 * 60 * 1000), // 2分鐘後
        id: 'streak_reminder',
      });
    } catch (error) {
      console.error('設置連續記錄提醒失敗:', error);
    }
  }

  static async sendAchievementNotification(achievement) {
    try {
      const achievements = {
        'first_word': '🎯 恭喜！您獲得了"初學者"徽章！',
        'week_streak': '🔥 太棒了！您獲得了"持之以恆"徽章！',
        'quiz_master': '🏆 優秀！您獲得了"測驗達人"徽章！',
      };

      PushNotification.localNotification({
        title: '🏅 新成就解鎖！',
        message: achievements[achievement] || '您獲得了新徽章！',
        id: `achievement_${achievement}`,
      });
    } catch (error) {
      console.error('發送成就通知失敗:', error);
    }
  }

  static async cancelAllNotifications() {
    PushNotification.cancelAllLocalNotifications();
  }

  static async setNotificationPreference(type, enabled) {
    await AsyncStorage.setItem(`${type}_reminder_enabled`, enabled.toString());
  }
}

export default NotificationService;
```

### 5. 無障礙功能增強

```javascript
// hooks/useAccessibility.js
import { useState, useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';

export const useAccessibility = () => {
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] = useState(false);

  useEffect(() => {
    // 檢查螢幕閱讀器狀態
    AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
      setIsScreenReaderEnabled(enabled);
    });

    // 檢查動畫減少設置
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setIsReduceMotionEnabled(enabled);
    });

    // 監聽變化
    const screenReaderSubscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsScreenReaderEnabled
    );

    const reduceMotionSubscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setIsReduceMotionEnabled
    );

    return () => {
      screenReaderSubscription?.remove();
      reduceMotionSubscription?.remove();
    };
  }, []);

  return {
    isScreenReaderEnabled,
    isReduceMotionEnabled,
    announce: (message) => {
      if (isScreenReaderEnabled) {
        AccessibilityInfo.announceForAccessibility(message);
      }
    },
  };
};
```

## 用戶體驗改進

### 1. 手勢導航增強

- 添加滑動手勢來快速切換分類
- 實現拖拽排序收藏夾
- 長按顯示快速操作菜單

### 2. 個性化設置

```javascript
// screens/SettingsScreen.jsx
const SettingsScreen = () => {
  const [settings, setSettings] = useState({
    fontSize: 'medium',
    autoPlay: true,
    dailyGoal: 10,
    difficulty: 'adaptive',
    notifications: {
      studyReminder: true,
      achievement: true,
      streak: true,
    },
    privacy: {
      analytics: true,
      crashReports: true,
    }
  });

  const fontSizeOptions = [
    { label: '小', value: 'small' },
    { label: '中', value: 'medium' },
    { label: '大', value: 'large' },
    { label: '特大', value: 'extra-large' }
  ];

  // 設置項目渲染邏輯...
};
```

### 3. 智能學習建議

實現基於用戶行為的智能推薦：

- 根據學習進度調整難度
- 推薦相關詞彙和分類
- 識別薄弱環節並提供針對性練習
- 根據遺忘曲線安排複習時間

### 4. 社交功能

```javascript
// components/LeaderBoard.jsx
const LeaderBoard = () => {
  // 排行榜功能
  // - 每週學習排行
  // - 連續天數排行  
  // - 測驗成績排行
  // - 朋友圈學習動態
};
```

### 5. 數據可視化改進

- 學習進度圓環圖
- 詞彙掌握熱力圖
- 學習時間趨勢圖
- 分類學習分佈餅圖

這些改進將大大提升用戶體驗，讓學習過程更加有趣和個性化。
