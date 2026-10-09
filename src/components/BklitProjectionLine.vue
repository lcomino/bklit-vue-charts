<script setup lang="ts">
withDefaults(defineProps<{ x1: number; y1: number; x2: number; y2: number; color?: string; width?: number; label?: string }>(), { color: "#7355e8", width: 1.75, label: "" });
</script>
<template><g class="bklit-projection-line"><line :x1="x1" :y1="y1" :x2="x2" :y2="y2" :stroke="color" :stroke-width="width" stroke-dasharray="5 4" /><circle :cx="x2" :cy="y2" r="3.5" :fill="color" /><text v-if="label" :x="x2 + 7" :y="y2 - 7" :fill="color">{{ label }}</text></g></template>
