import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ItemsTable from '@/components/ItemsTable';
import { Product, Comparison } from '@/types';

export default function ComparisonDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [sortedItems, setSortedItems] = useState<Product[]>([]);
  const [sortKey, setSortKey] = useState<'carbs' | 'fat' | 'protein' | 'calories' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    loadComparison();
  }, [id]);

  useEffect(() => {
    if (comparison) {
      setSortedItems([...comparison.items]);
      setSortKey(null);
      setSortOrder('asc');
    }
  }, [comparison]);

  const handleSort = (key: 'carbs' | 'fat' | 'protein' | 'calories') => {
    let order: 'asc' | 'desc' = 'asc';
    if (sortKey === key) {
      order = sortOrder === 'asc' ? 'desc' : 'asc';
    }
    setSortKey(key);
    setSortOrder(order);

    const sorted = [...sortedItems].sort((a, b) => {
      let aVal, bVal;
      if (key === 'carbs') {
        aVal = a.macros.carbohydrates;
        bVal = b.macros.carbohydrates;
      } else if (key === 'calories') {
        aVal = a.macros.energy_kcal;
        bVal = b.macros.energy_kcal;
      } else {
        aVal = a.macros[key as 'fat' | 'protein'];
        bVal = b.macros[key as 'fat' | 'protein'];
      }
      return order === 'asc' ? aVal - bVal : bVal - aVal;
    });
    setSortedItems(sorted);
  };

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
      <ThemedText type="title" style={styles.title}>{new Date(comparison.date).toLocaleDateString() + ' ' + new Date(comparison.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</ThemedText>
      {comparison.items.length === 0 ? (
        <ThemedView style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>No items in this comparison</ThemedText>
        </ThemedView>
      ) : (
        <ItemsTable items={sortedItems} onSort={handleSort} currentSortKey={sortKey} currentSortOrder={sortOrder} />
      )}
      <TouchableOpacity style={styles.editButton} onPress={async () => {
        await AsyncStorage.setItem('editingComparisonId', id);
        router.push('/');
      }}>
        <ThemedText style={styles.editButtonText}>Edit Comparison</ThemedText>
      </TouchableOpacity>
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
  editButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
  },
});
