import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Zap, Target, Clock } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface GameHUDProps {
  currentTrial: number;
  totalTrials: number;
  streak: number;
  timeRemaining: number;
  timeLimit: number;
}

function GameHUDComponent({
  currentTrial,
  totalTrials,
  streak,
  timeRemaining,
  timeLimit,
}: GameHUDProps) {
  const timerProgress = timeLimit > 0 ? timeRemaining / timeLimit : 1;
  const isLowTime = timerProgress < 0.25;
  const progressWidth = useRef(new Animated.Value(timerProgress)).current;

  useEffect(() => {
    Animated.timing(progressWidth, {
      toValue: timerProgress,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [timerProgress, progressWidth]);

  const timerColor = isLowTime ? Colors.error : Colors.accent;
  const timeText = `${Math.ceil(timeRemaining / 1000)}s`;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.trialInfo}>
          <Target size={14} color={Colors.textSecondary} />
          <Text style={styles.trialText}>
            {currentTrial}/{totalTrials}
          </Text>
        </View>

        <View style={styles.timerInfo}>
          <Clock size={14} color={timerColor} />
          <Text style={[styles.timerText, { color: timerColor }]}>{timeText}</Text>
        </View>

        {streak > 1 && (
          <View style={styles.streakBadge}>
            <Zap size={12} color={Colors.warning} />
            <Text style={styles.streakText}>{streak}</Text>
          </View>
        )}
      </View>

      <View style={styles.progressBar}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              backgroundColor: timerColor,
              width: progressWidth.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  trialInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trialText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  timerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.warningDim,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.warning,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});

export default React.memo(GameHUDComponent);
