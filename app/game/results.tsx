import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Trophy,
  Target,
  Clock,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  Home,
  Brain,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { formatMs, formatAccuracy } from '@/utils/scoring';
import { DifficultyMode, ModuleType } from '@/types/game';

export default function ResultsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    moduleId: string;
    mode?: string;
    accuracy: string;
    medianRt: string;
    streakMax: string;
    fatigueIndex: string;
    difficulty: string;
    newDifficulty: string;
    trialsCount: string;
    correctCount: string;
  }>();

  const accuracy = parseFloat(params.accuracy || '0');
  const medianRt = parseFloat(params.medianRt || '0');
  const streakMax = parseInt(params.streakMax || '0', 10);
  const fatigueIndex = parseFloat(params.fatigueIndex || '0');
  const difficulty = parseInt(params.difficulty || '1', 10);
  const newDifficulty = parseInt(params.newDifficulty || '1', 10);
  const trialsCount = parseInt(params.trialsCount || '0', 10);
  const correctCount = parseInt(params.correctCount || '0', 10);
  const moduleId: ModuleType = params.moduleId === 'restore-horizon' ? 'restore-horizon' : 'find-exact';
  const mode: DifficultyMode = params.mode === 'fixed' ? 'fixed' : 'adaptive';
  const modeLabel = mode === 'fixed' ? 'Fixed' : 'Adaptive';

  const showAdaptiveDifficulty = mode === 'adaptive';
  const promoted = newDifficulty > difficulty;
  const demoted = newDifficulty < difficulty;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const isGood = accuracy >= 0.7;
  const isGreat = accuracy >= 0.9;
  const accentColor = isGreat ? Colors.accent : isGood ? Colors.secondary : Colors.warning;

  const moduleName = moduleId === 'find-exact' ? 'Найди точный' : 'Восстанови горизонт';

  const getFatigueLabel = () => {
    if (fatigueIndex < -0.2) return 'Ускорение';
    if (fatigueIndex > 0.3) return 'Усталость';
    return 'Стабильно';
  };

  const getFatigueIcon = () => {
    if (fatigueIndex > 0.3) return TrendingDown;
    if (fatigueIndex < -0.2) return TrendingUp;
    return Minus;
  };

  const FatigueIcon = getFatigueIcon();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.header}>
            <View style={[styles.trophyCircle, { backgroundColor: isGreat ? Colors.accentDim : Colors.secondaryDim }]}>
              <Trophy size={40} color={accentColor} />
            </View>
            <Text style={styles.title}>Сессия завершена</Text>
            <Text style={styles.subtitle}>{moduleName} · Уровень {difficulty}</Text>
            <Text style={styles.modeText}>Режим: {modeLabel}</Text>
          </View>

          <View style={styles.scoreCard}>
            <Text style={[styles.bigScore, { color: accentColor }]}>
              {formatAccuracy(accuracy)}
            </Text>
            <Text style={styles.scoreLabel}>
              {correctCount}/{trialsCount} верно
            </Text>
          </View>

          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <View style={[styles.metricIcon, { backgroundColor: Colors.accentDim }]}>
                <Target size={18} color={Colors.accent} />
              </View>
              <Text style={styles.metricValue}>{formatAccuracy(accuracy)}</Text>
              <Text style={styles.metricLabel}>Точность</Text>
            </View>

            <View style={styles.metricItem}>
              <View style={[styles.metricIcon, { backgroundColor: Colors.secondaryDim }]}>
                <Clock size={18} color={Colors.secondary} />
              </View>
              <Text style={styles.metricValue}>{formatMs(medianRt)}</Text>
              <Text style={styles.metricLabel}>Медиана вр.</Text>
            </View>

            <View style={styles.metricItem}>
              <View style={[styles.metricIcon, { backgroundColor: Colors.warningDim }]}>
                <Zap size={18} color={Colors.warning} />
              </View>
              <Text style={styles.metricValue}>{streakMax}</Text>
              <Text style={styles.metricLabel}>Лучш. серия</Text>
            </View>

            <View style={styles.metricItem}>
              <View style={[styles.metricIcon, { backgroundColor: Colors.tertiaryDim }]}>
                <FatigueIcon size={18} color={Colors.tertiary} />
              </View>
              <Text style={styles.metricValue}>{getFatigueLabel()}</Text>
              <Text style={styles.metricLabel}>Усталость</Text>
            </View>
          </View>

          {showAdaptiveDifficulty && (
            <View
              style={[
                styles.difficultyChange,
                {
                  backgroundColor: promoted
                    ? Colors.accentDim
                    : demoted
                      ? Colors.warningDim
                      : Colors.secondaryDim,
                },
              ]}
            >
              <View style={styles.difficultyRow}>
                {promoted ? (
                  <TrendingUp size={20} color={Colors.accent} />
                ) : demoted ? (
                  <TrendingDown size={20} color={Colors.warning} />
                ) : (
                  <Minus size={20} color={Colors.secondary} />
                )}
                <Text
                  style={[
                    styles.difficultyText,
                    {
                      color: promoted
                        ? Colors.accent
                        : demoted
                          ? Colors.warning
                          : Colors.secondary,
                    },
                  ]}
                >
                  {promoted
                    ? 'Уровень повышен!'
                    : demoted
                      ? 'Уровень снижен'
                      : 'Уровень сохранён'}
                </Text>
              </View>
              <Text style={styles.difficultyDetail}>
                {`Уровень ${difficulty} → Уровень ${newDifficulty}`}
              </Text>
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                router.replace({
                  pathname: (moduleId === 'find-exact' ? '/game/find-exact' : '/game/restore-horizon') as any,
                  params: {
                    mode,
                    level: String(difficulty),
                  },
                });
              }}
              testID="play-again"
            >
              <Brain size={20} color={Colors.background} />
              <Text style={styles.primaryButtonText}>Тренироваться снова</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.replace('/')}
              testID="go-home"
            >
              <Home size={20} color={Colors.text} />
              <Text style={styles.secondaryButtonText}>Главная</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    marginBottom: 24,
  },
  trophyCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  modeText: {
    marginTop: 6,
    fontSize: 13,
    color: Colors.textTertiary,
    fontWeight: '600' as const,
  },
  scoreCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  bigScore: {
    fontSize: 56,
    fontWeight: '800' as const,
    letterSpacing: -1,
  },
  scoreLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  metricItem: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  difficultyChange: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    alignItems: 'center',
  },
  difficultyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  difficultyText: {
    fontSize: 17,
    fontWeight: '700' as const,
  },
  difficultyDetail: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: Colors.accent,
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.background,
  },
  secondaryButton: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
  },
});
