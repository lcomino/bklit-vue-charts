<script setup lang="ts">
import BklitCartesianChart from "./BklitCartesianChart.vue";
import type { ChartAxis, ChartSeries } from "../types";

withDefaults(defineProps<{
  series: ChartSeries[];
  axes?: ChartAxis[];
  height?: number;
  showLegend?: boolean;
  xTickCount?: number;
  formatValue?: (value: number) => string;
}>(), { axes: () => [{ id: "primary", side: "left" }], height: 320, showLegend: true, xTickCount: undefined, formatValue: (value: number) => value.toLocaleString() });
</script>

<template>
  <BklitCartesianChart v-bind="$props" kind="line" aria-label="Gráfico de linhas" />
</template>
