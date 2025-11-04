import React, { useEffect, useRef, useState } from 'react';
import { View, TextInput, Modal, Keyboard, KeyboardAvoidingView, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { StyleSheet } from 'react-native';

interface PriceDialogProps {
  visible: boolean;
  onClose: () => void;
  onCalculate: (weight: string, price: string) => void;
  initialWeight: string;
  initialPrice: string;
  isEditing: boolean;
}

export default function PriceDialog({
  visible,
  onClose,
  onCalculate,
  initialWeight,
  initialPrice,
  isEditing,
}: PriceDialogProps) {
  const [weight, setWeight] = useState('');
  const [price, setPrice] = useState('');
  const weightInputRef = useRef<TextInput>(null);
  const priceInputRef = useRef<TextInput>(null);
  const modalBackground = useThemeColor({ light: '#ffffff', dark: '#1a1a1a' }, 'background');

  useEffect(() => {
    if (visible) {
      setWeight(initialWeight);
      setPrice(initialPrice);
      setTimeout(() => weightInputRef.current?.focus(), 100);
    }
  }, [visible, initialWeight, initialPrice]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView style={styles.modalOverlay} behavior="padding">
        <View style={[styles.modalContent, { backgroundColor: modalBackground }]}>
          <ThemedText type="subtitle" style={styles.modalTitle}>
            {isEditing ? 'Edit' : 'Add'} Price Information
          </ThemedText>
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
            <TouchableOpacity style={styles.modalButton} onPress={() => { Keyboard.dismiss(); onClose(); }}>
              <ThemedText style={styles.modalButtonText}>Cancel</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, styles.calculateButton]} onPress={() => onCalculate(weight, price)}>
              <ThemedText style={[styles.modalButtonText, styles.calculateText]}>Calculate</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
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
