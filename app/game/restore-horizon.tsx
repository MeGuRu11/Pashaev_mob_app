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
import { X, RotateCcw, RotateCw, FlipHorizontal, FlipVertical, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { HORIZON_DIFFICULTIES } from '@/constants/game';
import { useGame } from '@/providers/GameProvider';
import { Trial, DifficultyMode } from '@/types/game';
import {
  areGridsEqual,
  applyGridAction,
  generateHorizonPattern,
  generateHorizonTransform,
  applyTransform,
  HorizonAction,
} from '@/utils/horizon-generator';
import { generateSeed } from '@/utils/seed-random';
import { buildSessionSummary } from '@/utils/scoring';
import { resolveDifficultyAfterSession } from '@/utils/adaptive-difficulty';
import GameHUD from '@/components/GameHUD';
import HorizonGrid from '@/components/HorizonGrid';
import { clampDifficulty } from '@/utils/progress-normalization';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function RestoreHorizonScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; level?: string }>();
  const { progress, addSession, updateDifficulty } = useGame();

  const moduleProgress = progress['restore-horizon'];
  const sessionMode: DifficultyMode =
    params.mode === 'fixed' || params.mode === 'adaptive'
      ? params.mode
      : moduleProgress.difficultyMode;
  const parsedLevel = params.level ? Number(params.level) : moduleProgress.selectedDifficulty;
  const sessionDifficulty = Math.min(
    HORIZON_DIFFICULTIES.length,
    clampDifficulty(parsedLevel)
  );
  const config = HORIZON_DIFFICULTIES[sessionDifficulty - 1];

  const [trialIndex, setTrialIndex] = useState(0);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [streak, setStreak] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(config.timeLimit);
  const [isActive, setIsActive] = useState(true);
  const [patternSeed, setPatternSeed] = useState(generateSeed);
  const [transformSeed, setTransformSeed] = useState(generateSeed);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackCorrect, setFeedbackCorrect] = useState(false);
  const [sessionStartedAt] = useState(Date.now);
  const [moveCount, setMoveCount] = useState(0);

  const trialStartRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedbackAnim = useRef(new Animated.Value(0)).current;
  const trialIndexRef = useRef(trialIndex);
  const trialsRef = useRef(trials);
  const trialResolvedRef = useRef(false);
  const moveCountRef = useRef(0);
  const advanceTrialRef = useRef<() => void>(() => {});
  const finishSessionRef = useRef<() => void>(() => {});
  const showFeedbackAnimationRef = useRef<(correct: boolean) => void>(() => {});
  const feedbackSequenceRef = useRef<Animated.CompositeAnimation | null>(null);
  const isLeavingRef = useRef(false);

  useEffect(() => {
    trialIndexRef.current = trialIndex;
  }, [trialIndex]);

  useEffect(() => {
    trialsRef.current = trials;
  }, [trials]);
  useEffect(() => () => {
    isLeavingRef.current = true;
    if (feedbackSequenceRef.current) {
      feedbackSequenceRef.current.stop();
      feedbackSequenceRef.current = null;
    }
  }, []);

  const gridCardPadding = 14;
  const gridGap = 3;
  const containerPadding = 10;
  const spaceBetweenGrids = 16;
  const maxGridCardWidth = (SCREEN_WIDTH - containerPadding * 2 - spaceBetweenGrids) / 2;
  const maxCellFromWidth = Math.floor((maxGridCardWidth - gridCardPadding * 2 - (config.gridSize - 1) * gridGap) / config.gridSize);
  const gridCellSize = Math.min(maxCellFromWidth, 50);

  const pattern = React.useMemo(
    () => generateHorizonPattern(patternSeed, config.gridSize),
    [patternSeed, config.gridSize]
  );

  const initialTransform = React.useMemo(
    () =>
      generateHorizonTransform(
        transformSeed,
        sessionDifficulty,
        config.minTransformSteps,
        config.maxMoves
      ),
    [transformSeed, sessionDifficulty, config.minTransformSteps, config.maxMoves]
  );

  const targetGrid = React.useMemo(() => pattern.grid, [pattern]);
  const initialGrid = React.useMemo(
    () => applyTransform(pattern, initialTransform),
    [pattern, initialTransform]
  );
  const [currentGrid, setCurrentGrid] = useState<number[][]>(initialGrid);

  useEffect(() => {
    setCurrentGrid(initialGrid);
  }, [initialGrid]);

  const movesRemaining = Math.max(0, config.maxMoves - moveCount);

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

  const handleAction = useCallback(
    (action: HorizonAction) => {
      if (!isActive || showFeedback || trialResolvedRef.current) return;
      if (moveCountRef.current >= config.maxMoves) return;
      moveCountRef.current += 1;
      setCurrentGrid((prev) => applyGridAction(prev, action));
      setMoveCount(moveCountRef.current);

      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    [isActive, showFeedback, config.maxMoves]
  );

  const handleConfirm = useCallback(() => {
    if (!isActive || showFeedback || trialResolvedRef.current) return;
    trialResolvedRef.current = true;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const rt = Date.now() - trialStartRef.current;
    const isCorrect = areGridsEqual(currentGrid, targetGrid);

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

    setTrials((prev) => [...prev, trial]);
    setStreak((prev) => (isCorrect ? prev + 1 : 0));
    showFeedbackAnimationRef.current(isCorrect);
  }, [isActive, showFeedback, currentGrid, targetGrid]);

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
      Animated.delay(500),
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
      setPatternSeed(generateSeed());
      setTransformSeed(generateSeed());
      moveCountRef.current = 0;
      setMoveCount(0);
    }
  }, [config.trialsCount]);

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
      'restore-horizon',
      sessionDifficulty,
      sessionStartedAt,
      sessionMode
    );
    addSession(summary);

    const { newLevel } = resolveDifficultyAfterSession(
      sessionMode,
      allTrials,
      sessionDifficulty,
      HORIZON_DIFFICULTIES.length
    );
    if (sessionMode === 'adaptive') {
      updateDifficulty('restore-horizon', newLevel);
    }

    router.replace({
      pathname: '/game/results' as any,
      params: {
        sessionId: summary.id,
        moduleId: 'restore-horizon',
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

  useEffect(() => {
    advanceTrialRef.current = advanceTrial;
  }, [advanceTrial]);

  useEffect(() => {
    finishSessionRef.current = finishSession;
  }, [finishSession]);

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

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleQuit} style={styles.quitButton} testID="quit-button">
          <X size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.moduleTitle}>Восстанови горизонт</Text>
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

      <View style={styles.gridsContainer}>
        <View style={styles.gridWrapper}>
          <Text style={styles.gridLabel}>ЦЕЛЬ</Text>
          <View style={styles.gridCard}>
            <HorizonGrid grid={targetGrid} cellSize={gridCellSize} />
          </View>
        </View>

        <View style={styles.gridWrapper}>
          <Text style={styles.gridLabel}>ТЕКУЩЕЕ · {moveCount} ходов</Text>
          <View style={[styles.gridCard, styles.currentCard]}>
            <HorizonGrid grid={currentGrid} cellSize={gridCellSize} />
          </View>
          <Text style={styles.movesLabel}>
            Осталось ходов: {movesRemaining}/{config.maxMoves}
          </Text>
        </View>
      </View>

      <View style={styles.controlsSection}>
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[
              styles.controlButton,
              (showFeedback || movesRemaining <= 0) && styles.controlButtonDisabled,
            ]}
            onPress={() => handleAction('rotateLeft')}
            disabled={showFeedback || movesRemaining <= 0}
            testID="rotate-left"
          >
            <RotateCcw size={24} color={Colors.secondary} />
            <Text style={styles.controlLabel}>Влево</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.controlButton,
              (showFeedback || movesRemaining <= 0) && styles.controlButtonDisabled,
            ]}
            onPress={() => handleAction('rotateRight')}
            disabled={showFeedback || movesRemaining <= 0}
            testID="rotate-right"
          >
            <RotateCw size={24} color={Colors.secondary} />
            <Text style={styles.controlLabel}>Вправо</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.controlButton,
              (showFeedback || movesRemaining <= 0) && styles.controlButtonDisabled,
            ]}
            onPress={() => handleAction('flipX')}
            disabled={showFeedback || movesRemaining <= 0}
            testID="flip-x"
          >
            <FlipHorizontal size={24} color={Colors.tertiary} />
            <Text style={styles.controlLabel}>Гориз.</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.controlButton,
              (showFeedback || movesRemaining <= 0) && styles.controlButtonDisabled,
            ]}
            onPress={() => handleAction('flipY')}
            disabled={showFeedback || movesRemaining <= 0}
            testID="flip-y"
          >
            <FlipVertical size={24} color={Colors.tertiary} />
            <Text style={styles.controlLabel}>Вертик.</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.confirmButton, showFeedback && styles.confirmDisabled]}
          onPress={handleConfirm}
          disabled={showFeedback}
          testID="confirm-button"
        >
          <Check size={22} color={Colors.background} />
          <Text style={styles.confirmText}>Подтвердить</Text>
        </TouchableOpacity>
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
    backgroundColor: Colors.secondaryDim,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  diffText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.secondary,
  },
  gridsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: 10,
    paddingVertical: 16,
    flex: 1,
  },
  gridWrapper: {
    alignItems: 'center',
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textTertiary,
    letterSpacing: 1,
    marginBottom: 10,
  },
  movesLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  gridCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  currentCard: {
    borderColor: Colors.secondaryDim,
  },
  controlsSection: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 10,
  },
  controlButton: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  controlButtonDisabled: {
    opacity: 0.45,
  },
  controlLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  confirmButton: {
    backgroundColor: Colors.accent,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmDisabled: {
    opacity: 0.5,
  },
  confirmText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.background,
  },
  feedbackOverlay: {
    position: 'absolute',
    top: '45%',
    left: 0,
    right: 0,
    alignItems: 'center',
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
