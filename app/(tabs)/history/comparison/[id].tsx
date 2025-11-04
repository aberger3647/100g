import React, { useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, TextInput, Modal, Keyboard, Alert } from 'react-native';
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
  const [showPriceDialog, setShowPriceDialog] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [weight, setWeight] = useState('');
  const [price, setPrice] = useState('');
  const [keyboardMargin, setKeyboardMargin] = useState(0);
  const weightInputRef = useRef<TextInput>(null);
  const priceInputRef = useRef<TextInput>(null);

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

  const handleRemove = (index: number) => {
    if (!comparison) return;
    const newItems = comparison.items.filter((_, i) => i !== index);
    const updatedComparison = { ...comparison, items: newItems };
    setComparison(updatedComparison);
    // Re-sort the new items
    if (sortKey) {
      const sorted = [...newItems].sort((a, b) => {
        let aVal, bVal;
        if (sortKey === 'carbs') {
          aVal = a.macros.carbohydrates;
          bVal = b.macros.carbohydrates;
        } else if (sortKey === 'calories') {
          aVal = a.macros.energy_kcal;
          bVal = b.macros.energy_kcal;
        } else {
          aVal = a.macros[sortKey as 'fat' | 'protein'];
          bVal = b.macros[sortKey as 'fat' | 'protein'];
        }
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      });
      setSortedItems(sorted);
    } else {
      setSortedItems([...newItems]);
    }
    // Save to storage
    AsyncStorage.getItem('comparisons').then((stored) => {
      if (stored) {
        const history: Comparison[] = JSON.parse(stored);
        const idx = history.findIndex(c => c.id === id);
        if (idx !== -1) {
          if (newItems.length === 0) {
            // Remove the comparison if no items left
            history.splice(idx, 1);
            AsyncStorage.setItem('comparisons', JSON.stringify(history));
            router.back(); // Navigate back since comparison is deleted
          } else {
            history[idx] = updatedComparison;
            AsyncStorage.setItem('comparisons', JSON.stringify(history));
          }
        }
      }
    });
  };

  const handleAddPrice = (index: number) => {
    setEditingIndex(index);
    setWeight('');
    setPrice('');
    setShowPriceDialog(true);
  };

  const handleCalculatePrice = () => {
    Keyboard.dismiss();
    const w = parseFloat(weight);
    const p = parseFloat(price);
    if (isNaN(w) || isNaN(p) || w <= 0 || p <= 0) {
      Alert.alert('Invalid Input', 'Please enter valid weight and price.');
      return;
    }
    const pricePer100g = (p / w) * 100;
    if (comparison && editingIndex !== null) {
      const newItems = [...comparison.items];
      newItems[editingIndex] = { ...newItems[editingIndex], pricePer100g };
      const updatedComparison = { ...comparison, items: newItems };
      setComparison(updatedComparison);
      // Update sortedItems
      if (sortKey) {
        const sorted = [...newItems].sort((a, b) => {
          let aVal, bVal;
          if (sortKey === 'carbs') {
            aVal = a.macros.carbohydrates;
            bVal = b.macros.carbohydrates;
          } else if (sortKey === 'calories') {
            aVal = a.macros.energy_kcal;
            bVal = b.macros.energy_kcal;
          } else {
            aVal = a.macros[sortKey as 'fat' | 'protein'];
            bVal = b.macros[sortKey as 'fat' | 'protein'];
          }
          return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        });
        setSortedItems(sorted);
      } else {
        setSortedItems([...newItems]);
      }
      // Save to storage
      AsyncStorage.getItem('comparisons').then((stored) => {
        if (stored) {
          const history: Comparison[] = JSON.parse(stored);
          const idx = history.findIndex(c => c.id === id);
          if (idx !== -1) {
            history[idx] = updatedComparison;
            AsyncStorage.setItem('comparisons', JSON.stringify(history));
          }
        }
      });
    }
    setShowPriceDialog(false);
  };

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
        <ItemsTable items={sortedItems} onRemove={handleRemove} onSort={handleSort} onAddPrice={handleAddPrice} currentSortKey={sortKey} currentSortOrder={sortOrder} />
      )}
      <TouchableOpacity style={styles.editButton} onPress={async () => {
        await AsyncStorage.setItem('editingComparisonId', id);
        router.push('/');
      }}>
        <ThemedText style={styles.editButtonText}>Scan Items</ThemedText>
      </TouchableOpacity>
      <Modal visible={showPriceDialog} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText type="subtitle" style={styles.modalTitle}>Add Price Information</ThemedText>
            <ThemedText style={styles.label}>Net Weight (g):</ThemedText>
            <TextInput
              ref={weightInputRef}
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
              placeholder="e.g. 500"
              returnKeyType="next"
              onSubmitEditing={() => priceInputRef.current?.focus()}
            />
            <ThemedText style={styles.label}>Price ($):</ThemedText>
            <TextInput
              ref={priceInputRef}
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              placeholder="e.g. 3.99"
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
            <ThemedText style={styles.orText}>OR</ThemedText>
            <TouchableOpacity style={styles.disabledButton}>
              <ThemedText style={styles.disabledText}>Take Photo (Disabled)</ThemedText>
            </TouchableOpacity>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={() => { Keyboard.dismiss(); setShowPriceDialog(false); }}>
                <ThemedText style={styles.modalButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.calculateButton]} onPress={handleCalculatePrice}>
                <ThemedText style={[styles.modalButtonText, styles.calculateText]}>Calculate</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  disabledText: {
    color: '#ccc',
  },
  orText: {
    textAlign: 'center',
    marginVertical: 10,
    fontWeight: 'bold',
  },
  label: {
    marginTop: 10,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
  },
  calculateButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  calculateText: {
    color: 'white',
  },
});
