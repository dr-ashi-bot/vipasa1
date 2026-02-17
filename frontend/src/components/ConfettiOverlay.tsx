import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import LottieView from 'lottie-react-native';

interface ConfettiOverlayProps {
  visible: boolean;
  intensity?: number;
  onComplete?: () => void;
}

export function ConfettiOverlay({
  visible,
  intensity = 1,
  onComplete,
}: ConfettiOverlayProps) {
  const lottieRef = useRef<LottieView>(null);

  useEffect(() => {
    if (visible) {
      lottieRef.current?.play();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={[styles.overlay, { opacity: intensity }]} pointerEvents="none">
        <LottieView
          ref={lottieRef}
          source={require('../../assets/confetti.json')}
          autoPlay
          loop={false}
          style={styles.lottie}
          onAnimationFinish={onComplete}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  lottie: {
    width: 400,
    height: 400,
  },
});
