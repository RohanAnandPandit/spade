import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  App as AntdApp,
  Space,
  Spin,
  Switch,
  Tabs,
  TabsProps,
  Tooltip,
} from "antd";
import { ChartType, QueryAnalysis, QueryResults } from "../../types";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/store";
import {
  AiOutlineAreaChart,
  AiOutlineBarChart,
  AiOutlineRadarChart,
} from "react-icons/ai";
import { HiOutlineGlobe } from "react-icons/hi";
import {
  BsBodyText,
  BsCalendar3,
  BsLightbulb,
  BsPieChart,
} from "react-icons/bs";
import { BiLineChart, BiScatterChart } from "react-icons/bi";
import {
  TbChartSankey,
  TbChartTreemap,
  TbCircles,
  TbGridDots,
} from "react-icons/tb";
import { VscGraphScatter } from "react-icons/vsc";
import { ImSphere, ImTree } from "react-icons/im";
import { TiChartPieOutline } from "react-icons/ti";

import "./Charts.css";
import Fullscreen from "./Fullscreen";
import {
  getAllRelations,
  getRecommendedCharts,
  inferVariableCategories,
} from "../../utils/charts";
import { Suggested } from "../analysis/Suggested";
import { IoMdGitNetwork } from "react-icons/io";
import { MdOutlineStackedBarChart } from "react-icons/md";
import { RiBarChartGroupedFill } from "react-icons/ri";

const AreaChart = lazy(() => import("../charts/AreaChart"));
const BarChart = lazy(() => import("../charts/BarChart"));
const BubbleChart = lazy(() => import("../charts/BubbleChart"));
const CalendarChart = lazy(() => import("../charts/CalendarChart"));
const ChordDiagram = lazy(() => import("../charts/ChordDiagram"));
const ChoroplethMap = lazy(() => import("../charts/ChoroplethMap"));
const CirclePacking = lazy(() =>
  import("../charts/CirclePacking").then((module) => ({
    default: module.CirclePacking,
  }))
);
const GroupedBarChart = lazy(() => import("../charts/GroupedBarChart"));
const HeatMap = lazy(() => import("../charts/HeatMap"));
const HierarchyTree = lazy(() => import("../charts/HierarchyTree"));
const LineChart = lazy(() => import("../charts/LineChart"));
const NetworkChart = lazy(() => import("../charts/NetworkChart"));
const PieChart = lazy(() => import("../charts/PieChart"));
const SankeyChart = lazy(() => import("../charts/SankeyChart"));
const ScatterChart = lazy(() => import("../charts/ScatterChart"));
const SpiderChart = lazy(() => import("../charts/SpiderChart"));
const StackedBarChart = lazy(() => import("../charts/StackedBarChart"));
const SunburstChart = lazy(() => import("../charts/SunburstChart"));
const TreeMap = lazy(() => import("../charts/TreeMap"));
const WordCloud = lazy(() => import("../charts/WordCloud"));

type ChartsProps = {
  results: QueryResults;
  queryAnalysis: QueryAnalysis | null;
};

const EMPTY_ANALYSIS: QueryAnalysis = {
  pattern: null,
  visualisations: [],
  variables: {
    key: [],
    scalar: [],
    geographical: [],
    temporal: [],
    lexical: [],
    date: [],
    numeric: [],
    object: [],
  },
};

const Charts = observer(({ results, queryAnalysis }: ChartsProps) => {
  const rootStore = useStore();
  const settings = rootStore.settingsStore;
  const showAllCharts = settings.showAllCharts();
  const [loading, setLoading] = useState<boolean>(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState(0);
  const { message } = AntdApp.useApp();
  const fallbackWidth =
    window.innerWidth -
    (settings.fullScreen()
      ? 0
      : settings.sidebarCollapsed()
        ? 64
        : settings.sidebarWidth()) -
    120;
  const chartWidth = Math.max(240, (contentWidth || fallbackWidth) - 24);

  const chartHeight = settings.fullScreen()
    ? Math.max(320, settings.screenHeight() - 140)
    : Math.max(280, Math.min(480, settings.screenHeight() * 0.48));

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const updateWidth = () => setContentWidth(content.clientWidth);
    updateWidth();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(updateWidth);
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  const analysis = useMemo(
    () =>
      queryAnalysis ?? {
        ...EMPTY_ANALYSIS,
        variables: inferVariableCategories(results),
      },
    [queryAnalysis, results]
  );

  const chartTabs: TabsProps["items"] = useMemo(() => {
    return [
      {
        key: ChartType.BAR,
        label: (
          <>
            <AiOutlineBarChart size={20} /> Bar
          </>
        ),
        children: (
          <BarChart
            results={results}
            width={chartWidth}
            height={chartHeight}
            variables={analysis.variables}
          />
        ),
      },
      {
        key: ChartType.PIE,
        label: (
          <>
            <BsPieChart size={18} /> Pie
          </>
        ),
        children: (
          <PieChart
            results={results}
            width={chartWidth}
            height={chartHeight}
            variables={analysis.variables}
          />
        ),
      },
      {
        key: ChartType.LINE,
        label: (
          <>
            <BiLineChart size={18} /> Line
          </>
        ),
        children: (
          <LineChart
            results={results}
            width={chartWidth}
            height={chartHeight}
            variables={analysis.variables}
          />
        ),
      },
      {
        key: ChartType.AREA,
        label: (
          <>
            <AiOutlineAreaChart size={18} /> Area
          </>
        ),
        children: (
          <AreaChart
            results={results}
            width={chartWidth}
            height={chartHeight}
            variables={analysis.variables}
          />
        ),
      },
      {
        key: ChartType.TREE_MAP,
        label: (
          <>
            <TbChartTreemap size={18} /> Treemap
          </>
        ),
        children: (
          <TreeMap
            results={results}
            width={chartWidth}
            height={chartHeight}
            variables={analysis.variables}
          />
        ),
      },
      {
        key: ChartType.CIRCLE_PACKING,
        label: (
          <>
            <TbCircles size={18} /> Circle Packing
          </>
        ),
        children: (
          <CirclePacking
            results={results}
            width={chartWidth}
            height={chartHeight}
            variables={analysis.variables}
          />
        ),
      },
      {
        key: ChartType.SUNBURST,
        label: (
          <>
            <TiChartPieOutline size={20} /> Sunburst
          </>
        ),
        children: (
          <SunburstChart
            results={results}
            width={chartWidth}
            height={chartHeight}
            variables={analysis.variables}
          />
        ),
      },
      {
        key: ChartType.SPIDER,
        label: (
          <>
            <AiOutlineRadarChart size={18} /> Spider
          </>
        ),
        children: (
          <SpiderChart
            results={results}
            width={chartWidth}
            height={chartHeight}
            variables={analysis.variables}
          />
        ),
      },
      {
        key: ChartType.STACKED_BAR,
        label: (
          <>
            <MdOutlineStackedBarChart size={20} /> Stacked Bar
          </>
        ),
        children: (
          <StackedBarChart
            results={results}
            width={chartWidth}
            height={chartHeight}
            variables={analysis.variables}
          />
        ),
      },
      {
        key: ChartType.GROUPED_BAR,
        label: (
          <>
            <RiBarChartGroupedFill size={20} /> Grouped Bar
          </>
        ),
        children: (
          <GroupedBarChart
            results={results}
            width={chartWidth}
            height={chartHeight}
            variables={analysis.variables}
          />
        ),
      },
      {
        key: ChartType.SANKEY,
        label: (
          <>
            <TbChartSankey size={18} /> Sankey
          </>
        ),
        children: (
          <SankeyChart
            results={results}
            width={chartWidth}
            height={chartHeight}
            variables={analysis.variables}
          />
        ),
      },
      {
        key: ChartType.SCATTER,
        label: (
          <>
            <VscGraphScatter size={18} /> Scatter
          </>
        ),
        children: (
          <ScatterChart
            results={results}
            width={chartWidth}
            height={chartHeight}
            variables={analysis.variables}
          />
        ),
      },
      {
        key: ChartType.BUBBLE,
        label: (
          <>
            <BiScatterChart size={18} /> Bubble
          </>
        ),
        children: (
          <BubbleChart
            results={results}
            width={chartWidth}
            height={chartHeight}
            variables={analysis.variables}
          />
        ),
      },
      {
        key: ChartType.CHORD_DIAGRAM,
        label: (
          <>
            <ImSphere size={18} /> Chord
          </>
        ),
        children: (
          <ChordDiagram
            results={results}
            width={chartWidth}
            height={chartHeight}
            variables={analysis.variables}
          />
        ),
      },
      {
        key: ChartType.HEAT_MAP,
        label: (
          <>
            <TbGridDots size={20} /> Heat Map
          </>
        ),
        children: (
          <HeatMap
            results={results}
            width={chartWidth}
            height={chartHeight}
            variables={analysis.variables}
          />
        ),
      },
      {
        key: ChartType.WORD_CLOUD,
        label: (
          <>
            <BsBodyText size={18} /> Word Cloud
          </>
        ),
        children: (
          <>
            <WordCloud
              results={results}
              width={chartWidth}
              height={chartHeight}
              variables={analysis.variables}
            />
          </>
        ),
      },
      {
        key: ChartType.CALENDAR,
        label: (
          <>
            <BsCalendar3 size={20} /> Calendar
          </>
        ),
        children: (
          <CalendarChart
            results={results}
            width={chartWidth}
            height={chartHeight}
            variables={analysis.variables}
          />
        ),
      },
      {
        key: ChartType.HIERARCHY_TREE,
        label: (
          <>
            <ImTree size={20} /> Hierarchy Tree
          </>
        ),
        children: (
          <HierarchyTree
            results={results}
            width={chartWidth}
            height={chartHeight}
            variables={analysis.variables}
          />
        ),
      },
      {
        key: ChartType.NETWORK,
        label: (
          <>
            <IoMdGitNetwork size={20} /> Network
          </>
        ),
        children: (
          <NetworkChart
            results={results}
            width={chartWidth}
            height={chartHeight}
            variables={analysis.variables}
          />
        ),
      },
      {
        key: ChartType.CHOROPLETH_MAP,
        label: (
          <>
            <HiOutlineGlobe size={20} /> Choropleth Map
          </>
        ),
        children: (
          <ChoroplethMap
            results={results}
            width={chartWidth}
            height={chartHeight}
            variables={analysis.variables}
          />
        ),
      },
    ];
  }, [analysis.variables, chartHeight, chartWidth, results]);

  const [recommendedCharts, setRecommendedCharts] = useState<ChartType[]>([]);

  const possibleCharts = useMemo(() => {
    const isSuitable = (key: ChartType) =>
      recommendedCharts.includes(key) &&
      (!analysis.pattern || analysis.visualisations.includes(key));
    return showAllCharts
      ? chartTabs.map((tab) =>
          isSuitable(tab.key as ChartType)
            ? tab
            : {
                ...tab,
                children: (
                  <div className="charts-empty" role="status">
                    <strong>Chart unavailable for this query</strong>
                    <span>Try a suggested chart or adjust the query.</span>
                  </div>
                ),
              }
        )
      : chartTabs.filter(({ key }) => isSuitable(key as ChartType));
  }, [
    chartTabs,
    analysis.pattern,
    analysis.visualisations,
    recommendedCharts,
    showAllCharts,
  ]);

  const { allRelations, allIncomingLinks, allOutgoingLinks } = useMemo(() => {
    return getAllRelations(results, analysis.variables.key);
  }, [analysis.variables.key, results]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getRecommendedCharts(
      analysis.variables,
      allRelations,
      results,
      queryAnalysis !== null
    )
      .then((charts) => {
        if (active) setRecommendedCharts(charts);
      })
      .catch(() => {
        if (active) message.error("Could not determine recommended charts.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [allRelations, analysis.variables, message, queryAnalysis, results]);

  return (
    <Fullscreen
      toolbar={
        <Tooltip title="Include chart types that may not suit these results">
          <Space className="charts-options" size={6}>
            <Switch
              size="small"
              aria-label="Show all charts"
              checked={showAllCharts}
              onChange={(checked) => settings.setShowAllCharts(checked)}
            />
            <span>All charts</span>
          </Space>
        </Tooltip>
      }
    >
      <div className="charts-content" ref={contentRef}>
        <Spin spinning={loading}>
          <Suspense fallback={<Spin />}>
            <Tabs
              className="charts-view"
              size="small"
              key={queryAnalysis ? "analysed" : recommendedCharts.join(",")}
              defaultActiveKey={
                !queryAnalysis && recommendedCharts.includes(ChartType.BAR)
                  ? ChartType.BAR
                  : "Suggested"
              }
              items={[
                {
                  key: "Suggested",
                  label: (
                    <>
                      <BsLightbulb size={17} /> Suggested
                    </>
                  ),
                  children: (
                    <Suggested
                      results={results}
                      variables={analysis.variables}
                      allRelations={allRelations}
                      allIncomingLinks={allIncomingLinks}
                      allOutgoingLinks={allOutgoingLinks}
                    />
                  ),
                },
                ...possibleCharts,
              ].map((item) => ({
                ...item,
                label: (
                  <Tooltip title={item.key}>
                    <span className="charts-tab-label">{item.label}</span>
                  </Tooltip>
                ),
              }))}
            />
          </Suspense>
        </Spin>
      </div>
    </Fullscreen>
  );
});

export default Charts;
