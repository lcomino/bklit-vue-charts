export type CartesianKind = "line" | "area" | "bar";
export type CartesianChartKind = CartesianKind | "composed";
export type AxisSide = "left" | "right";

export interface ChartPoint {
  label: string;
  value: number;
}

export interface ChartSeries {
  id: string;
  name: string;
  data: ChartPoint[];
  color?: string;
  kind?: CartesianKind;
  axisId?: string;
  formatValue?: (value: number) => string;
}

export interface ChartAxis {
  id: string;
  side?: AxisSide;
  label?: string;
  min?: number;
  max?: number;
  tickFormat?: (value: number) => string;
}

export interface PieDatum {
  id: string;
  name: string;
  value: number;
  color?: string;
}

export interface TooltipRow {
  id: string;
  label: string;
  value: number;
  color: string;
  formatValue?: (value: number) => string;
  kind?: CartesianKind;
}

export const chartPalette = [
  "#7355e8",
  "#1ca37a",
  "#d99232",
  "#df5b7b",
  "#4389d6",
  "#2a9e9c",
  "#c84f99",
  "#586fc9",
];
