<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { scaleLinear, scalePoint } from "d3-scale";
import BklitTooltip from "../components/BklitTooltip.vue";
import type { TooltipRow } from "../types";

export interface ProfitLossPoint { label: string; value: number }
const props = withDefaults(defineProps<{ data: ProfitLossPoint[]; height?: number; positiveColor?: string; negativeColor?: string; formatValue?: (value: number) => string }>(), {
  height: 280, positiveColor: "#1ca37a", negativeColor: "#df5b7b", formatValue: (value: number) => value.toLocaleString(),
});
const host = ref<HTMLDivElement | null>(null); const width = ref(720); const activeIndex = ref<number | null>(null); const mouse = ref({ x: 0, y: 0 }); let observer: ResizeObserver | undefined;
onMounted(() => { if (host.value && typeof ResizeObserver !== "undefined") { observer = new ResizeObserver(([entry]) => { if (entry) width.value = Math.max(320, entry.contentRect.width); }); observer.observe(host.value); } });
onBeforeUnmount(() => observer?.disconnect());
const margin = { top: 18, right: 18, bottom: 36, left: 58 };
const x = computed(() => scalePoint<string>().domain(props.data.map((item) => item.label)).range([margin.left, width.value - margin.right]).padding(.35));
const y = computed(() => { const vals = props.data.map((item) => item.value); const extent = Math.max(1, ...vals.map(Math.abs)); return scaleLinear().domain([-extent, extent]).nice().range([props.height - margin.bottom, margin.top]); });
const ticks = computed(() => y.value.ticks(4));
const segments = computed(() => {
  const result: Array<{ color: string; d: string }> = [];
  for (let index = 1; index < props.data.length; index += 1) {
    const a = props.data[index - 1]!; const b = props.data[index]!;
    const ax = x.value(a.label) ?? 0; const ay = y.value(a.value); const bx = x.value(b.label) ?? 0; const by = y.value(b.value);
    if (a.value * b.value < 0) {
      const ratio = Math.abs(a.value) / (Math.abs(a.value) + Math.abs(b.value)); const crossX = ax + (bx - ax) * ratio; const zero = y.value(0);
      result.push({ color: a.value >= 0 ? props.positiveColor : props.negativeColor, d: `M${ax},${ay} L${crossX},${zero}` });
      result.push({ color: b.value >= 0 ? props.positiveColor : props.negativeColor, d: `M${crossX},${zero} L${bx},${by}` });
    } else result.push({ color: a.value >= 0 ? props.positiveColor : props.negativeColor, d: `M${ax},${ay} L${bx},${by}` });
  }
  return result;
});
const active = computed(() => activeIndex.value === null ? null : props.data[activeIndex.value] ?? null);
const rows = computed<TooltipRow[]>(() => active.value ? [{ id: "profit-loss", label: active.value.value >= 0 ? "Lucro" : "Prejuízo", value: active.value.value, color: active.value.value >= 0 ? props.positiveColor : props.negativeColor, formatValue: props.formatValue }] : []);
function handleMove(event: PointerEvent) { if (!host.value || !props.data.length) return; const bounds = host.value.getBoundingClientRect(); const localX = event.clientX - bounds.left; const chartX = localX * width.value / Math.max(1, bounds.width); activeIndex.value = props.data.reduce((best, item, index) => Math.abs((x.value(item.label) ?? 0) - chartX) < Math.abs((x.value(props.data[best]!.label) ?? 0) - chartX) ? index : best, 0); mouse.value = { x: localX, y: event.clientY - bounds.top }; }
</script>

<template>
  <div ref="host" class="bklit-chart" :style="{ height: `${height}px` }">
    <svg class="bklit-chart-svg" :viewBox="`0 0 ${width} ${height}`" role="img" aria-label="Gráfico de lucro e prejuízo" @pointermove="handleMove" @pointerleave="activeIndex = null">
      <g class="bklit-grid"><g v-for="tick in ticks" :key="tick"><line :x1="margin.left" :x2="width - margin.right" :y1="y(tick)" :y2="y(tick)" /><text :x="margin.left - 10" :y="y(tick) + 4" text-anchor="end">{{ formatValue(tick) }}</text></g></g>
      <line :x1="margin.left" :x2="width - margin.right" :y1="y(0)" :y2="y(0)" class="bklit-zero-line" />
      <path v-for="(segment, index) in segments" :key="index" :d="segment.d" fill="none" :stroke="segment.color" stroke-width="2" stroke-linecap="round" />
      <circle v-if="active" :cx="x(active.label)" :cy="y(active.value)" r="4" :fill="active.value >= 0 ? positiveColor : negativeColor" class="bklit-point-marker" />
      <g class="bklit-x-axis"><text v-for="item in data" :key="item.label" :x="x(item.label)" :y="height - 10" text-anchor="middle">{{ item.label }}</text></g>
    </svg>
    <BklitTooltip :open="active !== null" :x="mouse.x" :y="mouse.y" :container-width="width" :container-height="height" :label="active?.label ?? ''" :rows="rows" :format-value="formatValue" />
  </div>
</template>
