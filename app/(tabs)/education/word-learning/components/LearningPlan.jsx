import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet,
  Alert,
  Modal
} from 'react-native';
import { VocabularyService } from '../services/VocabularyService';

const LearningPlan = ({ userId, onPlanUpdate }) => {
  const [currentPlan, setCurrentPlan] = useState(null);
  const [planTemplates, setPlanTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [todayProgress, setTodayProgress] = useState({
    completed: 0,
    target: 0,
    streak: 0
  });

  useEffect(() => {
    loadCurrentPlan();
    loadPlanTemplates();
    loadTodayProgress();
  }, []);

  const loadCurrentPlan = async () => {
    try {
      const plan = await VocabularyService.getCurrentPlan(userId);
      setCurrentPlan(plan);
    } catch (error) {
      console.error('載入學習計劃失敗:', error);
    }
  };

  const loadPlanTemplates = async () => {
    try {
      const templates = await VocabularyService.getPlanTemplates();
      setPlanTemplates(templates);
    } catch (error) {
      console.error('載入計劃模板失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTodayProgress = async () => {
    try {
      const progress = await VocabularyService.getTodayProgress(userId);
      setTodayProgress(progress);
    } catch (error) {
      console.error('載入今日進度失敗:', error);
    }
  };

  const createCustomPlan = async (planData) => {
    try {
      const newPlan = await VocabularyService.createLearningPlan({
        userId,
        ...planData
      });
      setCurrentPlan(newPlan);
      setShowPlanModal(false);
      onPlanUpdate && onPlanUpdate(newPlan);
      Alert.alert('成功', '學習計劃已建立！');
    } catch (error) {
      console.error('建立學習計劃失敗:', error);
      Alert.alert('錯誤', '建立學習計劃失敗');
    }
  };

  const selectTemplate = async (template) => {
    const planData = {
      name: template.name,
      description: template.description,
      dailyGoal: template.dailyGoal,
      duration: template.duration,
      categories: template.categories,
      level: template.level,
      schedule: template.schedule
    };
    
    await createCustomPlan(planData);
  };

  const markDayComplete = async () => {
    try {
      await VocabularyService.markDayComplete(userId);
      await loadTodayProgress();
      Alert.alert('恭喜！', '今日學習目標達成！');
    } catch (error) {
      console.error('標記完成失敗:', error);
      Alert.alert('錯誤', '標記完成失敗');
    }
  };

  const renderProgressRing = (completed, target) => {
    const percentage = target > 0 ? (completed / target) * 100 : 0;
    const strokeDasharray = 2 * Math.PI * 45;
    const strokeDashoffset = strokeDasharray - (strokeDasharray * percentage) / 100;

    return (
      <View style={styles.progressRingContainer}>
        <svg width="100" height="100" style={styles.progressSvg}>
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="#e0e0e0"
            strokeWidth="6"
            fill="none"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="#4A90E2"
            strokeWidth="6"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
        </svg>
        <View style={styles.progressText}>
          <Text style={styles.progressNumber}>{completed}</Text>
          <Text style={styles.progressTarget}>/{target}</Text>
        </View>
      </View>
    );
  };

  const renderPlanTemplate = (template) => (
    <TouchableOpacity
      key={template.id}
      style={styles.templateCard}
      onPress={() => selectTemplate(template)}
    >
      <Text style={styles.templateName}>{template.name}</Text>
      <Text style={styles.templateDescription}>{template.description}</Text>
      
      <View style={styles.templateDetails}>
        <Text style={styles.templateDetail}>
          📚 每日目標: {template.dailyGoal} 個詞彙
        </Text>
        <Text style={styles.templateDetail}>
          ⏱️ 計劃時長: {template.duration} 天
        </Text>
        <Text style={styles.templateDetail}>
          🎯 難度: {template.level}
        </Text>
      </View>
      
      <View style={styles.templateCategories}>
        {template.categories.map((category, index) => (
          <Text key={index} style={styles.categoryTag}>
            {category}
          </Text>
        ))}
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>載入學習計劃中...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {currentPlan ? (
        <View style={styles.currentPlanContainer}>
          <Text style={styles.planTitle}>{currentPlan.name}</Text>
          <Text style={styles.planDescription}>{currentPlan.description}</Text>
          
          {/* 今日進度 */}
          <View style={styles.todayProgressContainer}>
            <Text style={styles.sectionTitle}>今日進度</Text>
            <View style={styles.progressContent}>
              {renderProgressRing(todayProgress.completed, todayProgress.target)}
              
              <View style={styles.progressStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{todayProgress.streak}</Text>
                  <Text style={styles.statLabel}>連續天數</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {Math.round((todayProgress.completed / todayProgress.target) * 100) || 0}%
                  </Text>
                  <Text style={styles.statLabel}>完成率</Text>
                </View>
              </View>
            </View>
            
            {todayProgress.completed >= todayProgress.target ? (
              <TouchableOpacity 
                style={[styles.actionButton, styles.completedButton]}
                onPress={markDayComplete}
              >
                <Text style={styles.actionButtonText}>✅ 今日目標達成</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.encouragementText}>
                還需要學習 {todayProgress.target - todayProgress.completed} 個詞彙完成今日目標！
              </Text>
            )}
          </View>

          {/* 本週計劃 */}
          <View style={styles.weeklyPlanContainer}>
            <Text style={styles.sectionTitle}>本週計劃</Text>
            <View style={styles.weeklyProgress}>
              {currentPlan.weeklySchedule?.map((day, index) => (
                <View key={index} style={styles.dayProgress}>
                  <Text style={styles.dayLabel}>{day.label}</Text>
                  <View style={[
                    styles.dayCircle,
                    day.completed && styles.dayCompleted,
                    day.isToday && styles.dayToday
                  ]}>
                    <Text style={[
                      styles.dayNumber,
                      day.completed && styles.dayCompletedText
                    ]}>
                      {day.completed ? '✓' : day.target}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* 計劃統計 */}
          <View style={styles.planStatsContainer}>
            <Text style={styles.sectionTitle}>計劃統計</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statCardNumber}>
                  {currentPlan.totalWordsLearned || 0}
                </Text>
                <Text style={styles.statCardLabel}>已學詞彙</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statCardNumber}>
                  {currentPlan.remainingDays || 0}
                </Text>
                <Text style={styles.statCardLabel}>剩餘天數</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statCardNumber}>
                  {currentPlan.averageAccuracy || 0}%
                </Text>
                <Text style={styles.statCardLabel}>平均正確率</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statCardNumber}>
                  {currentPlan.completionRate || 0}%
                </Text>
                <Text style={styles.statCardLabel}>完成進度</Text>
              </View>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.noPlanContainer}>
          <Text style={styles.noPlanTitle}>建立您的學習計劃</Text>
          <Text style={styles.noPlanDescription}>
            選擇一個適合的學習計劃，讓我們幫助您有系統地學習詞彙
          </Text>
          
          <TouchableOpacity 
            style={styles.createPlanButton}
            onPress={() => setShowPlanModal(true)}
          >
            <Text style={styles.createPlanButtonText}>🎯 建立學習計劃</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 計劃選擇模態 */}
      <Modal
        visible={showPlanModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>選擇學習計劃</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowPlanModal(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.templatesContainer}>
            {planTemplates.map(renderPlanTemplate)}
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentPlanContainer: {
    padding: 16,
  },
  planTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  todayProgressContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  progressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressRingContainer: {
    position: 'relative',
    marginRight: 24,
  },
  progressSvg: {
    width: 100,
    height: 100,
  },
  progressText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  progressTarget: {
    fontSize: 14,
    color: '#666',
  },
  progressStats: {
    flex: 1,
  },
  statItem: {
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  actionButton: {
    backgroundColor: '#4A90E2',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  completedButton: {
    backgroundColor: '#4caf50',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  encouragementText: {
    fontSize: 14,
    color: '#ff9800',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  weeklyPlanContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  weeklyProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayProgress: {
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCompleted: {
    backgroundColor: '#4caf50',
  },
  dayToday: {
    backgroundColor: '#4A90E2',
  },
  dayNumber: {
    fontSize: 12,
    color: '#666',
  },
  dayCompletedText: {
    color: 'white',
    fontWeight: 'bold',
  },
  planStatsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  statCardNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 4,
  },
  statCardLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  noPlanContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noPlanTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  noPlanDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  createPlanButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
  },
  createPlanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  templatesContainer: {
    padding: 16,
  },
  templateCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  templateName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  templateDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  templateDetails: {
    marginBottom: 16,
  },
  templateDetail: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  templateCategories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryTag: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
});

export default LearningPlan;
