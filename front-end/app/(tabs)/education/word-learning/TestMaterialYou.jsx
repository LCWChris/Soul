import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialYouTheme, Typography, Spacing } from './ui';

const TestMaterialYou = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Material You 測試</Text>
      <Text style={styles.subtitle}>這是一個簡單的測試組件</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MaterialYouTheme.surface.surface,
    padding: Spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...Typography.headlineMedium,
    color: MaterialYouTheme.onSurface.onSurface,
    marginBottom: Spacing.md,
  },
  subtitle: {
    ...Typography.bodyLarge,
    color: MaterialYouTheme.onSurfaceVariant.onSurfaceVariant,
    textAlign: 'center',
  },
});

export default TestMaterialYou;
