<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import BklitTooltip from "../components/BklitTooltip.vue";
import type { TooltipRow } from "../types";

export interface HeatmapDatum { date: string | Date; value: number }
const props = withDefaults(defineProps<{ data: HeatmapDatum[]; height?: number; cellSize?: number; color?: string; formatValue?: (value: number) => string }>(), {
  height: 190, cellSize: 11, color: "#7355e8", formatValue: (value: number) => value.toLocaleString(),
});
const host = ref<HTMLDivElement | null>(null);
const width = ref(720);
const hovered = ref<HeatmapDatum | null>(null);
let observer: ResizeObserver | undefined;
onMounted(() => {
  if (host.value && typeof ResizeObserver !== "undefined") { observer = new ResizeObserver(([entry]) => { if (entry) width.value = Math.max(320, entry.contentRect.width); }); observer.observe(host.value); }
});
onBeforeUnmount(() => observer?.disconnect());
const start = computed(() => {
  const dates = props.data.map((item) => new Date(item.date));
  const earliest = dates.length ? new Date(Math.min(...dates.map((date) => date.getTime()))) : new Date();
  earliest.setDate(earliest.getDate() - earliest.getDay());
  return earliest;
});
const maxValue = computed(() => Math.max(1, ...props.data.map((item) => item.value)));
const cell = computed(() => Math.max(5, Math.min(props.cellSize, (width.value - 62) / 54)));
const gap = 3;
const cells = computed(() => props.data.map((datum) => {
  const date = new Date(datum.date);
  const day = Math.floor((date.getTime() - start.value.getTime()) / 86400000);
  return { ...datum, date, x: 52 + Math.floor(day / 7) * (cell.value + gap), y: 22 + date.getDay() * (cell.value + gap), opacity: 0.12 + 0.88 * Math.min(1, datum.value / maxValue.value) };
}));
const tooltipRows = computed<TooltipRow[]>(() => hovered.value ? [{ id: "heat", label: "Atividade", value: hovered.value.value, color: props.color, formatValue: props.formatValue }] : []);
const tooltipX = ref(0); const tooltipY = ref(0);
function setHovered(datum: HeatmapDatum, event: PointerEvent) { hovered.value = datum; const rect = host.value?.getBoundingClientRect(); if (rect) { tooltipX.value = event.clientX - rect.left; tooltipY.value = event.clientY - rect.top; } }
const weekdayLabels = ["D", "S", "T", "Q", "Q", "S", "S"];
const monthLabels = computed(() => {
  const seen = new Set<number>();
  return cells.value.flatMap((item) => { const month = item.date.getMonth(); const week = Math.floor((item.date.getTime() - start.value.getTime()) / 604800000); if (item.date.getDate() <= 7 && !seen.has(month)) { seen.add(month); return [{ month: item.date.toLocaleDateString("pt-BR", { month: "short" }), x: 52 + week * (cell.value + gap) }]; } return []; });
});
</script>

<template>
  <div ref="host" class="bklit-chart bklit-heatmap-wrap" :style="{ height: `${height}px` }">
    <svg class="bklit-heatmap-svg" :viewBox="`0 0 ${width} ${height}`" role="img" aria-label="Mapa de atividade por dia" @pointerleave="hovered = null">
      <text v-for="(day, index) in weekdayLabels" :key="index" x="34" :y="28 + index * (cell + gap)" text-anchor="end" class="bklit-heatmap-day">{{ day }}</text>
      <text v-for="month in monthLabels" :key="`${month.month}-${month.x}`" :x="month.x" y="12" class="bklit-heatmap-month">{{ month.month }}</text>
      <rect v-for="item in cells" :key="String(item.date)" :x="item.x" :y="item.y" :width="cell" :height="cell" rx="2" :fill="color" :fill-opacity="item.opacity" class="bklit-heatmap-cell" @pointerenter="setHovered(item, $event)" />
    </svg>
    <BklitTooltip :open="hovered !== null" :x="tooltipX" :y="tooltipY" :container-width="width" :container-height="height" :label="hovered ? new Date(hovered.date).toLocaleDateString('pt-BR') : ''" :rows="tooltipRows" :format-value="formatValue" />
  </div>
</template>
