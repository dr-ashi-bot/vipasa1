import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { VisualTimer } from '../components/VisualTimer';
import { ConfettiOverlay } from '../components/ConfettiOverlay';
import {
  generateContent,
  submitProgress,
  getSocraticQuestion,
  DEFAULT_USER_ID,
} from '../api/client';

const MATH_CONCEPTS = [
  'math_6_geometry_3d',
  'math_6_integers',
  'math_6_equations',
  'math_6_ratios',
];

export function SessionScreen({
  sessionData,
  onSessionExpired,
}: {
  sessionData: { math_concepts: string[]; ela_concepts: string[]; expires_at: string };
  onSessionExpired: () => void;
}) {
  const [conceptIndex, setConceptIndex] = useState(0);
  const [problem, setProblem] = useState<{
    problem: string;
    expectedAnswer?: string;
    narrativePart?: string;
  } | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [socraticQuestion, setSocraticQuestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [correctInRow, setCorrectInRow] = useState(0);
  const [confettiVisible, setConfettiVisible] = useState(false);
  const [confettiIntensity, setConfettiIntensity] = useState(1);
  const [sessionExpired, setSessionExpired] = useState(false);

  const conceptId =
    sessionData.math_concepts[conceptIndex] ?? MATH_CONCEPTS[conceptIndex % MATH_CONCEPTS.length];

  const loadProblem = useCallback(async () => {
    setLoading(true);
    setSocraticQuestion(null);
    setUserAnswer('');
    try {
      const content = await generateContent(
        DEFAULT_USER_ID,
        conceptId,
        'math',
        0
      );
      setProblem(content);
    } catch {
      setProblem({
        problem: 'Ashi has 3 balance beams. Each is 4 meters long. How many meters total?',
        expectedAnswer: '12',
        narrativePart: 'Great job!',
      });
    } finally {
      setLoading(false);
    }
  }, [conceptId]);

  useEffect(() => {
    loadProblem();
  }, [loadProblem]);

  const handleExpire = () => {
    setSessionExpired(true);
    onSessionExpired();
  };

  const checkAnswer = (expected: string, actual: string): boolean => {
    const n = (s: string) => parseFloat(String(s).trim().replace(/[^0-9.-]/g, ''));
    const a = n(actual);
    const e = n(expected);
    if (!isNaN(a) && !isNaN(e)) return Math.abs(a - e) < 0.01;
    return String(actual).trim().toLowerCase() === String(expected).trim().toLowerCase();
  };

  const handleSubmit = async () => {
    if (!problem || sessionExpired) return;
    const isCorrect = problem.expectedAnswer
      ? checkAnswer(problem.expectedAnswer, userAnswer)
      : false;

    if (isCorrect) {
      const newCorrectInRow = correctInRow + 1;
      setCorrectInRow(newCorrectInRow);
      setConfettiIntensity(newCorrectInRow <= 2 ? 1 : newCorrectInRow <= 4 ? 0.7 : 0.5);
      setConfettiVisible(true);

      await submitProgress(DEFAULT_USER_ID, conceptId, true, {
        correctInRow: newCorrectInRow,
      });

      setConceptIndex((i) => i + 1);
      setProblem(null);
      loadProblem();
    } else {
      try {
        const { question } = await getSocraticQuestion(
          DEFAULT_USER_ID,
          conceptId,
          userAnswer,
          problem.problem
        );
        setSocraticQuestion(question);
      } catch {
        setSocraticQuestion('Can you walk me through your steps?');
      }
      await submitProgress(DEFAULT_USER_ID, conceptId, false, {
        userAnswer,
        problem: problem.problem,
      });
    }
  };

  if (sessionExpired) {
    return (
      <View style={styles.center}>
        <Text style={styles.zeigarnik}>
          Session complete! 🐕
        </Text>
        <Text style={styles.zeigarnikSub}>
          Come back tomorrow to continue the story!
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <VisualTimer
        durationMinutes={18}
        expiresAt={new Date(sessionData.expires_at)}
        onExpire={handleExpire}
      />

      <ConfettiOverlay
        visible={confettiVisible}
        intensity={confettiIntensity}
        onComplete={() => setConfettiVisible(false)}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#7cb342" style={{ marginTop: 24 }} />
      ) : problem ? (
        <View style={styles.problemCard}>
          <Text style={styles.problemText}>{problem.problem}</Text>
          <TextInput
            style={styles.input}
            placeholder="Your answer"
            value={userAnswer}
            onChangeText={setUserAnswer}
            keyboardType="numeric"
          />
          {socraticQuestion && (
            <Text style={styles.socratic}>{socraticQuestion}</Text>
          )}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={!userAnswer.trim()}
          >
            <Text style={styles.submitText}>Submit</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf8f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  zeigarnik: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3e2723',
    textAlign: 'center',
  },
  zeigarnikSub: {
    fontSize: 16,
    color: '#5d4037',
    marginTop: 8,
    textAlign: 'center',
  },
  problemCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  problemText: {
    fontSize: 18,
    color: '#3e2723',
    marginBottom: 16,
    lineHeight: 26,
  },
  input: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  socratic: {
    fontSize: 14,
    color: '#7cb342',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  submitBtn: {
    backgroundColor: '#7cb342',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});
