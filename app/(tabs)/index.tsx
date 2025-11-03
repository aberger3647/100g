import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import ItemsTable from "@/components/ItemsTable";
import { Camera, CameraView } from "expo-camera";
import React, { useEffect, useRef, useState } from "react";
import {
Alert,
FlatList,
StyleSheet,
TouchableOpacity,
View,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

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

export default function HomeScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [scannedItems, setScannedItems] = useState<Product[]>([]);
  const cameraRef = useRef<CameraView>(null);
  const isProcessing = useRef(false);

  const saveComparison = async (items: Product[]) => {
    console.log('saveComparison called with items:', items.length);
    if (items.length === 0) return;
    try {
      const stored = await AsyncStorage.getItem('comparisons');
      const history = stored ? JSON.parse(stored) : [];
      const newComp = {
        id: Date.now().toString(),
        items,
        date: new Date().toISOString(),
      };
      history.push(newComp);
      await AsyncStorage.setItem('comparisons', JSON.stringify(history));
      console.log('Comparison saved:', newComp);
    } catch (error) {
      console.log('Error saving comparison:', error);
    }
  };

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    };

    getCameraPermissions();
  }, []);

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
        const macros = {
          protein: product.nutriments['proteins_100g'] || 0,
          carbohydrates: product.nutriments['carbohydrates_100g'] || 0,
          fat: product.nutriments['fat_100g'] || 0,
          energy_kcal: product.nutriments['energy-kcal_100g'] || 0,
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
            />
          )}
          <View style={styles.buttonContainer}>
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
          </View>
        </View>
      )}
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
});
