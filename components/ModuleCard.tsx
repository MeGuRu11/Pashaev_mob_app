import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Crosshair, RotateCcw, ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { UserProgress } from '@/types/game';

interface ModuleCardProps {
  moduleId: 'find-exact' | 'restore-horizon';
  title: string;
  subtitle: string;
  color: string;
  colorDim: string;
  progress: UserProgress;
  onPress: () => void;
}

function ModuleCardComponent({
  moduleId,
  title,
  subtitle,
  color,
  colorDim,
  progress,
  onPress,
}: ModuleCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  const IconComponent = moduleId === 'find-exact' ? Crosshair : RotateCcw;
  const levelText =
    progress.difficultyMode === 'adaptive'
      ? `Адаптивный: Ур. ${progress.currentDifficulty}`
      : `Фиксированный: Ур. ${progress.selectedDifficulty}`;
  const sessionsText = `${progress.totalSessions} сессий`;

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        testID={`module-card-${moduleId}`}
      >
        <View style={styles.topRow}>
          <View style={[styles.iconContainer, { backgroundColor: colorDim }]}>
            <IconComponent size={24} color={color} />
          </View>
          <View style={[styles.levelBadge, { backgroundColor: colorDim }]}>
            <Text style={[styles.levelText, { color }]}>{levelText}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.sessions}>{sessionsText}</Text>
          <View style={[styles.playButton, { backgroundColor: color }]}>
            <ChevronRight size={18} color={Colors.background} />
          </View>
        </View>

        <View style={[styles.accentLine, { backgroundColor: color }]} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  levelText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  content: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessions: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accentLine: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 2,
    borderRadius: 1,
  },
});

export default React.memo(ModuleCardComponent);
