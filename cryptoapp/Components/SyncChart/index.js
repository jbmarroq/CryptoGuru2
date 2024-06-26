import useSWR from "swr";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { GECKO_API_KEY } from "@/Config/CoinGeckoAPI";
import { Skeleton } from "../ui/skeleton";
import {
  LinearGradient,
  stop,
  defs,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Brush,
  AreaChart,
  Area,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { mutate } from "swr";

const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

export function SyncChart() {
  const [days, setDays] = useState(1);
  //   const [chartData, setChartData] = useState([]);
  const [didUpdateChartData, setDidUpdateChartData] = useState(false);
  const [didUpdateAgain, setDidUpdateAgain] = useState(false);
  const [lastClickedButton, setLastClickedButton] = useState(1);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const router = useRouter();
  const { CoinID } = router.query;
  const aud = "aud";
  const fetcher = (...args) =>
    fetch(...args, {
      method: "GET",
      headers: {
        "x-cg-demo-api-key": GECKO_API_KEY,
      },
    }).then((res) => res.json());

  const URL = `https://api.coingecko.com/api/v3/coins/${CoinID}/market_chart?vs_currency=${aud}&days=${days}`;

  const { data: coinHistory, error, isLoading } = useSWR(URL, fetcher);

  console.log("CoinHistory : ", coinHistory);
  const chartData = coinHistory?.prices.map((priceData, index) => ({
    date: formatDate(priceData[0]),
    price: priceData[1],
    marketCaps: coinHistory.market_caps[index][1],
    totalVolumes: coinHistory.total_volumes[index][1],
  }));
  // console.log(error);
  //   useEffect(() => {
  //     if (coinHistory && coinHistory.prices) {
  //       setChartData(
  //         (prevData) =>
  //           [
  //             ...prevData,
  //             ...coinHistory?.prices.map((priceData, index) => ({
  //               date: formatDate(priceData[0]),
  //               price: priceData[1],
  //               marketCaps: coinHistory.market_caps[index][1],
  //               totalVolumes: coinHistory.total_volumes[index][1],
  //             })),
  //           ].sort((a, b) => new Date(a.date) - new Date(b.date)) ///datapoints are concatenated need to sort by datetime
  //       );
  //     }
  //   }, [coinHistory]);
  const handleClick = (days) => {
    setDays(days);
    setLastClickedButton(days); // Update the lastClickedButton state
    mutate(URL, undefined, true); // Revalidate the data
  };

  if (error) return <div>Failed to load coinHistory</div>;
  if (isLoading)
    return (
      <div className="border bg-stone-300 dark:border dark:border-stone-700 dark:bg-slate-950 rounded-md p-4">
        <div className="flex justify-between w-full mb-4">
          <Skeleton className="h-10 w-64 mr-2" />
          <Skeleton className="h-10 w-64 mr-2" />
          <Skeleton className="h-10 w-64 mr-2" />
          <Skeleton className="h-10 w-64" />
        </div>
        <Skeleton className="h-48 w-full mb-4" />
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-48 w-full mb-4" />
        <Skeleton className="h-48 w-full" />
      </div>
    );

  //   const handleBrushChange = (value) => {
  //     const { startIndex, endIndex } = value;

  //     console.log("currentIndex", startIndex);
  //     console.log("endIndex", endIndex);
  //     if (startIndex >= 2148 && !didUpdateAgain) {
  //       //assuming fetch returns 365 datapoints
  //       setDays(1);
  //       mutate(
  //         URL,
  //         (prevData) => {
  //           const newData = prevData.prices.map((priceData, index) => ({
  //             date: formatDate(priceData[0]),
  //             price: priceData[1],
  //             marketCaps: prevData.market_caps[index][1],
  //             totalVolumes: prevData.total_volumes[index][1],
  //           }));
  //           setDidUpdateAgain(true);
  //           return [...chartData, ...newData];
  //         },
  //         false
  //       ); // Don't revalidate the data
  //     } else if (startIndex >= 275 && !didUpdateChartData) {
  //       //assuming fetch returns 365 datapoints
  //       setDays(90);
  //       mutate(
  //         URL,
  //         (prevData) => {
  //           //data for 365days
  //           const newData = prevData.prices.map((priceData, index) => ({
  //             //data plus 90days-Note some days are repeated, hence the sorting afterwards
  //             date: formatDate(priceData[0]),
  //             price: priceData[1],
  //             marketCaps: prevData.market_caps[index][1],
  //             totalVolumes: prevData.total_volumes[index][1],
  //           }));
  //           console.log("NewDATA : ", newData);
  //           setDidUpdateChartData(true);
  //           return [...chartData, ...newData];
  //         },
  //         false
  //       );
  //     }
  //   };

  console.log("DisplayedData:", chartData);
  return (
    <div className="border bg-slate-100 dark:border dark:border-stone-700 dark:bg-slate-950 rounded-md p-4  ">
      <div className="flex justify-between w-full mb-4">
        <button
          className={`flex-grow bg-stone-200 shadow-md hover:bg-slate-900 text-stone-300 border border-stone-200 hover:text-white  hover:border-transparent dark:border-stone-700 dark:text-stone-500 dark:hover:text-white  dark:bg-slate-900 dark:hover:border-white ${
            lastClickedButton === 1
              ? "text-stone-600 border-stone-300 dark:border-2 dark:text-white" //border-2 border-slate-400 dark:border-2 dark:border-stone-200
              : ""
          }`}
          onClick={() => handleClick(1)}
        >
          24 hours
        </button>
        <div className="w-4"></div>
        <button
          className={`flex-grow bg-stone-200  shadow-md hover:bg-slate-900 text-stone-300 border border-stone-200 hover:text-white  hover:border-transparent  dark:border-stone-700 dark:text-stone-500 dark:hover:text-white  dark:bg-slate-900 dark:hover:border-white ${
            lastClickedButton === 7
              ? "text-stone-600 border-stone-300 dark:border-2 dark:text-white"
              : ""
          }`}
          onClick={() => handleClick(7)}
        >
          7 days
        </button>
        <div className="w-4"></div>
        <button
          className={`flex-grow bg-stone-200 shadow-md  hover:bg-slate-900 text-stone-300 border  border-stone-200 hover:text-white  hover:border-transparent  dark:border-stone-700 dark:text-stone-500 dark:hover:text-white  dark:bg-slate-900 dark:hover:border-white ${
            lastClickedButton === 30
              ? "text-stone-600 border-stone-300 dark:border-2 dark:text-white"
              : ""
          }`}
          onClick={() => handleClick(30)}
        >
          1 month
        </button>
        <div className="w-4"></div>
        <button
          className={`flex-grow bg-stone-200 shadow-md  hover:bg-slate-900 text-stone-300 border border-stone-200 hover:text-white  hover:border-transparent  dark:border-stone-700 dark:text-stone-500 dark:hover:text-white  dark:bg-slate-900 dark:hover:border-white ${
            lastClickedButton === 365
              ? "text-stone-600 border-stone-300 dark:border-2 dark:text-white"
              : ""
          }`}
          onClick={() => handleClick(365)}
        >
          1 year
        </button>
      </div>
      <h1 className="text-md md:text-xl dark:text-amber-500">Price (AU$)</h1>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart
          width={500}
          height={200}
          data={chartData}
          syncId="anyId"
          margin={{
            top: 10,
            right: windowWidth < 768 ? 0 : 90,
            left: windowWidth < 768 ? 0 : 90,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FDDC5C" stopOpacity={0.8}></stop>
              <stop offset="95%" stopColor="#FDDC5C" stopOpacity={0}></stop>
            </linearGradient>
          </defs>
          <Brush
            dataKey="date"
            height={25}
            startIndex={5}
            travellerWidth={5}
            fill="#E5E5E5"
            endIndex={chartData.length - 1}
          />

          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis
            domain={["auto", "auto"]}
            tickFormatter={(value) =>
              value.toLocaleString("en", {
                notation: "compact",
              })
            }
          />
          <Tooltip
            labelStyle={{
              color: "black",
            }}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke="goldenrod"
            // fill="#FDDC5C" //"#FDDC5C"
            fillOpacity={1}
            fill="url(#colorPrice)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
      <h1 className="text-md md:text-xl dark:text-amber-500">
        Market Caps (AU$)
      </h1>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart
          width={500}
          height={200}
          data={chartData}
          syncId="anyId"
          margin={{
            top: 10,
            right: windowWidth < 768 ? 0 : 90,
            left: windowWidth < 768 ? 0 : 90,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorMarket" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="yellowgreen"
                stopOpacity={0.8}
              ></stop>
              <stop offset="95%" stopColor="yellowgreen" stopOpacity={0}></stop>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis
            domain={["auto", "auto"]}
            tickFormatter={(value) =>
              value.toLocaleString("en", {
                notation: "compact",
                compactDisplay: "short",
              })
            }
          />
          {/* domain={[0, "auto"]} */}
          <Tooltip labelStyle={{ color: "black" }} />

          <Area
            type="monotone"
            dataKey="marketCaps"
            stroke="limegreen"
            // fill="yellowgreen"
            // fill="#edff4d"
            fillOpacity={1}
            fill="url(#colorMarket)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
      <h1 className="text-md md:text-xl  dark:text-amber-500">
        Total Volume (AU$)
      </h1>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart
          width={500}
          height={200}
          data={chartData}
          syncId="anyId"
          margin={{
            top: 10,
            right: windowWidth < 768 ? 0 : 90,
            left: windowWidth < 768 ? 0 : 90,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorVolumes" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ff8cff" stopOpacity={0.8}></stop>
              <stop offset="95%" stopColor="#ff8cff" stopOpacity={0}></stop>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis
            domain={["auto", "auto"]}
            tickFormatter={(value) =>
              value.toLocaleString("en", {
                notation: "compact",
                compactDisplay: "short",
              })
            }
          />
          <Tooltip labelStyle={{ color: "black" }} />
          <Area
            type="monotone"
            dataKey="totalVolumes"
            stroke="magenta"
            //
            fillOpacity={1}
            fill="url(#colorVolumes)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
