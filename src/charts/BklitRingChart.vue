<script setup lang="ts">
import BklitPieChart from "./BklitPieChart.vue";
import type { PieDatum } from "../types";

withDefaults(defineProps<{
  data: PieDatum[];
  height?: number;
  innerRadius?: number;
  showLegend?: boolean;
  formatValue?: (value: number) => string;
}>(), { height: 320, innerRadius: 0.68, showLegend: true, formatValue: (value: number) => value.toLocaleString() });
</script>

<template>
  <BklitPieChart v-bind="$props" />
</template>
