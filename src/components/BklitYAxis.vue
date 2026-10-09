<script setup lang="ts">
withDefaults(defineProps<{ ticks: Array<{ y: number; label: string }>; x: number; color?: string; fontSize?: number }>(), { color: "var(--bklit-muted, #78727d)", fontSize: 11 });
</script>
<template><g class="bklit-y-axis"><text v-for="tick in ticks" :key="`${tick.y}-${tick.label}`" :x="x" :y="tick.y + 4" text-anchor="end" :fill="color" :font-size="fontSize">{{ tick.label }}</text></g></template>
