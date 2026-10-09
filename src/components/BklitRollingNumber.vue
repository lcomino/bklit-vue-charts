<script setup lang="ts">
import { toRef } from "vue";
import { useAnimatedNumber } from "../composables/useAnimatedNumber";

const props = withDefaults(defineProps<{
  value: number;
  formatValue?: (value: number) => string;
  duration?: number;
  animateOnMount?: boolean;
}>(), {
  formatValue: (value: number) => Math.round(value).toLocaleString(),
  duration: 420,
  animateOnMount: false,
});

const display = useAnimatedNumber(
  toRef(props, "value"),
  (value) => props.formatValue(value),
  props.duration,
  props.animateOnMount,
);
</script>

<template>
  <span class="bklit-rolling-number">{{ display }}</span>
</template>
