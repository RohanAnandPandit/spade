import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useStore } from "../../stores/store";
import CodeEditor from "./CodeEditor";
import { QueryAnalysis, RepositoryId, URI } from "../../types";
import { Button, Tooltip } from "antd";
import { BiSolidAnalyse } from "react-icons/bi";
import { getAllProperties, getAllTypes } from "../../api/dataset";
import { removePrefix } from "../../utils/queryResults";
import sparql from "../../utils/sparql.json";
import Analysis from "../analysis/Analysis";

type QueryEditorProps = {
  query: string;
  onChange: (text: string) => void;
  repository: RepositoryId | null;
  queryAnalysis: QueryAnalysis | null;
  analysisLoading: boolean;
  demo?: boolean;
};

const Editor = ({
  query,
  onChange,
  repository,
  queryAnalysis,
  analysisLoading,
  demo = false,
}: QueryEditorProps) => {
  const rootStore = useStore();
  const settings = rootStore.settingsStore;
  const [properties, setProperties] = useState<URI[]>([]);
  const [types, setTypes] = useState<URI[]>([]);
  const [analysisCollapsed, setAnalysisCollapsed] = useState(false);

  useEffect(() => {
    let active = true;
    if (!repository || demo) {
      setProperties([]);
      setTypes([]);
      return;
    }
    Promise.allSettled([
      getAllProperties(repository),
      getAllTypes(repository),
    ]).then(([nextProperties, nextTypes]) => {
      if (active) {
        setProperties(
          nextProperties.status === "fulfilled" ? nextProperties.value : []
        );
        setTypes(nextTypes.status === "fulfilled" ? nextTypes.value : []);
      }
    });
    return () => {
      active = false;
    };
  }, [demo, repository]);

  return (
    <div
      className={`query-editor-grid ${analysisCollapsed ? "query-editor-grid-collapsed" : ""}`}
    >
      <section className="query-editor-panel" aria-label="SPARQL query editor">
        <CodeEditor
          code={query}
          setCode={onChange}
          language="sparql"
          completions={{
            keywords: sparql.keywords,
            properties: properties.map((prop) => removePrefix(prop)),
            types: types.map((t) => removePrefix(t)),
            variables: getTokens(query).filter((token) => isVariable(token)),
          }}
          darkTheme={settings.darkMode()}
        />
      </section>
      <aside className="query-analysis-panel" aria-label="Query analysis">
        {analysisCollapsed ? (
          <Tooltip title="Expand analysis" placement="left">
            <Button
              className="query-analysis-expand"
              aria-label="Expand analysis"
              aria-expanded={false}
              icon={<BiSolidAnalyse size={20} />}
              onClick={() => setAnalysisCollapsed(false)}
            />
          </Tooltip>
        ) : (
          <Analysis
            queryAnalysis={queryAnalysis}
            loading={analysisLoading}
            onCollapse={() => setAnalysisCollapsed(true)}
            emptyMessage={
              demo
                ? "Query analysis and repository exploration are available when you create an account."
                : repository
                  ? undefined
                  : "Choose a repository to enable analysis. Your query's variables and suggested charts will appear here."
            }
          />
        )}
      </aside>
    </div>
  );
};

function getTokens(text: string): string[] {
  return text.split(/[\s,]+/).map((token) => token.trim());
}

function isVariable(text: string): boolean {
  return text.length > 1 && text.charAt(0) === "?";
}

export default observer(Editor);
