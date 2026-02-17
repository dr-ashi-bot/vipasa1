import React, { useEffect, useRef } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');

interface ConfettiOverlayProps {
  visible: boolean;
  opacity: number;
  onComplete?: () => void;
}

/**
 * Full-screen Lottie confetti animation overlay.
 * Implements Flow State Design: opacity and frequency fade
 * as the user enters a flow state (5+ correct in a row).
 */
const ConfettiOverlay: React.FC<ConfettiOverlayProps> = ({
  visible,
  opacity,
  onComplete,
}) => {
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    if (visible && animationRef.current) {
      animationRef.current.play();
    }
  }, [visible]);

  if (!visible || opacity <= 0.05) return null;

  return (
    <LottieView
      ref={animationRef}
      source={require('../assets/animations/confetti.json')}
      autoPlay={false}
      loop={false}
      speed={1.2}
      style={[styles.overlay, { opacity }]}
      onAnimationFinish={onComplete}
    />
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
    zIndex: 1000,
    pointerEvents: 'none',
  },
});

export default ConfettiOverlay;
