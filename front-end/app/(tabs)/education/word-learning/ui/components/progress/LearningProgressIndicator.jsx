import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialYouTheme } from '../../themes/MaterialYouTheme';
import { LEARNING_STATUS } from '@/utils/learning-progress';

const LearningProgressIndicator = ({ status, onPress, size = 'medium' }) => {
  const getProgressConfig = (status) => {
    switch (status) {
      case LEARNING_STATUS.NOT_STARTED:
        return {
          icon: 'ellipse-outline',
          color: MaterialYouTheme.neutral.neutral50,
          bgColor: MaterialYouTheme.neutral.neutral95,
        };
      case LEARNING_STATUS.LEARNING:
        return {
          icon: 'school',
          color: MaterialYouTheme.tertiary.tertiary40,
          bgColor: MaterialYouTheme.tertiary.tertiary90,
        };
      case LEARNING_STATUS.REVIEWING:
        return {
          icon: 'refresh',
          color: MaterialYouTheme.secondary.secondary40,
          bgColor: MaterialYouTheme.secondary.secondary90,
        };
      case LEARNING_STATUS.MASTERED:
        return {
          icon: 'checkmark-circle',
          color: "#2563EB", // 藍色主題
          bgColor: "#EFF6FF", // 淡藍色背景
        };
      default:
        return {
          icon: 'ellipse-outline',
          color: MaterialYouTheme.neutral.neutral50,
          bgColor: MaterialYouTheme.neutral.neutral95,
        };
    }
  };

  const getSizeConfig = (size) => {
    switch (size) {
      case 'small':
        return { containerSize: 24, iconSize: 14 };
      case 'medium':
        return { containerSize: 32, iconSize: 18 };
      case 'large':
        return { containerSize: 40, iconSize: 24 };
      default:
        return { containerSize: 32, iconSize: 18 };
    }
  };

  const config = getProgressConfig(status);
  const sizeConfig = getSizeConfig(size);

  const containerStyle = [
    styles.container,
    {
      backgroundColor: config.bgColor,
      width: sizeConfig.containerSize,
      height: sizeConfig.containerSize,
      borderRadius: sizeConfig.containerSize / 2,
    }
  ];

  return (
    <TouchableOpacity style={containerStyle} onPress={onPress}>
      <Ionicons 
        name={config.icon} 
        size={sizeConfig.iconSize} 
        color={config.color} 
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
});

export default LearningProgressIndicator;
