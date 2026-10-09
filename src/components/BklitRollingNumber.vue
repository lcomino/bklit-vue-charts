<script setup lang="ts">
import { toRef } from "vue";
import { useAnimatedNumber } from "../composables/useAnimatedNumber";

const props = withDefaults(defineProps<{
  value: number;
  formatValue?: (value: number) => string;
  duration?: number;
}>(), {
  formatValue: (value: number) => Math.round(value).toLocaleString(),
  duration: 260,
});

const display = useAnimatedNumber(toRef(props, "value"), (value) => props.formatValue(value), props.duration);
</script>

<template>
  <span class="bklit-rolling-number" aria-live="polite" aria-atomic="true">{{ display }}</span>
</template>
