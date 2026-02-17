import { StyleSheet, Text, View } from "react-native";

interface StreakFireRowProps {
  streak: number;
  streakFreezes: number;
}

export function StreakFireRow({ streak, streakFreezes }: StreakFireRowProps) {
  const flameCount = Math.max(1, Math.min(7, streak));
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Daily Streak</Text>
      <Text style={styles.icons}>{Array.from({ length: flameCount }, () => "🔥").join(" ")}</Text>
      <Text style={styles.meta}>Streak Freeze shields available: {streakFreezes}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff7ed",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#9a3412",
  },
  icons: {
    marginTop: 6,
    fontSize: 20,
  },
  meta: {
    marginTop: 4,
    color: "#7c2d12",
  },
});
