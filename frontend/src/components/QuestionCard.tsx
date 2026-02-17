import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { GeneratedContent } from '../types';

interface QuestionCardProps {
  content: GeneratedContent;
  onSubmitAnswer: (answer: string) => void;
  disabled?: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  content,
  onSubmitAnswer,
  disabled = false,
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');

  const handleSubmit = () => {
    if (selectedAnswer.trim()) {
      onSubmitAnswer(selectedAnswer);
      setSelectedAnswer('');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {content.narrative_context && (
        <View style={styles.narrativeContainer}>
          <Text style={styles.narrativeText}>{content.narrative_context}</Text>
        </View>
      )}

      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{content.question}</Text>
      </View>

      {content.possible_answers && content.possible_answers.length > 0 ? (
        // Multiple choice
        <View style={styles.answersContainer}>
          {content.possible_answers.map((answer, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.answerButton,
                selectedAnswer === answer && styles.answerButtonSelected,
              ]}
              onPress={() => setSelectedAnswer(answer)}
              disabled={disabled}
            >
              <Text
                style={[
                  styles.answerText,
                  selectedAnswer === answer && styles.answerTextSelected,
                ]}
              >
                {answer}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        // Free response
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={selectedAnswer}
            onChangeText={setSelectedAnswer}
            placeholder="Type your answer here..."
            placeholderTextColor="#999"
            editable={!disabled}
            multiline
          />
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.submitButton,
          (!selectedAnswer.trim() || disabled) && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={!selectedAnswer.trim() || disabled}
      >
        <Text style={styles.submitButtonText}>Submit Answer</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  narrativeContainer: {
    backgroundColor: '#FFF9C4',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  narrativeText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    fontStyle: 'italic',
  },
  questionContainer: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1976D2',
    lineHeight: 26,
  },
  answersContainer: {
    marginBottom: 16,
  },
  answerButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  answerButtonSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  answerText: {
    fontSize: 16,
    color: '#333',
  },
  answerTextSelected: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default QuestionCard;
