import { Stack } from 'expo-router';
import React from 'react';

export default function HistoryLayout() {
  return (
    <Stack
      screenOptions={{
        gestureEnabled: true,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Comparison History',
        }}
      />
      <Stack.Screen
        name="comparison/[id]"
        options={{
          title: 'Comparison',
        }}
      />
    </Stack>
  );
}
