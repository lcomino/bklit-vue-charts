<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

export interface FunnelStage { label: string; value: number; color?: string; displayValue?: string }
const props = withDefaults(defineProps<{ data: FunnelStage[]; height?: number; color?: string; showPercentage?: boolean; formatValue?: (value: number) => string }>(), {
  height: 320,
  color: "#7355e8",
  showPercentage: true,
  formatValue: (value: number) => value.toLocaleString(),
});

const host = ref<HTMLDivElement | null>(null);
const width = ref(720);
const activeIndex = ref<number | null>(null);
let observer: ResizeObserver | undefined;

onMounted(() => {
  if (host.value && typeof ResizeObserver !== "undefined") {
    observer = new ResizeObserver(([entry]) => {
      if (entry) width.value = Math.max(320, entry.contentRect.width);
    });
    observer.observe(host.value);
  }
});
onBeforeUnmount(() => observer?.disconnect());

const segments = computed(() => {
  if (!props.data.length) return [];
  const gap = 4;
  const top = 16;
  const totalHeight = Math.max(1, props.height - top * 2);
  const segmentHeight = (totalHeight - gap * (props.data.length - 1)) / props.data.length;
  const maxValue = Math.max(1, props.data[0]?.value ?? 0);
  const maxShapeWidth = width.value * 0.82;
  const centerX = width.value / 2;
  return props.data.map((stage, index) => {
    const normStart = Math.max(0, stage.value / maxValue);
    // Bklit's funnel keeps the final stage at its own width, giving the flow a clean end cap.
    const normEnd = Math.max(0, (props.data[index + 1]?.value ?? stage.value) / maxValue);
    const startHalf = normStart * maxShapeWidth * 0.44;
    const endHalf = normEnd * maxShapeWidth * 0.44;
    const y = top + index * (segmentHeight + gap);
    const cx = segmentHeight * 0.55;
    const path = `M ${centerX - startHalf} ${y} C ${centerX - startHalf} ${y + cx}, ${centerX - endHalf} ${y + segmentHeight - cx}, ${centerX - endHalf} ${y + segmentHeight} L ${centerX + endHalf} ${y + segmentHeight} C ${centerX + endHalf} ${y + segmentHeight - cx}, ${centerX + startHalf} ${y + cx}, ${centerX + startHalf} ${y} Z`;
    return { ...stage, index, y, segmentHeight, path, percentage: normStart * 100 };
  });
});
</script>

<template>
  <div ref="host" class="bklit-funnel" :style="{ height: `${height}px` }">
    <svg class="bklit-funnel-svg" :viewBox="`0 0 ${width} ${height}`" role="img" aria-label="Gráfico de funil" @pointerleave="activeIndex = null">
      <g v-for="stage in segments" :key="`shape-${stage.label}`" class="bklit-funnel-shape" :class="{ 'is-active': activeIndex === stage.index, 'is-muted': activeIndex !== null && activeIndex !== stage.index }" @pointerenter="activeIndex = stage.index">
        <path :d="stage.path" :fill="stage.color ?? color" :fill-opacity="0.62 + (stage.index / Math.max(1, segments.length - 1)) * 0.12" />
      </g>
      <g v-for="stage in segments" :key="`label-${stage.label}`" class="bklit-funnel-label-row" :class="{ 'is-active': activeIndex === stage.index, 'is-muted': activeIndex !== null && activeIndex !== stage.index }" @pointerenter="activeIndex = stage.index">
        <rect x="16" :y="stage.y" :width="width - 32" :height="stage.segmentHeight" fill="transparent" />
        <text x="28" :y="stage.y + stage.segmentHeight / 2" dominant-baseline="middle" class="bklit-funnel-value">{{ stage.displayValue ?? formatValue(stage.value) }}</text>
        <g v-if="showPercentage" :transform="`translate(${width / 2},${stage.y + stage.segmentHeight / 2})`">
          <rect x="-31" y="-12" width="62" height="24" rx="12" :fill="stage.color ?? color" fill-opacity=".16" />
          <text y="1" dominant-baseline="middle" text-anchor="middle" class="bklit-funnel-pct">{{ stage.percentage.toFixed(1) }}%</text>
        </g>
        <text :x="width - 28" :y="stage.y + stage.segmentHeight / 2" dominant-baseline="middle" text-anchor="end" class="bklit-funnel-name">{{ stage.label }}</text>
      </g>
    </svg>
  </div>
</template>
