import React, { useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, Alert, Keyboard, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import PriceDialog from '@/components/PriceDialog';
import { Camera, CameraView } from "expo-camera";
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
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const isProcessing = useRef(false);

  useEffect(() => {
    loadComparison();
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    };
    getCameraPermissions();
  }, [id]);

  useEffect(() => {
    if (comparison) {
      setSortedItems([...comparison.items]);
      setSortKey(null);
      setSortOrder('asc');
    }
  }, [comparison]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (isProcessing.current || !comparison) return;
    console.log("Barcode scanned:", data);
    isProcessing.current = true;
    if (comparison.items.some(item => item.barcode === data)) {
      Alert.alert("Duplicate", "This item has already been scanned.", [{ text: "OK", onPress: () => { isProcessing.current = false; } }]);
      return;
    }
    try {
      console.log("Fetching data for barcode:", data);
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${data}.json`
      );
      console.log("Response status:", response.status);
      const json = await response.json();
      console.log("API response:", json);
      if (json.status === 1) {
        const product = json.product;
        const nutriments = product.nutriments || {};
        console.log('Nutriments:', nutriments);
        const macros = {
          protein: nutriments['proteins_100g'] || 0,
          carbohydrates: nutriments['carbohydrates_100g'] || 0,
          fat: nutriments['fat_100g'] || 0,
          energy_kcal: nutriments['energy-kcal_100g'] || 0,
        };
        console.log("Macros:", macros);
        const newItem: Product = {
          barcode: data,
          product_name: product.product_name || "Unknown",
          macros,
        };
        const newItems = [...comparison.items, newItem];
        const updatedComparison = { ...comparison, items: newItems };
        setComparison(updatedComparison);
        setSortedItems([...newItems]); // Update sortedItems
        setSortKey(null);
        setSortOrder('asc');
        // Save to storage
        const stored = await AsyncStorage.getItem('comparisons');
        if (stored) {
          const history: Comparison[] = JSON.parse(stored);
          const idx = history.findIndex(c => c.id === id);
          if (idx !== -1) {
            history[idx] = updatedComparison;
            await AsyncStorage.setItem('comparisons', JSON.stringify(history));
          }
        }
        console.log("Item added:", newItem);
        Alert.alert(
          "Item Scanned",
          `Scanned: ${product.product_name || 'Unknown'}\nScan another item?`,
          [
            { text: "No", onPress: () => { setIsScanning(false); isProcessing.current = false; } },
            { text: "Yes", onPress: () => { isProcessing.current = false; }, style: "default" },
          ]
        );
      } else {
        console.log("Product not found");
        Alert.alert(
          "Product not found",
          "Could not find product data for this barcode.",
          [{ text: "OK", onPress: () => { isProcessing.current = false; } }]
        );
      }
    } catch (error) {
      console.log("Fetch error:", error);
      Alert.alert("Error", "Failed to fetch product data.", [{ text: "OK", onPress: () => { isProcessing.current = false; } }]);
    }
  };

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
    const item = sortedItems[index];
    if (item.pricePer100g && !item.weight) {
      setWeight('100');
      setPrice(item.pricePer100g.toFixed(2));
    } else {
      setWeight(item.weight || '');
      setPrice(item.price || '');
    }
    setShowPriceDialog(true);
  };

  const handleCalculatePrice = (w: string, p: string) => {
    Keyboard.dismiss();
    const weightNum = parseFloat(w);
    const priceNum = parseFloat(p);
    if (isNaN(weightNum) || isNaN(priceNum) || weightNum <= 0 || priceNum <= 0) {
      Alert.alert('Invalid Input', 'Please enter valid weight and price.');
      return;
    }
    const pricePer100g = (priceNum / weightNum) * 100;
    if (comparison && editingIndex !== null) {
      const itemToUpdate = sortedItems[editingIndex];
      const actualIndex = comparison.items.findIndex(item => item.barcode === itemToUpdate.barcode);
      if (actualIndex !== -1) {
        const newItems = [...comparison.items];
        newItems[actualIndex] = { ...newItems[actualIndex], pricePer100g, weight: w, price: p };
        const updatedComparison = { ...comparison, items: newItems };
        setComparison(updatedComparison);
        setWeight(w);
        setPrice(p);
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

  if (hasPermission === null) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Requesting camera permission...</ThemedText>
      </ThemedView>
    );
  }
  if (hasPermission === false) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>No access to camera</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {isScanning ? (
        <View style={styles.cameraContainer}>
          <CameraView
          ref={cameraRef}
          onBarcodeScanned={isScanning ? handleBarCodeScanned : undefined}
          onCameraReady={() => {
          console.log('Camera ready');
          if (cameraRef.current) {
          const features = cameraRef.current.getSupportedFeatures();
          console.log('Supported features:', features);
          }
          }}
          onMountError={(error) => console.log('Camera mount error:', error)}
          barcodeScannerSettings={{
          barcodeTypes: [
          "aztec",
          "codabar",
          "code128",
          "code39",
          "code93",
          "datamatrix",
          "ean13",
          "ean8",
          "itf14",
          "pdf417",
          "upc_a",
          "upc_e",
          "qr",
          ],
          }}
          responsiveOrientation={true}
            style={StyleSheet.absoluteFillObject}
          />
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setIsScanning(false)}
          >
            <ThemedText style={styles.backButtonText}>Back to Comparison</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ThemedText type="title" style={styles.title}>{new Date(comparison.date).toLocaleDateString() + ' ' + new Date(comparison.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</ThemedText>
          {comparison.items.length === 0 ? (
            <ThemedView style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>No items in this comparison</ThemedText>
            </ThemedView>
          ) : (
            <ItemsTable items={sortedItems} onRemove={handleRemove} onSort={handleSort} onAddPrice={handleAddPrice} currentSortKey={sortKey} currentSortOrder={sortOrder} />
          )}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.editButton} onPress={() => setIsScanning(true)}>
              <ThemedText style={styles.editButtonText}>Add an Item</ThemedText>
            </TouchableOpacity>
          </View>
        </>
      )}
      <PriceDialog
        visible={showPriceDialog}
        onClose={() => setShowPriceDialog(false)}
        onCalculate={handleCalculatePrice}
        initialWeight={weight}
        initialPrice={price}
        isEditing={editingIndex !== null && !!sortedItems[editingIndex]?.pricePer100g}
      />
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
    width: 200,
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  cameraContainer: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 5,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
  },

});
