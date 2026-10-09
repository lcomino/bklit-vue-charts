<script setup lang="ts">
import { computed, ref } from "vue";

export interface FunnelStage { label: string; value: number; color?: string; displayValue?: string }
const props = withDefaults(defineProps<{ data: FunnelStage[]; height?: number; color?: string; showPercentage?: boolean; formatValue?: (value: number) => string }>(), {
  height: 320, color: "#7355e8", showPercentage: true, formatValue: (value: number) => value.toLocaleString(),
});
const width = 720;
const activeIndex = ref<number | null>(null);
const maxValue = computed(() => Math.max(1, ...props.data.map((item) => item.value)));
const stepHeight = computed(() => Math.max(30, (props.height - 28) / Math.max(1, props.data.length)));
const segments = computed(() => props.data.map((item, index) => {
  const top = 14 + index * stepHeight.value;
  const currentWidth = 560 * item.value / maxValue.value;
  const nextValue = props.data[index + 1]?.value ?? 0;
  const nextWidth = 560 * nextValue / maxValue.value;
  const center = width / 2;
  return { ...item, index, top, topLeft: center - currentWidth / 2, topRight: center + currentWidth / 2, bottomLeft: center - nextWidth / 2, bottomRight: center + nextWidth / 2, pct: item.value / maxValue.value * 100 };
}));
</script>

<template>
  <div class="bklit-funnel" :style="{ height: `${height}px` }">
    <svg class="bklit-funnel-svg" :viewBox="`0 0 ${width} ${height}`" role="img" aria-label="Gráfico de funil">
      <g v-for="stage in segments" :key="stage.label" class="bklit-funnel-stage" :class="{ 'is-active': activeIndex === stage.index, 'is-muted': activeIndex !== null && activeIndex !== stage.index }" @pointerenter="activeIndex = stage.index" @pointerleave="activeIndex = null">
        <polygon :points="`${stage.topLeft},${stage.top} ${stage.topRight},${stage.top} ${stage.bottomRight},${stage.top + stepHeight - 4} ${stage.bottomLeft},${stage.top + stepHeight - 4}`" :fill="stage.color ?? color" :opacity="0.92 - stage.index * 0.07" />
        <text :x="width / 2" :y="stage.top + stepHeight / 2 - 2" text-anchor="middle" class="bklit-funnel-label">{{ stage.label }} · {{ stage.displayValue ?? formatValue(stage.value) }}<tspan v-if="showPercentage"> · {{ stage.pct.toFixed(1) }}%</tspan></text>
      </g>
    </svg>
  </div>
</template>
