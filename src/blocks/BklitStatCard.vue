<script setup lang="ts">
import { computed, getCurrentInstance, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { area as d3Area, curveMonotoneX, line as d3Line } from "d3-shape";
import { scaleLinear, scalePoint } from "d3-scale";
import BklitRollingNumber from "../components/BklitRollingNumber.vue";

const props = withDefaults(defineProps<{ title: string; value: number; data: number[]; labels?: string[]; trend?: number; variant?: "area" | "line"; color?: string; formatValue?: (value: number) => string; averageLabel?: string }>(), {
  trend: 0, variant: "area", color: "#7355e8", formatValue: (value: number) => value.toLocaleString(), averageLabel: "Avg",
});
const id = `bklit-stat-${getCurrentInstance()?.uid ?? 0}`;
const highlightClipId = `${id}-highlight`;
const host = ref<HTMLDivElement | null>(null); const width = ref(320); const hoveredIndex = ref<number | null>(null); let observer: ResizeObserver | undefined;
onMounted(() => { if (host.value && typeof ResizeObserver !== "undefined") { observer = new ResizeObserver(([entry]) => { if (entry) width.value = Math.max(160, entry.contentRect.width); }); observer.observe(host.value); } });
let springFrame = 0;
onBeforeUnmount(() => { observer?.disconnect(); cancelAnimationFrame(springFrame); });
const chartHeight = 112;
const points = computed(() => { const min = Math.min(...props.data, 0); const max = Math.max(...props.data, 1); const x = scalePoint<number>().domain(props.data.map((_, index) => index)).range([0, width.value]).padding(.06); const y = scaleLinear().domain([min, max]).nice().range([chartHeight - 8, 8]); return props.data.map((value, index) => ({ x: x(index) ?? 0, y: y(value), value, index })); });
const linePath = computed(() => d3Line<{x:number;y:number}>().x((item) => item.x).y((item) => item.y).curve(curveMonotoneX)(points.value) ?? "");
const areaPath = computed(() => d3Area<{x:number;y:number}>().x((item) => item.x).y0(chartHeight).y1((item) => item.y).curve(curveMonotoneX)(points.value) ?? "");
const selectedPoint = computed(() => hoveredIndex.value === null ? null : points.value[hoveredIndex.value] ?? null);
const average = computed(() => props.data.length ? props.data.reduce((sum, item) => sum + item, 0) / props.data.length : props.value);
const displayValue = computed(() => selectedPoint.value?.value ?? average.value);
const displayLabel = computed(() => selectedPoint.value ? props.labels?.[selectedPoint.value.index] ?? `Point ${selectedPoint.value.index + 1}` : props.averageLabel);
const displayTrend = computed(() => {
  if (!selectedPoint.value || selectedPoint.value.index === 0) return props.trend;
  const previous = points.value[selectedPoint.value.index - 1]?.value ?? 0;
  return previous ? ((selectedPoint.value.value - previous) / Math.abs(previous)) * 100 : props.trend;
});
const targetBand = computed(() => {
  if (!selectedPoint.value) return { x: 0, width: 0 };
  const start = points.value[Math.max(0, selectedPoint.value.index - 1)]?.x ?? 0;
  const end = points.value[Math.min(points.value.length - 1, selectedPoint.value.index + 1)]?.x ?? start;
  return { x: start, width: Math.max(0, end - start) };
});
const highlightBand = ref({ x: 0, width: 0 });
let hasActiveHover = false;
watch(targetBand, (target) => {
  cancelAnimationFrame(springFrame);
  if (!selectedPoint.value) { hasActiveHover = false; return; }
  if (!hasActiveHover || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    highlightBand.value = target;
    hasActiveHover = true;
    return;
  }
  let previous = performance.now();
  let vx = 0; let vw = 0;
  const tick = (time: number) => {
    const dt = Math.min(.032, Math.max(.001, (time - previous) / 1000)); previous = time;
    const advance = (current: number, velocity: number, to: number) => { velocity = (velocity + (to - current) * 250 * dt) * Math.exp(-24 * dt); return { value: current + velocity * dt, velocity }; };
    const x = advance(highlightBand.value.x, vx, target.x); const w = advance(highlightBand.value.width, vw, target.width);
    vx = x.velocity; vw = w.velocity; highlightBand.value = { x: x.value, width: w.value };
    if (Math.abs(target.x - x.value) > .2 || Math.abs(target.width - w.value) > .2 || Math.abs(vx) > .2 || Math.abs(vw) > .2) springFrame = requestAnimationFrame(tick);
    else highlightBand.value = target;
  };
  springFrame = requestAnimationFrame(tick);
});
function handlePointerMove(event: PointerEvent) {
  if (points.value.length === 0) return;
  const rect = (event.currentTarget as SVGSVGElement).getBoundingClientRect();
  const x = (event.clientX - rect.left) / Math.max(1, rect.width) * width.value;
  hoveredIndex.value = points.value.reduce((best, point) => Math.abs(point.x - x) < Math.abs(points.value[best]!.x - x) ? point.index : best, 0);
}
</script>

<template>
  <article ref="host" class="bklit-stat-card" :style="{ '--stat-color': color }">
    <header><span>{{ title }}</span><span class="bklit-stat-trend" :class="displayTrend >= 0 ? 'is-up' : 'is-down'">{{ displayTrend >= 0 ? '+' : '−' }}{{ Math.abs(displayTrend).toFixed(1) }}%</span></header>
    <div class="bklit-stat-card-value"><BklitRollingNumber :value="displayValue" :format-value="formatValue" :duration="380" /> <span>{{ displayLabel }}</span></div>
    <svg class="bklit-stat-sparkline" :viewBox="`0 0 ${width} ${chartHeight}`" preserveAspectRatio="none" aria-hidden="true" @pointermove="handlePointerMove" @pointerleave="hoveredIndex = null">
      <defs><linearGradient :id="`${id}-gradient`" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" :stop-color="color" stop-opacity=".25" /><stop offset="100%" :stop-color="color" stop-opacity="0" /></linearGradient><clipPath :id="highlightClipId"><rect :x="highlightBand.x" y="0" :width="highlightBand.width" :height="chartHeight" /></clipPath></defs>
      <path v-if="variant === 'area'" :d="areaPath" :fill="`url(#${id}-gradient)`" :class="{ 'is-muted': selectedPoint }" />
      <path :d="linePath" fill="none" :stroke="color" stroke-width="2" stroke-linecap="round" :class="{ 'is-muted': selectedPoint }" />
      <path v-if="selectedPoint" :d="linePath" fill="none" :stroke="color" stroke-width="2.8" stroke-linecap="round" class="bklit-stat-highlight" :clip-path="`url(#${highlightClipId})`" />
      <line v-if="selectedPoint" :x1="selectedPoint.x" :x2="selectedPoint.x" y1="0" :y2="chartHeight" class="bklit-stat-crosshair" />
      <circle v-if="selectedPoint" :cx="selectedPoint.x" :cy="selectedPoint.y" r="4" :fill="color" class="bklit-stat-dot" />
    </svg>
  </article>
</template>
