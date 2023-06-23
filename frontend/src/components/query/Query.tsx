import React, { useState } from "react";
import { Space, Tabs, TabsProps, Tooltip } from "antd";
import { observer } from "mobx-react-lite";
import { BiNetworkChart } from "react-icons/bi";
import { BsBarChartSteps, BsTable } from "react-icons/bs";
import { useStore } from "../../stores/store";
import { QueryResults, RepositoryId, Triplet } from "../../types";
import { isEmpty, isGraph } from "../../utils/queryResults";
import Graph from "./Graph";
import Editor from "./Editor";
import Results from "./Results";
import Charts from "./Charts";
import { MdOutlineEditNote } from "react-icons/md";

type QueryProps = {
  qid: string;
};

const Query = observer(({ qid }: QueryProps) => {
  const rootStore = useStore();
  const settings = rootStore.settingsStore;
  const repositoryStore = rootStore.repositoryStore;
  const queriesStore = rootStore.queriesStore;
  const [results, setResults] = useState<QueryResults>({
    header: [],
    data: [],
  });
  const {
    name,
    sparql: query,
    repository = repositoryStore.currentRepository(),
  } = queriesStore.getQuery(qid);

  const setQueryText = (text: string) => {
    queriesStore.setQueryText(qid, text);
  };

  const setRepository = (repositoryId: RepositoryId | null) => {
    queriesStore.setQueryRepository(qid, repositoryId);
  };

  const [graphKey, setGraphKey] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("editor");

  const width = Math.floor(
    (window.screen.width -
      (settings.fullScreen() ? 0 : settings.sidebarWidth())) *
      (settings.fullScreen() ? 0.95 : 0.85)
  );
  const height = Math.floor(
    window.screen.height * (settings.fullScreen() ? 0.75 : 0.6)
  );

  const items: TabsProps["items"] = [
    {
      key: "editor",
      label: (
        <Space.Compact>
          <MdOutlineEditNote size={25} />
          Query
        </Space.Compact>
      ),
      children: (
        <Editor
          query={query}
          queryName={name}
          onChange={setQueryText}
          onRun={(results) => {
            setResults(results);
            setGraphKey((key) => key + 1);
            repositoryStore.updateQueryHistory();
            setLoading(false);
            setActiveTab("results");
          }}
          width={width}
          height={height}
          loading={loading}
          setLoading={setLoading}
          repository={repository}
          setRepository={setRepository}
        />
      ),
    },
    {
      key: "results",
      label: (
        <Space.Compact>
          <BsTable size={15} style={{ margin: 5 }} />
          Results
        </Space.Compact>
      ),
      children: <Results results={results} loading={loading} />,
    },
    {
      key: "graph",
      label: (
        <Space.Compact title="Use CONSTRUCT for a graph">
          <BiNetworkChart size={20} style={{ margin: 5 }} />
          Graph
        </Space.Compact>
      ),
      disabled: isEmpty(results) || !isGraph(results),
      children: (
        <Graph
          key={graphKey}
          links={results.data as Triplet[]}
          repository={repositoryStore.currentRepository()!}
        />
      ),
    },
    {
      key: "charts",
      label: (
        <Tooltip title="View recommended charts">
          <Space.Compact>
            <BsBarChartSteps size={15} style={{ margin: 5 }} />
            Charts
          </Space.Compact>
        </Tooltip>
      ),
      disabled: isEmpty(results),
      children: (
        <Charts
          query={query}
          results={results}
          repository={repository}
          showAllCharts={settings.state.showAllCharts}
        />
      ),
    },
  ];

  return (
    <Tabs
      activeKey={activeTab}
      items={items}
      onChange={(activeKey) => setActiveTab(activeKey)}
    />
  );
});

export default Query;
