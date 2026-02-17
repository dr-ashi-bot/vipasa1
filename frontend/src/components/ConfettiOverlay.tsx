import React, { useEffect, useRef } from 'react';
import { StyleSheet, Dimensions, View } from 'react-native';
import LottieView from 'lottie-react-native';
import type { FlowState } from '../types';

const { width, height } = Dimensions.get('window');

interface ConfettiOverlayProps {
  visible: boolean;
  flowState?: FlowState;
  onComplete?: () => void;
}

/**
 * Full-screen Lottie confetti animation.
 *
 * Flow State Design: As the user enters flow (5+ consecutive correct),
 * the confetti opacity and frequency are gradually reduced to let the
 * intrinsic story motivation take over.
 */
export const ConfettiOverlay: React.FC<ConfettiOverlayProps> = ({
  visible,
  flowState,
  onComplete,
}) => {
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    if (visible && animationRef.current) {
      animationRef.current.reset();
      animationRef.current.play();
    }
  }, [visible]);

  if (!visible) return null;

  const opacity = flowState?.confetti_opacity ?? 1.0;
  const shouldShow = flowState?.show_confetti ?? true;

  if (!shouldShow) return null;

  return (
    <View style={[styles.container, { opacity }]} pointerEvents="none">
      <LottieView
        ref={animationRef}
        source={require('../assets/animations/confetti.json')}
        autoPlay
        loop={false}
        style={styles.animation}
        onAnimationFinish={onComplete}
        speed={1.2}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    pointerEvents: 'none',
  },
  animation: {
    width: width,
    height: height,
  },
});
