import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart3, Target, Zap, TrendingUp, Brain } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useGame } from '@/providers/GameProvider';
import MetricCard from '@/components/MetricCard';
import SessionCard from '@/components/SessionCard';
import { formatMs, formatAccuracy } from '@/utils/scoring';

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const { sessions, progress, totalSessionsCount, overallAccuracy } = useGame();

  const findExact = progress['find-exact'];
  const restoreHorizon = progress['restore-horizon'];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <BarChart3 size={24} color={Colors.accent} />
          <Text style={styles.title}>Аналитика</Text>
        </View>

        <View style={styles.overviewCards}>
          <MetricCard
            label="Всего сессий"
            value={`${totalSessionsCount}`}
            color={Colors.accent}
          />
          <View style={{ width: 10 }} />
          <MetricCard
            label="Общая точность"
            value={totalSessionsCount > 0 ? formatAccuracy(overallAccuracy) : '--'}
            color={Colors.secondary}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.moduleIcon, { backgroundColor: Colors.accentDim }]}>
              <Target size={16} color={Colors.accent} />
            </View>
            <Text style={styles.sectionTitle}>Найди точный</Text>
          </View>
          <View style={styles.statsRow}>
            <StatItem label="Уровень" value={`${findExact.currentDifficulty}`} color={Colors.accent} />
            <StatItem label="Сессии" value={`${findExact.totalSessions}`} color={Colors.textSecondary} />
            <StatItem label="Лучш. точн." value={findExact.totalSessions > 0 ? formatAccuracy(findExact.bestAccuracy) : '--'} color={Colors.accent} />
            <StatItem label="Ср. время" value={findExact.totalSessions > 0 ? formatMs(findExact.avgReactionTime) : '--'} color={Colors.secondary} />
          </View>
          {findExact.bestStreak > 0 && (
            <View style={styles.streakRow}>
              <Zap size={14} color={Colors.warning} />
              <Text style={styles.streakText}>Лучшая серия: {findExact.bestStreak}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.moduleIcon, { backgroundColor: Colors.secondaryDim }]}>
              <Brain size={16} color={Colors.secondary} />
            </View>
            <Text style={styles.sectionTitle}>Восстанови горизонт</Text>
          </View>
          <View style={styles.statsRow}>
            <StatItem label="Уровень" value={`${restoreHorizon.currentDifficulty}`} color={Colors.secondary} />
            <StatItem label="Сессии" value={`${restoreHorizon.totalSessions}`} color={Colors.textSecondary} />
            <StatItem label="Лучш. точн." value={restoreHorizon.totalSessions > 0 ? formatAccuracy(restoreHorizon.bestAccuracy) : '--'} color={Colors.secondary} />
            <StatItem label="Ср. время" value={restoreHorizon.totalSessions > 0 ? formatMs(restoreHorizon.avgReactionTime) : '--'} color={Colors.tertiary} />
          </View>
          {restoreHorizon.bestStreak > 0 && (
            <View style={styles.streakRow}>
              <Zap size={14} color={Colors.warning} />
              <Text style={styles.streakText}>Лучшая серия: {restoreHorizon.bestStreak}</Text>
            </View>
          )}
        </View>

        {sessions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>История сессий</Text>
            {sessions.slice(0, 20).map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </View>
        )}

        {sessions.length === 0 && (
          <View style={styles.emptyState}>
            <TrendingUp size={40} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>Пока нет данных</Text>
            <Text style={styles.emptyText}>Завершите тренировочные сессии, чтобы увидеть аналитику.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function StatItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  overviewCards: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  section: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  moduleIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  streakText: {
    fontSize: 13,
    color: Colors.warning,
    fontWeight: '600' as const,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 14,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
