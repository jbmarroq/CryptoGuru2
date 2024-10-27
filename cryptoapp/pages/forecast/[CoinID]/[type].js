// //pages/forecast/[CoinID]/[type].js

// import { useRouter } from "next/router";
// import Link from "next/link";
// import { Button } from "@/components/ui/button";
// import { ArrowLeft } from "lucide-react";
// import useSWR from "swr";
// import { ModeToggle } from "@/Components/ToggleMode/ModeToggle";
// import {
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
//   Area,
//   AreaChart,
// } from "recharts";

// export default function ForecastPage() {
//   const router = useRouter();
//   const { CoinID, type } = router.query;
//   const timeframe = router.query.timeframe || 1;

//   const cacheKey = `https://api.coingecko.com/api/v3/coins/${CoinID}/market_chart?vs_currency=aud&days=${timeframe}`;
//   const { data: coinHistory } = useSWR(cacheKey, null, {
//     revalidateOnMount: false,
//   });

//   const chartData = coinHistory
//     ? coinHistory.prices.map((priceData, index) => ({
//         date: new Date(priceData[0]).toLocaleString("en-AU", {
//           month: "short",
//           day: "numeric",
//           hour: "2-digit",
//           minute: "2-digit",
//         }),
//         value:
//           type === "price"
//             ? priceData[1]
//             : type === "market-cap"
//             ? coinHistory.market_caps[index][1]
//             : coinHistory.total_volumes[index][1],
//       }))
//     : [];

//   const getGradientColors = () => {
//     switch (type) {
//       case "price":
//         return {
//           stroke: "goldenrod",
//           fill: "#FDDC5C",
//           gradientStart: "#FDDC5C",
//           gradientEnd: "#FDDC5C",
//         };
//       case "market-cap":
//         return {
//           stroke: "limegreen",
//           fill: "yellowgreen",
//           gradientStart: "yellowgreen",
//           gradientEnd: "yellowgreen",
//         };
//       case "volume":
//         return {
//           stroke: "magenta",
//           fill: "#ff8cff",
//           gradientStart: "#ff8cff",
//           gradientEnd: "#ff8cff",
//         };
//       default:
//         return {
//           stroke: "goldenrod",
//           fill: "#FDDC5C",
//           gradientStart: "#FDDC5C",
//           gradientEnd: "#FDDC5C",
//         };
//     }
//   };

//   const colors = getGradientColors();
//   const formatTooltipDate = (value) => {
//     const date = new Date(value);
//     return date.toLocaleString("en-AU", {
//       month: "short",
//       day: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   };

//   const formatTooltipValue = (value) => {
//     return new Intl.NumberFormat("en-AU", {
//       style: "currency",
//       currency: "AUD",
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     }).format(value);
//   };

//   return (
//     <>
//       <div className="p-1 sticky top-0 z-50 w-full border-transparent bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex flex-wrap items-center justify-between dark:border-transparent md:px-6">
//         <Link href={`/coins/${CoinID}`}>
//           <Button variant="outline" className="flex items-center gap-2">
//             <ArrowLeft className="h-4 w-4" />
//             Back to Coin Details
//           </Button>
//         </Link>
//         <ModeToggle />
//       </div>

//       <div className="container mx-auto p-4">
//         <div className="bg-slate-100 dark:bg-slate-950 p-4 rounded-lg">
//           <h1 className="text-2xl font-bold mb-4 dark:text-amber-500">
//             {type.charAt(0).toUpperCase() + type.slice(1)} Analysis
//           </h1>

//           {!coinHistory ? (
//             <p>
//               No cached data available. Please return to the coin details page.
//             </p>
//           ) : (
//             <div className="h-[400px] w-full">
//               <ResponsiveContainer>
//                 <AreaChart
//                   data={chartData}
//                   margin={{ top: 5, right: 30, left: 30, bottom: 30 }}
//                 >
//                   <defs>
//                     <linearGradient
//                       id={`colorGradient`}
//                       x1="0"
//                       y1="0"
//                       x2="0"
//                       y2="1"
//                     >
//                       <stop
//                         offset="5%"
//                         stopColor={colors.gradientStart}
//                         stopOpacity={0.8}
//                       />
//                       <stop
//                         offset="95%"
//                         stopColor={colors.gradientEnd}
//                         stopOpacity={0}
//                       />
//                     </linearGradient>
//                   </defs>
//                   <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
//                   <XAxis
//                     dataKey="date"
//                     angle={-45}
//                     textAnchor="end"
//                     height={80}
//                     tick={{ fontSize: 12 }}
//                     interval="preserveStartEnd"
//                   />
//                   <YAxis
//                     domain={["auto", "auto"]}
//                     tickFormatter={(value) =>
//                       value.toLocaleString("en", {
//                         notation: "compact",
//                         minimumFractionDigits: 0,
//                         maximumFractionDigits: 1,
//                       })
//                     }
//                     tick={{ fontSize: 12 }}
//                     width={80}
//                   />
//                   <Tooltip
//                     contentStyle={{
//                       backgroundColor: "rgba(17, 25, 40, 0.9)",
//                       border: "1px solid rgba(255, 255, 255, 0.2)",
//                       borderRadius: "8px",
//                       padding: "8px",
//                       color: "#ffffff",
//                       fontSize: "12px",
//                     }}
//                     labelStyle={{ color: "#ffffff" }}
//                     labelFormatter={formatTooltipDate}
//                     formatter={formatTooltipValue}
//                   />
//                   <Area
//                     type="monotone"
//                     dataKey="value"
//                     stroke={colors.stroke}
//                     fill={`url(#colorGradient)`}
//                     fillOpacity={1}
//                     dot={false}
//                   />
//                 </AreaChart>
//               </ResponsiveContainer>
//             </div>
//           )}
//         </div>
//       </div>
//     </>
//   );
// }

// pages/forecast/[CoinID]/[type].js
import { useRouter } from "next/router";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import useSWR from "swr";
import { ModeToggle } from "@/Components/ToggleMode/ModeToggle";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useState, useMemo } from "react";
import { generatePredictions } from "@/utils/forecastUtils";
import { GECKO_API_KEY } from "@/Config/CoinGeckoAPI";

export default function ForecastPage() {
  const router = useRouter();
  const { CoinID, type } = router.query;
  const timeframe = router.query.timeframe || 1;
  const [selectedPredictions, setSelectedPredictions] = useState([]);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  // Fetch historical data
  const fetcher = (...args) =>
    fetch(...args, {
      method: "GET",
      headers: {
        "x-cg-demo-api-key": GECKO_API_KEY,
      },
    }).then((res) => res.json());

  const URL = `https://api.coingecko.com/api/v3/coins/${CoinID}/market_chart?vs_currency=aud&days=${timeframe}`;
  const { data: coinHistory, error } = useSWR(URL, fetcher);

  // const chartData = useMemo(() => {
  //   if (!coinHistory) return [];

  //   // Convert historical data
  //   const baseData = coinHistory.prices.map((priceData, index) => ({
  //     date: new Date(priceData[0]).toLocaleString("en-AU", {
  //       month: "short",
  //       day: "numeric",
  //       hour: "2-digit",
  //       minute: "2-digit",
  //     }),
  //     timestamp: priceData[0], // Keep original timestamp for sorting
  //     value:
  //       type === "price"
  //         ? priceData[1]
  //         : type === "market-cap"
  //         ? coinHistory.market_caps[index][1]
  //         : coinHistory.total_volumes[index][1],
  //   }));

  //   if (selectedPredictions.length === 0) return baseData;

  //   const predictions = generatePredictions(baseData, selectedPredictions);

  //   const predictionData = selectedPredictions.flatMap((method) =>
  //     predictions[method].predictions.map((p) => ({
  //       ...p,
  //       date: p.date,
  //       [`${method}Prediction`]: p.predicted,
  //       value: null, // Ensure original value line stops at historical data
  //     }))
  //   );

  //   return [...baseData, ...predictionData];
  // }, [coinHistory, selectedPredictions, type]);

  // Inside your ForecastPage component, replace the chartData useMemo with this:

  const chartData = useMemo(() => {
    if (!coinHistory) return [];

    // Convert historical data
    const baseData = coinHistory.prices.map((priceData, index) => ({
      date: new Date(priceData[0]).toLocaleString("en-AU", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      timestamp: priceData[0],
      value:
        type === "price"
          ? priceData[1]
          : type === "market-cap"
          ? coinHistory.market_caps[index][1]
          : coinHistory.total_volumes[index][1],
    }));

    if (selectedPredictions.length === 0) return baseData;

    const timeInterval = coinHistory.prices[1][0] - coinHistory.prices[0][0];
    const lastTimestamp = coinHistory.prices[coinHistory.prices.length - 1][0];
    const numPredictionPoints = Math.floor(baseData.length * 0.2);

    const predictionData = [];
    const allPredictions = {
      sma: null,
      linear: null,
    };

    // Calculate predictions
    if (selectedPredictions.includes("sma")) {
      // Use last 20 points for moving average
      const window = 20;
      const lastValues = baseData.slice(-window);
      const smaValues = [];

      // Calculate moving average for each window
      for (let i = 0; i < window; i++) {
        const windowValues = lastValues.slice(i);
        const avg =
          windowValues.reduce((sum, point) => sum + point.value, 0) /
          windowValues.length;
        smaValues.push(avg);
      }

      // Use the trend from moving averages to project forward
      const lastSMA = smaValues[smaValues.length - 1];
      const smaChange =
        (smaValues[smaValues.length - 1] - smaValues[0]) / smaValues.length;
      allPredictions.sma = (i) => lastSMA + smaChange * i;
    }

    if (selectedPredictions.includes("linear")) {
      // Use last 30 points for linear regression
      const window = 30;
      const trainingData = baseData.slice(-window);

      // Calculate linear regression parameters
      const xValues = trainingData.map((_, i) => i);
      const yValues = trainingData.map((d) => d.value);

      const xMean = xValues.reduce((a, b) => a + b, 0) / window;
      const yMean = yValues.reduce((a, b) => a + b, 0) / window;

      const xDeviation = xValues.map((x) => x - xMean);
      const yDeviation = yValues.map((y) => y - yMean);

      const ssxx = xDeviation.reduce((a, b) => a + b * b, 0);
      const ssxy = xDeviation.reduce((a, b, i) => a + b * yDeviation[i], 0);

      const slope = ssxy / ssxx;
      const intercept = yMean - slope * xMean;

      // Store linear regression function
      allPredictions.linear = (i) => slope * (window + i) + intercept;
    }

    // Generate future points
    for (let i = 1; i <= numPredictionPoints; i++) {
      const futureTimestamp = lastTimestamp + i * timeInterval;
      const point = {
        timestamp: futureTimestamp,
        date: new Date(futureTimestamp).toLocaleString("en-AU", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        value: null,
      };

      if (selectedPredictions.includes("sma")) {
        point.smaPrediction = allPredictions.sma(i);
      }

      if (selectedPredictions.includes("linear")) {
        point.linearPrediction = allPredictions.linear(i);
      }

      predictionData.push(point);
    }

    // Add some console logging to help with debugging
    console.log("Last historical point:", baseData[baseData.length - 1]);
    console.log("First prediction point:", predictionData[0]);
    console.log("Prediction methods active:", selectedPredictions);

    return [...baseData, ...predictionData];
  }, [coinHistory, selectedPredictions, type]);

  // Log the data to help with debugging
  console.log("Chart Data:", chartData);

  // Rest of your component remains the same...

  const colors = {
    value: getGradientColors(type),
    sma: { stroke: "#FF6B6B", fill: "#FF6B6B" },
    linear: { stroke: "#4ECDC4", fill: "#4ECDC4" },
  };

  if (error) return <div>Failed to load data</div>;
  if (!coinHistory) return <div>Loading...</div>;

  return (
    <>
      <div className="p-1 sticky top-0 z-50 w-full border-transparent bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex flex-wrap items-center justify-between dark:border-transparent md:px-6">
        <Link href={`/coins/${CoinID}`}>
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Coin Details
          </Button>
        </Link>
        <ModeToggle />
      </div>

      <div className="container mx-auto p-4">
        <div className="bg-slate-100 dark:bg-slate-950 p-4 rounded-lg">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4">
            <h1 className="text-2xl font-bold dark:text-amber-500 mb-4 md:mb-0">
              {type.charAt(0).toUpperCase() + type.slice(1)} Forecast Analysis
            </h1>
            <div className="space-x-2">
              <Button
                variant="outline"
                onClick={() =>
                  setSelectedPredictions((prev) =>
                    prev.includes("sma")
                      ? prev.filter((p) => p !== "sma")
                      : [...prev, "sma"]
                  )
                }
                className={`${
                  selectedPredictions.includes("sma")
                    ? "bg-red-100 dark:bg-red-900"
                    : ""
                } mb-2 md:mb-0`}
              >
                Moving Average
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setSelectedPredictions((prev) =>
                    prev.includes("linear")
                      ? prev.filter((p) => p !== "linear")
                      : [...prev, "linear"]
                  )
                }
                className={`${
                  selectedPredictions.includes("linear")
                    ? "bg-teal-100 dark:bg-teal-900"
                    : ""
                }`}
              >
                Linear Regression
              </Button>
            </div>
          </div>

          <div className="h-[600px] w-full">
            <ResponsiveContainer>
              <AreaChart
                data={chartData}
                margin={{
                  top: 20,
                  right: windowWidth < 768 ? 20 : 30,
                  left: windowWidth < 768 ? 20 : 30,
                  bottom: 60,
                }}
              >
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={colors.value.fill}
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor={colors.value.fill}
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient id="colorSMA" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={colors.sma.fill}
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor={colors.sma.fill}
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient id="colorLinear" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={colors.linear.fill}
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor={colors.linear.fill}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  dataKey="date"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tickFormatter={(value) =>
                    value.toLocaleString("en", {
                      notation: "compact",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 1,
                    })
                  }
                  tick={{ fontSize: 12 }}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(17, 25, 40, 0.9)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "8px",
                    padding: "8px",
                    color: "#ffffff",
                    fontSize: "12px",
                  }}
                  labelStyle={{ color: "#ffffff" }}
                  formatter={(value, name) => [
                    value
                      ? value.toLocaleString("en-AU", {
                          style: "currency",
                          currency: "AUD",
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : "N/A",
                    name,
                  ]}
                />
                <Legend verticalAlign="top" height={36} />

                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={colors.value.stroke}
                  fill="url(#colorValue)"
                  fillOpacity={1}
                  dot={false}
                  name="Historical Data"
                />

                {selectedPredictions.includes("sma") && (
                  <Area
                    type="monotone"
                    dataKey="smaPrediction"
                    stroke={colors.sma.stroke}
                    fill="url(#colorSMA)"
                    fillOpacity={0.1}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Moving Average Prediction"
                  />
                )}

                {selectedPredictions.includes("linear") && (
                  <Area
                    type="monotone"
                    dataKey="linearPrediction"
                    stroke={colors.linear.stroke}
                    fill="url(#colorLinear)"
                    fillOpacity={0.1}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Linear Regression Prediction"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Prediction Info Section */}
          <div className="mt-6 p-4 bg-white dark:bg-slate-900 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 dark:text-amber-500">
              Prediction Information
            </h2>
            <div className="space-y-4">
              {selectedPredictions.includes("sma") && (
                <div>
                  <h3 className="font-medium text-red-600 dark:text-red-400">
                    Moving Average (SMA)
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Calculates predictions based on the average of the last 20
                    data points. This method is useful for smoothing out price
                    fluctuations and identifying trends.
                  </p>
                </div>
              )}
              {selectedPredictions.includes("linear") && (
                <div>
                  <h3 className="font-medium text-teal-600 dark:text-teal-400">
                    Linear Regression
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Projects future values based on the linear trend of the last
                    30 data points. This method is better at identifying
                    long-term directional trends.
                  </p>
                </div>
              )}
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                <p>
                  Note: These predictions are for educational purposes only and
                  should not be used as financial advice.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function getGradientColors(type) {
  switch (type) {
    case "price":
      return {
        stroke: "goldenrod",
        fill: "#FDDC5C",
      };
    case "market-cap":
      return {
        stroke: "limegreen",
        fill: "yellowgreen",
      };
    case "volume":
      return {
        stroke: "magenta",
        fill: "#ff8cff",
      };
    default:
      return {
        stroke: "goldenrod",
        fill: "#FDDC5C",
      };
  }
}
