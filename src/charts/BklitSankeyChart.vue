<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { sankey, sankeyCenter, sankeyLinkHorizontal } from "d3-sankey";
import type { SankeyGraph, SankeyLink as LayoutLink, SankeyNode as LayoutNode } from "d3-sankey";

export interface SankeyNode { id: string; name: string; color?: string }
export interface SankeyLink { source: string; target: string; value: number; color?: string }
type LayoutNodeData = SankeyNode & { index?: number; x0?: number; x1?: number; y0?: number; y1?: number; value?: number };
type LayoutLinkData = SankeyLink & { index?: number; width?: number; y0?: number; y1?: number };

const props = withDefaults(defineProps<{ nodes: SankeyNode[]; links: SankeyLink[]; height?: number; nodeWidth?: number; nodePadding?: number }>(), {
  height: 360,
  nodeWidth: 16,
  nodePadding: 24,
});

const host = ref<HTMLDivElement | null>(null);
const width = ref(720);
const activeNode = ref<string | null>(null);
let observer: ResizeObserver | undefined;

onMounted(() => {
  if (host.value && typeof ResizeObserver !== "undefined") {
    observer = new ResizeObserver(([entry]) => {
      if (entry) width.value = Math.max(320, entry.contentRect.width);
    });
    observer.observe(host.value);
  }
});
onBeforeUnmount(() => observer?.disconnect());

const graph = computed<SankeyGraph<LayoutNodeData, LayoutLinkData> | null>(() => {
  if (props.nodes.length < 2 || !props.links.length) return null;
  const margin = { top: 28, right: 112, bottom: 28, left: 112 };
  const plotWidth = Math.max(96, width.value - margin.left - margin.right);
  const plotHeight = Math.max(80, props.height - margin.top - margin.bottom);
  try {
    const layout = sankey<LayoutNodeData, LayoutLinkData>()
      .nodeId((node) => node.id)
      .nodeWidth(Math.min(props.nodeWidth, Math.max(8, plotWidth / 8)))
      .nodePadding(props.nodePadding)
      .nodeAlign(sankeyCenter)
      .extent([[0, 0], [plotWidth, plotHeight]]);
    const data = layout({
      nodes: props.nodes.map((node) => ({ ...node })),
      links: props.links.filter((link) => link.value > 0).map((link) => ({ ...link })),
    });
    return {
      nodes: data.nodes.map((node) => ({ ...node, x0: (node.x0 ?? 0) + margin.left, x1: (node.x1 ?? 0) + margin.left, y0: (node.y0 ?? 0) + margin.top, y1: (node.y1 ?? 0) + margin.top })),
      links: data.links.map((link) => {
        const source = link.source as LayoutNodeData;
        const target = link.target as LayoutNodeData;
        return { ...link, source: { ...source, x0: (source.x0 ?? 0) + margin.left, x1: (source.x1 ?? 0) + margin.left, y0: (source.y0 ?? 0) + margin.top, y1: (source.y1 ?? 0) + margin.top }, target: { ...target, x0: (target.x0 ?? 0) + margin.left, x1: (target.x1 ?? 0) + margin.left, y0: (target.y0 ?? 0) + margin.top, y1: (target.y1 ?? 0) + margin.top } };
      }),
    } as SankeyGraph<LayoutNodeData, LayoutLinkData>;
  } catch {
    // Invalid cyclic/empty input should not break the containing dashboard.
    return null;
  }
});

const paths = computed(() => {
  if (!graph.value) return [];
  const path = sankeyLinkHorizontal<LayoutNodeData, LayoutLinkData>();
  return graph.value.links.flatMap((link, index) => {
    const d = path(link as LayoutLink<LayoutNodeData, LayoutLinkData>) ?? "";
    const source = link.source as LayoutNodeData;
    const target = link.target as LayoutNodeData;
    if (!d) return [];
    return [{ ...link, index, d, sourceId: source.id, targetId: target.id, sourceX: source.x1 ?? 0, targetX: target.x0 ?? 0, sourceColor: link.color ?? source.color ?? "#7355e8", targetColor: link.color ?? target.color ?? source.color ?? "#7355e8" }];
  });
});

const nodes = computed(() => graph.value?.nodes.map((node) => {
  const x0 = node.x0 ?? 0;
  const x1 = node.x1 ?? x0 + props.nodeWidth;
  const y0 = node.y0 ?? 0;
  const y1 = node.y1 ?? y0 + 1;
  const leftSide = (x0 + x1) / 2 < width.value / 2;
  return { ...node, x0, x1, y0, y1, centerY: (y0 + y1) / 2, leftSide };
}) ?? []);

function linkIsMuted(link: { sourceId: string; targetId: string }) {
  return activeNode.value !== null && link.sourceId !== activeNode.value && link.targetId !== activeNode.value;
}
</script>

<template>
  <div ref="host" class="bklit-chart bklit-sankey-wrap" :style="{ height: `${height}px` }">
    <svg class="bklit-sankey-svg" :viewBox="`0 0 ${width} ${height}`" role="img" aria-label="Diagrama Sankey" @pointerleave="activeNode = null">
      <defs>
        <linearGradient v-for="link in paths" :id="`bklit-sankey-gradient-${link.index}`" :key="`gradient-${link.index}`" gradientUnits="userSpaceOnUse" :x1="link.sourceX" :x2="link.targetX" y1="0" y2="0">
          <stop offset="0%" :stop-color="link.sourceColor" stop-opacity=".52" />
          <stop offset="100%" :stop-color="link.targetColor" stop-opacity=".24" />
        </linearGradient>
      </defs>
      <path v-for="link in paths" :key="link.index" :d="link.d" fill="none" :stroke="`url(#bklit-sankey-gradient-${link.index})`" :stroke-width="Math.max(1, link.width ?? 1)" class="bklit-sankey-link" :class="{ 'is-muted': linkIsMuted(link), 'is-active': activeNode === link.sourceId || activeNode === link.targetId }" @pointerenter="activeNode = link.sourceId" />
      <g v-for="node in nodes" :key="node.id" class="bklit-sankey-node" :class="{ 'is-muted': activeNode !== null && activeNode !== node.id }" @pointerenter="activeNode = node.id">
        <rect :x="node.x0" :y="node.y0" :width="node.x1 - node.x0" :height="Math.max(1, node.y1 - node.y0)" rx="4" :fill="node.color ?? '#7355e8'" />
        <text :x="node.leftSide ? node.x0 - 12 : node.x1 + 12" :y="node.centerY" :text-anchor="node.leftSide ? 'end' : 'start'" dominant-baseline="middle" class="bklit-sankey-label">{{ node.name }}</text>
        <text :x="node.leftSide ? node.x0 - 12 : node.x1 + 12" :y="node.centerY + 15" :text-anchor="node.leftSide ? 'end' : 'start'" dominant-baseline="middle" class="bklit-sankey-value">{{ Math.round(node.value ?? 0).toLocaleString() }}</text>
      </g>
    </svg>
  </div>
</template>
