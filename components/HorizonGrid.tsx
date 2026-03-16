import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import Colors from '@/constants/colors';

const CELL_COLORS: Record<number, string> = {
  1: Colors.gridCell1,
  2: Colors.gridCell2,
  3: Colors.gridCell3,
  4: Colors.gridCell4,
  5: Colors.gridCell5,
  6: 'transparent',
};

interface HorizonGridProps {
  grid: number[][];
  cellSize: number;
}

function HorizonGridComponent({ grid, cellSize }: HorizonGridProps) {
  const gridSize = grid.length;
  const totalSize = gridSize * cellSize + (gridSize - 1) * 3;

  return (
    <View style={[styles.container, { width: totalSize, height: totalSize }]}>
      {grid.map((row, r) =>
        row.map((cell, c) => {
          const isMarker = cell === 6;
          return (
            <View
              key={`${r}-${c}`}
              style={[
                styles.cell,
                {
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: isMarker ? Colors.warningDim : CELL_COLORS[cell] || Colors.gridCell1,
                  top: r * (cellSize + 3),
                  left: c * (cellSize + 3),
                  borderRadius: cellSize * 0.2,
                  opacity: isMarker ? 1 : 0.85,
                },
              ]}
            >
              {isMarker && (
                <Star size={cellSize * 0.5} color={Colors.warning} fill={Colors.warning} />
              )}
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  cell: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default React.memo(HorizonGridComponent);
