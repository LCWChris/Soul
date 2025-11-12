import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialYouTheme } from '../../themes/MaterialYouTheme';

const LevelSelector = ({ onSelectLevel, selectedLevel, style }) => {
  const levelOptions = [
    {
      level: '初級',
      label: '初級',
      icon: 'leaf-outline',
      color: MaterialYouTheme.secondary.secondary40,
      bgColor: MaterialYouTheme.secondary.secondary90,
      description: '基礎詞彙，適合初學者',
    },
    {
      level: '中級',
      label: '中級',
      icon: 'school-outline',
      color: MaterialYouTheme.tertiary.tertiary40,
      bgColor: MaterialYouTheme.tertiary.tertiary90,
      description: '常用詞彙，有一定基礎',
    },
    {
      level: '高級',
      label: '高級',
      icon: 'trophy-outline',
      color: MaterialYouTheme.primary.primary40,
      bgColor: MaterialYouTheme.primary.primary90,
      description: '複雜詞彙，挑戰進階',
    },
  ];

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>選擇難度分級學習</Text>
      <Text style={styles.subtitle}>選擇最適合您的學習等級</Text>
      
      <View style={styles.optionsContainer}>
        {levelOptions.map((option) => (
          <TouchableOpacity
            key={option.level}
            style={[
              styles.optionCard,
              { backgroundColor: option.bgColor },
              selectedLevel === option.level && styles.selectedCard,
            ]}
            onPress={() => onSelectLevel(option.level)}
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
    borderColor: MaterialYouTheme.primary.primary40,
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

export default LevelSelector;
