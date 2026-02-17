import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

interface MacroBarProps {
  label: string;
  current: number;
  target: number;
  color: string;
  unit?: string;
}

export function MacroBar({ label, current, target, color, unit = 'g' }: MacroBarProps) {
  const progress = Math.min(current / target, 1);
  const percentage = Math.round(progress * 100);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.labelContainer}>
          <View style={[styles.colorDot, { backgroundColor: color }]} />
          <Text style={styles.label}>{label}</Text>
        </View>
        <Text style={styles.values}>
          <Text style={[styles.current, { color }]}>{Math.round(current)}</Text>
          <Text style={styles.separator}> / </Text>
          <Text style={styles.target}>{Math.round(target)}{unit}</Text>
        </Text>
      </View>
      <View style={styles.barContainer}>
        <View style={styles.barBackground}>
          <View
            style={[
              styles.barFill,
              {
                width: `${percentage}%`,
                backgroundColor: color,
              },
            ]}
          />
        </View>
        <Text style={[styles.percentage, { color }]}>{percentage}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  values: {
    fontSize: 13,
  },
  current: {
    fontWeight: '700',
  },
  separator: {
    color: '#999',
  },
  target: {
    color: '#666',
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barBackground: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentage: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 10,
    minWidth: 35,
    textAlign: 'right',
  },
});
