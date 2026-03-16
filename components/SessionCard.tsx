import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Crosshair, RotateCcw, CheckCircle, XCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { SessionSummary } from '@/types/game';
import { formatMs, formatAccuracy } from '@/utils/scoring';

interface SessionCardProps {
  session: SessionSummary;
}

function SessionCardComponent({ session }: SessionCardProps) {
  const isGood = session.accuracy >= 0.7;
  const Icon = session.moduleId === 'find-exact' ? Crosshair : RotateCcw;
  const moduleColor = session.moduleId === 'find-exact' ? Colors.accent : Colors.secondary;
  const timeAgo = getTimeAgo(session.endedAt);

  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: session.moduleId === 'find-exact' ? Colors.accentDim : Colors.secondaryDim }]}>
        <Icon size={18} color={moduleColor} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>
          {session.moduleId === 'find-exact' ? 'Найди точный' : 'Восстанови горизонт'}
        </Text>
        <Text style={styles.meta}>
          Ур. {session.difficulty} · {timeAgo}
        </Text>
      </View>
      <View style={styles.stats}>
        <View style={styles.statRow}>
          {isGood ? (
            <CheckCircle size={14} color={Colors.success} />
          ) : (
            <XCircle size={14} color={Colors.error} />
          )}
          <Text style={[styles.statValue, { color: isGood ? Colors.success : Colors.error }]}>
            {formatAccuracy(session.accuracy)}
          </Text>
        </View>
        <Text style={styles.rtText}>{formatMs(session.medianRt)}</Text>
      </View>
    </View>
  );
}

function getTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Только что';
  if (minutes < 60) return `${minutes} мин назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  return `${days} дн назад`;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  meta: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  stats: {
    alignItems: 'flex-end',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  rtText: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
});

export default React.memo(SessionCardComponent);
