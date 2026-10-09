<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { scaleLinear, scalePoint } from "d3-scale";
import BklitTooltip from "../components/BklitTooltip.vue";
import type { TooltipRow } from "../types";

export interface OHLCPoint {
  label: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

const props = withDefaults(defineProps<{
  data: OHLCPoint[];
  height?: number;
  positiveColor?: string;
  negativeColor?: string;
  formatValue?: (value: number) => string;
}>(), {
  height: 320,
  positiveColor: "#1ca37a",
  negativeColor: "#df5b7b",
  formatValue: (value: number) => value.toLocaleString(),
});
const host = ref<HTMLDivElement | null>(null);
const width = ref(720);
const active = ref<OHLCPoint | null>(null);
let observer: ResizeObserver | undefined;
onMounted(() => {
  if (host.value && typeof ResizeObserver !== "undefined") {
    observer = new ResizeObserver(([entry]) => { if (entry) width.value = Math.max(320, entry.contentRect.width); });
    observer.observe(host.value);
  }
});
onBeforeUnmount(() => observer?.disconnect());

const margin = { top: 18, right: 18, bottom: 36, left: 58 };
const labels = computed(() => props.data.map((item) => item.label));
const x = computed(() => scalePoint<string>().domain(labels.value).range([margin.left, width.value - margin.right]).padding(0.5));
const y = computed(() => {
  const minValue = Math.min(...props.data.map((item) => item.low), 0);
  const maxValue = Math.max(...props.data.map((item) => item.high), 1);
  return scaleLinear().domain([minValue, maxValue]).nice().range([props.height - margin.bottom, margin.top]);
});
const ticks = computed(() => y.value.ticks(4));
const candleWidth = computed(() => Math.max(3, Math.min(18, ((width.value - margin.left - margin.right) / Math.max(1, props.data.length)) * 0.58)));
const activeRows = computed<TooltipRow[]>(() => active.value ? ([
  { id: "open", label: "Abertura", value: active.value.open, color: "#8f8795", formatValue: props.formatValue },
  { id: "high", label: "Máxima", value: active.value.high, color: props.positiveColor, formatValue: props.formatValue },
  { id: "low", label: "Mínima", value: active.value.low, color: props.negativeColor, formatValue: props.formatValue },
  { id: "close", label: "Fechamento", value: active.value.close, color: active.value.close >= active.value.open ? props.positiveColor : props.negativeColor, formatValue: props.formatValue },
]) : []);
function handlePointerMove(event: PointerEvent) {
  if (!host.value || !props.data.length) return;
  const bounds = host.value.getBoundingClientRect();
  const localX = event.clientX - bounds.left;
  const chartX = localX * width.value / Math.max(1, bounds.width);
  const label = labels.value.reduce((best, item) => Math.abs((x.value(item) ?? 0) - chartX) < Math.abs((x.value(best) ?? 0) - chartX) ? item : best, labels.value[0]);
  active.value = props.data.find((item) => item.label === label) ?? null;
}
</script>

<template>
  <div ref="host" class="bklit-chart" :style="{ height: `${height}px` }">
    <svg class="bklit-chart-svg" :viewBox="`0 0 ${width} ${height}`" role="img" aria-label="Gráfico candlestick" @pointermove="handlePointerMove" @pointerleave="active = null">
      <g class="bklit-grid">
        <g v-for="tick in ticks" :key="tick"><line :x1="margin.left" :x2="width - margin.right" :y1="y(tick)" :y2="y(tick)" /><text :x="margin.left - 10" :y="y(tick) + 4" text-anchor="end">{{ formatValue(tick) }}</text></g>
      </g>
      <g v-for="item in data" :key="item.label" class="bklit-candle">
        <line :x1="x(item.label)" :x2="x(item.label)" :y1="y(item.high)" :y2="y(item.low)" :stroke="item.close >= item.open ? positiveColor : negativeColor" stroke-width="1.5" />
        <rect :x="(x(item.label) ?? 0) - candleWidth / 2" :y="Math.min(y(item.open), y(item.close))" :width="candleWidth" :height="Math.max(1.5, Math.abs(y(item.open) - y(item.close)))" :fill="item.close >= item.open ? positiveColor : negativeColor" rx="1.5" />
      </g>
      <g class="bklit-x-axis"><text v-for="item in data" :key="item.label" :x="x(item.label)" :y="height - 10" text-anchor="middle">{{ item.label }}</text></g>
    </svg>
    <BklitTooltip :open="active !== null" :x="width / 2" :y="36" :container-width="width" :container-height="height" :label="active?.label ?? ''" :rows="activeRows" :format-value="formatValue" />
  </div>
</template>
