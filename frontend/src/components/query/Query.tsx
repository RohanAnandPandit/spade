import { useEffect, useState } from "react";
import { Button, Space, Tabs, TabsProps, Tooltip, App as AntdApp } from "antd";
import { observer } from "mobx-react-lite";
import { BiNetworkChart } from "react-icons/bi";
import { BsBarChartSteps, BsTable } from "react-icons/bs";
import { useStore } from "../../stores/store";
import { ChartType, QueryInfo, QueryResults, Triplet } from "../../types";
import { isEmpty } from "../../utils/queryResults";
import Graph from "./Graph";
import Editor from "./Editor";
import Results from "./Results";
import Charts from "./Charts";
import { MdOutlineEditNote } from "react-icons/md";
import { runDemoSparqlQuery, runSparqlQuery } from "../../api/sparql";
import { FiPlay } from "react-icons/fi";
import { apiErrorMessage } from "../../api/client";
import { useQueryAnalysis } from "../../hooks/useQueryAnalysis";

type QueryProps = {
  qid: string;
  demo?: boolean;
  demoQuery?: QueryInfo;
  onDemoQueryChange?: (sparql: string) => void;
};

const Query = observer(
  ({ qid, demo = false, demoQuery, onDemoQueryChange }: QueryProps) => {
    const rootStore = useStore();
    const settings = rootStore.settingsStore;
    const repositoryStore = rootStore.repositoryStore;
    const queriesStore = rootStore.queriesStore;
    const repository = demo ? "Mondial" : repositoryStore.currentRepository();
    const [results, setResults] = useState<QueryResults>({
      header: [],
      data: [],
    });
    const { name, sparql: query } = demoQuery ?? queriesStore.getQuery(qid);

    const setQueryText = (text: string) => {
      if (demo) onDemoQueryChange?.(text);
      else queriesStore.setQueryText(qid, text);
    };

    const [graphKey, setGraphKey] = useState<number>(0);
    const [queryLoading, setQueryLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<string>("editor");

    useEffect(() => {
      setResults({ header: [], data: [] });
      setGraphKey((key) => key + 1);
      setActiveTab("editor");
    }, [repository]);

    const { message, notification } = AntdApp.useApp();

    const showNotification = (time: number) => {
      notification.info({
        message: "Query finished!",
        description: `Got results in ${time} ms`,
        placement: "top",
        duration: 3,
      });
    };

    const {
      analysis: queryAnalysis,
      loading: analysisLoading,
      error: analysisError,
    } = useQueryAnalysis(query, demo ? null : repository);

    useEffect(() => {
      if (analysisError) message.error(analysisError);
    }, [analysisError, message]);

    const executeQuery = async () => {
      if (!repository) return;
      setQueryLoading(true);
      const start = performance.now();
      try {
        const nextResults = demo
          ? await runDemoSparqlQuery(query)
          : await runSparqlQuery(repository, query);
        setResults(nextResults);
        setGraphKey((key) => key + 1);
        if (!demo) await repositoryStore.updateQueryHistory();
        setActiveTab("results");
        showNotification(Math.round(performance.now() - start));
      } catch (error) {
        message.error(apiErrorMessage(error, "Could not run the query."));
      } finally {
        setQueryLoading(false);
      }
    };

    const items: TabsProps["items"] = [
      {
        key: "editor",
        label: (
          <Space.Compact>
            <MdOutlineEditNote size={25} />
            <span className="query-tab-label-text">Query</span>
          </Space.Compact>
        ),
        children: (
          <Editor
            query={query}
            queryName={name}
            onChange={setQueryText}
            repository={repository}
            queryAnalysis={queryAnalysis}
            analysisLoading={analysisLoading}
            demo={demo}
          />
        ),
      },
      ...(repository
        ? [
            {
              key: "results",
              label: (
                <Space.Compact>
                  <BsTable size={15} style={{ margin: 5 }} />
                  <span className="query-tab-label-text">Results</span>
                </Space.Compact>
              ),
              children: <Results results={results} loading={queryLoading} />,
            },
            ...(!demo
              ? [
                  {
                    key: "graph",
                    label: (
                      <Space.Compact title="Use CONSTRUCT for a graph">
                        <BiNetworkChart size={20} style={{ margin: 5 }} />
                        <span className="query-tab-label-text">Graph</span>
                      </Space.Compact>
                    ),
                    disabled:
                      isEmpty(results) ||
                      !queryAnalysis?.visualisations.includes(ChartType.GRAPH),
                    children: (
                      <Graph
                        key={graphKey}
                        links={results.data as Triplet[]}
                        repository={repository}
                      />
                    ),
                  },
                ]
              : []),
            {
              key: "charts",
              label: (
                <Tooltip title="View recommended charts">
                  <Space.Compact>
                    <BsBarChartSteps size={15} style={{ margin: 5 }} />
                    <span className="query-tab-label-text">Charts</span>
                  </Space.Compact>
                </Tooltip>
              ),
              disabled:
                isEmpty(results) ||
                queryAnalysis?.visualisations.includes(ChartType.GRAPH),
              children: (
                <Charts
                  results={results}
                  showAllCharts={settings.state.showAllCharts}
                  queryAnalysis={queryAnalysis}
                />
              ),
            },
          ]
        : []),
    ];

    return (
      <Tabs
        className="query-view"
        activeKey={repository ? activeTab : "editor"}
        items={items}
        onChange={(activeKey) => setActiveTab(activeKey)}
        tabBarExtraContent={
          repository
            ? {
                left: (
                  <Button
                    style={{ marginRight: 20 }}
                    icon={<FiPlay size={20} />}
                    title="Run query"
                    loading={queryLoading}
                    onClick={() => void executeQuery()}
                  >
                    <span className="run-button-label">Run</span>
                  </Button>
                ),
              }
            : undefined
        }
      />
    );
  }
);

export default Query;
