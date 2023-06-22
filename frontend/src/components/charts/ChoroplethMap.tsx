import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Polygon,
  TileLayer,
  Tooltip,
  Marker,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  Coordinates,
  GeoData,
  QueryResults,
  VariableCategories,
} from "../../types";
import { getGeoJSON } from "../../api/queries";
import { Segmented, Space, Spin, Typography } from "antd";
import "./ChoroplethMap.css";
import { removePrefix } from "../../utils/queryResults";
import iconMarker from "leaflet/dist/images/marker-icon.png";
import iconRetina from "leaflet/dist/images/marker-icon-2x.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import L from "leaflet";

const icon = L.icon({
  iconRetinaUrl: iconRetina,
  iconUrl: iconMarker,
  shadowUrl: iconShadow,
  iconSize: [35, 46],
  iconAnchor: [35, 46],
});

type ChoroplethMapProps = {
  results: QueryResults;
  variables: VariableCategories;
  width: number;
  height: number;
};

const ChoroplethMap = ({
  results,
  variables,
  width,
  height,
}: ChoroplethMapProps) => {
  // const legendItems = [];
  // const legendItemsReverse = [...legendItems].reverse();
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<GeoData[]>([]);
  const [scalarColumn, setScalarColumn] = useState<string>(variables.scalar[0]);
  const { regionValue, minValue, maxValue } = useMemo(() => {
    const valueIndex = results.header.indexOf(scalarColumn);
    const regionValue = {}; // Mapping from region to value

    let minValue = Number.MAX_SAFE_INTEGER;
    let maxValue = Number.MIN_SAFE_INTEGER;

    for (let row of results.data) {
      // Concatenate geographical variables to identify the location
      const region = variables.geographical
        .map((column: string) => row[results.header.indexOf(column)])
        .reduce((a, b) => `${removePrefix(b)}${a ? "," : ""}${a}`, "");

      const value = parseFloat(row[valueIndex]);
      regionValue[region] = value;

      minValue = Math.min(minValue, value);
      maxValue = Math.max(maxValue, value);
    }

    return { regionValue, minValue, maxValue };
  }, [results.data, results.header, variables.geographical, scalarColumn]);

  const cache = useMemo(() => {
    return {};
  }, []);

  useEffect(() => {
    setLoading(true);

    Promise.all(
      Object.keys(regionValue).map(async (name) => {
        if (cache[name]) {
          return cache[name];
        }
        const data: GeoData = await getGeoJSON(name);
        if (data.coordinates) {
          data.coordinates = reverseCoordinates(data.coordinates);
        }
        cache[name] = data;
        // console.log(name, data);
        return data;
      })
    ).then((responses) => {
      setData(responses.filter((location) => location !== null) as GeoData[]);
      setLoading(false);
    });
  }, [
    cache,
    regionValue,
    results.data,
    results.header,
    variables.geographical,
    variables.key,
    variables.lexical,
    variables.scalar,
  ]);

  return (
    <Space direction="vertical">
      <Segmented
        options={variables.numeric.map((name) => ({ label: name, value: name }))}
        onChange={(value) => setScalarColumn(value as string)}
      />
      <Spin spinning={loading}>
        <WorldMap
          geoData={data}
          width={width - 50}
          height={height}
          regionValue={regionValue}
          minValue={minValue}
          maxValue={maxValue}
          valueColumn={scalarColumn}
        />
      </Spin>
    </Space>
  );
};

type WorldMapProps = {
  geoData: GeoData[];
  width: number;
  height: number;
  regionValue: { [key: string]: number };
  minValue: number;
  maxValue: number;
  valueColumn: string;
};
const WorldMap = ({
  geoData,
  width,
  height,
  regionValue,
  minValue,
  maxValue,
  valueColumn,
}: WorldMapProps) => {
  return (
    <MapContainer
      style={{ width, height }}
      zoom={1}
      center={[20, 60]}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {geoData.map(({ region, coordinates, name, type }, index: number) => {
        return (
          coordinates &&
          (type === "Point" ? (
            <Marker
              key={`region-${index}`}
              position={reversePoint(coordinates)}
              icon={icon}
            >
              <Tooltip>
                <Space direction="vertical">
                  <Typography.Text>{name}</Typography.Text>
                  <Typography.Text>
                    {valueColumn}:{" "}
                    {(regionValue[region] ?? "").toLocaleString()}
                  </Typography.Text>
                </Space>
              </Tooltip>
            </Marker>
          ) : (
            <Polygon
              key={`region-${index}`}
              pathOptions={{
                color: `orange`,
                weight: 1,
                fillOpacity:
                  (regionValue[region] - minValue) / (maxValue - minValue),
              }}
              positions={coordinates}
            >
              <Tooltip sticky>
                <Space direction="vertical">
                  <Typography.Text>{name}</Typography.Text>
                  <Typography.Text>
                    {valueColumn}:{" "}
                    {(regionValue[region] ?? "").toLocaleString()}
                  </Typography.Text>
                </Space>
              </Tooltip>
            </Polygon>
          ))
        );
      })}
    </MapContainer>
  );
};

function reversePoint([x, y]: [number, number]) {
  return [y, x] as [number, number];
}

// Reverse points in GeoJSON coordinates to display regions in the correct orientation
function reverseCoordinates(polygon: Coordinates) {
  return polygon.map((arr) => {
    if (arr.length > 0 && Array.isArray(arr[0])) {
      return reverseCoordinates(arr);
    }
    if (arr.length === 2) {
      return [arr[1], arr[0]];
    }
    return arr;
  });
}
export default ChoroplethMap;
