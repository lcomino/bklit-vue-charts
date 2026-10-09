<script setup lang="ts">
import { BklitAreaChart, BklitBarChart, BklitComposedChart, BklitLineChart, BklitPieChart, BklitRingChart } from "../index";
import type { ChartAxis, ChartSeries, PieDatum, RingDatum } from "../types";

const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);
const compact = (value: number) => new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(value);

const revenue: ChartSeries[] = [
  { id: "hb", name: "HBAgency", color: "#f5ac18", data: [
    { label: "01 out", value: 36 }, { label: "02 out", value: 23 }, { label: "03 out", value: 26 }, { label: "04 out", value: 21 }, { label: "05 out", value: 8 }, { label: "06 out", value: 22 }, { label: "07 out", value: 0 },
  ], formatValue: money },
  { id: "mgid", name: "MGID", color: "#123c86", data: [
    { label: "01 out", value: 12 }, { label: "02 out", value: 8 }, { label: "03 out", value: 5 }, { label: "04 out", value: 6 }, { label: "05 out", value: 8 }, { label: "06 out", value: 2 }, { label: "07 out", value: 12 },
  ], formatValue: money },
];

const pageviews: ChartSeries = {
  id: "pageviews", name: "Pageviews Fillrate", color: "#34263f", kind: "line", axisId: "pageviews", formatValue: compact,
  data: [
    { label: "01 out", value: 5_000_000 }, { label: "02 out", value: 4_300_000 }, { label: "03 out", value: 3_900_000 }, { label: "04 out", value: 2_700_000 }, { label: "05 out", value: 3_800_000 }, { label: "06 out", value: 5_600_000 }, { label: "07 out", value: 5_900_000 },
  ],
};
const billingSeries = [...revenue.map((series) => ({ ...series, kind: "bar" as const })), pageviews];
const billingAxes: ChartAxis[] = [
  { id: "primary", side: "left", label: "Receita", tickFormat: money },
  { id: "pageviews", side: "right", label: "Pageviews", tickFormat: compact },
];
const revenueArea: ChartSeries[] = [{
  id: "revenue", name: "Receita", color: "#7355e8", formatValue: money,
  data: [
    { label: "01 out", value: 18 }, { label: "02 out", value: 31 }, { label: "03 out", value: 23 }, { label: "04 out", value: 40 }, { label: "05 out", value: 34 }, { label: "06 out", value: 48 }, { label: "07 out", value: 42 },
  ],
}];
const audience: PieDatum[] = [
  { label: "HBAgency", value: 135, color: "#f5ac18" },
  { label: "MGID", value: 48, color: "#123c86" },
  { label: "Sem demanda mapeada", value: 5, color: "#a8adb8" },
];
const performance: RingDatum[] = [
  { label: "Receita", value: 72, maxValue: 100, color: "#7355e8" },
  { label: "Pageviews", value: 58, maxValue: 100, color: "#1ca37a" },
  { label: "Fill rate", value: 86, maxValue: 100, color: "#d99232" },
];
</script>

<template>
  <main class="demo-shell">
    <header class="demo-header">
      <div class="demo-brand-mark">b</div>
      <div>
        <p class="demo-eyebrow">VUE 3 · SVG CHARTS</p>
        <h1>Bklit Vue</h1>
        <p class="demo-subtitle">A chart library for Vue, built with the interaction feel of Bklit UI.</p>
      </div>
      <a class="demo-github" href="https://github.com/bklit/bklit-ui" target="_blank" rel="noreferrer">Upstream reference <span>↗</span></a>
    </header>

    <section class="demo-grid demo-grid-wide">
      <article class="demo-card demo-card-wide">
        <div class="demo-card-heading"><div><h2>Billing · Composed chart</h2><p>Stacked revenue with a pageviews line on its own axis</p></div><span class="demo-badge">INTERACTIVE</span></div>
        <BklitComposedChart :series="billingSeries" :axes="billingAxes" :height="330" :stacked="true" :format-value="money" />
      </article>
      <article class="demo-card">
        <div class="demo-card-heading"><div><h2>Revenue by demand</h2><p>Animated participation and center value</p></div></div>
        <BklitPieChart :data="audience" :height="330" :inner-radius="92" :format-value="money" />
      </article>
    </section>

    <section class="demo-grid demo-grid-two">
      <article class="demo-card">
        <div class="demo-card-heading"><div><h2>Area chart</h2><p>Soft gradient, smooth curve, and crosshair</p></div></div>
        <BklitAreaChart :series="revenueArea" :height="280" :format-value="money" />
      </article>
      <article class="demo-card">
        <div class="demo-card-heading"><div><h2>Bar chart</h2><p>Stacking and legend toggles preserve the scale</p></div></div>
        <BklitBarChart :series="revenue" :height="280" :stacked="true" :format-value="money" />
      </article>
    </section>

    <section class="demo-grid demo-grid-two">
      <article class="demo-card">
        <div class="demo-card-heading"><div><h2>Line chart</h2><p>Left-to-right reveal and rolling tooltip values</p></div></div>
        <BklitLineChart :series="revenueArea" :height="280" :format-value="money" />
      </article>
      <article class="demo-card">
        <div class="demo-card-heading"><div><h2>Progress rings</h2><p>Staggered progress reveal and spring hover</p></div></div>
        <BklitRingChart :data="performance" :size="300" :format-value="compact" />
      </article>
    </section>

    <footer class="demo-footer">Independent community port · Vue 3 + TypeScript + SVG</footer>
  </main>
</template>
