<script setup lang="ts">
withDefaults(defineProps<{ width: number; height: number; xTicks?: number[]; yTicks?: number[]; horizontal?: boolean; vertical?: boolean; color?: string }>(), { xTicks: () => [], yTicks: () => [], horizontal: true, vertical: false, color: "var(--bklit-grid, #e9e6eb)" });
</script>
<template><g class="bklit-grid"><line v-if="horizontal" v-for="(y, index) in yTicks" :key="`y-${index}`" x1="0" :x2="width" :y1="y" :y2="y" :style="{ stroke: color }" /><line v-if="vertical" v-for="(x, index) in xTicks" :key="`x-${index}`" :x1="x" :x2="x" y1="0" :y2="height" :style="{ stroke: color }" /></g></template>
