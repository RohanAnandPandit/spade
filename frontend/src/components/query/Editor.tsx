import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { useStore } from "../../stores/store";
import CodeEditor from "./CodeEditor";
import { runSparqlQuery } from "../../api/sparql";
import { QueryResults, RepositoryId, RepositoryInfo, URI } from "../../types";
import { Button, Dropdown, Space, App as AntdApp, Row, Col } from "antd";
import { FiPlay } from "react-icons/fi";
import { RiGitRepositoryLine } from "react-icons/ri";
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
  onRun: (results: QueryResults) => void;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  queryName: string;
  repository: RepositoryId | null;
  setRepository: (repositoryId: string | null) => void;
};

const Editor = ({
  query,
  onChange,
  width,
  height,
  onRun,
  loading,
  setLoading,
  queryName,
  repository,
  setRepository,
}: QueryEditorProps) => {
  const rootStore = useStore();
  const settings = rootStore.settingsStore;
  const queriesStore = rootStore.queriesStore;
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

  const { notification } = AntdApp.useApp();

  const showNotification = (time: number) => {
    notification.info({
      message: "Query finished!",
      description: `Got results in ${time} ms`,
      placement: "top",
      duration: 3,
    });
  };

  return (
    <Row gutter={10}>
      <Col span={12}>
        <Space wrap>
          <SelectRepository
            repository={repository}
            setRepository={setRepository}
          />
          <Button
            icon={<FiPlay size={20} />}
            title={repository === null ? "Select repository to run query" : ""}
            loading={loading}
            onClick={() => {
              setLoading(true);
              const start = new Date().getTime();
              runSparqlQuery(
                repository!,
                queriesStore.currentQuery().sparql,
                authStore.username!
              ).then((results) => {
                showNotification(new Date().getTime() - start);
                onRun(results);
              });
            }}
            disabled={repository === null}
            style={{ alignItems: "center" }}
          >
            Run
          </Button>
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
          width={Math.floor(width / 2)}
          height={height}
        />
      </Col>
      <Col span={12}>
        <Analysis query={query} repository={repository} />
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

const SelectRepository = observer(
  ({
    repository,
    setRepository,
  }: {
    repository: string | null;
    setRepository: (repositoryId: string | null) => void;
  }) => {
    const rootStore = useStore();
    const repositoryStore = rootStore.repositoryStore;

    return (
      <Dropdown
        menu={{
          items: repositoryStore
            .repositories()
            .map(({ name }: RepositoryInfo, index) => {
              return {
                key: `${index}`,
                label: (
                  <Button
                    onClick={() => setRepository(name)}
                    style={{ width: "100%", height: "100%" }}
                  >
                    {name}
                  </Button>
                ),
              };
            }),
        }}
      >
        <Button name="Choose repository">
          <Space>
            <RiGitRepositoryLine size={20} />
            {repository || "Choose repository"}
          </Space>
        </Button>
      </Dropdown>
    );
  }
);

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
