import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSelector } from 'react-redux';
import { Circle, Path, Svg } from 'react-native-svg';
import { fonts, getThemePalette, spacing } from '../theme/colors';
import Card from './Card';

const buildPath = (points) => points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`).join(' ');

export default function LineChart({ title, subtitle, items = [], height = 140 }) {
  const themeMode = useSelector((state) => state.auth.user?.themePreference || 'light');
  const palette = getThemePalette(themeMode);
  const { width } = useWindowDimensions();
  const isMobile = width < 600;
  const pointSpacing = isMobile ? 40 : 56;
  const minWidth = isMobile ? 280 : 360;
  const chartWidth = Math.max(items.length * pointSpacing, minWidth);
  const paddingX = 16;
  const paddingY = 12;
  const plotWidth = Math.max(chartWidth - paddingX * 2, 1);
  const plotHeight = Math.max(height - paddingY * 2, 1);
  const maxValue = Math.max(...items.map((item) => Number(item.value) || 0), 1);
  const lineColor = items[0]?.color || palette.green;

  const points = useMemo(() => {
    if (!items.length) {
      return [];
    }

    return items.map((item, index) => {
      const value = Number(item.value) || 0;
      const ratio = items.length === 1 ? 0 : index / (items.length - 1);
      const x = paddingX + ratio * plotWidth;
      const y = paddingY + (1 - value / maxValue) * plotHeight;
      return { x, y, value, label: item.label };
    });
  }, [items, maxValue, paddingX, plotWidth, paddingY, plotHeight]);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: palette.gray800 }]}>{title}</Text>
          {subtitle ? <Text style={[styles.subtitle, { color: palette.gray500 }]}>{subtitle}</Text> : null}
        </View>
      </View>

      {items.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={{ width: chartWidth }}>
            <Svg width={chartWidth} height={height}>
              <Path d={buildPath(points)} stroke={lineColor} strokeWidth={2.5} fill="none" />
              {points.map((point, index) => (
                <Circle
                  key={`${point.label}-${index}`}
                  cx={point.x}
                  cy={point.y}
                  r={3.5}
                  fill={lineColor}
                />
              ))}
            </Svg>
            <View style={[styles.labelRow, { width: chartWidth }]}>
              {items.map((item, index) => (
                <Text
                  key={`${item.label}-label-${index}`}
                  style={[styles.label, { color: palette.gray500, width: pointSpacing }]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              ))}
            </View>
          </View>
        </ScrollView>
      ) : (
        <Text style={[styles.empty, { color: palette.gray500 }]}>No data available.</Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: {
    ...fonts.base,
    ...fonts.bold,
    letterSpacing: 0.2,
  },
  subtitle: {
    ...fonts.xs,
    marginTop: 2,
    lineHeight: 16,
  },
  scrollContent: {
    paddingBottom: spacing.xs,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  label: {
    ...fonts.xs,
    ...fonts.semibold,
    textAlign: 'center',
  },
  empty: {
    ...fonts.sm,
  },
});
