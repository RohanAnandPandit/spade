import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useStore } from "../../stores/store";
import CodeEditor from "./CodeEditor";
import { QueryAnalysis, RepositoryId, URI } from "../../types";
import { Button, Space, Row, Col } from "antd";
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
  width: number;
  height: number;
  queryName: string;
  repository: RepositoryId | null;
  queryAnalysis: QueryAnalysis | null;
};

const Editor = ({
  query,
  onChange,
  width,
  height,
  queryName,
  repository,
  queryAnalysis,
}: QueryEditorProps) => {
  const rootStore = useStore();
  const settings = rootStore.settingsStore;
  const authStore = rootStore.authStore;
  const username = authStore.username!;
  const [properties, setProperties] = useState<URI[]>([]);
  const [types, setTypes] = useState<URI[]>([]);

  useEffect(() => {
    if (repository) {
      getAllProperties(repository, username).then((res) => {
        setProperties(res);
      });
      getAllTypes(repository, username).then((res) => {
        setTypes(res);
      });
    }
  }, [repository, username]);


  return (
    <Row>
      <Col style={{ width: Math.floor(width / 2) }}>
        <Space wrap>
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
          width={Math.floor(width / 2) - 10}
          height={height}
        />
      </Col>
      <Col style={{ width: Math.floor(width / 2) }}>
        <Analysis queryAnalysis={queryAnalysis} />
      </Col>
    </Row>
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
    const username = rootStore.authStore.username!;

    const repositoryStore = rootStore.repositoryStore;
    return (
      <Button
        icon={<BiSave size={20} />}
        disabled={repository === null}
        onClick={() => {
          addQueryToHistory(repository!, query, name, username).then(() => {
            repositoryStore.updateQueryHistory();
          });
        }}
      >
        Save
      </Button>
    );
  }
);
export default observer(Editor);
