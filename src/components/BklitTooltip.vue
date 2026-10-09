<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import BklitRollingNumber from "./BklitRollingNumber.vue";
import type { TooltipRow } from "../types";

const props = defineProps<{
  open: boolean;
  x: number;
  y: number;
  containerWidth: number;
  containerHeight: number;
  label: string;
  rows: TooltipRow[];
  total?: number;
  formatValue?: (value: number) => string;
}>();
const panel = ref<HTMLDivElement | null>(null);
const panelSize = ref({ width: 220, height: 64 });
let observer: ResizeObserver | undefined;
const left = computed(() => {
  const margin = 8;
  const gap = 14;
  const width = Math.min(panelSize.value.width, Math.max(0, props.containerWidth - margin * 2));
  const rightSpace = props.containerWidth - margin - (props.x + gap);
  const leftSpace = props.x - gap - margin;
  const preferred = rightSpace >= width
    ? props.x + gap
    : leftSpace >= width
      ? props.x - width - gap
      : rightSpace >= leftSpace
        ? props.x + gap
        : props.x - width - gap;
  const maxLeft = Math.max(margin, props.containerWidth - width - margin);
  return Math.max(margin, Math.min(maxLeft, preferred));
});
const top = computed(() => Math.max(8, Math.min(props.containerHeight - panelSize.value.height - 8, props.y - panelSize.value.height / 2)));

watch(() => props.open, async (open) => {
  if (!open) {
    observer?.disconnect();
    return;
  }
  await nextTick();
  if (!panel.value || typeof ResizeObserver === "undefined") return;
  const measure = () => {
    if (!panel.value) return;
    const bounds = panel.value.getBoundingClientRect();
    panelSize.value = { width: bounds.width, height: bounds.height };
  };
  observer?.disconnect();
  observer = new ResizeObserver(measure);
  observer.observe(panel.value);
  measure();
}, { flush: "post", immediate: true });
onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <Transition name="bklit-tooltip">
    <div
      ref="panel"
      v-if="open"
      class="bklit-tooltip"
      :style="{ left: `${left}px`, top: `${top}px` }"
      role="tooltip"
    >
      <Transition name="bklit-date">
        <div :key="label" class="bklit-tooltip-date">{{ label }}</div>
      </Transition>
      <div v-for="row in rows" :key="row.id" class="bklit-tooltip-row">
        <span class="bklit-tooltip-name">
          <span
            class="bklit-tooltip-marker"
            :class="{ 'bklit-tooltip-marker-line': row.kind === 'line' }"
            :style="{ '--series-color': row.color }"
          />
          <span>{{ row.label }}</span>
        </span>
        <BklitRollingNumber
          class="bklit-tooltip-value"
          :value="row.value"
          :format-value="row.formatValue ?? formatValue"
          :duration="220"
          :animate-on-mount="false"
        />
      </div>
      <div v-if="total !== undefined" class="bklit-tooltip-total">
        <span>Total</span>
        <BklitRollingNumber :value="total" :format-value="formatValue" :duration="220" :animate-on-mount="false" />
      </div>
    </div>
  </Transition>
</template>
