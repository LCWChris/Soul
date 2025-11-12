// SOUL/app/(tabs)/education/word-learning/components/AchievementModal.jsx
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { VocabularyService } from "../../../api";
import {
  BorderRadius,
  MaterialYouTheme,
  Spacing,
  Typography,
} from "../../themes/MaterialYouTheme";

const AchievementModal = ({ visible, onClose }) => {
  const { user } = useUser();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    if (visible && user?.id) {
      loadAchievements();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, user?.id]);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await VocabularyService.getUserAchievements(user.id);

      if (result && result.achievements && Array.isArray(result.achievements)) {
        setAchievements(result.achievements);
      } else {
        // API 返回空數據，使用模擬數據
        setAchievements([
          {
            id: "first_word",
            title: "初次學習",
            description: "學習第一個單詞",
            icon: "school",
            earned: true,
            earnedAt: new Date(),
          },
          {
            id: "week_streak",
            title: "堅持一週",
            description: "連續學習7天",
            icon: "calendar",
            earned: false,
          },
          {
            id: "words_50",
            title: "詞彙新手",
            description: "學習50個單詞",
            icon: "book",
            earned: false,
          },
        ]);
      }
    } catch (error) {
      console.error("載入成就失敗:", error);
      setError("載入成就數據失敗，顯示模擬數據");

      // 顯示模擬成就
      setAchievements([
        {
          id: "first_word",
          title: "初次學習",
          description: "學習第一個單詞",
          icon: "school",
          earned: true,
          earnedAt: new Date(),
        },
        {
          id: "week_streak",
          title: "堅持一週",
          description: "連續學習7天",
          icon: "calendar",
          earned: false,
        },
        {
          id: "words_50",
          title: "詞彙新手",
          description: "學習50個單詞",
          icon: "book",
          earned: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const getIconColor = (achievement) => {
    return achievement.earned
      ? MaterialYouTheme.secondary.secondary40
      : MaterialYouTheme.neutral.neutral60;
  };

  const getBackgroundColor = (achievement) => {
    return achievement.earned
      ? MaterialYouTheme.secondary.secondary95
      : MaterialYouTheme.neutral.neutral95;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          {/* 標題欄 */}
          <View style={styles.header}>
            <Text style={styles.title}>學習成就</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons
                name="close"
                size={24}
                color={MaterialYouTheme.neutral.neutral30}
              />
            </TouchableOpacity>
          </View>

          {/* 成就列表 */}
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>載入成就中...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : (
              <View style={styles.achievementsGrid}>
                {achievements.map((achievement) => (
                  <View
                    key={achievement.id}
                    style={[
                      styles.achievementCard,
                      { backgroundColor: getBackgroundColor(achievement) },
                    ]}
                  >
                    <View style={styles.achievementIcon}>
                      <Ionicons
                        name={achievement.icon}
                        size={32}
                        color={getIconColor(achievement)}
                      />
                      {achievement.earned && (
                        <View style={styles.earnedBadge}>
                          <Ionicons name="checkmark" size={12} color="white" />
                        </View>
                      )}
                    </View>

                    <Text
                      style={[
                        styles.achievementTitle,
                        !achievement.earned && styles.achievementTitleLocked,
                      ]}
                    >
                      {achievement.title}
                    </Text>

                    <Text
                      style={[
                        styles.achievementDescription,
                        !achievement.earned &&
                          styles.achievementDescriptionLocked,
                      ]}
                    >
                      {achievement.description}
                    </Text>

                    {achievement.earned && achievement.earnedAt && (
                      <Text style={styles.earnedDate}>
                        已獲得於{" "}
                        {new Date(achievement.earnedAt).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* 統計資訊 */}
          <View style={styles.footer}>
            <Text style={styles.statsText}>
              已獲得 {achievements.filter((a) => a.earned).length} /{" "}
              {achievements.length} 個成就
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  container: {
    backgroundColor: MaterialYouTheme.neutral.neutral99,
    borderRadius: BorderRadius.xl,
    width: "100%",
    maxHeight: "80%",
    elevation: 8,
    shadowColor: MaterialYouTheme.neutral.neutral0,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: MaterialYouTheme.neutral.neutral90,
  },
  title: {
    ...Typography.headlineSmall,
    color: MaterialYouTheme.neutral.neutral10,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  loadingContainer: {
    paddingVertical: Spacing.xl,
    alignItems: "center",
  },
  loadingText: {
    ...Typography.bodyMedium,
    color: MaterialYouTheme.neutral.neutral50,
  },
  errorContainer: {
    paddingVertical: Spacing.xl,
    alignItems: "center",
  },
  errorText: {
    ...Typography.bodyMedium,
    color: MaterialYouTheme.error.error40,
    textAlign: "center",
  },
  achievementsGrid: {
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  achievementCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: "center",
    position: "relative",
  },
  achievementIcon: {
    marginBottom: Spacing.sm,
    position: "relative",
  },
  earnedBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: MaterialYouTheme.secondary.secondary40,
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  achievementTitle: {
    ...Typography.titleMedium,
    color: MaterialYouTheme.neutral.neutral20,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  achievementTitleLocked: {
    color: MaterialYouTheme.neutral.neutral60,
  },
  achievementDescription: {
    ...Typography.bodyMedium,
    color: MaterialYouTheme.neutral.neutral40,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  achievementDescriptionLocked: {
    color: MaterialYouTheme.neutral.neutral70,
  },
  earnedDate: {
    ...Typography.labelSmall,
    color: MaterialYouTheme.secondary.secondary40,
    textAlign: "center",
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: MaterialYouTheme.neutral.neutral90,
    alignItems: "center",
  },
  statsText: {
    ...Typography.bodyMedium,
    color: MaterialYouTheme.neutral.neutral30,
  },
});

export default AchievementModal;
