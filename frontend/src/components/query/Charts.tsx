import { useEffect, useMemo, useState } from "react";
import { Spin, Tabs, TabsProps } from "antd";
import {
  ChartType,
  QueryAnalysis,
  QueryResults,
  RepositoryId,
} from "../../types";
import BarChart from "../charts/BarChart";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/store";
import { AiOutlineAreaChart, AiOutlineBarChart, AiOutlineRadarChart } from "react-icons/ai";
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

import PieChart from "../charts/PieChart";
import LineChart from "../charts/LineChart";
import TreeMap from "../charts/TreeMap";
import SpiderChart from "../charts/SpiderChart";
import SankeyChart from "../charts/SankeyChart";
import ScatterChart from "../charts/ScatterChart";
import "./Charts.css";
import Fullscreen from "./Fullscreen";
import ChordDiagram from "../charts/ChordDiagram";
import { getQueryAnalysis } from "../../api/queries";
import CalendarChart from "../charts/CalendarChart";
import WordCloud from "../charts/WordCloud";
import { CirclePacking } from "../charts/CirclePacking";
import HierarchyTree from "../charts/HierarchyTree";
import SunburstChart from "../charts/SunburstChart";
import HeatMap from "../charts/HeatMap";
import ChoroplethMap from "../charts/ChoroplethMap";
import { getAllRelations, getRecommendedCharts } from "../../utils/charts";
import { Suggested } from "../analysis/Suggested";
import NetworkChart from "../charts/NetworkChart";
import { IoMdGitNetwork } from "react-icons/io";
import { MdOutlineStackedBarChart } from "react-icons/md";
import StackedBarChart from "../charts/StackedBarChart";
import GroupedBarChart from "../charts/GroupedBarChart";
import { RiBarChartGroupedFill } from "react-icons/ri";
import BubbleChart from "../charts/BubbleChart";
import AreaChart from "../charts/AreaChart";

type ChartsProps = {
  query: string;
  results: QueryResults;
  repository: RepositoryId | null;
  showAllCharts: boolean;
};

const Charts = observer(
  ({ query, results, repository, showAllCharts }: ChartsProps) => {
    const rootStore = useStore();
    const settings = rootStore.settingsStore;
    const username = rootStore.authStore.username!;
    const [loading, setLoading] = useState<boolean>(false);
    const chartWidth = Math.floor(
      (window.screen.width -
        (settings.fullScreen() ? 0 : settings.sidebarWidth())) *
        (settings.fullScreen() ? 0.95 : 0.88)
    );

    const chartHeight = settings.fullScreen()
      ? settings.screenHeight()
      : settings.screenHeight() - 325;

    const [queryAnalysis, setQueryAnalysis] = useState<QueryAnalysis>({
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
    });

    const chartTabs: TabsProps["items"] = useMemo(() => {
      if (!queryAnalysis) {
        return [];
      }
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
              variables={queryAnalysis!.variables}
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
              variables={queryAnalysis.variables!}
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
              variables={queryAnalysis!.variables}
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
              variables={queryAnalysis!.variables}
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
              variables={queryAnalysis!.variables}
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
              variables={queryAnalysis!.variables}
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
              variables={queryAnalysis!.variables}
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
              variables={queryAnalysis!.variables}
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
              variables={queryAnalysis.variables}
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
              variables={queryAnalysis.variables}
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
              variables={queryAnalysis.variables}
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
              variables={queryAnalysis!.variables}
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
              variables={queryAnalysis!.variables}
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
              variables={queryAnalysis!.variables}
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
              variables={queryAnalysis.variables}
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
                variables={queryAnalysis.variables}
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
              variables={queryAnalysis!.variables}
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
              variables={queryAnalysis!.variables}
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
              variables={queryAnalysis!.variables}
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
              variables={queryAnalysis.variables}
            />
          ),
        },
      ];
    }, [chartHeight, chartWidth, queryAnalysis, results]);

    const [recommendedCharts, setRecommendedCharts] = useState<ChartType[]>([]);

    const possibleCharts = useMemo(() => {
      setLoading(false);
      return showAllCharts
        ? chartTabs
        : queryAnalysis.pattern
        ? chartTabs.filter(({ key: chartKey }) => {
            return (
              queryAnalysis.visualisations.includes(chartKey as ChartType) &&
              recommendedCharts.includes(chartKey as ChartType)
            );
          })
        : chartTabs.filter(({ key }) => {
            return recommendedCharts.includes(key as ChartType);
          });
    }, [
      chartTabs,
      queryAnalysis.pattern,
      queryAnalysis.visualisations,
      recommendedCharts,
      showAllCharts,
    ]);

    const { allRelations, allIncomingLinks, allOutgoingLinks } = useMemo(() => {
      setLoading(true);
      const { allRelations, allIncomingLinks, allOutgoingLinks } =
        getAllRelations(results, queryAnalysis.variables.key);

      getRecommendedCharts(queryAnalysis.variables, allRelations, results).then(
        (charts) => setRecommendedCharts(charts)
      );
      return { allRelations, allIncomingLinks, allOutgoingLinks };
    }, [queryAnalysis.variables, results]);

    useEffect(() => {
      if (repository) {
        getQueryAnalysis(query, repository!, username).then((res) => {
          setQueryAnalysis(res);
        });
      }
    }, [query, repository, username]);

    return (
      <Fullscreen>
        <Spin spinning={loading}>
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
                    variables={queryAnalysis.variables}
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
        </Spin>
      </Fullscreen>
    );
  }
);

export default Charts;
