import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsProps } from "antd";
import { ChartType, QueryAnalysis, QueryResults } from "../../types";
import BarChart from "../charts/BarChart";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/store";
import { AiOutlineBarChart, AiOutlineRadarChart } from "react-icons/ai";
import { HiOutlineGlobe } from "react-icons/hi";
import {
  BsBodyText,
  BsCalendar3,
  BsLightbulb,
  BsPieChart,
} from "react-icons/bs";
import { BiLineChart } from "react-icons/bi";
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
import { numericColumns } from "../../utils/queryResults";
import ChordDiagram from "../charts/ChordDiagram";
import { getQueryAnalysis } from "../../api/queries";
import CalendarChart from "../charts/CalendarChart";
import WordCloud from "../charts/WordCloud";
import { CirclePacking } from "../charts/CirclePacking";
import HierarchyTree from "../charts/HierarchyTree";
import SunburstChart from "../charts/SunburstChart";
import HeatMap from "../charts/HeatMap";
import ChoroplethMap from "../charts/ChoroplethMap";
import { getAllRelations, recommendedCharts } from "../../utils/charts";
import { Suggested } from "../analysis/Suggested";
import NetworkChart from "../charts/NetworkChart";
import { IoMdGitNetwork } from "react-icons/io";
import { MdOutlineStackedBarChart } from "react-icons/md";
import StackedBarChart from "../charts/StackedBarChart";
import GroupedBarChart from "../charts/GroupedBarChart";
import { RiBarChartGroupedFill } from "react-icons/ri";

type ChartsProps = {
  query: string;
  results: QueryResults;
};

const Charts = observer(({ query, results }: ChartsProps) => {
  const rootStore = useStore();
  const settings = rootStore.settingsStore;
  const repositoryStore = rootStore.repositoryStore;
  const username = rootStore.authStore.username!;

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
    },
  });

  const [possibleCharts, setPossibleCharts] = useState<ChartType[]>([]);

  const { allRelations, allIncomingLinks, allOutgoingLinks } = useMemo(() => {
    const { allRelations, allIncomingLinks, allOutgoingLinks } =
      getAllRelations(results, results.header);
    setPossibleCharts(
      recommendedCharts(queryAnalysis.variables, allRelations, results)
    );
    return { allRelations, allIncomingLinks, allOutgoingLinks };
  }, [queryAnalysis.variables, results]);

  useEffect(() => {
    if (repositoryStore.currentRepository()) {
      getQueryAnalysis(
        query,
        repositoryStore.currentRepository()!,
        username
      ).then((res) => {
        setQueryAnalysis(res);
      });
    }
  }, [query, repositoryStore, results, username]);

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
          <Tabs
            defaultActiveKey="1"
            items={numericColumns(results).map((index) => {
              return {
                key: `${index}`,
                label: results.header[index],
                children: (
                  <PieChart
                    results={results}
                    width={chartWidth}
                    height={chartHeight}
                    columnIndex={index}
                  />
                ),
              };
            })}
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

  return (
    <Fullscreen>
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
                allRelations={allRelations}
                allIncomingLinks={allIncomingLinks}
                allOutgoingLinks={allOutgoingLinks}
              />
            ),
          },
          ...(settings.showAllCharts()
            ? chartTabs
            : queryAnalysis.pattern
            ? chartTabs.filter(
                ({ key }) =>
                  queryAnalysis.visualisations.includes(key as ChartType) &&
                  possibleCharts.includes(key as ChartType)
              )
            : chartTabs.filter(({ key }) =>
                possibleCharts.includes(key as ChartType)
              )),
        ]}
        style={{ padding: 10 }}
      />
    </Fullscreen>
  );
});

export default Charts;
