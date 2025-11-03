import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ItemsTable from '@/components/ItemsTable';

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

export default function ComparisonDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [comparison, setComparison] = useState<Comparison | null>(null);

  useEffect(() => {
    loadComparison();
  }, [id]);

  const loadComparison = async () => {
    try {
      const stored = await AsyncStorage.getItem('comparisons');
      if (stored) {
        const history: Comparison[] = JSON.parse(stored);
        const comp = history.find(c => c.id === id);
        if (comp) {
          setComparison(comp);
        } else {
          router.back(); // or show error
        }
      }
    } catch (error) {
      console.log('Error loading comparison:', error);
      router.back();
    }
  };

  if (!comparison) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Scanned Items</ThemedText>
      <ThemedText style={styles.dateText}>{new Date(comparison.date).toLocaleDateString() + ' ' + new Date(comparison.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</ThemedText>
      {comparison.items.length === 0 ? (
        <ThemedView style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>No items in this comparison</ThemedText>
        </ThemedView>
      ) : (
        <ItemsTable items={comparison.items} />
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
    marginBottom: 10,
    textAlign: 'center',
  },
  dateText: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
