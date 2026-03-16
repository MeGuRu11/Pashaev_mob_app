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

export const [GameProvider, useGame] = createContextHook(() => {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [progress, setProgress] = useState<Record<ModuleType, UserProgress>>(DEFAULT_PROGRESS);
  const sessionsRef = useRef<SessionSummary[]>([]);
  const progressRef = useRef<Record<ModuleType, UserProgress>>(DEFAULT_PROGRESS);
  const persistQueueRef = useRef(Promise.resolve());

  const persistState = useCallback(
    (
      nextSessions: SessionSummary[],
      nextProgress: Record<ModuleType, UserProgress>
    ) => {
      persistQueueRef.current = persistQueueRef.current
        .then(async () => {
          await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(nextSessions));
          await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(nextProgress));
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
        const stored = await AsyncStorage.getItem(SESSIONS_KEY);
        return stored ? (JSON.parse(stored) as SessionSummary[]) : [];
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
    if (sessionsQuery.data) {
      setSessions(sessionsQuery.data);
      sessionsRef.current = sessionsQuery.data;
    }
  }, [sessionsQuery.data]);

  useEffect(() => {
    if (progressQuery.data) {
      setProgress(progressQuery.data);
      progressRef.current = progressQuery.data;
    }
  }, [progressQuery.data]);

  const addSession = useCallback(
    (session: SessionSummary) => {
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

      sessionsRef.current = nextSessions;
      progressRef.current = nextProgress;
      setSessions(nextSessions);
      setProgress(nextProgress);
      persistState(nextSessions, nextProgress);
    },
    [persistState]
  );

  const updateDifficulty = useCallback(
    (moduleId: ModuleType, newLevel: number) => {
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
      progressRef.current = nextProgress;
      setProgress(nextProgress);
      persistState(sessionsRef.current, nextProgress);
    },
    [persistState]
  );

  const updateDifficultySettings = useCallback(
    (
      moduleId: ModuleType,
      settings: { difficultyMode: DifficultyMode; selectedDifficulty: number }
    ) => {
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
      progressRef.current = nextProgress;
      setProgress(nextProgress);
      persistState(sessionsRef.current, nextProgress);
    },
    [persistState]
  );

  const getModuleSessions = useCallback(
    (moduleId: ModuleType) => sessions.filter((s) => s.moduleId === moduleId),
    [sessions]
  );

  const totalSessionsCount = useMemo(() => sessions.length, [sessions]);

  const overallAccuracy = useMemo(() => {
    if (sessions.length === 0) return 0;
    return sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length;
  }, [sessions]);

  const isLoading = sessionsQuery.isLoading || progressQuery.isLoading;

  return {
    sessions,
    progress,
    isLoading,
    addSession,
    updateDifficulty,
    updateDifficultySettings,
    getModuleSessions,
    totalSessionsCount,
    overallAccuracy,
  };
});
