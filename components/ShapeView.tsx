import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polygon, Line } from 'react-native-svg';
import { Shape } from '@/types/game';
import Colors from '@/constants/colors';

interface ShapeViewProps {
  shape: Shape;
  size: number;
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
  highlighted?: boolean;
}

function ShapeViewComponent({
  shape,
  size,
  strokeColor = Colors.shapeStroke,
  fillColor = Colors.shapeFill,
  strokeWidth = 2,
  highlighted = false,
}: ShapeViewProps) {
  const points = shape.vertices.map((v) => `${v.x},${v.y}`).join(' ');

  return (
    <View style={[styles.container, { width: size, height: size }, highlighted && styles.highlighted]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Polygon
          points={points}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
        {shape.innerLines.map(([a, b], idx) => (
          <Line
            key={`line-${idx}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={strokeColor}
            strokeWidth={strokeWidth * 0.7}
            strokeOpacity={0.6}
          />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlighted: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.accent,
  },
});

export default React.memo(ShapeViewComponent);
