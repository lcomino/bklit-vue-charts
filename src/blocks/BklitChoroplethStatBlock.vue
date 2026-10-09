<script setup lang="ts">
import { computed, ref } from "vue";
import BklitChoroplethChart from "../charts/BklitChoroplethChart.vue";
import type { ChoroplethFeature } from "../charts/BklitChoroplethChart.vue";
import BklitRollingNumber from "../components/BklitRollingNumber.vue";
const props = withDefaults(defineProps<{ title?: string; value: number; trend?: number; features: ChoroplethFeature[]; color?: string; formatValue?: (value: number) => string }>(), { title: "Unique Visitors", trend: -3.1, color: "#7355e8", formatValue: (value: number) => value.toLocaleString() });
const hovered = ref<ChoroplethFeature | null>(null);
const average = computed(() => { const known = props.features.filter((feature) => feature.value > 0); return known.length ? known.reduce((sum, feature) => sum + feature.value, 0) / known.length : 0; });
const displayValue = computed(() => hovered.value ? hovered.value.value : props.value);
const displayLabel = computed(() => hovered.value?.name ?? "Total");
const displayTrend = computed(() => hovered.value && average.value ? ((hovered.value.value - average.value) / average.value) * 100 : props.trend);
</script>
<template><article class="bklit-stat-card bklit-stat-map"><header><span>{{ title }}</span><span class="bklit-stat-trend" :class="displayTrend >= 0 ? 'is-up' : 'is-down'">{{ displayTrend >= 0 ? '+' : '−' }}{{ Math.abs(displayTrend).toFixed(1) }}%</span></header><div class="bklit-stat-card-value"><BklitRollingNumber :value="displayValue" :format-value="formatValue" :duration="380" /><span>{{ displayLabel }}</span></div><BklitChoroplethChart :features="features" :height="180" :high-color="color" @feature-hover="hovered = $event" /></article></template>
