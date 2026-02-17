import { StyleSheet, Text, View } from "react-native";

interface Quest {
  title: string;
  target: string;
  reward_xp: number;
  expires_in_hours: number;
}

interface QuestListProps {
  quests: Quest[];
}

export function QuestList({ quests }: QuestListProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Quests</Text>
      {quests.map((quest) => (
        <View key={quest.title} style={styles.item}>
          <Text style={styles.questTitle}>{quest.title}</Text>
          <Text style={styles.questBody}>{quest.target}</Text>
          <Text style={styles.questMeta}>+{quest.reward_xp} XP</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ecfeff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#155e75",
  },
  item: {
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#cffafe",
  },
  questTitle: {
    fontWeight: "700",
    color: "#0f766e",
  },
  questBody: {
    marginTop: 2,
    color: "#115e59",
  },
  questMeta: {
    marginTop: 4,
    color: "#134e4a",
  },
});
