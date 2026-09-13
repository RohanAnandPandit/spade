import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useStore } from "../../stores/store";
import CodeEditor from "./CodeEditor";
import { QueryAnalysis, RepositoryId, URI } from "../../types";
import { App as AntdApp, Button, Space } from "antd";
import { BiCopy, BiSave } from "react-icons/bi";
import { getAllProperties, getAllTypes } from "../../api/dataset";
import { removePrefix } from "../../utils/queryResults";
import sparql from "../../utils/sparql.json";
import { sparqlTemplates } from "../../utils/sparqlTemplates";
import Templates from "./Templates";
import Analysis from "../analysis/Analysis";
import { addQueryToHistory } from "../../api/queries";

type QueryEditorProps = {
  query: string;
  onChange: (text: string) => void;
  queryName: string;
  repository: RepositoryId | null;
  queryAnalysis: QueryAnalysis | null;
  analysisLoading: boolean;
};

const Editor = ({
  query,
  onChange,
  queryName,
  repository,
  queryAnalysis,
  analysisLoading,
}: QueryEditorProps) => {
  const rootStore = useStore();
  const settings = rootStore.settingsStore;
  const [properties, setProperties] = useState<URI[]>([]);
  const [types, setTypes] = useState<URI[]>([]);
  const { message } = AntdApp.useApp();

  useEffect(() => {
    let active = true;
    if (!repository) {
      setProperties([]);
      setTypes([]);
      return;
    }
    Promise.all([getAllProperties(repository), getAllTypes(repository)])
      .then(([nextProperties, nextTypes]) => {
        if (active) {
          setProperties(nextProperties);
          setTypes(nextTypes);
        }
      })
      .catch(() => {
        if (active) message.error("Could not load repository completions.");
      });
    return () => {
      active = false;
    };
  }, [message, repository]);

  return (
    <div className="query-editor-grid">
      <section className="query-editor-panel" aria-label="SPARQL query editor">
        <Space wrap className="query-editor-toolbar">
          <CopyToClipboard text={query} />
          <SaveQuery repository={repository} query={query} name={queryName} />
          <Templates templates={sparqlTemplates} />
        </Space>
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
        <Analysis queryAnalysis={queryAnalysis} loading={analysisLoading} />
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

const CopyToClipboard = ({ text }: { text: string }) => {
  return (
    <Button
      icon={<BiCopy />}
      onClick={() => navigator.clipboard.writeText(text)}
    >
      Copy
    </Button>
  );
};

const SaveQuery = observer(
  ({
    name,
    query,
    repository,
  }: {
    name: string;
    query: string;
    repository: RepositoryId | null;
  }) => {
    const rootStore = useStore();
    const repositoryStore = rootStore.repositoryStore;
    const { message } = AntdApp.useApp();
    return (
      <Button
        icon={<BiSave size={20} />}
        disabled={repository === null}
        onClick={async () => {
          try {
            await addQueryToHistory(repository!, query, name);
            await repositoryStore.updateQueryHistory();
            message.success("Query saved.");
          } catch {
            message.error("Could not save the query.");
          }
        }}
      >
        Save
      </Button>
    );
  }
);
export default observer(Editor);
