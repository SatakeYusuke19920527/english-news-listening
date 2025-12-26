import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

export function LoadingPing() {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1.8,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [opacity, scale]);

  return (
    <View style={styles.loadingWrap} accessibilityLabel="読み込み中">
      <Animated.View
        style={[
          styles.loadingDot,
          {
            transform: [{ scale }],
            opacity,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadingDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF385C',
  },
});
