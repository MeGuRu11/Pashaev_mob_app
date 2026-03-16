import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { FIND_EXACT_DIFFICULTIES } from '@/constants/game';
import { useGame } from '@/providers/GameProvider';
import { DifficultyMode, Shape, Trial } from '@/types/game';
import { generateTrialShapes } from '@/utils/shape-generator';
import { generateSeed } from '@/utils/seed-random';
import { buildSessionSummary } from '@/utils/scoring';
import { resolveDifficultyAfterSession } from '@/utils/adaptive-difficulty';
import GameHUD from '@/components/GameHUD';
import ShapeView from '@/components/ShapeView';
import { clampDifficulty } from '@/utils/progress-normalization';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function scaleShapeToCanvas(shape: Shape, fromSize: number, toSize: number): Shape {
  if (!Number.isFinite(fromSize) || !Number.isFinite(toSize) || fromSize <= 0 || toSize <= 0) {
    return shape;
  }
  if (Math.abs(fromSize - toSize) < 0.001) {
    return shape;
  }

  const ratio = toSize / fromSize;
  const fromCenter = fromSize / 2;
  const toCenter = toSize / 2;

  const scalePoint = (x: number, y: number) => ({
    x: (x - fromCenter) * ratio + toCenter,
    y: (y - fromCenter) * ratio + toCenter,
  });

  return {
    ...shape,
    vertices: shape.vertices.map((v) => scalePoint(v.x, v.y)),
    innerLines: shape.innerLines.map(([a, b]) => {
      const nextA = scalePoint(a.x, a.y);
      const nextB = scalePoint(b.x, b.y);
      return [nextA, nextB];
    }),
  };
}

export default function FindExactScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; level?: string }>();
  const { progress, addSession, updateDifficulty } = useGame();

  const moduleProgress = progress['find-exact'];
  const sessionMode: DifficultyMode =
    params.mode === 'fixed' || params.mode === 'adaptive'
      ? params.mode
      : moduleProgress.difficultyMode;
  const parsedLevel = params.level ? Number(params.level) : moduleProgress.selectedDifficulty;
  const sessionDifficulty = Math.min(
    FIND_EXACT_DIFFICULTIES.length,
    clampDifficulty(parsedLevel)
  );
  const config = FIND_EXACT_DIFFICULTIES[sessionDifficulty - 1];

  const [trialIndex, setTrialIndex] = useState(0);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [streak, setStreak] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(config.timeLimit);
  const [isActive, setIsActive] = useState(true);
  const [trialSeed, setTrialSeed] = useState(generateSeed);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackCorrect, setFeedbackCorrect] = useState(false);
  const [sessionStartedAt] = useState(Date.now);

  const trialStartRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedbackAnim = useRef(new Animated.Value(0)).current;
  const trialIndexRef = useRef(trialIndex);
  const trialsRef = useRef(trials);
  const streakRef = useRef(streak);
  const trialResolvedRef = useRef(false);
  const showFeedbackAnimationRef = useRef<(correct: boolean) => void>(() => {});
  const feedbackSequenceRef = useRef<Animated.CompositeAnimation | null>(null);
  const isLeavingRef = useRef(false);

  useEffect(() => { trialIndexRef.current = trialIndex; }, [trialIndex]);
  useEffect(() => { trialsRef.current = trials; }, [trials]);
  useEffect(() => { streakRef.current = streak; }, [streak]);
  useEffect(() => () => {
    isLeavingRef.current = true;
    if (feedbackSequenceRef.current) {
      feedbackSequenceRef.current.stop();
      feedbackSequenceRef.current = null;
    }
  }, []);

  const padding = 20;
  const gridGap = 10;
  const availableWidth = SCREEN_WIDTH - padding * 2;
  const optionSizeFromWidth = Math.floor((availableWidth - gridGap * (config.gridSize - 1)) / config.gridSize);
  const topBarHeight = 64;
  const hudHeight = 50;
  const refSectionHeight = SCREEN_HEIGHT * 0.22;
  const gridLabelHeight = 30;
  const availableGridHeight = SCREEN_HEIGHT - insets.top - insets.bottom - topBarHeight - hudHeight - refSectionHeight - gridLabelHeight - 20;
  const optionSizeFromHeight = Math.floor((availableGridHeight - gridGap * (config.gridSize - 1)) / config.gridSize);
  const optionSize = Math.min(optionSizeFromWidth, optionSizeFromHeight);
  const refShapeSize = Math.min(SCREEN_WIDTH * 0.3, refSectionHeight * 0.7, 120);
  const optionShapeSize = optionSize * 0.85;
  const referenceContentSize = refShapeSize * 0.92;

  const trialData = React.useMemo(
    () => generateTrialShapes(
      trialSeed,
      config.gridSize,
      config.verticesMin,
      config.verticesMax,
      config.mutationStrength,
      optionShapeSize,
      config.nearMissCount,
      config.nearMissStrengthMultiplier
    ),
    [
      trialSeed,
      config.gridSize,
      config.verticesMin,
      config.verticesMax,
      config.mutationStrength,
      config.nearMissCount,
      config.nearMissStrengthMultiplier,
      optionShapeSize,
    ]
  );

  const handleTimeout = useCallback(() => {
    if (trialResolvedRef.current) return;
    trialResolvedRef.current = true;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const trial: Trial = {
      index: trialIndexRef.current,
      isCorrect: false,
      rtMs: config.timeLimit,
      errorType: 'timeout',
    };

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    setTrials((prev) => [...prev, trial]);
    setStreak(0);
    showFeedbackAnimationRef.current(false);
  }, [config.timeLimit]);

  const handleOptionPress = useCallback((index: number) => {
    if (!isActive || showFeedback || trialResolvedRef.current) return;
    trialResolvedRef.current = true;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const rt = Date.now() - trialStartRef.current;
    const isCorrect = index === trialData.correctIndex;

    const trial: Trial = {
      index: trialIndexRef.current,
      isCorrect,
      rtMs: rt,
      errorType: isCorrect ? undefined : 'wrong',
    };

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(
        isCorrect
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Error
      );
    }

    setSelectedIndex(index);
    setTrials((prev) => [...prev, trial]);
    setStreak((prev) => (isCorrect ? prev + 1 : 0));
    showFeedbackAnimationRef.current(isCorrect);
  }, [isActive, showFeedback, trialData.correctIndex]);

  useEffect(() => {
    if (!isActive) return;
    trialResolvedRef.current = false;
    setTimeRemaining(config.timeLimit);
    trialStartRef.current = Date.now();

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        const next = prev - 100;
        if (next <= 0) {
          handleTimeout();
          return 0;
        }
        return next;
      });
    }, 100);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [trialIndex, isActive, config.timeLimit, handleTimeout]);

  const advanceTrialRef = useRef<() => void>(() => {});
  const finishSessionRef = useRef<() => void>(() => {});

  const showFeedbackAnimation = useCallback((correct: boolean) => {
    if (isLeavingRef.current) return;
    setFeedbackCorrect(correct);
    setShowFeedback(true);
    feedbackAnim.setValue(0);

    if (feedbackSequenceRef.current) {
      feedbackSequenceRef.current.stop();
      feedbackSequenceRef.current = null;
    }

    const feedbackSequence = Animated.sequence([
      Animated.timing(feedbackAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.delay(400),
      Animated.timing(feedbackAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]);
    feedbackSequenceRef.current = feedbackSequence;
    feedbackSequence.start(({ finished }) => {
      feedbackSequenceRef.current = null;
      if (!finished || isLeavingRef.current) return;
      setShowFeedback(false);
      setSelectedIndex(null);
      advanceTrialRef.current();
    });
  }, [feedbackAnim]);

  useEffect(() => {
    showFeedbackAnimationRef.current = showFeedbackAnimation;
  }, [showFeedbackAnimation]);

  const advanceTrial = useCallback(() => {
    const nextTrial = trialIndexRef.current + 1;
    if (nextTrial >= config.trialsCount) {
      finishSessionRef.current();
    } else {
      setTrialIndex(nextTrial);
      setTrialSeed(generateSeed());
    }
  }, [config.trialsCount]);

  useEffect(() => { advanceTrialRef.current = advanceTrial; }, [advanceTrial]);

  const finishSession = useCallback(() => {
    isLeavingRef.current = true;
    if (feedbackSequenceRef.current) {
      feedbackSequenceRef.current.stop();
      feedbackSequenceRef.current = null;
    }
    trialResolvedRef.current = true;
    setIsActive(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const allTrials = [...trialsRef.current];
    const summary = buildSessionSummary(
      allTrials,
      'find-exact',
      sessionDifficulty,
      sessionStartedAt,
      sessionMode
    );
    addSession(summary);

    const { newLevel } = resolveDifficultyAfterSession(
      sessionMode,
      allTrials,
      sessionDifficulty,
      FIND_EXACT_DIFFICULTIES.length
    );
    if (sessionMode === 'adaptive') {
      updateDifficulty('find-exact', newLevel);
    }

    router.replace({
      pathname: '/game/results' as any,
      params: {
        sessionId: summary.id,
        moduleId: 'find-exact',
        accuracy: String(summary.accuracy),
        medianRt: String(summary.medianRt),
        streakMax: String(summary.streakMax),
        fatigueIndex: String(summary.fatigueIndex),
        mode: sessionMode,
        difficulty: String(sessionDifficulty),
        newDifficulty: String(newLevel),
        trialsCount: String(allTrials.length),
        correctCount: String(allTrials.filter((t) => t.isCorrect).length),
      },
    });
  }, [sessionDifficulty, sessionMode, sessionStartedAt, addSession, updateDifficulty, router]);

  useEffect(() => { finishSessionRef.current = finishSession; }, [finishSession]);

  const handleQuit = useCallback(() => {
    isLeavingRef.current = true;
    if (feedbackSequenceRef.current) {
      feedbackSequenceRef.current.stop();
      feedbackSequenceRef.current = null;
    }
    trialResolvedRef.current = true;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    router.back();
  }, [router]);

  const refShape = React.useMemo(
    () => scaleShapeToCanvas(trialData.reference, optionShapeSize, referenceContentSize),
    [trialData.reference, optionShapeSize, referenceContentSize]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleQuit} style={styles.quitButton} testID="quit-button">
          <X size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.moduleTitle}>Найди точный</Text>
        <View style={styles.diffBadge}>
          <Text style={styles.diffText}>Ур. {sessionDifficulty}</Text>
        </View>
      </View>

      <GameHUD
        currentTrial={trialIndex + 1}
        totalTrials={config.trialsCount}
        streak={streak}
        timeRemaining={timeRemaining}
        timeLimit={config.timeLimit}
      />

      <View style={styles.referenceSection}>
        <Text style={styles.referenceLabel}>ЭТАЛОН</Text>
        <View style={styles.referenceCard}>
          <ShapeView
            shape={refShape}
            size={refShapeSize}
            strokeColor={Colors.accent}
            fillColor={Colors.accentDim}
          />
        </View>
      </View>

      <View style={styles.gridSection}>
        <Text style={styles.gridLabel}>НАЙДИТЕ СОВПАДЕНИЕ</Text>
        <View style={[styles.grid, { width: availableWidth }]}>
          {Array.from({ length: config.gridSize }).map((_, row) => (
            <View key={`row-${row}`} style={styles.gridRow}>
              {Array.from({ length: config.gridSize }).map((__, col) => {
                const idx = row * config.gridSize + col;
                const isSelected = selectedIndex === idx;
                const isCorrectOption = idx === trialData.correctIndex;
                let borderColor = Colors.cardBorder;
                if (showFeedback && isSelected) {
                  borderColor = feedbackCorrect ? Colors.success : Colors.error;
                }
                if (showFeedback && !feedbackCorrect && isCorrectOption) {
                  borderColor = Colors.success;
                }

                return (
                  <TouchableOpacity
                    key={`opt-${idx}`}
                    style={[
                      styles.optionCard,
                      {
                        width: optionSize,
                        height: optionSize,
                        borderColor,
                      },
                      showFeedback && isSelected && {
                        backgroundColor: feedbackCorrect ? Colors.accentDim : Colors.errorDim,
                      },
                    ]}
                    onPress={() => handleOptionPress(idx)}
                    disabled={showFeedback}
                    activeOpacity={0.7}
                    testID={`option-${idx}`}
                  >
                    <ShapeView
                      shape={trialData.options[idx]}
                      size={optionShapeSize}
                      strokeColor={Colors.textSecondary}
                      fillColor="rgba(255,255,255,0.03)"
                      strokeWidth={1.8}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      {showFeedback && (
        <Animated.View
          style={[
            styles.feedbackOverlay,
            {
              opacity: feedbackAnim,
              transform: [
                {
                  scale: feedbackAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <View
            style={[
              styles.feedbackBadge,
              { backgroundColor: feedbackCorrect ? Colors.accentDim : Colors.errorDim },
            ]}
          >
            <Text
              style={[
                styles.feedbackText,
                { color: feedbackCorrect ? Colors.accent : Colors.error },
              ]}
            >
              {feedbackCorrect ? 'Верно!' : 'Ошибка'}
            </Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  quitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  diffBadge: {
    backgroundColor: Colors.accentDim,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  diffText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  referenceSection: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  referenceLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textTertiary,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  referenceCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.accentMuted,
  },
  gridSection: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 8,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textTertiary,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  grid: {
    alignItems: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 10,
  },
  optionCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackOverlay: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    marginTop: -25,
  },
  feedbackBadge: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
  },
  feedbackText: {
    fontSize: 18,
    fontWeight: '800' as const,
  },
});
