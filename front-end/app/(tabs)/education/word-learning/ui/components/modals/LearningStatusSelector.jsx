// LearningStatusSelector.jsx
// 小型狀態選擇器：顯示目前學習狀態並允許使用者循環切換。
import { LEARNING_STATUS } from "@/utils/learning-progress";
import { useCallback } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  BorderRadius,
  MaterialYouTheme,
  Spacing,
  Typography,
} from "../../themes/MaterialYouTheme";

const STATUS_ORDER = [
  LEARNING_STATUS.NOT_STARTED,
  LEARNING_STATUS.LEARNING,
  LEARNING_STATUS.REVIEWING,
  LEARNING_STATUS.MASTERED,
];

const STATUS_LABELS = {
  [LEARNING_STATUS.NOT_STARTED]: "未開始",
  [LEARNING_STATUS.LEARNING]: "學習中",
  [LEARNING_STATUS.REVIEWING]: "複習中",
  [LEARNING_STATUS.MASTERED]: "已掌握",
};

const getStatusColor = (status) => {
  switch (status) {
    case LEARNING_STATUS.NOT_STARTED:
      return MaterialYouTheme.neutral.neutral70;
    case LEARNING_STATUS.LEARNING:
      return MaterialYouTheme.primary.primary40;
    case LEARNING_STATUS.REVIEWING:
      return MaterialYouTheme.secondary.secondary40;
    case LEARNING_STATUS.MASTERED:
      return MaterialYouTheme.tertiary.tertiary40;
    default:
      return MaterialYouTheme.neutral.neutral50;
  }
};

const LearningStatusSelector = ({
  currentStatus = LEARNING_STATUS.NOT_STARTED,
  onStatusChange,
  style,
}) => {
  const handleNext = useCallback(() => {
    const idx = STATUS_ORDER.indexOf(currentStatus);
    const nextStatus = STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
    onStatusChange?.(nextStatus);
  }, [currentStatus, onStatusChange]);

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[
          styles.statusButton,
          { backgroundColor: getStatusColor(currentStatus) },
        ]}
        onPress={handleNext}
        activeOpacity={0.8}
      >
        <Text style={styles.statusText}>{STATUS_LABELS[currentStatus]}</Text>
        <Text style={styles.hintText}>點擊切換 →</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  statusButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    elevation: 1,
  },
  statusText: {
    ...Typography.labelLarge,
    color: "white",
    fontWeight: "600",
  },
  hintText: {
    ...Typography.labelSmall,
    color: "rgba(255,255,255,0.8)",
  },
});

export default LearningStatusSelector;
