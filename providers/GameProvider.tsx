import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { SessionSummary, UserProgress, ModuleType, DifficultyMode } from '@/types/game';
import {
  DEFAULT_PROGRESS,
  clampDifficulty,
  normalizeProgressRecord,
} from '@/utils/progress-normalization';

const SESSIONS_KEY = 'surgicoach_sessions';
const PROGRESS_KEY = 'surgicoach_progress';
const STATE_KEY = 'surgicoach_state';

type PersistedGameState = {
  sessions: SessionSummary[];
  progress: Record<ModuleType, UserProgress>;
};

function parsePersistedState(raw: string | null): PersistedGameState | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as { sessions?: unknown; progress?: unknown };
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.sessions)) {
      return null;
    }

    return {
      sessions: parsed.sessions as SessionSummary[],
      progress: normalizeProgressRecord(parsed.progress),
    };
  } catch {
    return null;
  }
}

export const [GameProvider, useGame] = createContextHook(() => {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [progress, setProgress] = useState<Record<ModuleType, UserProgress>>(DEFAULT_PROGRESS);
  const sessionsRef = useRef<SessionSummary[]>([]);
  const progressRef = useRef<Record<ModuleType, UserProgress>>(DEFAULT_PROGRESS);
  const persistQueueRef = useRef(Promise.resolve());
  const isHydratedRef = useRef(false);

  const applyState = useCallback(
    (
      nextSessions: SessionSummary[],
      nextProgress: Record<ModuleType, UserProgress>
    ) => {
      sessionsRef.current = nextSessions;
      progressRef.current = nextProgress;
      setSessions(nextSessions);
      setProgress(nextProgress);
    },
    []
  );

  const persistState = useCallback(
    (
      nextSessions: SessionSummary[],
      nextProgress: Record<ModuleType, UserProgress>
    ) => {
      persistQueueRef.current = persistQueueRef.current
        .then(async () => {
          const snapshot = JSON.stringify({
            sessions: nextSessions,
            progress: nextProgress,
          });
          await AsyncStorage.setItem(STATE_KEY, snapshot);
        })
        .catch((e) => {
          console.log('Failed to persist game state:', e);
        });
    },
    []
  );

  const sessionsQuery = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      try {
        const snapshot = parsePersistedState(await AsyncStorage.getItem(STATE_KEY));
        if (snapshot) {
          return snapshot.sessions;
        }

        const stored = await AsyncStorage.getItem(SESSIONS_KEY);
        const parsed = stored ? JSON.parse(stored) : [];
        return Array.isArray(parsed) ? (parsed as SessionSummary[]) : [];
      } catch (e) {
        console.log('Failed to load sessions:', e);
        return [];
      }
    },
  });

  const progressQuery = useQuery({
    queryKey: ['progress'],
    queryFn: async () => {
      try {
        const snapshot = parsePersistedState(await AsyncStorage.getItem(STATE_KEY));
        if (snapshot) {
          return snapshot.progress;
        }

        const stored = await AsyncStorage.getItem(PROGRESS_KEY);
        return stored
          ? normalizeProgressRecord(JSON.parse(stored))
          : DEFAULT_PROGRESS;
      } catch (e) {
        console.log('Failed to load progress:', e);
        return DEFAULT_PROGRESS;
      }
    },
  });

  useEffect(() => {
    if (isHydratedRef.current) return;
    if (!sessionsQuery.isSuccess || !progressQuery.isSuccess) return;

    applyState(
      sessionsQuery.data ?? [],
      progressQuery.data ?? DEFAULT_PROGRESS
    );
    isHydratedRef.current = true;
  }, [
    sessionsQuery.isSuccess,
    progressQuery.isSuccess,
    sessionsQuery.data,
    progressQuery.data,
    applyState,
  ]);

  const addSession = useCallback(
    (session: SessionSummary) => {
      isHydratedRef.current = true;
      const nextSessions = [session, ...sessionsRef.current].slice(0, 50);
      const currentProgress = progressRef.current;
      const moduleProgress = currentProgress[session.moduleId];

      const recentAccuracies = [
        session.accuracy,
        ...(moduleProgress.recentAccuracies || []).slice(0, 9),
      ];

      const updatedProgress: UserProgress = {
        ...moduleProgress,
        totalSessions: moduleProgress.totalSessions + 1,
        bestAccuracy: Math.max(moduleProgress.bestAccuracy, session.accuracy),
        bestStreak: Math.max(moduleProgress.bestStreak, session.streakMax),
        avgReactionTime:
          moduleProgress.totalSessions === 0
            ? session.medianRt
            : (moduleProgress.avgReactionTime * moduleProgress.totalSessions + session.medianRt) /
              (moduleProgress.totalSessions + 1),
        lastPlayedAt: session.endedAt,
        recentAccuracies,
      };

      const nextProgress = { ...currentProgress, [session.moduleId]: updatedProgress };

      applyState(nextSessions, nextProgress);
      persistState(nextSessions, nextProgress);
    },
    [applyState, persistState]
  );

  const updateDifficulty = useCallback(
    (moduleId: ModuleType, newLevel: number) => {
      isHydratedRef.current = true;
      const normalizedLevel = clampDifficulty(newLevel);
      const currentProgress = progressRef.current;
      const moduleProgress = currentProgress[moduleId];
      const nextSelectedDifficulty =
        moduleProgress.difficultyMode === 'adaptive'
          ? normalizedLevel
          : moduleProgress.selectedDifficulty;

      const nextProgress = {
        ...currentProgress,
        [moduleId]: {
          ...moduleProgress,
          currentDifficulty: normalizedLevel,
          selectedDifficulty: nextSelectedDifficulty,
        },
      };
      applyState(sessionsRef.current, nextProgress);
      persistState(sessionsRef.current, nextProgress);
    },
    [applyState, persistState]
  );

  const updateDifficultySettings = useCallback(
    (
      moduleId: ModuleType,
      settings: { difficultyMode: DifficultyMode; selectedDifficulty: number }
    ) => {
      isHydratedRef.current = true;
      const selectedDifficulty = clampDifficulty(settings.selectedDifficulty);
      const currentProgress = progressRef.current;
      const moduleProgress = currentProgress[moduleId];
      const nextCurrentDifficulty =
        settings.difficultyMode === 'fixed'
          ? selectedDifficulty
          : moduleProgress.currentDifficulty;

      const nextProgress = {
        ...currentProgress,
        [moduleId]: {
          ...moduleProgress,
          difficultyMode: settings.difficultyMode,
          selectedDifficulty,
          currentDifficulty: nextCurrentDifficulty,
        },
      };
      applyState(sessionsRef.current, nextProgress);
      persistState(sessionsRef.current, nextProgress);
    },
    [applyState, persistState]
  );

  const resetState = useCallback(async () => {
    isHydratedRef.current = true;
    applyState([], DEFAULT_PROGRESS);

    persistQueueRef.current = persistQueueRef.current
      .then(async () => {
        await AsyncStorage.multiRemove([STATE_KEY, SESSIONS_KEY, PROGRESS_KEY]);
      })
      .catch((e) => {
        console.log('Failed to reset game state:', e);
      });

    await persistQueueRef.current;
  }, [applyState]);

  const getModuleSessions = useCallback(
    (moduleId: ModuleType) => sessions.filter((s) => s.moduleId === moduleId),
    [sessions]
  );

  const totalSessionsCount = useMemo(() => sessions.length, [sessions]);

  const overallAccuracy = useMemo(() => {
    if (sessions.length === 0) return 0;
    return sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length;
  }, [sessions]);

  const isLoading = !isHydratedRef.current && (sessionsQuery.isLoading || progressQuery.isLoading);

  return {
    sessions,
    progress,
    isLoading,
    addSession,
    updateDifficulty,
    updateDifficultySettings,
    resetState,
    getModuleSessions,
    totalSessionsCount,
    overallAccuracy,
  };
});
