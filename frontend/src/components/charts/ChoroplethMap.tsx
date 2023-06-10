import { useEffect, useState } from "react";
import { MapContainer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { geoJSON, QueryResults, VariableCategories } from "../../types";
import { getGeoJSON } from "../../api/queries";
import { removePrefix } from "../../utils/queryResults";
import { Spin } from "antd";
import './ChoroplethMap.css';

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
  const [data, setData] = useState<geoJSON[]>([]);

  useEffect(() => {
    setLoading(true);
    const geoColumn =
      variables.geographical[0] ?? (variables.key[0] || variables.lexical[0]);

    const geoIndex = results.header.indexOf(geoColumn);
    const valueColumn = variables.scalar[0];
    const valueIndex = results.header.indexOf(valueColumn);

    let minValue = Number.MAX_SAFE_INTEGER;
    let maxValue = Number.MIN_SAFE_INTEGER;
    for (let row of results.data) {
      const value = parseFloat(row[valueIndex]);
      minValue = Math.min(minValue, value);
      maxValue = Math.max(maxValue, value);
    }

    Promise.all(
      results.data.map(async (row) => {
        const name = removePrefix(row[geoIndex]);
        const value = parseFloat(row[valueIndex]);
        const { data } = await getGeoJSON(name);

        const location = data;
        if (!location) return null;
        // console.log(name);
        location.properties.value = value;
        location.properties.text = value.toLocaleString();
        location.properties.color = `rgba(255,0,0,${
          (value - minValue) / (maxValue - minValue)
        })`;
        return location;
      })
    ).then((responses) => {
      setData(responses.filter((location) => location !== null) as geoJSON[]);
      setLoading(false);
    });
  }, [
    results.data,
    results.header,
    variables.geographical,
    variables.key,
    variables.lexical,
    variables.scalar,
  ]);

  return (
    <Spin spinning={loading}>
      <div>
        <WorldMap data={data} width={width - 50} height={height} />
        {/* <Legend legendItems={legendItemsReverse} /> */}
      </div>
    </Spin>
  );
};

// const Legend = ({ legendItems }) => {
//   return (
//     <div
//       style={{
//         display: "flex",
//         alignItems: "stretch",
//       }}
//     >
//       {legendItems.map((item: any) => (
//         <div
//           key={item.title}
//           style={{
//             backgroundColor: item.color,
//             flex: 1,
//             display: "flex",
//             alignItems: "center", // vertical
//             justifyContent: "center", // horiztontal
//             color: item.textColor != null ? item.textColor : "black",
//             fontWeight: "bolder",
//             fontSize: "1em",
//             height: "10vh",
//           }}
//         >
//           <span>{item.title}</span>
//         </div>
//       ))}
//     </div>
//   );
// };

const WorldMap = ({ data, width, height }) => {
  const mapStyle = {
    fillColor: "white",
    weight: 1,
    color: "black",
    fillOpacity: 1,
  };

  const onEachLocation = (country: any, layer: any) => {
    layer.options.fillColor = country.properties.color;
    const name = country.properties.NAME;
    const text = country.properties.text;
    layer.bindPopup(`${name} ${text}`);
  };

  const [key, setKey] = useState(0);

  useEffect(() => {
    setKey((key) => key + 1);
  }, [data]);

  return (
    <MapContainer style={{ width, height }} zoom={2} center={[20, 60]}>
      <GeoJSON
        key={key}
        style={mapStyle}
        data={data}
        onEachFeature={onEachLocation}
      />
    </MapContainer>
  );
};

export default ChoroplethMap;
