import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { MaterialYouTheme, Typography, Spacing, BorderRadius, Elevation } from '../MaterialYouTheme';

const MaterialFAB = ({ 
  onPress, 
  icon, 
  text, 
  variant = 'primary', 
  size = 'normal',
  style 
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: MaterialYouTheme.primary.primary50,
          color: MaterialYouTheme.primary.primary99,
        };
      case 'secondary':
        return {
          backgroundColor: MaterialYouTheme.secondary.secondary50,
          color: MaterialYouTheme.secondary.secondary99,
        };
      case 'tertiary':
        return {
          backgroundColor: MaterialYouTheme.tertiary.tertiary50,
          color: MaterialYouTheme.tertiary.tertiary99,
        };
      case 'surface':
        return {
          backgroundColor: MaterialYouTheme.neutral.neutral95,
          color: MaterialYouTheme.primary.primary30,
        };
      default:
        return {
          backgroundColor: MaterialYouTheme.primary.primary50,
          color: MaterialYouTheme.primary.primary99,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          width: 40,
          height: 40,
          borderRadius: 12,
        };
      case 'large':
        return {
          width: 96,
          height: 96,
          borderRadius: 28,
        };
      default: // normal
        return {
          width: 56,
          height: 56,
          borderRadius: 16,
        };
    }
  };

  const variantStyle = getVariantStyles();
  const sizeStyle = getSizeStyles();

  return (
    <TouchableOpacity
      style={[
        styles.fab,
        {
          backgroundColor: variantStyle.backgroundColor,
          ...sizeStyle,
        },
        style
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        {icon && (
          <Text style={[styles.icon, { color: variantStyle.color }]}>
            {icon}
          </Text>
        )}
        {text && (
          <Text style={[styles.text, { color: variantStyle.color }]}>
            {text}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: MaterialYouTheme.neutral.neutral30,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
    marginRight: 4,
  },
  text: {
    ...Typography.labelMedium,
    fontWeight: '500',
  },
});

export default MaterialFAB;
