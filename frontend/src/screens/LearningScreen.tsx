import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import VisualTimer from '../components/VisualTimer';
import ConfettiOverlay from '../components/ConfettiOverlay';
import { ContentResponse, ProgressResponse, SessionResponse } from '../types';

interface LearningScreenProps {
  session: SessionResponse;
  onGenerateContent: (conceptId: string, previousAnswer?: string) => Promise<ContentResponse>;
  onSubmitAnswer: (conceptId: string, isCorrect: boolean) => Promise<ProgressResponse>;
  onSessionExpired: () => void;
  onBack: () => void;
}

/**
 * Main Learning Screen
 *
 * Combines:
 * - Visual timer (Epic 4)
 * - AI-generated personalized content with Socratic follow-up (Epic 2)
 * - Confetti with flow state fade (Epic 3)
 * - BKT mastery tracking (Epic 1)
 * - Curiosity gap story narrative
 */
const LearningScreen: React.FC<LearningScreenProps> = ({
  session,
  onGenerateContent,
  onSubmitAnswer,
  onSessionExpired,
  onBack,
}) => {
  const [content, setContent] = useState<ContentResponse | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiOpacity, setConfettiOpacity] = useState(1.0);
  const [socraticMode, setSocraticMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [masteryDisplay, setMasteryDisplay] = useState(0);

  const currentConceptId =
    session.learning_path.math_next?.concept_id ??
    session.learning_path.ela_next?.concept_id ??
    'math_6_integers';

  const loadContent = useCallback(
    async (previousAnswer?: string) => {
      setLoading(true);
      try {
        const result = await onGenerateContent(
          currentConceptId,
          previousAnswer,
        );
        setContent(result);
        setMasteryDisplay(result.mastery_level);
      } catch {
        Alert.alert('Error', 'Failed to load content. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [currentConceptId, onGenerateContent],
  );

  useEffect(() => {
    loadContent();
  }, []);

  const handleAnswerSelect = useCallback(
    async (option: string) => {
      if (showResult || !content) return;

      setSelectedAnswer(option);
      setShowResult(true);

      const correctLetter = content.content.correct_answer;
      const isCorrect = option.startsWith(correctLetter);

      try {
        const result = await onSubmitAnswer(content.concept_id, isCorrect);

        if (isCorrect) {
          setConfettiOpacity(result.gamification.confetti_opacity);
          setShowConfetti(result.gamification.show_confetti);
        } else {
          setSocraticMode(true);
        }
      } catch {
        // Continue without backend
      }
    },
    [showResult, content, onSubmitAnswer],
  );

  const handleNextQuestion = useCallback(() => {
    setSelectedAnswer(null);
    setShowResult(false);
    setShowConfetti(false);
    setSocraticMode(false);
    loadContent();
  }, [loadContent]);

  const handleSocraticRetry = useCallback(() => {
    if (content) {
      setSelectedAnswer(null);
      setShowResult(false);
      setSocraticMode(false);
      loadContent(selectedAnswer ?? undefined);
    }
  }, [content, selectedAnswer, loadContent]);

  const handleTimerExpired = useCallback(() => {
    setSessionExpired(true);
    onSessionExpired();
  }, [onSessionExpired]);

  if (sessionExpired) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.expiredContainer}>
          <Text style={styles.expiredEmoji}>{'\uD83C\uDF1F'}</Text>
          <Text style={styles.expiredTitle}>Amazing work today!</Text>
          <Text style={styles.expiredMessage}>
            Your brain needs rest to grow stronger. Come back tomorrow to
            continue the adventure!
          </Text>
          <Text style={styles.expiredHint}>
            What happens next in the story? You'll find out tomorrow...
            {' \uD83D\uDC36'}
          </Text>
          <TouchableOpacity style={styles.doneButton} onPress={onBack}>
            <Text style={styles.doneButtonText}>Done for today!</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Confetti overlay */}
      <ConfettiOverlay
        visible={showConfetti}
        opacity={confettiOpacity}
        onComplete={() => setShowConfetti(false)}
      />

      {/* Visual Timer */}
      <VisualTimer
        totalSeconds={session.visual_timer.total_seconds}
        theme={session.visual_timer.theme as 'puppy_walk' | 'gymnast_routine'}
        onExpired={handleTimerExpired}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Mastery indicator */}
        <View style={styles.masteryBar}>
          <Text style={styles.masteryLabel}>
            {content?.track === 'math'
              ? '\uD83D\uDCCA Math'
              : '\uD83D\uDCDA Reading'}
            {' '}Mastery
          </Text>
          <View style={styles.masteryTrack}>
            <View
              style={[
                styles.masteryFill,
                { width: `${masteryDisplay * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.masteryPercent}>
            {(masteryDisplay * 100).toFixed(0)}%
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingEmoji}>{'\uD83E\uDD14'}</Text>
            <Text style={styles.loadingText}>
              Thinking up a great problem...
            </Text>
          </View>
        ) : content ? (
          <>
            {/* Story narrative */}
            <View style={styles.storyCard}>
              <Text style={styles.storyText}>
                {content.content.story_text}
              </Text>
            </View>

            {/* Question */}
            <View style={styles.questionCard}>
              <Text style={styles.questionText}>
                {content.content.question}
              </Text>
            </View>

            {/* Answer options */}
            <View style={styles.optionsContainer}>
              {content.content.options.map((option, idx) => {
                const letter = option.charAt(0);
                const isSelected = selectedAnswer === option;
                const isCorrect =
                  showResult && letter === content.content.correct_answer;
                const isWrong = showResult && isSelected && !isCorrect;

                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.optionButton,
                      isSelected && styles.optionSelected,
                      isCorrect && styles.optionCorrect,
                      isWrong && styles.optionWrong,
                    ]}
                    onPress={() => handleAnswerSelect(option)}
                    disabled={showResult}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isCorrect && styles.optionTextCorrect,
                        isWrong && styles.optionTextWrong,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Result feedback */}
            {showResult && (
              <View style={styles.resultContainer}>
                {selectedAnswer?.startsWith(content.content.correct_answer) ? (
                  <>
                    <Text style={styles.resultCorrect}>
                      {'\uD83C\uDF89'} Great thinking!
                    </Text>
                    <Text style={styles.explanation}>
                      {content.content.explanation}
                    </Text>
                    <Text style={styles.continuation}>
                      {content.content.story_continuation}
                    </Text>
                    <TouchableOpacity
                      style={styles.nextButton}
                      onPress={handleNextQuestion}
                    >
                      <Text style={styles.nextButtonText}>
                        Continue the story! {'\u27A1\uFE0F'}
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : socraticMode ? (
                  <>
                    <Text style={styles.resultWrong}>
                      {content.content.encouragement ??
                        "Hmm, that's not quite right. Let's think about this!"}
                    </Text>
                    {content.content.socratic_question ? (
                      <Text style={styles.socraticQuestion}>
                        {'\uD83E\uDD14'} {content.content.socratic_question}
                      </Text>
                    ) : (
                      <Text style={styles.hint}>
                        {'\uD83D\uDCA1'} Hint: {content.content.hint}
                      </Text>
                    )}
                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={handleSocraticRetry}
                    >
                      <Text style={styles.retryButtonText}>
                        Try again! {'\uD83D\uDCAA'}
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={styles.hint}>
                      {'\uD83D\uDCA1'} {content.content.hint}
                    </Text>
                    <TouchableOpacity
                      style={styles.nextButton}
                      onPress={handleNextQuestion}
                    >
                      <Text style={styles.nextButtonText}>
                        Next question {'\u27A1\uFE0F'}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  masteryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 8,
  },
  masteryLabel: {
    fontSize: 13,
    color: '#666',
    minWidth: 90,
  },
  masteryTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  masteryFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  masteryPercent: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4CAF50',
    minWidth: 35,
    textAlign: 'right',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#888',
  },
  storyCard: {
    backgroundColor: '#E8F5E9',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  storyText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#2E7D32',
  },
  questionCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  questionText: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 26,
    color: '#1A1A1A',
  },
  optionsContainer: {
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  optionButton: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  optionSelected: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  optionCorrect: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  optionWrong: {
    borderColor: '#F44336',
    backgroundColor: '#FFEBEE',
  },
  optionText: {
    fontSize: 15,
    color: '#333',
  },
  optionTextCorrect: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  optionTextWrong: {
    color: '#C62828',
  },
  resultContainer: {
    margin: 16,
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 16,
    gap: 12,
  },
  resultCorrect: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'center',
  },
  resultWrong: {
    fontSize: 16,
    color: '#E65100',
    textAlign: 'center',
  },
  explanation: {
    fontSize: 14,
    lineHeight: 22,
    color: '#555',
  },
  continuation: {
    fontSize: 15,
    lineHeight: 23,
    color: '#1565C0',
    fontStyle: 'italic',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
  },
  hint: {
    fontSize: 14,
    color: '#FF8F00',
    lineHeight: 22,
  },
  socraticQuestion: {
    fontSize: 16,
    color: '#4A148C',
    lineHeight: 24,
    fontWeight: '500',
    backgroundColor: '#F3E5F5',
    padding: 12,
    borderRadius: 8,
  },
  nextButton: {
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#FF9800',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  expiredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  expiredEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  expiredTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'center',
  },
  expiredMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  expiredHint: {
    fontSize: 15,
    color: '#1565C0',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 24,
  },
  doneButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 20,
  },
  doneButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LearningScreen;
