// // pages/forecast/[CoinID]/[type].js

// pages/forecast/[CoinID]/[type].js
import { useRouter } from "next/router";
import Link from "next/link";
import { Button } from "@/Components/ui/button";
import { ArrowLeft } from "lucide-react";
import useSWR from "swr";
import { ModeToggle } from "@/Components/ToggleMode/ModeToggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
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
import { useState, useMemo, useEffect } from "react";
import { GECKO_API_KEY } from "@/Config/CoinGeckoAPI";
import LSTMModel from "@/Components/PricePrediction/models/LSTMModel";
import GRUModel from "@/Components/PricePrediction/models/GRUModel";

export default function ForecastPage() {
  const router = useRouter();
  const { CoinID, type } = router.query;
  const timeframe = router.query.timeframe || 1;
  const [selectedPredictions, setSelectedPredictions] = useState([]);
  const [lstmPredictions, setLstmPredictions] = useState([]);
  const [isLstmEnabled, setIsLstmEnabled] = useState(false);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  const [activeTab, setActiveTab] = useState("traditional");
  const [isGruEnabled, setIsGruEnabled] = useState(false);
  const [gruPredictions, setGruPredictions] = useState([]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    console.log("LSTM Predictions:", lstmPredictions);
    console.log("LSTM Enabled:", isLstmEnabled);
  }, [lstmPredictions, isLstmEnabled]);

  const fetcher = (...args) =>
    fetch(...args, {
      method: "GET",
      headers: {
        "x-cg-demo-api-key": GECKO_API_KEY,
      },
    }).then((res) => res.json());

  const URL = `https://api.coingecko.com/api/v3/coins/${CoinID}/market_chart?vs_currency=aud&days=${timeframe}`;
  const { data: coinHistory, error } = useSWR(URL, fetcher);

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

    if (selectedPredictions.length === 0 && !isLstmEnabled && !isGruEnabled)
      return baseData;

    const timeInterval = coinHistory.prices[1][0] - coinHistory.prices[0][0];
    const lastTimestamp = coinHistory.prices[coinHistory.prices.length - 1][0];
    const numPredictionPoints = Math.floor(baseData.length * 0.2);

    const predictionData = [];
    const allPredictions = {
      sma: null,
      linear: null,
      // lstm: null,
    };
    // Calculate predictions
    if (selectedPredictions.includes("sma")) {
      const window = 20; // Use last 20 points for moving average
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
      const window = 30; // Use last 30 points for linear regression
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

      if (isLstmEnabled && lstmPredictions[i - 1]) {
        point.lstmPrediction = lstmPredictions[i - 1].lstmPrediction;
        console.log("Adding LSTM prediction:", point.lstmPrediction); // Debug log
      }

      if (isGruEnabled && gruPredictions[i - 1]) {
        point.gruPrediction = gruPredictions[i - 1].gruPrediction;
      }

      predictionData.push(point);
    }

    return [...baseData, ...predictionData];
  }, [
    coinHistory,
    selectedPredictions,
    lstmPredictions,
    gruPredictions,
    isLstmEnabled,
    isGruEnabled,
    type,
  ]);

  const colors = {
    value: getGradientColors(type),
    sma: { stroke: "#FF6B6B", fill: "#FF6B6B" },
    linear: { stroke: "#4ECDC4", fill: "#4ECDC4" },
  };

  if (error)
    return (
      <div className="container mx-auto p-4 text-center">
        <div className="bg-red-50 dark:bg-red-900 p-4 rounded-lg">
          <p className="text-red-600 dark:text-red-200">Failed to load data</p>
        </div>
      </div>
    );

  if (!coinHistory)
    return (
      <div className="container mx-auto p-4 text-center">
        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2">Loading data...</p>
        </div>
      </div>
    );

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
        <Tabs
          defaultValue="traditional"
          className="space-y-4"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="traditional">
                Traditional Analysis
              </TabsTrigger>
              <TabsTrigger value="ml">Machine Learning</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="traditional">
            <Card>
              <CardContent className="p-6">
                <div className="bg-slate-100 dark:bg-slate-950 p-4 rounded-lg">
                  <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold dark:text-amber-500 mb-4 md:mb-0">
                      {type.charAt(0).toUpperCase() + type.slice(1)} Traditional
                      Forecast
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
                      <Button
                        variant="outline"
                        onClick={() => setIsLstmEnabled(!isLstmEnabled)}
                        className={`${
                          isLstmEnabled
                            ? "bg-purple-100 dark:bg-purple-900"
                            : ""
                        }`}
                      >
                        LSTM
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsGruEnabled(!isGruEnabled)}
                        className={`${
                          isGruEnabled ? "bg-indigo-100 dark:bg-indigo-900" : ""
                        }`}
                      >
                        GRU
                      </Button>
                    </div>
                  </div>

                  <div className="h-[600px] w-full">
                    <ResponsiveContainer>
                      {isLstmEnabled && (
                        <div className="absolute top-100 right-4 z-50">
                          <LSTMModel
                            historicalData={coinHistory.prices.map(
                              ([timestamp, price]) => ({
                                date: new Date(timestamp).toISOString(),
                                price,
                              })
                            )}
                            onPredictionComplete={setLstmPredictions}
                            isEnabled={isLstmEnabled}
                            index={1} // LSTM will be positioned further right
                          />
                        </div>
                      )}
                      {isGruEnabled && (
                        <div className="absolute top-100 right-4 z-50">
                          <GRUModel
                            historicalData={coinHistory.prices.map(
                              ([timestamp, price]) => ({
                                date: new Date(timestamp).toISOString(),
                                price,
                              })
                            )}
                            onPredictionComplete={setGruPredictions}
                            isEnabled={isGruEnabled}
                            index={0} // GRU will be positioned closer to the right edge
                          />
                        </div>
                      )}
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
                          <linearGradient
                            id="colorValue"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
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
                          <linearGradient
                            id="colorSMA"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
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
                          <linearGradient
                            id="colorLinear"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
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
                          <linearGradient
                            id="colorLSTM"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#9333ea"
                              stopOpacity={0.8}
                            />
                            <stop
                              offset="95%"
                              stopColor="#9333ea"
                              stopOpacity={0}
                            />
                          </linearGradient>
                          <linearGradient
                            id="colorGRU"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#4C51BF"
                              stopOpacity={0.8}
                            />
                            <stop
                              offset="95%"
                              stopColor="#4C51BF"
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
                        {isLstmEnabled && (
                          <Area
                            type="monotone"
                            dataKey="lstmPrediction"
                            name="LSTM Prediction"
                            stroke="#9333ea"
                            fill="url(#colorLSTM)"
                            fillOpacity={0.1}
                            strokeDasharray="5 5"
                            dot={false}
                          />
                        )}
                        {isGruEnabled && (
                          <Area
                            type="monotone"
                            dataKey="gruPrediction"
                            name="GRU Prediction"
                            stroke="#4C51BF"
                            fill="url(#colorGRU)"
                            fillOpacity={0.1}
                            strokeDasharray="5 5"
                            dot={false}
                          />
                        )}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

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
                            Calculates predictions based on the average of the
                            last 20 data points. This method is useful for
                            smoothing out price fluctuations and identifying
                            trends.
                          </p>
                        </div>
                      )}
                      {selectedPredictions.includes("linear") && (
                        <div>
                          <h3 className="font-medium text-teal-600 dark:text-teal-400">
                            Linear Regression
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">
                            Projects future values based on the linear trend of
                            the last 30 data points. This method is better at
                            identifying long-term directional trends.
                          </p>
                        </div>
                      )}
                      {isLstmEnabled && (
                        <div>
                          <h3 className="font-medium text-purple-600 dark:text-purple-400">
                            LSTM Neural Network
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">
                            Long Short-Term Memory networks excel at learning
                            long-term dependencies in time series data, making
                            them effective for price prediction based on
                            historical patterns.
                          </p>
                        </div>
                      )}
                      {isGruEnabled && (
                        <div>
                          <h3 className="font-medium text-indigo-600 dark:text-indigo-400">
                            GRU Neural Network
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">
                            Gated Recurrent Units combine momentum indicators
                            with price data to capture market dynamics. They're
                            computationally efficient while maintaining high
                            prediction accuracy.
                          </p>
                        </div>
                      )}
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                        <p>
                          Note: These predictions are for educational purposes
                          only and should not be used as financial advice.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ml">
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold dark:text-amber-500">
                    AI Predictions
                  </h2>
                </div>

                {/* ML Model Component will go here - Currently in development
                <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-lg">
                  <p className="text-center text-gray-600 dark:text-gray-400">
                    Machine Learning predictions are currently being developed.
                    Check back soon for advanced prediction models.
                  </p> */}
                {/* <LSTMPrediction
                  historicalData={coinHistory.prices.map(
                    ([timestamp, price]) => ({
                      date: new Date(timestamp).toISOString(),
                      price,
                    })
                  )}
                /> */}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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
