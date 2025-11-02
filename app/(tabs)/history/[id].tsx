import React, { useEffect, useState } from 'react';
import { FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

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

  const renderItem = ({ item }: { item: Product }) => (
    <ThemedView style={styles.item}>
      <ThemedText type="subtitle">{item.product_name}</ThemedText>
      <ThemedText>Protein: {item.macros.protein}g</ThemedText>
      <ThemedText>Carbs: {item.macros.carbohydrates}g</ThemedText>
      <ThemedText>Fat: {item.macros.fat}g</ThemedText>
      <ThemedText>Calories: {item.macros.energy_kcal} kcal</ThemedText>
    </ThemedView>
  );

  if (!comparison) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Comparison from {new Date(comparison.date).toLocaleString()}
      </ThemedText>
      <FlatList
        data={comparison.items}
        renderItem={renderItem}
        keyExtractor={(item) => item.barcode}
        numColumns={2}
        style={styles.list}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
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
  item: {
    flex: 1,
    padding: 10,
    margin: 5,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
  },
});
