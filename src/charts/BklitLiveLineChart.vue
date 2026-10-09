<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import BklitLineChart from "./BklitLineChart.vue";
import type { ChartSeries } from "../types";

export interface LiveLinePoint { time: number; value: number }
const props = withDefaults(defineProps<{ data: LiveLinePoint[]; value: number; height?: number; windowSeconds?: number; paused?: boolean; color?: string; maxPoints?: number; formatValue?: (value: number) => string }>(), {
  height: 280, windowSeconds: 30, paused: false, color: "#7355e8", maxPoints: 80, formatValue: (value: number) => value.toLocaleString(),
});
const points = ref<LiveLinePoint[]>([...props.data]);
let timer = 0;
watch(() => props.data, (data) => { points.value = [...data].slice(-props.maxPoints); }, { deep: true });
onMounted(() => {
  timer = window.setInterval(() => {
    if (props.paused) return;
    const now = Math.floor(Date.now() / 1000);
    const previous = points.value.at(-1)?.value ?? props.value;
    const next = previous + (props.value - previous) * .35;
    points.value = [...points.value, { time: now, value: next }].filter((point) => point.time >= now - props.windowSeconds).slice(-props.maxPoints);
  }, 1000);
});
onBeforeUnmount(() => window.clearInterval(timer));
const series = computed<ChartSeries[]>(() => [{ id: "live", name: "Agora", color: props.color, data: points.value.map((point) => ({ label: new Date(point.time * 1000).toLocaleTimeString("pt-BR", { minute: "2-digit", second: "2-digit" }), value: point.value })), formatValue: props.formatValue }]);
</script>

<template><div class="bklit-live-line"><BklitLineChart :series="series" :height="height" :show-legend="false" :x-tick-count="5" :format-value="formatValue" aria-label="Gráfico em tempo real" /></div></template>
