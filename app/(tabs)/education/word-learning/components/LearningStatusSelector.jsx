import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialYouTheme, Typography, Spacing, BorderRadius, Elevation } from '../MaterialYouTheme';
import { LEARNING_STATUS } from '@/utils/learning-progress';

const LearningStatusSelector = ({ currentStatus, onStatusChange, style }) => {
  const statusOptions = [
    {
      status: LEARNING_STATUS.NOT_STARTED,
      label: '未開始',
      icon: 'ellipse-outline',
      color: MaterialYouTheme.neutral.neutral60,
      bgColor: MaterialYouTheme.neutral.neutral95,
    },
    {
      status: LEARNING_STATUS.LEARNING,
      label: '學習中',
      icon: 'play-circle',
      color: MaterialYouTheme.primary.primary40,
      bgColor: MaterialYouTheme.primary.primary95,
    },
    {
      status: LEARNING_STATUS.REVIEWING,
      label: '複習中',
      icon: 'refresh-circle',
      color: MaterialYouTheme.secondary.secondary40,
      bgColor: MaterialYouTheme.secondary.secondary95,
    },
    {
      status: LEARNING_STATUS.MASTERED,
      label: '已掌握',
      icon: 'checkmark-circle',
      color: MaterialYouTheme.tertiary.tertiary40,
      bgColor: MaterialYouTheme.tertiary.tertiary95,
    },
  ];

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>學習熟練度</Text>
      <View style={styles.optionsContainer}>
        {statusOptions.map((option) => {
          const isSelected = currentStatus === option.status;
          return (
            <TouchableOpacity
              key={option.status}
              style={[
                styles.optionButton,
                { backgroundColor: isSelected ? option.bgColor : MaterialYouTheme.neutralVariant.neutralVariant95 },
                isSelected && styles.selectedOption,
              ]}
              onPress={() => onStatusChange(option.status)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={option.icon}
                size={24}
                color={isSelected ? option.color : MaterialYouTheme.neutralVariant.neutralVariant40}
              />
              <Text
                style={[
                  styles.optionText,
                  {
                    color: isSelected ? option.color : MaterialYouTheme.neutralVariant.neutralVariant40,
                    fontWeight: isSelected ? '600' : '400',
                  },
                ]}
              >
                {option.label}
              </Text>
              {isSelected && (
                <Ionicons
                  name="checkmark"
                  size={16}
                  color={option.color}
                  style={styles.checkmark}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: MaterialYouTheme.neutral.neutral99,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Elevation.level1,
  },
  title: {
    ...Typography.titleMedium,
    color: MaterialYouTheme.neutral.neutral20,
    fontWeight: '600',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  optionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    position: 'relative',
    minHeight: 72,
    justifyContent: 'center',
  },
  selectedOption: {
    ...Elevation.level2,
  },
  optionText: {
    ...Typography.labelMedium,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  checkmark: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
  },
});

export default LearningStatusSelector;
