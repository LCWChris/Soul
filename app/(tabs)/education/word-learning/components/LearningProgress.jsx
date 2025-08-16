import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ProgressBarAndroid, ProgressViewIOS, Platform } from 'react-native';
import { VocabularyService } from '../services/VocabularyService';

const LearningProgress = ({ userId, selectedCategory, selectedLevel }) => {
  const [progress, setProgress] = useState({
    totalWords: 0,
    learnedWords: 0,
    masteredWords: 0,
    progressPercentage: 0
  });

  useEffect(() => {
    fetchProgress();
  }, [selectedCategory, selectedLevel]);

  const fetchProgress = async () => {
    try {
      // 這個 API 需要在後端實施
      const response = await VocabularyService.getUserProgress(userId, {
        category: selectedCategory,
        level: selectedLevel
      });
      setProgress(response);
    } catch (error) {
      console.error('獲取學習進度失敗:', error);
    }
  };

  const ProgressBar = Platform.OS === 'ios' ? ProgressViewIOS : ProgressBarAndroid;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📊 學習進度</Text>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{progress.learnedWords}</Text>
          <Text style={styles.statLabel}>已學習</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{progress.masteredWords}</Text>
          <Text style={styles.statLabel}>已掌握</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{progress.totalWords}</Text>
          <Text style={styles.statLabel}>總詞彙</Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          完成度: {Math.round(progress.progressPercentage)}%
        </Text>
        <ProgressBar
          styleAttr="Horizontal"
          indeterminate={false}
          progress={progress.progressPercentage / 100}
          color="#4A90E2"
          style={styles.progressBar}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressText: {
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 14,
    color: '#333',
  },
  progressBar: {
    height: 8,
  },
});

export default LearningProgress;
