import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import ItemsTable from "@/components/ItemsTable";
import { Camera, CameraView } from "expo-camera";
import React, { useEffect, useRef, useState } from "react";
import {
Alert,
StyleSheet,
TouchableOpacity,
View,
TextInput,
Modal,
Keyboard,
KeyboardAvoidingView,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, Comparison } from '@/types';

export default function HomeScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [scannedItems, setScannedItems] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPriceDialog, setShowPriceDialog] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [weight, setWeight] = useState('');
  const [price, setPrice] = useState('');
  const cameraRef = useRef<CameraView>(null);
  const isProcessing = useRef(false);
  const weightInputRef = useRef<TextInput>(null);
  const priceInputRef = useRef<TextInput>(null);

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
    setScannedItems(prev => prev.map((item, i) =>
      i === editingIndex ? { ...item, pricePer100g } : item
    ));
    setShowPriceDialog(false);
  };

  const saveComparison = async (items: Product[]) => {
    console.log('saveComparison called with items:', items.length);
    if (items.length === 0) return;
    try {
      const stored = await AsyncStorage.getItem('comparisons');
      let history = (stored ? JSON.parse(stored) : []) as Comparison[];
      if (editingId) {
        // update existing
        const index = history.findIndex(c => c.id === editingId);
        if (index !== -1) {
          history[index] = { ...history[index], items, date: new Date().toISOString() };
          console.log('Comparison updated:', editingId);
        }
        setEditingId(null);
      } else {
        const newComp = {
          id: Date.now().toString(),
          items,
          date: new Date().toISOString(),
        };
        history.push(newComp);
        console.log('Comparison saved:', newComp);
      }
      await AsyncStorage.setItem('comparisons', JSON.stringify(history));
    } catch (error) {
      console.log('Error saving comparison:', error);
    }
  };

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    };

    const checkEditing = async () => {
      const editingIdStored = await AsyncStorage.getItem('editingComparisonId');
      if (editingIdStored) {
        const stored = await AsyncStorage.getItem('comparisons');
        if (stored) {
          const history = JSON.parse(stored) as Comparison[];
          const comp = history.find(c => c.id === editingIdStored);
          if (comp) {
            setScannedItems(comp.items);
            setEditingId(editingIdStored);
            setIsScanning(false);
          }
        }
        await AsyncStorage.removeItem('editingComparisonId');
      }
    };

    getCameraPermissions();
    checkEditing();
  }, []);

  useEffect(() => {
    if (showPriceDialog) {
      setTimeout(() => weightInputRef.current?.focus(), 100);
    }
  }, [showPriceDialog]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (isProcessing.current) return;
    console.log("Barcode scanned:", data);
    isProcessing.current = true;
    if (scannedItems.some(item => item.barcode === data)) {
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
        setScannedItems((prev) => [...prev, newItem]);
        console.log("Item added:", newItem);
        Alert.alert(
        "Item Scanned",
        `Scanned: ${product.product_name || 'Unknown'}
Scan another item?`,
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
            style={StyleSheet.absoluteFillObject}
          />
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setIsScanning(false)}
          >
            <ThemedText style={styles.backButtonText}>View Current Comparison</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.scannedContainer}>
          <ThemedText type="title" style={styles.title}>Scanned Items</ThemedText>
          {scannedItems.length === 0 ? (
            <ThemedView style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>Scan an item to begin comparing</ThemedText>
            </ThemedView>
          ) : (
            <ItemsTable
              items={scannedItems}
              onRemove={(index) => setScannedItems((prev) => prev.filter((_, i) => i !== index))}
              onAddPrice={handleAddPrice}
            />
          )}
          <View style={styles.buttonContainer}>
            {editingId ? (
              <>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => { setIsScanning(true); isProcessing.current = false; }}
                >
                  <ThemedText style={styles.buttonText}>Scan to Add Item</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => {
                    saveComparison(scannedItems);
                    setScannedItems([]);
                    setIsScanning(true);
                    isProcessing.current = false;
                  }}
                >
                  <ThemedText style={styles.buttonText}>Save Changes</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setScannedItems([]);
                    setEditingId(null);
                    setIsScanning(true);
                    isProcessing.current = false;
                  }}
                >
                  <ThemedText style={styles.buttonText}>Cancel Edit</ThemedText>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => { setIsScanning(true); isProcessing.current = false; }}
                >
                  <ThemedText style={styles.buttonText}>
                    {scannedItems.length === 0 ? "Scan an item" : "Scan another item"}
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => {
                    saveComparison(scannedItems);
                    setScannedItems([]);
                    setIsScanning(true);
                    isProcessing.current = false;
                  }}
                >
                  <ThemedText style={styles.buttonText}>New Comparison</ThemedText>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}
      <Modal visible={showPriceDialog} transparent animationType="fade">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior="padding">
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
        </KeyboardAvoidingView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scannedContainer: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
    marginVertical: 5,
  },
  cancelButton: {
    backgroundColor: "#FF3B30",
  },
  buttonText: {
    color: "white",
  },
  cameraContainer: {
    flex: 1,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 10,
    borderRadius: 5,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
  },
  title: {
    marginBottom: 20,
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
    flexWrap: "wrap",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
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
