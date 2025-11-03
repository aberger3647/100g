import React, { useRef } from 'react';
import { TouchableOpacity, View, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { StyleSheet } from 'react-native';
import { Product } from '@/types';

interface ItemsTableProps {
  items: Product[];
  onRemove?: (index: number) => void;
}

const ITEM_WIDTH = 150;
const NUTRITION_WIDTH = 70;
const CALORIES_WIDTH = 90;
const DELETE_WIDTH = 40;
const ROW_HEIGHT = 48;

export default function ItemsTable({ items, onRemove }: ItemsTableProps) {
  const headerScrollRef = useRef<ScrollView>(null);
  const dataScrollRef = useRef<ScrollView>(null);

  const handleHeaderScroll = (event: any) => {
    const offset = event.nativeEvent.contentOffset.x;
    dataScrollRef.current?.scrollTo({ x: offset, animated: false });
  };

  const handleDataScroll = (event: any) => {
    const offset = event.nativeEvent.contentOffset.x;
    headerScrollRef.current?.scrollTo({ x: offset, animated: false });
  };

  return (
    <View style={styles.tableContainer}>
      <View style={styles.headerRow}>
        <View style={[styles.headerCell, { width: ITEM_WIDTH }]}>
          <ThemedText style={[styles.tableHeaderText, styles.leftAlign, {paddingLeft: 10}]}>Item</ThemedText>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollableHeader} ref={headerScrollRef} onScroll={handleHeaderScroll}>
          <View style={styles.scrollableContent}>
            <View style={[styles.headerCell, { width: NUTRITION_WIDTH }]}>
              <ThemedText style={styles.tableHeaderText}>Carbs</ThemedText>
            </View>
            <View style={[styles.headerCell, { width: NUTRITION_WIDTH }]}>
              <ThemedText style={styles.tableHeaderText}>Fat</ThemedText>
            </View>
            <View style={[styles.headerCell, { width: NUTRITION_WIDTH }]}>
              <ThemedText style={styles.tableHeaderText}>Protein</ThemedText>
            </View>
            <View style={[styles.headerCell, { width: CALORIES_WIDTH }]}>
              <ThemedText style={styles.tableHeaderText}>Calories</ThemedText>
            </View>
            <View style={[styles.headerCell, { width: DELETE_WIDTH }]}>
              <ThemedText style={styles.tableHeaderText}></ThemedText>
            </View>
          </View>
        </ScrollView>
      </View>
      <ScrollView vertical showsVerticalScrollIndicator={true} style={styles.dataScrollContainer}>
        <View style={styles.dataContainer}>
          <View style={[styles.itemColumnContainer, { width: ITEM_WIDTH }]}>
            {items.map((item) => (
              <View key={item.barcode} style={styles.itemCell}>
                <ThemedText style={[styles.tableCell, styles.itemText]} numberOfLines={2}>
                  {item.product_name}
                </ThemedText>
              </View>
            ))}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollableData} ref={dataScrollRef} onScroll={handleDataScroll}>
            <View style={styles.dataContent}>
              {items.map((item, index) => (
                <View key={item.barcode} style={styles.dataRow}>
                  <View style={[styles.cell, { width: NUTRITION_WIDTH }]}>
                    <ThemedText style={styles.tableCell}>
                      {Math.floor(item.macros.carbohydrates)}
                    </ThemedText>
                  </View>
                  <View style={[styles.cell, { width: NUTRITION_WIDTH }]}>
                    <ThemedText style={styles.tableCell}>
                      {Math.floor(item.macros.fat)}
                    </ThemedText>
                  </View>
                  <View style={[styles.cell, { width: NUTRITION_WIDTH }]}>
                    <ThemedText style={styles.tableCell}>
                      {Math.floor(item.macros.protein)}
                    </ThemedText>
                  </View>
                  <View style={[styles.cell, { width: CALORIES_WIDTH }]}>
                    <ThemedText style={styles.tableCell}>
                      {Math.floor(item.macros.energy_kcal)}
                    </ThemedText>
                  </View>
                  <View style={[styles.cell, { width: DELETE_WIDTH }]}>
                    <TouchableOpacity
                      style={[styles.deleteButton, !onRemove && styles.disabledButton]}
                      onPress={onRemove ? () => onRemove(index) : undefined}
                      disabled={!onRemove}
                    >
                      <ThemedText style={[styles.deleteText, !onRemove && styles.disabledText]}>×</ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tableContainer: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    marginHorizontal: 10,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  headerCell: {
    height: ROW_HEIGHT,
    paddingVertical: 12,
    paddingHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollableHeader: {
    flex: 1,
  },
  scrollableContent: {
    flexDirection: 'row',
  },
  tableHeaderText: {
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  leftAlign: {
    textAlign: 'left',
  },
  dataContainer: {
    flexDirection: 'row',
  },
  dataScrollContainer: {
    flex: 1,
  },
  itemColumnContainer: {
    flexDirection: 'column',
  },
  itemCell: {
    height: ROW_HEIGHT,
    paddingVertical: 12,
    paddingHorizontal: 5,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  itemText: {
    flex: 1,
    textAlign: 'left',
    paddingLeft: 10,
  },
  scrollableData: {
    flex: 1,
  },
  dataContent: {
    flexDirection: 'column',
  },
  dataRow: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  cell: {
    paddingVertical: 12,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableCell: {
    fontSize: 14,
    textAlign: 'right',
  },
  deleteButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  deleteText: {
    color: 'gray',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledText: {
    color: 'lightgray',
  },
});
