<script setup lang="ts">
withDefaults(defineProps<{ x: number; y: number; label?: string; color?: string; value?: string; anchor?: "start" | "middle" | "end" }>(), { label: "", color: "#7355e8", value: "", anchor: "start" });
</script>
<template><g class="bklit-custom-indicator"><circle :cx="x" :cy="y" r="4" :fill="color" stroke="white" stroke-width="2" /><line :x1="x" :x2="x" :y1="y + 6" :y2="y + 24" :stroke="color" stroke-dasharray="3 3" /><text :x="x + (anchor === 'start' ? 8 : anchor === 'end' ? -8 : 0)" :y="y - 9" :text-anchor="anchor" :fill="color">{{ label }}<tspan v-if="value" dx="5" font-weight="600">{{ value }}</tspan></text></g></template>
