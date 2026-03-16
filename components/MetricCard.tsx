import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';

interface MetricCardProps {
  label: string;
  value: string;
  color?: string;
  colorDim?: string;
  compact?: boolean;
}

function MetricCardComponent({
  label,
  value,
  color = Colors.accent,
  colorDim = Colors.accentDim,
  compact = false,
}: MetricCardProps) {
  if (compact) {
    return (
      <View style={styles.compactCard}>
        <Text style={[styles.compactValue, { color }]}>{value}</Text>
        <Text style={styles.compactLabel}>{label}</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={[styles.indicator, { backgroundColor: color }]} />
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, { color }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    flex: 1,
  },
  indicator: {
    width: 4,
    height: 32,
    borderRadius: 2,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 22,
    fontWeight: '700' as const,
  },
  compactCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    flex: 1,
  },
  compactValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  compactLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
});

export default React.memo(MetricCardComponent);
