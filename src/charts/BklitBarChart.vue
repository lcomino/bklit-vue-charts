<script setup lang="ts">
import BklitCartesianChart from "./BklitCartesianChart.vue";
import type { ChartAxis, ChartSeries } from "../types";

withDefaults(defineProps<{
  series: ChartSeries[];
  axes?: ChartAxis[];
  height?: number;
  stacked?: boolean;
  showTotal?: boolean;
  showLegend?: boolean;
  formatValue?: (value: number) => string;
}>(), { axes: () => [{ id: "primary", side: "left" }], height: 320, stacked: false, showTotal: true, showLegend: true, formatValue: (value: number) => value.toLocaleString() });
</script>

<template>
  <BklitCartesianChart v-bind="$props" kind="bar" aria-label="Gráfico de barras" />
</template>
