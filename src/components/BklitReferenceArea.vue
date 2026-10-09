<script setup lang="ts">
withDefaults(defineProps<{ x: number; y: number; width: number; height: number; fill?: string; opacity?: number; label?: string; dashed?: boolean }>(), { fill: "#7355e8", opacity: .1, label: "", dashed: false });
</script>
<template><g class="bklit-reference-area"><rect :x="x" :y="y" :width="width" :height="height" :fill="fill" :fill-opacity="opacity" :stroke="dashed ? fill : 'none'" :stroke-dasharray="dashed ? '4 4' : undefined" /><text v-if="label" :x="x + 6" :y="y + 14" class="bklit-reference-area-label">{{ label }}</text></g></template>
