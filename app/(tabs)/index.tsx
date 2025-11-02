import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Camera, CameraView } from "expo-camera";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

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
  const [scanned, setScanned] = useState(false);
  const [scannedItems, setScannedItems] = useState<Product[]>([]);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    };

    getCameraPermissions();
  }, []);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    console.log("Barcode scanned:", data);
    setScanned(true);
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
          protein: product.nutriments.proteins_100g || 0,
          carbohydrates: product.nutriments.carbohydrates_100g || 0,
          fat: product.nutriments.fat_100g || 0,
          energy_kcal: product.nutriments.energy_kcal_100g || 0,
        };
        console.log("Macros:", macros);
        const newItem: Product = {
          barcode: data,
          product_name: product.product_name || "Unknown",
          macros,
        };
        setScannedItems((prev) => [...prev, newItem]);
        console.log("Item added:", newItem);
      } else {
        console.log("Product not found");
        Alert.alert(
          "Product not found",
          "Could not find product data for this barcode."
        );
      }
    } catch (error) {
      console.log("Fetch error:", error);
      Alert.alert("Error", "Failed to fetch product data.");
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
      {!scanned ? (
        <CameraView
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          onCameraReady={() => console.log('Camera ready')}
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
      ) : (
        <View style={styles.scannedContainer}>
          <FlatList
            data={scannedItems}
            renderItem={renderItem}
            keyExtractor={(item) => item.barcode}
            style={styles.list}
          />
          <TouchableOpacity
            style={styles.button}
            onPress={() => setScanned(false)}
          >
            <ThemedText>Scan Again</ThemedText>
          </TouchableOpacity>
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
    padding: 20,
  },
  item: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: "#f9f9f9",
    borderRadius: 5,
  },
  list: {
    flex: 1,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 20,
  },
});
