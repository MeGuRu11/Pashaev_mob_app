import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Activity, Brain } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { MODULE_INFO } from '@/constants/game';
import { useGame } from '@/providers/GameProvider';
import ModuleCard from '@/components/ModuleCard';
import MetricCard from '@/components/MetricCard';
import SessionCard from '@/components/SessionCard';
import { formatAccuracy, formatMs } from '@/utils/scoring';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { progress, sessions, totalSessionsCount, overallAccuracy } = useGame();

  const recentSessions = sessions.slice(0, 5);
  const totalRtSessions =
    progress['find-exact'].totalSessions + progress['restore-horizon'].totalSessions;
  const averageReactionTime =
    totalRtSessions > 0
      ? (progress['find-exact'].avgReactionTime * progress['find-exact'].totalSessions +
          progress['restore-horizon'].avgReactionTime * progress['restore-horizon'].totalSessions) /
        totalRtSessions
      : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>SurgiCoach</Text>
              <Text style={styles.subtitle}>Когнитивная тренировочная платформа</Text>
            </View>
            <View style={styles.headerIcon}>
              <Brain size={28} color={Colors.accent} />
            </View>
          </View>
        </View>

        <View style={styles.quickStats}>
          <MetricCard
            label="Сессии"
            value={`${totalSessionsCount}`}
            color={Colors.accent}
            compact
          />
          <View style={{ width: 10 }} />
          <MetricCard
            label="Точность"
            value={totalSessionsCount > 0 ? formatAccuracy(overallAccuracy) : '--'}
            color={Colors.secondary}
            compact
          />
          <View style={{ width: 10 }} />
          <MetricCard
            label="Ср. время"
            value={
              totalRtSessions > 0 ? formatMs(averageReactionTime) : '--'
            }
            color={Colors.tertiary}
            compact
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Activity size={18} color={Colors.accent} />
            <Text style={styles.sectionTitle}>Модули тренировки</Text>
          </View>

          <ModuleCard
            moduleId="find-exact"
            title={MODULE_INFO['find-exact'].title}
            subtitle={MODULE_INFO['find-exact'].subtitle}
            color={MODULE_INFO['find-exact'].color}
            colorDim={MODULE_INFO['find-exact'].colorDim}
            progress={progress['find-exact']}
            onPress={() =>
              router.push({
                pathname: '/game/setup' as any,
                params: { moduleId: 'find-exact' },
              })
            }
          />

          <ModuleCard
            moduleId="restore-horizon"
            title={MODULE_INFO['restore-horizon'].title}
            subtitle={MODULE_INFO['restore-horizon'].subtitle}
            color={MODULE_INFO['restore-horizon'].color}
            colorDim={MODULE_INFO['restore-horizon'].colorDim}
            progress={progress['restore-horizon']}
            onPress={() =>
              router.push({
                pathname: '/game/setup' as any,
                params: { moduleId: 'restore-horizon' },
              })
            }
          />
        </View>

        {recentSessions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Недавняя активность</Text>
            {recentSessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </View>
        )}

        {recentSessions.length === 0 && (
          <View style={styles.emptyState}>
            <Brain size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>Готовы к тренировке?</Text>
            <Text style={styles.emptyText}>
              Выберите модуль выше, чтобы начать первую когнитивную тренировку.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickStats: {
    flexDirection: 'row',
    marginBottom: 28,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
