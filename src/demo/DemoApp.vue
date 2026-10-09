<script setup lang="ts">
import {
  BklitAreaChart, BklitBarChart, BklitCandlestickChart, BklitChoroplethChart,
  BklitComposedChart, BklitFunnelChart, BklitGauge, BklitHeatmapChart,
  BklitLineChart, BklitLiveLineChart, BklitPieChart, BklitProfitLossLine,
  BklitRadarChart, BklitRingChart, BklitSankeyChart, BklitScatterChart,
  BklitSunburstChart, BklitAreaStatBlock, BklitLineStatBlock, BklitChoroplethStatBlock,
} from "../index";
import type { ChartAxis, ChartSeries, PieDatum, RingDatum, LiveLinePoint, ChoroplethFeature } from "../index";
import worldCountries from "./data/world-countries.json";

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
const candleData = [
  { label: "Seg", open: 26, high: 34, low: 22, close: 31 }, { label: "Ter", open: 31, high: 37, low: 28, close: 29 },
  { label: "Qua", open: 29, high: 40, low: 27, close: 38 }, { label: "Qui", open: 38, high: 42, low: 34, close: 36 },
  { label: "Sex", open: 36, high: 46, low: 33, close: 44 },
];
const funnelData = [{ label: "Visitantes", value: 12600 }, { label: "Engajaram", value: 8400 }, { label: "Oportunidades", value: 4100 }, { label: "Conversões", value: 1850 }];
const heatmapData = Array.from({ length: 365 }, (_, index) => ({ date: new Date(Date.now() - (364 - index) * 86400000), value: Math.max(0, Math.round(16 + 14 * Math.sin(index * 1.7) + 10 * Math.cos(index * .43))) }));
const scatterData = Array.from({ length: 24 }, (_, index) => ({ x: 12 + index * 3.2, y: 18 + (index * 17 % 29) + Math.sin(index) * 9, label: `Campanha ${index + 1}` }));
const radarSeries = [{ id: "fillrate", name: "Atual", values: [82, 68, 91, 75, 86, 71], color: "#7355e8" }, { id: "benchmark", name: "Meta", values: [72, 78, 74, 82, 70, 80], color: "#1ca37a" }];
const pnlData = [{ label: "Seg", value: 12 }, { label: "Ter", value: 8 }, { label: "Qua", value: -5 }, { label: "Qui", value: 16 }, { label: "Sex", value: 22 }];
const liveData: LiveLinePoint[] = Array.from({ length: 12 }, (_, index) => ({ time: Math.floor(Date.now() / 1000) - (11 - index) * 2, value: 55 + Math.sin(index * .8) * 16 + index }));
const visitorsByCountry: Record<string, number> = { "United States": 18, "United Kingdom": 12, Germany: 17, France: 9, Canada: 8, Australia: 6, Netherlands: 5, Brazil: 7, India: 11, Japan: 4, Spain: 3, Italy: 6, Mexico: 5, Poland: 4, Sweden: 3, Belgium: 2, Switzerland: 2, Austria: 1, Norway: 2, Denmark: 1, Ireland: 3, Portugal: 2, "New Zealand": 1, Finland: 1, "South Africa": 4, Argentina: 3, Indonesia: 2, Philippines: 3, Thailand: 2, Vietnam: 1 };
function visitorColor(value: number) { if (!value) return "#e8e5ec"; if (value >= 17) return "#7355e8"; if (value >= 13) return "#13a77a"; if (value >= 9) return "#dd8c35"; if (value >= 5) return "#5985d8"; return "#a99abe"; }
const choroplethFeatures: ChoroplethFeature[] = worldCountries.features.map((feature, index) => {
  const name = String((feature.properties as { name?: string }).name ?? `Country ${index + 1}`);
  const value = visitorsByCountry[name] ?? 0;
  return { id: String(feature.id ?? name), name, value, color: visitorColor(value), geometry: feature.geometry as ChoroplethFeature["geometry"] };
});
const sankeyNodes = [{ id: "impressions", name: "Impressões", color: "#7355e8" }, { id: "viewable", name: "Visíveis", color: "#8f6eea" }, { id: "clicks", name: "Cliques", color: "#1ca37a" }, { id: "revenue", name: "Receita", color: "#f5ac18" }];
const sankeyLinks = [{ source: "impressions", target: "viewable", value: 90 }, { source: "impressions", target: "clicks", value: 28 }, { source: "viewable", target: "revenue", value: 52 }, { source: "clicks", target: "revenue", value: 18 }];
const sunburstData = { name: "Receita", children: [{ name: "Open auction", children: [{ name: "HB", value: 52 }, { name: "MGID", value: 31 }] }, { name: "Direct", children: [{ name: "Campanhas", value: 42 }, { name: "Outros", value: 19 }] }] };
const revenueStats = [5200, 6100, 5400, 4700, 5100, 6800, 6400, 7200, 6900, 8100, 7600, 8800];
const sessionStats = [920, 1380, 1120, 1580, 1240, 1710, 1460];
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
      <article class="demo-card"><div class="demo-card-heading"><div><h2>Stat card · Area</h2><p>O valor e a tendência acompanham o ponto ativo</p></div></div><BklitAreaStatBlock title="Total Revenue" :value="8100" :trend="12.4" :data="revenueStats" :labels="['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']" :format-value="money" /></article>
      <article class="demo-card"><div class="demo-card-heading"><div><h2>Stat card · Line</h2><p>Realce suave do trecho sob o cursor</p></div></div><BklitLineStatBlock title="Active Sessions" :value="1460" :trend="8.2" :data="sessionStats" :labels="['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']" :format-value="compact" /></article>
      <article class="demo-card"><div class="demo-card-heading"><div><h2>Stat card · Choropleth</h2><p>Resumo com mapa interativo</p></div></div><BklitChoroplethStatBlock title="Visitantes únicos" :value="choroplethFeatures.reduce((sum, feature) => sum + feature.value, 0)" :trend="6.3" :features="choroplethFeatures" :format-value="compact" /></article>
    </section>

    <section class="demo-grid demo-grid-two">
      <article class="demo-card"><div class="demo-card-heading"><div><h2>Candlestick</h2><p>Abertura, máxima, mínima e fechamento</p></div></div><BklitCandlestickChart :data="candleData" :height="280" :format-value="money" /></article>
      <article class="demo-card"><div class="demo-card-heading"><div><h2>Funnel</h2><p>Etapas e conversão acumulada</p></div></div><BklitFunnelChart :data="funnelData" :height="280" /></article>
      <article class="demo-card"><div class="demo-card-heading"><div><h2>Gauge</h2><p>Progresso com entrada animada</p></div></div><BklitGauge :value="78" :height="220" label="Fill rate" /></article>
      <article class="demo-card"><div class="demo-card-heading"><div><h2>Heatmap</h2><p>Atividade diária nas últimas semanas</p></div></div><BklitHeatmapChart :data="heatmapData" :height="220" /></article>
      <article class="demo-card"><div class="demo-card-heading"><div><h2>Scatter</h2><p>Distribuição de desempenho</p></div></div><BklitScatterChart :data="scatterData" :height="280" x-label="Fill rate" y-label="Receita" /></article>
      <article class="demo-card"><div class="demo-card-heading"><div><h2>Radar</h2><p>Comparação de indicadores</p></div></div><BklitRadarChart :metrics="['Viewability','Fill rate','CTR','eCPM','Receita','Cobertura']" :series="radarSeries" :size="300" /></article>
      <article class="demo-card"><div class="demo-card-heading"><div><h2>Profit / loss</h2><p>Transição contínua entre lucro e prejuízo</p></div></div><BklitProfitLossLine :data="pnlData" :height="280" :format-value="money" /></article>
      <article class="demo-card"><div class="demo-card-heading"><div><h2>Live line</h2><p>Janela de dados atualizada em tempo real</p></div></div><BklitLiveLineChart :data="liveData" :value="72" :height="280" :format-value="compact" /></article>
      <article class="demo-card"><div class="demo-card-heading"><div><h2>Choropleth</h2><p>Mapa de intensidade por país</p></div></div><BklitChoroplethChart :features="choroplethFeatures" :height="280" /></article>
      <article class="demo-card"><div class="demo-card-heading"><div><h2>Sankey</h2><p>Fluxo de impressões até receita</p></div></div><BklitSankeyChart :nodes="sankeyNodes" :links="sankeyLinks" :height="280" /></article>
      <article class="demo-card"><div class="demo-card-heading"><div><h2>Sunburst</h2><p>Clique para navegar pela hierarquia</p></div></div><BklitSunburstChart :data="sunburstData" :size="300" /></article>
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
