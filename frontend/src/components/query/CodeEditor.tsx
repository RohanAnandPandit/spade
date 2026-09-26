import CodeMirror from "@uiw/react-codemirror";
import type { CSSProperties } from "react";
import { theme } from "antd";
import { StreamLanguage } from "@codemirror/language";
import { sparql } from "@codemirror/legacy-modes/mode/sparql";
import { autocompletion, CompletionContext } from "@codemirror/autocomplete";

type CodeEditorProps = {
  code: string;
  setCode: (text: string) => void;
  language: string;
  completions: {
    keywords?: string[];
    properties?: string[];
    variables?: string[];
    types?: string[];
  };
  darkTheme: boolean;
};

const languageParsers: any = {
  sparql: sparql,
};

const CodeEditor = ({
  code,
  setCode,
  language,
  completions,
  darkTheme,
}: CodeEditorProps) => {
  const { token } = theme.useToken();
  const editorStyle = {
    fontSize: 14,
    "--editor-bg": token.colorBgContainer,
    "--editor-gutter": token.colorFillQuaternary,
    "--editor-text": token.colorText,
    "--editor-muted": token.colorTextTertiary,
    "--editor-border": token.colorBorderSecondary,
    "--editor-active": token.colorFillQuaternary,
    "--editor-focus": token.colorPrimary,
    "--editor-focus-ring": token.colorPrimaryBg,
  } as CSSProperties;
  const myCompletions = (context: CompletionContext) => {
    const word = context.matchBefore(/(\w|[<>?])*/)!;
    if (word.from === word.to && !context.explicit) return null;
    return {
      from: word.from,
      options: getCompletions(completions),
    };
  };

  return (
    <CodeMirror
      value={code}
      basicSetup={{
        autocompletion: true,
      }}
      width="100%"
      height="auto"
      minHeight="200px"
      placeholder="Enter your SPARQL query here"
      extensions={[
        StreamLanguage.define(languageParsers[language]),
        autocompletion({ override: [myCompletions] }),
      ]}
      onChange={(value: string) => {
        setCode(value);
      }}
      theme={darkTheme ? "dark" : "light"}
      className="query-code-editor"
      style={editorStyle}
    />
  );
};

function getCompletions({
  keywords,
  properties,
  variables,
  types,
}: {
  keywords?: string[];
  properties?: string[];
  variables?: string[];
  types?: string[];
}) {
  return [
    ...(keywords ?? []).map((kw) => {
      return {
        label: kw,
        type: "keyword",
        detail: "SPARQL keyword",
      };
    }),
    ...(properties ?? []).map((prop) => {
      return {
        label: prop,
        type: "property",
        detail: "property",
      };
    }),
    ...(variables ?? []).map((v) => {
      return {
        label: v,
        type: "variable",
        detail: "variable",
      };
    }),
    ...(types ?? []).map((t) => {
      return {
        label: t,
        type: "type",
        detail: "type",
      };
    }),
  ];
}

export default CodeEditor;
