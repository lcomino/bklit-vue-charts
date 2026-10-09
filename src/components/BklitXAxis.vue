<script setup lang="ts">
withDefaults(defineProps<{ ticks: Array<{ x: number; label: string }>; y: number; color?: string; fontSize?: number }>(), { color: "var(--bklit-muted, #78727d)", fontSize: 11 });
</script>
<template><g class="bklit-x-axis"><text v-for="tick in ticks" :key="tick.label" :x="tick.x" :y="y" text-anchor="middle" :fill="color" :font-size="fontSize">{{ tick.label }}</text></g></template>
