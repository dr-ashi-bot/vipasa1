import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

interface VisualTimerProps {
  startsAtIso: string;
  expiresAtIso: string;
  theme: "puppy-walk" | "gymnast-routine";
  onExpire: () => void;
}

export function VisualTimer({ startsAtIso, expiresAtIso, theme, onExpire }: VisualTimerProps) {
  const [progress, setProgress] = useState(0);
  const icon = theme === "puppy-walk" ? "🐶" : "🤸‍♀️";

  useEffect(() => {
    const startsAt = new Date(startsAtIso).getTime();
    const expiresAt = new Date(expiresAtIso).getTime();
    const total = Math.max(1, expiresAt - startsAt);
    const tick = () => {
      const now = Date.now();
      const elapsed = Math.max(0, now - startsAt);
      const pct = Math.min(1, elapsed / total);
      setProgress(pct);
      if (now >= expiresAt) {
        onExpire();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAtIso, onExpire, startsAtIso]);

  const leftOffsetPct = useMemo(() => `${Math.min(92, progress * 92)}%`, [progress]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Focus Journey</Text>
      <Text style={styles.subtitle}>
        {theme === "puppy-walk"
          ? "Ashi's puppy walks the path while focus time flows."
          : "Ashi's gymnast routine flows step by step."}
      </Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.max(8, progress * 100)}%` }]} />
        <Text style={[styles.icon, { left: leftOffsetPct }]}>{icon}</Text>
      </View>
      <Text style={styles.noNumbers}>No countdown numbers, just calm progress.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  subtitle: {
    marginTop: 4,
    color: "#4b5563",
  },
  track: {
    marginTop: 14,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    overflow: "hidden",
  },
  fill: {
    position: "absolute",
    height: "100%",
    backgroundColor: "#c7d2fe",
    borderRadius: 16,
  },
  icon: {
    position: "absolute",
    fontSize: 20,
  },
  noNumbers: {
    marginTop: 8,
    fontSize: 12,
    color: "#6b7280",
  },
});
