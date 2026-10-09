<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { scaleLinear } from "d3-scale";
import BklitTooltip from "../components/BklitTooltip.vue";
import type { TooltipRow } from "../types";

export interface ScatterDatum { x: number; y: number; label?: string; size?: number; color?: string }
const props = withDefaults(defineProps<{ data: ScatterDatum[]; height?: number; color?: string; xLabel?: string; yLabel?: string; formatValue?: (value: number) => string }>(), {
  height: 320, color: "#7355e8", xLabel: "X", yLabel: "Y", formatValue: (value: number) => value.toLocaleString(),
});
const host = ref<HTMLDivElement | null>(null); const width = ref(720); const hovered = ref<ScatterDatum | null>(null); const tooltip = ref({ x: 0, y: 0 }); let observer: ResizeObserver | undefined;
onMounted(() => { if (host.value && typeof ResizeObserver !== "undefined") { observer = new ResizeObserver(([entry]) => { if (entry) width.value = Math.max(320, entry.contentRect.width); }); observer.observe(host.value); } });
onBeforeUnmount(() => observer?.disconnect());
const margin = { top: 18, right: 18, bottom: 42, left: 58 };
const x = computed(() => { const values = props.data.map((item) => item.x); return scaleLinear().domain([Math.min(...values, 0), Math.max(...values, 1)]).nice().range([margin.left, width.value - margin.right]); });
const y = computed(() => { const values = props.data.map((item) => item.y); return scaleLinear().domain([Math.min(...values, 0), Math.max(...values, 1)]).nice().range([props.height - margin.bottom, margin.top]); });
const rows = computed<TooltipRow[]>(() => hovered.value ? [
  { id: "x", label: props.xLabel, value: hovered.value.x, color: props.color, formatValue: props.formatValue },
  { id: "y", label: props.yLabel, value: hovered.value.y, color: "#1ca37a", formatValue: props.formatValue },
] : []);
const ticks = [0, 1, 2, 3, 4];
function activate(item: ScatterDatum, event: PointerEvent) { hovered.value = item; const rect = host.value?.getBoundingClientRect(); if (rect) tooltip.value = { x: event.clientX - rect.left, y: event.clientY - rect.top }; }
</script>

<template>
  <div ref="host" class="bklit-chart" :style="{ height: `${height}px` }">
    <svg class="bklit-chart-svg" :viewBox="`0 0 ${width} ${height}`" role="img" aria-label="Gráfico de dispersão" @pointerleave="hovered = null">
      <g class="bklit-grid"><g v-for="tick in ticks" :key="tick"><line :x1="margin.left" :x2="width - margin.right" :y1="margin.top + tick * (height - margin.top - margin.bottom) / 4" :y2="margin.top + tick * (height - margin.top - margin.bottom) / 4" /><line :x1="margin.left + tick * (width - margin.left - margin.right) / 4" :x2="margin.left + tick * (width - margin.left - margin.right) / 4" :y1="margin.top" :y2="height - margin.bottom" /></g></g>
      <circle v-for="(item, index) in data" :key="index" :cx="x(item.x)" :cy="y(item.y)" :r="item.size ?? 5" :fill="item.color ?? color" :fill-opacity="hovered && hovered !== item ? .24 : .78" class="bklit-scatter-point" @pointerenter="activate(item, $event)" />
      <text :x="width / 2" :y="height - 8" text-anchor="middle" class="bklit-scatter-axis-label">{{ xLabel }}</text>
      <text :transform="`translate(14 ${height / 2}) rotate(-90)`" text-anchor="middle" class="bklit-scatter-axis-label">{{ yLabel }}</text>
    </svg>
    <BklitTooltip :open="hovered !== null" :x="tooltip.x" :y="tooltip.y" :container-width="width" :container-height="height" :label="hovered?.label ?? ''" :rows="rows" :format-value="formatValue" />
  </div>
</template>
