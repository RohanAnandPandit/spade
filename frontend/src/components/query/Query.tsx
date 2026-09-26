import { useEffect, useState } from "react";
import { Button, Tabs, TabsProps, Tooltip, App as AntdApp } from "antd";
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
    const repositoryStore = rootStore.repositoryStore;
    const queriesStore = rootStore.queriesStore;
    const repository = demo ? "Mondial" : repositoryStore.currentRepository();
    const [results, setResults] = useState<QueryResults>({
      header: [],
      data: [],
    });
    const { sparql: query } = demoQuery ?? queriesStore.getQuery(qid);

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
          <Tooltip title="Query" placement="right">
            <span className="query-view-tab-icon">
              <MdOutlineEditNote size={20} />
              <span className="query-view-tab-text">Query</span>
            </span>
          </Tooltip>
        ),
        children: (
          <Editor
            query={query}
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
                <Tooltip title="Results" placement="right">
                  <span className="query-view-tab-icon">
                    <BsTable size={17} />
                    <span className="query-view-tab-text">Results</span>
                  </span>
                </Tooltip>
              ),
              children: <Results results={results} loading={queryLoading} />,
            },
            ...(!demo
              ? [
                  {
                    key: "graph",
                    label: (
                      <Tooltip title="Graph (use CONSTRUCT)" placement="right">
                        <span className="query-view-tab-icon">
                          <BiNetworkChart size={19} />
                          <span className="query-view-tab-text">Graph</span>
                        </span>
                      </Tooltip>
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
                <Tooltip title="Charts" placement="right">
                  <span className="query-view-tab-icon">
                    <BsBarChartSteps size={18} />
                    <span className="query-view-tab-text">Charts</span>
                  </span>
                </Tooltip>
              ),
              disabled:
                isEmpty(results) ||
                queryAnalysis?.visualisations.includes(ChartType.GRAPH),
              children: (
                <Charts results={results} queryAnalysis={queryAnalysis} />
              ),
            },
          ]
        : []),
    ];

    return (
      <div>
        <Tabs
          className="query-view"
          tabPosition="left"
          activeKey={repository ? activeTab : "editor"}
          items={items}
          onChange={(activeKey) => setActiveTab(activeKey)}
          tabBarExtraContent={
            repository
              ? {
                  left: (
                    <Tooltip title="Run query" placement="right">
                      <Button
                        className="query-view-run"
                        type="text"
                        aria-label="Run query"
                        icon={<FiPlay size={18} />}
                        loading={queryLoading}
                        onClick={() => void executeQuery()}
                      />
                    </Tooltip>
                  ),
                }
              : undefined
          }
        />
      </div>
    );
  }
);

export default Query;
