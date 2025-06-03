declare module 'react-plotly.js' {
    import * as React from 'react';
    import { Layout, Data } from 'plotly.js';
  
    export interface PlotParams {
      data: Data[];
      layout?: Partial<Layout>;
      config?: object;
      style?: React.CSSProperties;
      className?: string;
      useResizeHandler?: boolean;
      onInitialized?: (figure: { data: Data[]; layout: Partial<Layout> }) => void;
      onUpdate?: (figure: { data: Data[]; layout: Partial<Layout> }) => void;
    }
  
    const Plot: React.FC<PlotParams>;
    export default Plot;
  }