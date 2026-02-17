import { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import LottieView from "lottie-react-native";

interface ConfettiLayerProps {
  playNonce: number;
  opacity: number;
}

export function ConfettiLayer({ playNonce, opacity }: ConfettiLayerProps) {
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    if (playNonce > 0) {
      animationRef.current?.reset();
      animationRef.current?.play();
    }
  }, [playNonce]);

  if (playNonce === 0) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.overlay}>
      <LottieView
        ref={animationRef}
        source={require("../assets/confetti.json")}
        style={[styles.animation, { opacity: Math.max(0, Math.min(1, opacity)) }]}
        autoPlay={false}
        loop={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  animation: {
    width: "100%",
    height: "100%",
  },
});
