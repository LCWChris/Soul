import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialYouTheme } from '../../themes/MaterialYouTheme';
import { LEARNING_STATUS } from '@/utils/learning-progress';

const LearningProgressSelector = ({ onSelectProgress, selectedProgress, style }) => {
  const progressOptions = [
    {
      status: LEARNING_STATUS.NOT_STARTED,
      label: '未開始',
      icon: 'ellipse-outline',
      color: MaterialYouTheme.neutral.neutral50,
      bgColor: MaterialYouTheme.neutral.neutral95,
      description: '尚未開始學習的單字',
    },
    {
      status: LEARNING_STATUS.LEARNING,
      label: '學習中',
      icon: 'school-outline',
      color: MaterialYouTheme.tertiary.tertiary40,
      bgColor: MaterialYouTheme.tertiary.tertiary90,
      description: '正在學習但還不熟悉',
    },
    {
      status: LEARNING_STATUS.REVIEWING,
      label: '複習中',
      icon: 'refresh-outline',
      color: MaterialYouTheme.secondary.secondary40,
      bgColor: MaterialYouTheme.secondary.secondary90,
      description: '基本掌握，需要複習鞏固',
    },
    {
      status: LEARNING_STATUS.MASTERED,
      label: '已掌握',
      icon: 'checkmark-circle-outline',
      color: '#2563EB', // 藍色主題
      bgColor: '#EFF6FF', // 淡藍色背景
      description: '完全掌握該單字',
    },
  ];

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>選擇進度學習</Text>
      <Text style={styles.subtitle}>選擇您想要學習的掌握程度</Text>
      
      <View style={styles.optionsContainer}>
        {progressOptions.map((option) => (
          <TouchableOpacity
            key={option.status}
            style={[
              styles.optionCard,
              { backgroundColor: option.bgColor },
              selectedProgress === option.status && styles.selectedCard,
            ]}
            onPress={() => onSelectProgress(option.status)}
          >
            <View style={styles.optionHeader}>
              <View style={[styles.iconContainer, { backgroundColor: option.color }]}>
                <Ionicons name={option.icon} size={24} color="white" />
              </View>
              <Text style={[styles.optionLabel, { color: option.color }]}>
                {option.label}
              </Text>
            </View>
            <Text style={styles.optionDescription}>{option.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: MaterialYouTheme.neutral.neutral10,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: MaterialYouTheme.neutral.neutral30,
    textAlign: 'center',
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 16,
  },
  optionCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: '#2563EB', // 藍色邊框
    transform: [{ scale: 1.02 }],
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  optionDescription: {
    fontSize: 14,
    color: MaterialYouTheme.neutral.neutral30,
    lineHeight: 20,
  },
});

export default LearningProgressSelector;
