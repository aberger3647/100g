import React, { useCallback, useState } from 'react';
import { View, FlatList, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Product, Comparison } from '@/types';

export default function HistoryScreen() {
  const [history, setHistory] = useState<Comparison[]>([]);
  const router = useRouter();
  const comparisonBackground = useThemeColor({light: '#f9f9f9', dark: '#1a1a1a'}, 'background');

  useFocusEffect(useCallback(() => {
    loadHistory();
  }, []));

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem('comparisons');
      console.log('Stored history:', stored);
      if (stored) {
        const parsed = JSON.parse(stored);
        const sorted = parsed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setHistory(sorted);
        console.log('Parsed and sorted history:', sorted);
      } else {
        console.log('No stored history');
      }
    } catch (error) {
      console.log('Error loading history:', error);
    }
  };

  const deleteComparison = async (id: string) => {
    Alert.alert(
      'Delete Comparison',
      'Are you sure you want to delete this comparison?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const newHistory = history.filter(comp => comp.id !== id);
            setHistory(newHistory);
            await AsyncStorage.setItem('comparisons', JSON.stringify(newHistory));
          },
        },
      ]
    );
  };

  const renderComparison = ({ item }: { item: Comparison }) => (
    <ThemedView style={[styles.comparison, {backgroundColor: comparisonBackground}]}>
      <TouchableOpacity
        style={styles.comparisonContent}
        onPress={() => router.push(`/history/comparison/${item.id}`)}
      >
        <ThemedText type="subtitle" style={{marginBottom: 5}}>{item.items.map(i => i.product_name).join(' vs ')}</ThemedText>
        <ThemedText>{new Date(item.date).toLocaleDateString() + ' ' + new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</ThemedText>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteComparison(item.id)}
      >
        <ThemedText style={styles.deleteButtonText}>×</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Comparison History</ThemedText>
      {history.length === 0 ? (
        <ThemedText>No past comparisons.</ThemedText>
      ) : (
        <FlatList
          data={history}
          renderItem={renderComparison}
          keyExtractor={(item) => item.id}
          style={styles.list}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  comparison: {
    padding: 15,
    marginVertical: 5,
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  comparisonContent: {
    flex: 1,
  },
  deleteButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'gray',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
