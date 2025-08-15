import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { VocabularyService } from '../services/VocabularyService';

const VocabularyQuiz = ({ category, level, onQuizComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  useEffect(() => {
    generateQuiz();
  }, [category, level]);

  const generateQuiz = async () => {
    try {
      // 需要後端支援生成測驗題目
      const quizData = await VocabularyService.generateQuiz({
        category,
        level,
        questionCount: 10
      });
      setQuestions(quizData);
    } catch (error) {
      console.error('生成測驗失敗:', error);
      Alert.alert('錯誤', '無法載入測驗內容');
    }
  };

  const handleAnswerSelect = (answerIndex) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === null) {
      Alert.alert('提示', '請選擇一個答案');
      return;
    }

    // 檢查答案
    const isCorrect = selectedAnswer === questions[currentQuestion].correctAnswer;
    if (isCorrect) {
      setScore(score + 1);
    }

    setShowResult(true);
    
    setTimeout(() => {
      if (currentQuestion + 1 < questions.length) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        // 測驗完成
        setQuizCompleted(true);
        onQuizComplete && onQuizComplete({
          score,
          total: questions.length,
          percentage: Math.round((score / questions.length) * 100)
        });
      }
    }, 1500);
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setQuizCompleted(false);
    generateQuiz();
  };

  if (questions.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text>載入測驗中...</Text>
      </View>
    );
  }

  if (quizCompleted) {
    return (
      <View style={styles.resultContainer}>
        <Text style={styles.resultTitle}>🎉 測驗完成!</Text>
        <Text style={styles.scoreText}>
          得分: {score}/{questions.length} ({Math.round((score / questions.length) * 100)}%)
        </Text>
        
        <View style={styles.performanceContainer}>
          {score / questions.length >= 0.8 ? (
            <>
              <Text style={styles.excellentText}>🌟 表現優秀!</Text>
              <Text style={styles.encouragementText}>您對這個主題掌握得很好</Text>
            </>
          ) : score / questions.length >= 0.6 ? (
            <>
              <Text style={styles.goodText}>👍 不錯!</Text>
              <Text style={styles.encouragementText}>繼續努力，還有進步空間</Text>
            </>
          ) : (
            <>
              <Text style={styles.needWorkText}>💪 需要加強</Text>
              <Text style={styles.encouragementText}>多練習幾次會更好</Text>
            </>
          )}
        </View>

        <TouchableOpacity style={styles.restartButton} onPress={restartQuiz}>
          <Text style={styles.restartButtonText}>🔄 重新測驗</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const question = questions[currentQuestion];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.questionNumber}>
          問題 {currentQuestion + 1}/{questions.length}
        </Text>
        <Text style={styles.scoreDisplay}>得分: {score}</Text>
      </View>

      <View style={styles.questionContainer}>
        {question.image && (
          <Image source={{ uri: question.image }} style={styles.questionImage} />
        )}
        <Text style={styles.questionText}>{question.question}</Text>
      </View>

      <View style={styles.answersContainer}>
        {question.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.answerButton,
              selectedAnswer === index && styles.selectedAnswer,
              showResult && index === question.correctAnswer && styles.correctAnswer,
              showResult && selectedAnswer === index && index !== question.correctAnswer && styles.wrongAnswer
            ]}
            onPress={() => !showResult && handleAnswerSelect(index)}
            disabled={showResult}
          >
            <Text style={[
              styles.answerText,
              selectedAnswer === index && styles.selectedAnswerText,
              showResult && index === question.correctAnswer && styles.correctAnswerText
            ]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {!showResult ? (
        <TouchableOpacity style={styles.nextButton} onPress={handleNextQuestion}>
          <Text style={styles.nextButtonText}>
            {currentQuestion + 1 === questions.length ? '完成測驗' : '下一題'}
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.resultFeedback}>
          <Text style={[
            styles.feedbackText,
            selectedAnswer === question.correctAnswer ? styles.correctFeedback : styles.wrongFeedback
          ]}>
            {selectedAnswer === question.correctAnswer ? '✅ 正確!' : '❌ 錯誤'}
          </Text>
          {selectedAnswer !== question.correctAnswer && (
            <Text style={styles.correctAnswerFeedback}>
              正確答案: {question.options[question.correctAnswer]}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  questionNumber: {
    fontSize: 16,
    color: '#666',
  },
  scoreDisplay: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  questionContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  questionImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
    marginBottom: 16,
  },
  questionText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  answersContainer: {
    marginBottom: 20,
  },
  answerButton: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  selectedAnswer: {
    borderColor: '#4A90E2',
    backgroundColor: '#e3f2fd',
  },
  correctAnswer: {
    borderColor: '#4caf50',
    backgroundColor: '#e8f5e8',
  },
  wrongAnswer: {
    borderColor: '#f44336',
    backgroundColor: '#ffebee',
  },
  answerText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  selectedAnswerText: {
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  correctAnswerText: {
    color: '#4caf50',
    fontWeight: 'bold',
  },
  nextButton: {
    backgroundColor: '#4A90E2',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultFeedback: {
    alignItems: 'center',
    padding: 16,
  },
  feedbackText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  correctFeedback: {
    color: '#4caf50',
  },
  wrongFeedback: {
    color: '#f44336',
  },
  correctAnswerFeedback: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  scoreText: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
    color: '#4A90E2',
  },
  performanceContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  excellentText: {
    fontSize: 18,
    color: '#4caf50',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  goodText: {
    fontSize: 18,
    color: '#ff9800',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  needWorkText: {
    fontSize: 18,
    color: '#f44336',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  encouragementText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  restartButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  restartButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default VocabularyQuiz;
