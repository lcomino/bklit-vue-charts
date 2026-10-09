<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import BklitRollingNumber from "../components/BklitRollingNumber.vue";
import { chartPalette, type RingDatum } from "../types";
import BklitRingLayer from "./BklitRingLayer.vue";

const props = withDefaults(defineProps<{
  data: RingDatum[];
  size?: number;
  height?: number;
  strokeWidth?: number;
  ringGap?: number;
  baseInnerRadius?: number;
  startAngle?: number;
  endAngle?: number;
  centerLabel?: string;
  formatValue?: (value: number) => string;
}>(), {
  size: undefined,
  height: 320,
  strokeWidth: 12,
  ringGap: 6,
  baseInnerRadius: 60,
  startAngle: -Math.PI / 2,
  endAngle: (3 * Math.PI) / 2,
  centerLabel: "Total",
  formatValue: (value: number) => value.toLocaleString(),
});

const hoveredIndex = ref<number | null>(null);
let clearHoverTimer = 0;
function setHoveredIndex(index: number | null) {
  window.clearTimeout(clearHoverTimer);
  if (index !== null) hoveredIndex.value = index;
  else clearHoverTimer = window.setTimeout(() => { hoveredIndex.value = null; }, 55);
}
onBeforeUnmount(() => window.clearTimeout(clearHoverTimer));
const chartSize = computed(() => props.size ?? Math.min(360, props.height));
const center = computed(() => chartSize.value / 2);
const availableRadius = computed(() => Math.max(20, center.value - 8));
const designOuterRadius = computed(() => props.baseInnerRadius + Math.max(0, props.data.length - 1) * (props.strokeWidth + props.ringGap) + props.strokeWidth);
const scale = computed(() => Math.min(1, availableRadius.value / Math.max(1, designOuterRadius.value)));
const scaledStroke = computed(() => props.strokeWidth * scale.value);
const scaledGap = computed(() => props.ringGap * scale.value);
const scaledInner = computed(() => props.baseInnerRadius * scale.value);
const totalValue = computed(() => props.data.reduce((sum, item) => sum + item.value, 0));
const displayDatum = computed(() => hoveredIndex.value === null ? null : props.data[hoveredIndex.value] ?? null);
const displayValue = computed(() => displayDatum.value?.value ?? totalValue.value);
const displayLabel = computed(() => displayDatum.value?.label ?? props.centerLabel);
const centerStyle = computed(() => ({ width: `${Math.max(20, scaledInner.value * 2 - 16)}px`, height: `${Math.max(20, scaledInner.value * 2 - 16)}px` }));
</script>

<template>
  <div class="bklit-ring-wrap" :style="{ width: `${chartSize}px`, height: `${chartSize}px` }">
    <svg class="bklit-ring-svg" :viewBox="`0 0 ${chartSize} ${chartSize}`" role="img" aria-label="Gráfico de progresso em anéis">
      <g :transform="`translate(${center} ${center})`">
        <BklitRingLayer
          v-for="(item, index) in data"
          :key="item.label"
          :index="index"
          :value="item.value"
          :max-value="item.maxValue ?? 100"
          :color="item.color ?? chartPalette[index % chartPalette.length]"
          :inner-radius="scaledInner + index * (scaledStroke + scaledGap)"
          :outer-radius="scaledInner + index * (scaledStroke + scaledGap) + scaledStroke"
          :start-angle="startAngle"
          :end-angle="endAngle"
          :hovered="hoveredIndex === index"
          :dimmed="hoveredIndex !== null && hoveredIndex !== index"
          :pushed-out="hoveredIndex !== null && hoveredIndex < index"
          @hoverstart="setHoveredIndex(index)"
          @hoverend="setHoveredIndex(null)"
        />
      </g>
    </svg>
    <div class="bklit-ring-center" :style="centerStyle">
      <span class="bklit-pie-center-label">{{ displayLabel }}</span>
      <BklitRollingNumber class="bklit-pie-center-value" :value="displayValue" :format-value="formatValue" :duration="520" :animate-on-mount="true" />
    </div>
  </div>
</template>
