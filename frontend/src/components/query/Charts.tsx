import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { App as AntdApp, Spin, Tabs, TabsProps } from "antd";
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
import { getAllRelations, getRecommendedCharts } from "../../utils/charts";
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
  showAllCharts: boolean;
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

const Charts = observer(
  ({ results, showAllCharts, queryAnalysis }: ChartsProps) => {
    const rootStore = useStore();
    const settings = rootStore.settingsStore;
    const [loading, setLoading] = useState<boolean>(false);
    const { message } = AntdApp.useApp();
    const chartWidth = Math.floor(
      (window.innerWidth -
        (settings.fullScreen() ? 0 : settings.sidebarWidth())) *
        (settings.fullScreen() ? 0.95 : 0.88)
    );

    const chartHeight = settings.fullScreen()
      ? settings.screenHeight()
      : settings.screenHeight() - 325;

    const analysis = queryAnalysis ?? EMPTY_ANALYSIS;

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
      return showAllCharts
        ? chartTabs
        : analysis.pattern
          ? chartTabs.filter(({ key: chartKey }) => {
              return (
                analysis.visualisations.includes(chartKey as ChartType) &&
                recommendedCharts.includes(chartKey as ChartType)
              );
            })
          : chartTabs.filter(({ key }) => {
              return recommendedCharts.includes(key as ChartType);
            });
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
      getRecommendedCharts(analysis.variables, allRelations, results)
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
    }, [allRelations, analysis.variables, message, results]);

    return (
      <Fullscreen>
        <Spin spinning={loading}>
          <Suspense fallback={<Spin />}>
            <Tabs
              defaultActiveKey="1"
              items={[
                {
                  key: "Suggested",
                  label: (
                    <>
                      <BsLightbulb size={15} /> Suggested
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
              ]}
              style={{ padding: 10 }}
            />
          </Suspense>
        </Spin>
      </Fullscreen>
    );
  }
);

export default Charts;
