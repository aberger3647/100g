import React, { useEffect, useState } from 'react';
import { View, FlatList, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

interface Product {
  barcode: string;
  product_name: string;
  macros: {
    protein: number;
    carbohydrates: number;
    fat: number;
    energy_kcal: number;
  };
}

interface Comparison {
  id: string;
  items: Product[];
  date: string;
}

export default function HistoryScreen() {
  const [history, setHistory] = useState<Comparison[]>([]);
  const router = useRouter();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem('comparisons');
      console.log('Stored history:', stored);
      if (stored) {
        const parsed = JSON.parse(stored);
        setHistory(parsed);
        console.log('Parsed history:', parsed);
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
    <ThemedView style={styles.comparison}>
      <TouchableOpacity
        style={styles.comparisonContent}
        onPress={() => router.push(`/history/${item.id}`)}
      >
        <ThemedText type="subtitle">{item.items.map(i => i.product_name).join(' vs ')}</ThemedText>
        <ThemedText>{new Date(item.date).toLocaleString()}</ThemedText>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteComparison(item.id)}
      >
        <ThemedText>Delete</ThemedText>
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
    paddingTop: 40,
    paddingHorizontal: 20,
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
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  comparisonContent: {
    flex: 1,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    padding: 10,
    borderRadius: 5,
  },
});
