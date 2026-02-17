import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { ConfettiOverlay } from '../components/ConfettiOverlay';
import { VisualTimer } from '../components/VisualTimer';
import { MasteryProgressBar } from '../components/MasteryProgressBar';
import { XpDisplay } from '../components/XpDisplay';
import type {
  SessionConfig,
  GeneratedContent,
  FlowState,
  ProgressResult,
  SocraticResponse,
} from '../types';

interface LearningScreenProps {
  navigation: any;
  route: any;
}

/**
 * Learning Screen: The core learning experience.
 *
 * Features:
 * - Visual Pomodoro timer (puppy walk / gymnast routine)
 * - BKT-optimized content from the learning path
 * - Confetti with flow-state fade
 * - Socratic feedback on incorrect answers
 * - Curiosity gap narratives
 * - Zeigarnik effect cutoff when timer expires
 */
export const LearningScreen: React.FC<LearningScreenProps> = ({
  navigation,
  route,
}) => {
  const preferredTrack = route?.params?.track;

  // Session state
  const [session, setSession] = useState<SessionConfig | null>(null);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  // Content state
  const [currentContent, setCurrentContent] = useState<GeneratedContent | null>(
    null,
  );
  const [currentConceptIndex, setCurrentConceptIndex] = useState(0);

  // Answer state
  const [userAnswer, setUserAnswer] = useState('');
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Gamification state
  const [totalXp, setTotalXp] = useState(250);
  const [xpEarned, setXpEarned] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [flowState, setFlowState] = useState<FlowState>({
    consecutive_correct: 0,
    is_in_flow: false,
    confetti_opacity: 1.0,
    confetti_frequency: 1.0,
    show_confetti: true,
  });

  // Socratic state
  const [socraticResponse, setSocraticResponse] =
    useState<SocraticResponse | null>(null);

  // Mastery state
  const [currentMastery, setCurrentMastery] = useState(0.1);
  const [previousMastery, setPreviousMastery] = useState(0.1);

  // Demo session initialization
  useEffect(() => {
    initializeSession();
  }, []);

  const initializeSession = () => {
    const demoContent: GeneratedContent = {
      concept_id: 'math_6_integer_ops',
      subject: 'math',
      narrative:
        "Ashi is training for a big gymnastics competition! She needs to figure out her total score. In the morning, she earned 47 points on the balance beam. But then she got a 12-point deduction for stepping out of bounds. In the afternoon, she earned 35 more points on the floor routine, but lost 8 points for a wobble. Meanwhile, her cute puppy friend Biscuit was watching from the stands, wagging his tail every time Ashi stuck a landing! To find out what surprise Biscuit has for Ashi after the competition, you need to calculate her final score...",
      question:
        "What is Ashi's final score? Calculate: 47 + (-12) + 35 + (-8)",
      hint: 'Try adding all the positive numbers together first, then all the negative numbers, and combine them!',
      correct_answer: '62',
      difficulty: 2,
      story_part: 1,
    };

    const demoSession: SessionConfig = {
      session_id: 'demo_session_1',
      user_id: 'demo_user',
      duration_minutes: 18,
      visual_timer_theme: 'puppy_walk',
      started_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 18 * 60 * 1000).toISOString(),
      learning_path: [
        {
          concept_id: 'math_6_integer_ops',
          subject: 'math',
          concept_name: 'Integer Operations',
          mastery: 0.1,
          content: demoContent,
        },
        {
          concept_id: 'ela_4_main_idea',
          subject: 'ela',
          concept_name: 'Main Idea & Details',
          mastery: 0.15,
        },
      ],
      is_active: true,
    };

    setSession(demoSession);
    setCurrentContent(demoContent);
  };

  const handleSubmitAnswer = () => {
    if (!currentContent || !userAnswer.trim()) return;

    const correct =
      userAnswer.trim().toLowerCase() ===
      currentContent.correct_answer.toLowerCase();
    setIsCorrect(correct);
    setIsAnswerSubmitted(true);

    if (correct) {
      const newConsecutive = flowState.consecutive_correct + 1;
      const isInFlow = newConsecutive >= 5;
      const flowDepth = Math.max(0, newConsecutive - 5);
      const fadeRate = 0.15;

      const newFlowState: FlowState = {
        consecutive_correct: newConsecutive,
        is_in_flow: isInFlow,
        confetti_opacity: isInFlow
          ? Math.max(0.1, 1.0 - flowDepth * fadeRate)
          : 1.0,
        confetti_frequency: isInFlow
          ? Math.max(0.2, 1.0 - flowDepth * fadeRate)
          : 1.0,
        show_confetti: !isInFlow || 1.0 - flowDepth * fadeRate > 0.1,
      };

      setFlowState(newFlowState);
      setXpEarned(10);
      setTotalXp((prev) => prev + 10);
      setShowConfetti(true);
      setPreviousMastery(currentMastery);
      setCurrentMastery((prev) => Math.min(prev + 0.15, 1.0));
    } else {
      setFlowState((prev) => ({
        ...prev,
        consecutive_correct: 0,
        is_in_flow: false,
        confetti_opacity: 1.0,
        confetti_frequency: 1.0,
        show_confetti: true,
      }));

      setSocraticResponse({
        guiding_question:
          "Ashi, you're so close! I noticed something about your calculation. When we work with negative numbers in gymnastics scoring, it's like counting backwards on the scoreboard. Can you check: did you add all the positive numbers together first, then subtract all the negative numbers?",
        encouragement: "Great effort, Ashi! Let's think about this together. 🤔",
        related_misconceptions: [],
      });
    }
  };

  const handleNextQuestion = () => {
    setUserAnswer('');
    setIsAnswerSubmitted(false);
    setIsCorrect(false);
    setShowHint(false);
    setSocraticResponse(null);
    setXpEarned(0);
    setShowConfetti(false);

    // Cycle through learning path or generate new content
    if (session) {
      const nextIndex =
        (currentConceptIndex + 1) % session.learning_path.length;
      setCurrentConceptIndex(nextIndex);

      const nextItem = session.learning_path[nextIndex];
      if (nextItem.content) {
        setCurrentContent(nextItem.content);
      } else {
        // Generate ELA content as fallback
        setCurrentContent({
          concept_id: 'ela_4_main_idea',
          subject: 'ela',
          narrative: "Read this short passage about Ashi's adventure:",
          question:
            '"Ashi went to the park with her puppy, Biscuit. They played fetch near the big oak tree. Then they ran through the sprinklers. Biscuit loved to splash in the water. Ashi laughed and laughed. It was the best day at the park." What is the main idea of this passage?\n\nA) Biscuit likes water\nB) Ashi and Biscuit had a fun day at the park\nC) The park has a big oak tree\nD) Ashi likes to laugh',
          hint: 'The main idea is what the WHOLE passage is about, not just one detail.',
          correct_answer: 'B',
          difficulty: 1,
          story_part: 1,
        });
      }
    }
  };

  const handleTimerExpired = () => {
    setIsSessionExpired(true);
    // Zeigarnik Effect: cut off content and show return message
  };

  if (!session || !currentContent) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Preparing your adventure...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ConfettiOverlay
        visible={showConfetti}
        flowState={flowState}
        onComplete={() => setShowConfetti(false)}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Timer */}
        <VisualTimer
          totalSeconds={session.duration_minutes * 60}
          theme={session.visual_timer_theme}
          onExpired={handleTimerExpired}
          startedAt={session.started_at}
        />

        {/* XP and Flow State */}
        <View style={styles.topBar}>
          <XpDisplay
            totalXp={totalXp}
            xpEarned={xpEarned}
            showAnimation={xpEarned > 0}
          />
          {flowState.is_in_flow && (
            <View style={styles.flowBadge}>
              <Text style={styles.flowText}>
                🌊 Flow State ({flowState.consecutive_correct} streak)
              </Text>
            </View>
          )}
        </View>

        {/* Mastery Progress */}
        <View style={styles.masterySection}>
          <MasteryProgressBar
            conceptName={
              session.learning_path[currentConceptIndex]?.concept_name ||
              'Loading...'
            }
            subject={currentContent.subject}
            mastery={currentMastery}
            previousMastery={previousMastery}
          />
        </View>

        {/* Narrative (Curiosity Gap Story) */}
        <View style={styles.narrativeCard}>
          <Text style={styles.narrativeText}>{currentContent.narrative}</Text>
        </View>

        {/* Question */}
        <View style={styles.questionCard}>
          <Text style={styles.questionLabel}>Your Challenge:</Text>
          <Text style={styles.questionText}>{currentContent.question}</Text>

          {/* Hint button */}
          {!showHint && currentContent.hint && !isAnswerSubmitted && (
            <TouchableOpacity
              style={styles.hintButton}
              onPress={() => setShowHint(true)}
            >
              <Text style={styles.hintButtonText}>💡 Need a hint?</Text>
            </TouchableOpacity>
          )}
          {showHint && currentContent.hint && (
            <View style={styles.hintBox}>
              <Text style={styles.hintText}>
                💡 {currentContent.hint}
              </Text>
            </View>
          )}
        </View>

        {/* Answer Input */}
        {!isSessionExpired && (
          <View style={styles.answerSection}>
            {!isAnswerSubmitted ? (
              <>
                <TextInput
                  style={styles.answerInput}
                  placeholder="Type your answer here..."
                  value={userAnswer}
                  onChangeText={setUserAnswer}
                  placeholderTextColor={COLORS.textLight}
                />
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    !userAnswer.trim() && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmitAnswer}
                  disabled={!userAnswer.trim()}
                >
                  <Text style={styles.submitButtonText}>Submit Answer</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.resultSection}>
                {isCorrect ? (
                  <View style={styles.correctFeedback}>
                    <Text style={styles.correctText}>
                      ✨ Amazing work, Ashi! That's correct!
                    </Text>
                    <Text style={styles.xpText}>+{xpEarned} XP earned!</Text>
                    {flowState.is_in_flow && (
                      <Text style={styles.flowMessage}>
                        🌊 You're in the zone! Keep going!
                      </Text>
                    )}
                  </View>
                ) : (
                  <View style={styles.incorrectFeedback}>
                    <Text style={styles.encouragement}>
                      {socraticResponse?.encouragement}
                    </Text>
                    <View style={styles.socraticBox}>
                      <Text style={styles.socraticLabel}>
                        Coach Spark asks:
                      </Text>
                      <Text style={styles.socraticQuestion}>
                        {socraticResponse?.guiding_question}
                      </Text>
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={handleNextQuestion}
                >
                  <Text style={styles.nextButtonText}>
                    {isCorrect ? 'Continue the Story →' : 'Try Again'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Zeigarnik Effect: Session Expired */}
        {isSessionExpired && (
          <View style={styles.expiredSection}>
            <Text style={styles.expiredTitle}>
              🌟 Great session, Ashi!
            </Text>
            <Text style={styles.expiredText}>
              What happens next in the story? Come back tomorrow to find out!
              Biscuit will be waiting for you! 🐶
            </Text>
            <TouchableOpacity
              style={styles.goHomeButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.goHomeText}>Go Home</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    ...FONTS.heading,
    color: COLORS.primary,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  flowBadge: {
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  flowText: {
    ...FONTS.bodySmall,
    color: COLORS.primary,
    fontWeight: '600',
  },
  masterySection: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  narrativeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
    ...SHADOWS.small,
  },
  narrativeText: {
    ...FONTS.body,
    lineHeight: 24,
  },
  questionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  questionLabel: {
    ...FONTS.caption,
    color: COLORS.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  questionText: {
    ...FONTS.body,
    lineHeight: 24,
    fontWeight: '500',
  },
  hintButton: {
    marginTop: SPACING.md,
    alignSelf: 'flex-start',
  },
  hintButtonText: {
    ...FONTS.bodySmall,
    color: COLORS.primary,
    fontWeight: '600',
  },
  hintBox: {
    marginTop: SPACING.md,
    backgroundColor: '#FFF9E6',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
  },
  hintText: {
    ...FONTS.bodySmall,
    fontStyle: 'italic',
  },
  answerSection: {
    paddingHorizontal: SPACING.md,
  },
  answerInput: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    ...FONTS.body,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    ...FONTS.button,
  },
  resultSection: {
    marginBottom: SPACING.md,
  },
  correctFeedback: {
    backgroundColor: '#E8F5E9',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  correctText: {
    ...FONTS.subheading,
    color: COLORS.success,
    textAlign: 'center',
  },
  xpText: {
    ...FONTS.heading,
    color: COLORS.xp,
    marginTop: SPACING.sm,
  },
  flowMessage: {
    ...FONTS.bodySmall,
    color: COLORS.primary,
    marginTop: SPACING.sm,
    fontWeight: '600',
  },
  incorrectFeedback: {
    marginBottom: SPACING.md,
  },
  encouragement: {
    ...FONTS.body,
    color: COLORS.secondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  socraticBox: {
    backgroundColor: '#FFF3E0',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  socraticLabel: {
    ...FONTS.caption,
    fontWeight: '700',
    color: COLORS.warning,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  socraticQuestion: {
    ...FONTS.body,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  nextButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  nextButtonText: {
    ...FONTS.button,
  },
  expiredSection: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginHorizontal: SPACING.md,
    alignItems: 'center',
  },
  expiredTitle: {
    ...FONTS.heading,
    color: COLORS.textOnPrimary,
    marginBottom: SPACING.md,
  },
  expiredText: {
    ...FONTS.body,
    color: COLORS.textOnPrimary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.lg,
  },
  goHomeButton: {
    backgroundColor: COLORS.textOnPrimary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xl,
  },
  goHomeText: {
    ...FONTS.button,
    color: COLORS.primary,
  },
  bottomSpacer: {
    height: SPACING.xxl,
  },
});
