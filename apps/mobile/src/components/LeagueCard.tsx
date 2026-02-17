import { StyleSheet, Text, View } from "react-native";

interface LeagueCardProps {
  tier: string;
  rank: number;
  promotionZoneMaxRank: number;
  demotionZoneMinRank: number;
}

const tierOrder = [
  "Bronze",
  "Silver",
  "Gold",
  "Sapphire",
  "Ruby",
  "Emerald",
  "Amethyst",
  "Pearl",
  "Obsidian",
  "Diamond",
];

export function LeagueCard({
  tier,
  rank,
  promotionZoneMaxRank,
  demotionZoneMinRank,
}: LeagueCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Weekly League (30 learners)</Text>
      <Text style={styles.rank}>Tier: {tier}</Text>
      <Text style={styles.rank}>Current rank: {rank}</Text>
      <Text style={styles.zone}>Promotion zone: ranks 1 to {promotionZoneMaxRank}</Text>
      <Text style={styles.zone}>Demotion zone: ranks {demotionZoneMinRank} to 30</Text>
      <View style={styles.tierRow}>
        {tierOrder.map((item) => (
          <Text key={item} style={[styles.tierPill, item === tier && styles.tierPillActive]}>
            {item}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  rank: {
    marginTop: 4,
    color: "#1e293b",
  },
  zone: {
    marginTop: 2,
    color: "#334155",
  },
  tierRow: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tierPill: {
    backgroundColor: "#e2e8f0",
    color: "#334155",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 12,
  },
  tierPillActive: {
    backgroundColor: "#c7d2fe",
    color: "#1e1b4b",
    fontWeight: "700",
  },
});
