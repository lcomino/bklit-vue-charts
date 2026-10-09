<script setup lang="ts">
import BklitRollingNumber from "./BklitRollingNumber.vue";
import type { TooltipRow } from "../types";

withDefaults(defineProps<{
  open: boolean;
  x: number;
  y: number;
  label: string;
  rows: TooltipRow[];
  total?: number;
  formatValue?: (value: number) => string;
}>(), {
  total: undefined,
  formatValue: (value: number) => value.toLocaleString(),
});
</script>

<template>
  <Transition name="bklit-tooltip">
    <div
      v-if="open"
      class="bklit-tooltip"
      :style="{ left: `${x}px`, top: `${y}px` }"
      role="status"
      aria-live="polite"
    >
      <Transition name="bklit-date" mode="out-in">
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
        />
      </div>
      <div v-if="total !== undefined" class="bklit-tooltip-total">
        <span>Total</span>
        <BklitRollingNumber :value="total" :format-value="formatValue" :duration="220" />
      </div>
    </div>
  </Transition>
</template>
