import React, { useRef, useState } from 'react';
import { TouchableOpacity, View, ScrollView, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Product } from '@/types';

interface ItemsTableProps {
  items: Product[];
  onRemove?: (index: number) => void;
  onSort?: (key: 'carbs' | 'fat' | 'protein' | 'calories') => void;
  onAddPrice?: (index: number) => void;
  currentSortKey?: 'carbs' | 'fat' | 'protein' | 'calories' | null;
  currentSortOrder?: 'asc' | 'desc';
}

const ITEM_WIDTH = 150;
const NUTRITION_WIDTH = 75;
const CALORIES_WIDTH = 95;
const PRICE_WIDTH = 80;
const DELETE_WIDTH = 40;
const ROW_HEIGHT = 48;

export default function ItemsTable({ items, onRemove, onSort, onAddPrice, currentSortKey, currentSortOrder }: ItemsTableProps) {
  const headerScrollRef = useRef<ScrollView>(null);
  const dataScrollRef = useRef<ScrollView>(null);
  const [tooltip, setTooltip] = useState<{ visible: boolean; text: string; x: number; y: number }>({ visible: false, text: '', x: 0, y: 0 });

  const tableBackground = useThemeColor({light: '#f9f9f9', dark: '#1a1a1a'}, 'background');
  const headerBackground = useThemeColor({light: '#e0e0e0', dark: '#2a2a2a'}, 'background');
  const borderColor = useThemeColor({light: '#e0e0e0', dark: '#2a2a2a'}, 'background');

  const handleDataScroll = (event: any) => {
    const offset = event.nativeEvent.contentOffset.x;
    headerScrollRef.current?.scrollTo({ x: offset, animated: false });
  };

  return (
    <View style={[styles.tableContainer, {backgroundColor: tableBackground}]}>
      <View style={[styles.headerRow, {backgroundColor: headerBackground}]}>
        <View style={[styles.headerCell, { width: ITEM_WIDTH }]}>
          <ThemedText style={[styles.tableHeaderText, styles.leftAlign, {paddingLeft: 10}]}>Item</ThemedText>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollableHeader} ref={headerScrollRef}>
          <View style={styles.scrollableContent}>
            {onSort ? (
              <>
                <TouchableOpacity style={[styles.headerCell, { width: NUTRITION_WIDTH }]} onPress={() => onSort?.('carbs')}>
                  <ThemedText style={styles.tableHeaderText}>
                    Carbs{currentSortKey === 'carbs' ? (currentSortOrder === 'asc' ? ' ↑' : ' ↓') : ''}
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.headerCell, { width: NUTRITION_WIDTH }]} onPress={() => onSort?.('fat')}>
                  <ThemedText style={styles.tableHeaderText}>
                    Fat{currentSortKey === 'fat' ? (currentSortOrder === 'asc' ? ' ↑' : ' ↓') : ''}
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.headerCell, { width: NUTRITION_WIDTH }]} onPress={() => onSort?.('protein')}>
                  <ThemedText style={styles.tableHeaderText}>
                    Protein{currentSortKey === 'protein' ? (currentSortOrder === 'asc' ? ' ↑' : ' ↓') : ''}
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.headerCell, { width: CALORIES_WIDTH }]} onPress={() => onSort?.('calories')}>
                  <ThemedText style={styles.tableHeaderText}>
                    Calories{currentSortKey === 'calories' ? (currentSortOrder === 'asc' ? ' ↑' : ' ↓') : ''}
                  </ThemedText>
                </TouchableOpacity>
                <View style={[styles.headerCell, { width: PRICE_WIDTH }]}>
                  <ThemedText style={styles.tableHeaderText}>Price</ThemedText>
                </View>
              </>
            ) : (
              <>
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
                <View style={[styles.headerCell, { width: PRICE_WIDTH }]}>
                  <ThemedText style={styles.tableHeaderText}>Price</ThemedText>
                </View>
              </>
            )}
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
              <View key={item.barcode} style={[styles.itemCell, {borderBottomColor: borderColor}]}>
                <TouchableWithoutFeedback
                  onLongPress={(event) => {
                    const { pageX, pageY } = event.nativeEvent;
                    setTooltip({ visible: true, text: item.product_name, x: pageX, y: pageY });
                  }}
                  onPressOut={() => setTooltip({ visible: false, text: '', x: 0, y: 0 })}
                >
                  <ThemedText style={[styles.tableCell, styles.itemText]} numberOfLines={2}>
                    {item.product_name}
                  </ThemedText>
                </TouchableWithoutFeedback>
              </View>
            ))}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollableData} ref={dataScrollRef} onScroll={handleDataScroll}>
            <View style={styles.dataContent}>
              {items.map((item, index) => (
                <View key={item.barcode} style={[styles.dataRow, {borderBottomColor: borderColor}]}>
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
                  <View style={[styles.cell, { width: PRICE_WIDTH }]}>
                    {item.pricePer100g ? (
                      <TouchableOpacity
                        style={styles.priceCell}
                        onPress={onAddPrice ? () => onAddPrice(index) : undefined}
                      >
                        <ThemedText style={styles.tableCell}>
                          ${item.pricePer100g.toFixed(2)}
                        </ThemedText>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.addButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        activeOpacity={0.7}
                        onPress={onAddPrice ? () => onAddPrice(index) : undefined}
                      >
                        <ThemedText style={styles.addText}>+</ThemedText>
                      </TouchableOpacity>
                    )}
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
      {tooltip.visible && (
        <View style={[styles.tooltip, { left: tooltip.x - 50, top: tooltip.y - 60 }]}>
          <ThemedText style={styles.tooltipText}>{tooltip.text}</ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tableContainer: {
    flex: 1,
    borderRadius: 5,
    marginHorizontal: 10,
  },
  headerRow: {
    flexDirection: 'row',
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
  addButton: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  addButtonTouchable: {
    hitSlop: { top: 10, bottom: 10, left: 10, right: 10 },
  },
  addText: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  priceCell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 8,
    borderRadius: 4,
    maxWidth: 200,
    zIndex: 1000,
  },
  tooltipText: {
    color: 'white',
    fontSize: 14,
  },
});
