import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, ProgressBar } from 'react-native-paper';

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
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.values}>
          {Math.round(current)}{unit} / {Math.round(target)}{unit}
        </Text>
      </View>
      <ProgressBar progress={progress} color={color} style={styles.bar} />
      <Text style={[styles.percentage, { color }]}>{percentage}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  values: {
    fontSize: 12,
    color: '#666',
  },
  bar: {
    height: 8,
    borderRadius: 4,
  },
  percentage: {
    fontSize: 11,
    marginTop: 2,
    textAlign: 'right',
  },
});
