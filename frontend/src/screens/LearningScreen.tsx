import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { contentApi, progressApi, sessionApi } from '../services/api';
import QuestionCard from '../components/QuestionCard';
import VisualTimer from '../components/VisualTimer';
import ConfettiAnimation from '../components/ConfettiAnimation';
import { GeneratedContent, LearningSession, ProgressResponse } from '../types';

interface LearningScreenProps {
  route: any;
  navigation: any;
}

const LearningScreen: React.FC<LearningScreenProps> = ({ route, navigation }) => {
  const { session, recommendedConcepts, userProfile } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [currentContent, setCurrentContent] = useState<GeneratedContent | null>(null);
  const [currentConceptIndex, setCurrentConceptIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiOpacity, setConfettiOpacity] = useState(1);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);

  const sessionRef = useRef<LearningSession>(session);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeSession();
    startTimer();

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, []);

  const initializeSession = async () => {
    await loadNextQuestion();
  };

  const startTimer = () => {
    const expiresAt = new Date(sessionRef.current.expires_at).getTime();
    
    timerInterval.current = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      
      setRemainingSeconds(remaining);

      if (remaining === 0) {
        handleSessionEnd();
      }
    }, 1000);
  };

  const loadNextQuestion = async () => {
    try {
      setLoading(true);
      
      if (currentConceptIndex >= recommendedConcepts.length) {
        Alert.alert('Great Job!', 'You\'ve completed all concepts for today!');
        navigation.goBack();
        return;
      }

      const conceptId = recommendedConcepts[currentConceptIndex];
      const response = await contentApi.generate({
        user_id: userProfile.user_id,
        concept_id: conceptId,
      });

      setCurrentContent(response.data);
      setQuestionStartTime(Date.now());
    } catch (error) {
      console.error('Failed to load question:', error);
      Alert.alert('Error', 'Failed to load question. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async (answer: string) => {
    if (!currentContent) return;

    const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);

    try {
      setLoading(true);

      const response = await progressApi.submit({
        user_id: userProfile.user_id,
        session_id: sessionRef.current.session_id,
        content_id: currentContent.content_id,
        concept_id: recommendedConcepts[currentConceptIndex],
        is_correct: answer === currentContent.correct_answer,
        time_taken_seconds: timeTaken,
        answer_given: answer,
      });

      const result: ProgressResponse = response.data;

      setIsCorrect(result.trigger_confetti);

      if (result.trigger_confetti) {
        // Show confetti for correct answer
        setConfettiOpacity(result.confetti_opacity);
        setShowConfetti(true);

        // Show explanation
        setFeedback(currentContent.explanation);
        setShowFeedback(true);

        // Move to next question after delay
        setTimeout(() => {
          setShowFeedback(false);
          setCurrentConceptIndex((prev) => prev + 1);
          loadNextQuestion();
        }, 3000);
      } else {
        // Incorrect answer - get Socratic feedback
        const feedbackRes = await contentApi.getFeedback({
          user_id: userProfile.user_id,
          concept_id: recommendedConcepts[currentConceptIndex],
          user_answer: answer,
          correct_answer: currentContent.correct_answer,
        });

        setFeedback(feedbackRes.data.feedback);
        setShowFeedback(true);

        // Allow retry after viewing feedback
        setTimeout(() => {
          setShowFeedback(false);
        }, 4000);
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
      Alert.alert('Error', 'Failed to submit answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSessionEnd = () => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }

    Alert.alert(
      'Session Complete!',
      'Great work! Your session time is up. Come back tomorrow to keep your streak going!',
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  const totalSeconds = sessionRef.current.config.session_duration_minutes * 60;

  return (
    <View style={styles.container}>
      <VisualTimer
        remainingSeconds={remainingSeconds}
        totalSeconds={totalSeconds}
        timerType={sessionRef.current.config.visual_timer_type}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      ) : currentContent ? (
        <QuestionCard
          content={currentContent}
          onSubmitAnswer={handleSubmitAnswer}
          disabled={loading || showFeedback}
        />
      ) : null}

      <ConfettiAnimation
        visible={showConfetti}
        opacity={confettiOpacity}
        onComplete={() => setShowConfetti(false)}
      />

      <Modal
        visible={showFeedback}
        transparent
        animationType="fade"
      >
        <View style={styles.feedbackOverlay}>
          <View
            style={[
              styles.feedbackContainer,
              isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect,
            ]}
          >
            <Text style={styles.feedbackEmoji}>
              {isCorrect ? '🎉' : '🤔'}
            </Text>
            <Text style={styles.feedbackText}>{feedback}</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  feedbackContainer: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    maxWidth: 350,
  },
  feedbackCorrect: {
    borderWidth: 4,
    borderColor: '#4CAF50',
  },
  feedbackIncorrect: {
    borderWidth: 4,
    borderColor: '#FF9800',
  },
  feedbackEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  feedbackText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
    lineHeight: 24,
  },
});

export default LearningScreen;
