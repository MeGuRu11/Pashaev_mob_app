import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Play, SlidersHorizontal } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { FIND_EXACT_DIFFICULTIES, HORIZON_DIFFICULTIES, MODULE_INFO } from '@/constants/game';
import { useGame } from '@/providers/GameProvider';
import { DifficultyMode, ModuleType } from '@/types/game';
import { formatMs } from '@/utils/scoring';
import { clampDifficulty } from '@/utils/progress-normalization';

const LEVELS = [1, 2, 3, 4, 5];

export default function GameSetupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ moduleId?: string }>();
  const { progress, updateDifficultySettings } = useGame();

  const moduleId: ModuleType | null =
    params.moduleId === 'find-exact' || params.moduleId === 'restore-horizon'
      ? params.moduleId
      : null;
  const resolvedModuleId: ModuleType = moduleId ?? 'find-exact';

  useEffect(() => {
    if (!moduleId) {
      router.replace('/');
    }
  }, [moduleId, router]);

  const moduleProgress = progress[resolvedModuleId];
  const configs =
    resolvedModuleId === 'find-exact' ? FIND_EXACT_DIFFICULTIES : HORIZON_DIFFICULTIES;
  const maxLevel = configs.length;

  const [mode, setMode] = useState<DifficultyMode>(moduleProgress.difficultyMode);
  const [level, setLevel] = useState<number>(clampDifficulty(moduleProgress.selectedDifficulty));

  useEffect(() => {
    setMode(moduleProgress.difficultyMode);
    setLevel(clampDifficulty(moduleProgress.selectedDifficulty));
  }, [moduleProgress.difficultyMode, moduleProgress.selectedDifficulty]);

  const selectedLevel = Math.min(maxLevel, clampDifficulty(level));
  const config = useMemo(
    () => configs[Math.max(0, selectedLevel - 1)],
    [configs, selectedLevel]
  );
  const isFindExact = resolvedModuleId === 'find-exact';
  const moduleInfo = MODULE_INFO[resolvedModuleId];
  const findExactConfig = isFindExact
    ? FIND_EXACT_DIFFICULTIES[Math.max(0, selectedLevel - 1)]
    : null;
  const horizonConfig = !isFindExact
    ? HORIZON_DIFFICULTIES[Math.max(0, selectedLevel - 1)]
    : null;

  if (!moduleId) {
    return null;
  }

  const startSession = () => {
    updateDifficultySettings(resolvedModuleId, {
      difficultyMode: mode,
      selectedDifficulty: selectedLevel,
    });

    router.replace({
      pathname: (isFindExact ? '/game/find-exact' : '/game/restore-horizon') as any,
      params: {
        mode,
        level: String(selectedLevel),
      },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={18} color={Colors.textSecondary} />
          <Text style={styles.backText}>Назад</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <SlidersHorizontal size={20} color={moduleInfo.color} />
          </View>
          <Text style={styles.title}>{moduleInfo.title}</Text>
          <Text style={styles.subtitle}>{moduleInfo.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Режим сложности</Text>
          <View style={styles.modeRow}>
            <ModeChip
              label="Адаптивный"
              selected={mode === 'adaptive'}
              onPress={() => setMode('adaptive')}
            />
            <ModeChip
              label="Фиксированный"
              selected={mode === 'fixed'}
              onPress={() => setMode('fixed')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Уровень</Text>
          <View style={styles.levelRow}>
            {LEVELS.slice(0, maxLevel).map((value) => (
              <LevelChip
                key={`level-${value}`}
                value={value}
                selected={selectedLevel === value}
                onPress={() => setLevel(value)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Параметры уровня</Text>
          <View style={styles.previewCard}>
            <PreviewItem label="Сетка" value={`${config.gridSize}×${config.gridSize}`} />
            <PreviewItem label="Время на задание" value={formatMs(config.timeLimit)} />
            <PreviewItem label="Количество заданий" value={`${config.trialsCount}`} />
            {isFindExact ? (
              <>
                <PreviewItem
                  label="Похожие варианты"
                  value={`${findExactConfig?.nearMissCount ?? 0}`}
                />
                <PreviewItem
                  label="Степень похожести"
                  value={`${Math.round((findExactConfig?.nearMissStrengthMultiplier ?? 0) * 100)}%`}
                />
              </>
            ) : (
              <>
                <PreviewItem
                  label="Мин. шагов для решения"
                  value={`${horizonConfig?.minTransformSteps ?? 1}`}
                />
                <PreviewItem label="Лимит ходов" value={`${horizonConfig?.maxMoves ?? 1}`} />
              </>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.note}>
            {mode === 'adaptive'
              ? 'Адаптивный режим изменяет текущий уровень после каждой сессии.'
              : 'Фиксированный режим сохраняет выбранный уровень без автоподстройки.'}
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity style={styles.startButton} onPress={startSession} testID="start-session">
          <Play size={18} color={Colors.background} />
          <Text style={styles.startButtonText}>Начать</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ModeChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.modeChip, selected && styles.modeChipSelected]}
      onPress={onPress}
    >
      <Text style={[styles.modeChipText, selected && styles.modeChipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

function LevelChip({
  value,
  selected,
  onPress,
}: {
  value: number;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.levelChip, selected && styles.levelChipSelected]}
      onPress={onPress}
    >
      <Text style={[styles.levelChipText, selected && styles.levelChipTextSelected]}>{value}</Text>
    </TouchableOpacity>
  );
}

function PreviewItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.previewItem}>
      <Text style={styles.previewLabel}>{label}</Text>
      <Text style={styles.previewValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 140,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    marginBottom: 12,
  },
  backText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  header: {
    marginBottom: 20,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    fontWeight: '700' as const,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modeChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    backgroundColor: Colors.card,
  },
  modeChipSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentDim,
  },
  modeChipText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  modeChipTextSelected: {
    color: Colors.accent,
  },
  levelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  levelChip: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelChipSelected: {
    borderColor: Colors.secondary,
    backgroundColor: Colors.secondaryDim,
  },
  levelChipText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  levelChipTextSelected: {
    color: Colors.secondary,
  },
  previewCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  previewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  previewValue: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  note: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  startButton: {
    backgroundColor: Colors.accent,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  startButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '800' as const,
  },
});
