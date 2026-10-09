<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import BklitTooltip from "../components/BklitTooltip.vue";
import type { TooltipRow } from "../types";

export interface RadarSeries { id: string; name: string; values: number[]; color?: string }
const props = withDefaults(defineProps<{ metrics: string[]; series: RadarSeries[]; size?: number; levels?: number; color?: string; formatValue?: (value: number) => string }>(), {
  size: 360, levels: 5, color: "#7355e8", formatValue: (value: number) => value.toLocaleString(),
});
const host = ref<HTMLDivElement | null>(null); const activeIndex = ref<number | null>(null); const tooltip = ref({ x: 0, y: 0 }); let observer: ResizeObserver | undefined;
onMounted(() => { if (host.value && typeof ResizeObserver !== "undefined") { observer = new ResizeObserver(([entry]) => { if (entry) size.value = Math.min(props.size, Math.max(240, entry.contentRect.width)); }); observer.observe(host.value); } });
onBeforeUnmount(() => observer?.disconnect());
const size = ref(props.size);
const center = computed(() => size.value / 2); const radius = computed(() => size.value * .34);
const maxValue = computed(() => Math.max(1, ...props.series.flatMap((item) => item.values)));
const pointsFor = (values: number[]) => props.metrics.map((metric, index) => {
  const angle = -Math.PI / 2 + 2 * Math.PI * index / props.metrics.length;
  const r = radius.value * (values[index] ?? 0) / maxValue.value;
  return { metric, x: center.value + Math.cos(angle) * r, y: center.value + Math.sin(angle) * r, ax: center.value + Math.cos(angle) * radius.value, ay: center.value + Math.sin(angle) * radius.value };
});
const polygons = computed(() => props.series.map((item, index) => ({ ...item, index, points: pointsFor(item.values).map((point) => `${point.x},${point.y}`).join(" "), vertices: pointsFor(item.values) })));
const activeSeries = computed(() => activeIndex.value === null ? null : props.series[activeIndex.value]);
const rows = computed<TooltipRow[]>(() => activeSeries.value ? props.metrics.map((metric, index) => ({ id: `${activeSeries.value!.id}-${index}`, label: metric, value: activeSeries.value!.values[index] ?? 0, color: activeSeries.value!.color ?? props.color, formatValue: props.formatValue })) : []);
function activate(index: number, event: PointerEvent) { activeIndex.value = index; const bounds = host.value?.getBoundingClientRect(); if (bounds) tooltip.value = { x: event.clientX - bounds.left, y: event.clientY - bounds.top }; }
</script>

<template>
  <div ref="host" class="bklit-chart bklit-radar-wrap" :style="{ height: `${size}px` }">
    <svg class="bklit-radar-svg" :viewBox="`0 0 ${size} ${size}`" role="img" aria-label="Gráfico radar" @pointerleave="activeIndex = null">
      <g v-for="level in levels" :key="level" class="bklit-radar-grid"><polygon :points="pointsFor(metrics.map(() => maxValue * level / levels)).map((point) => `${point.x},${point.y}`).join(' ')" /></g>
      <g v-for="(metric, index) in metrics" :key="metric" class="bklit-radar-axis"><line :x1="center" :y1="center" :x2="pointsFor(metrics.map(() => maxValue))[index]?.ax" :y2="pointsFor(metrics.map(() => maxValue))[index]?.ay" /><text :x="pointsFor(metrics.map(() => maxValue))[index]?.ax" :y="pointsFor(metrics.map(() => maxValue))[index]?.ay" :text-anchor="(pointsFor(metrics.map(() => maxValue))[index]?.ax ?? center) < center - 8 ? 'end' : (pointsFor(metrics.map(() => maxValue))[index]?.ax ?? center) > center + 8 ? 'start' : 'middle'">{{ metric }}</text></g>
      <polygon v-for="series in polygons" :key="series.id" :points="series.points" :fill="series.color ?? color" fill-opacity=".16" :stroke="series.color ?? color" stroke-width="2" class="bklit-radar-series" :class="{ 'is-muted': activeIndex !== null && activeIndex !== series.index, 'is-active': activeIndex === series.index }" @pointerenter="activate(series.index, $event)" />
      <g v-for="series in polygons" :key="`${series.id}-dots`" class="bklit-radar-dots" :class="{ 'is-muted': activeIndex !== null && activeIndex !== series.index }"><circle v-for="(point, index) in series.vertices" :key="index" :cx="point.x" :cy="point.y" r="3.5" :fill="series.color ?? color" /></g>
    </svg>
    <BklitTooltip :open="activeSeries !== null" :x="tooltip.x" :y="tooltip.y" :container-width="size" :container-height="size" :label="activeSeries?.name ?? ''" :rows="rows" :format-value="formatValue" />
  </div>
</template>
