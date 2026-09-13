import { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { QueryResults, Row, VariableCategories } from "../../types";
import randomColor from "randomcolor";
import { Text } from "@visx/text";
import { scaleLinear } from "@visx/scale";
import { Wordcloud } from "@visx/wordcloud";

type WordCloudProps = {
  results: QueryResults;
  width: number;
  height: number;
  variables: VariableCategories;
};

function getRotationDegree() {
  const rand = Math.random();
  const degree = rand > 0.5 ? 60 : -60;
  return rand * degree;
}

interface WordData {
  text: string;
  value: number;
}

const fixedValueGenerator = () => 0.5;

export const WordCloud = observer(
  ({ results, width, height, variables }: WordCloudProps) => {
    const textIndex = results.header.indexOf(variables.key[0]);
    const valueIndex = results.header.indexOf(variables.scalar[0]);

    const { words, colors } = useMemo<{
      words: WordData[];
      colors: Record<string, string>;
    }>(() => {
      const colors: { [key: string]: string } = {};
      return {
        words: results.data.map((row: Row) => {
          const text = row[textIndex] as string;
          const value = parseFloat(row[valueIndex]);
          colors[text] = randomColor();
          return {
            text,
            value,
          };
        }),
        colors,
      };
    }, [results.data, textIndex, valueIndex]);

    const fontScale = useMemo(
      () =>
        scaleLinear({
          domain: [
            Math.min(...words.map((w: WordData) => w.value)),
            Math.max(...words.map((w: WordData) => w.value)),
          ],
          range: [15, 100],
        }),
      [words]
    );

    const fontSizeSetter = (datum: WordData) => fontScale(datum.value);
    const withRotation = false;

    return (
      <div style={{ justifyContent: "center", width, height }}>
        <Wordcloud
          words={words}
          width={width}
          height={height}
          fontSize={fontSizeSetter}
          font={"Impact"}
          padding={2}
          spiral="archimedean"
          rotate={withRotation ? getRotationDegree : 0}
          random={fixedValueGenerator}
        >
          {(cloudWords) =>
            cloudWords.map((w) => (
              <Text
                key={w.text}
                fill={colors[w.text as string]}
                textAnchor={"middle"}
                transform={`translate(${w.x}, ${w.y}) rotate(${w.rotate})`}
                fontSize={w.size}
                fontFamily={w.font}
              >
                {w.text}
              </Text>
            ))
          }
        </Wordcloud>
      </div>
    );
  }
);

export default WordCloud;
