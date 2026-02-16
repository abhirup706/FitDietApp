import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, IconButton } from 'react-native-paper';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  color: string;
}

export function StatCard({ title, value, subtitle, icon, color }: StatCardProps) {
  return (
    <Card style={styles.card} mode="elevated">
      <Card.Content style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <IconButton icon={icon} iconColor={color} size={24} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.value}>{value}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 4,
    minWidth: 100,
  },
  content: {
    alignItems: 'center',
    padding: 12,
  },
  iconContainer: {
    borderRadius: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  value: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
});
