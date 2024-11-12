import { GECKO_API_KEY } from "@/Config/CoinGeckoAPI";
import { useRouter } from "next/router";
import useSWR from "swr";
import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination";
import { Input } from "../ui/input";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  CartesianGrid,
  YAxis,
  XAxis,
} from "recharts";

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function formatNumber(number) {
  if (Math.abs(number) >= 1e9) {
    return (
      (number / 1e9).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " B"
    );
  } else if (Math.abs(number) >= 1e6) {
    return (
      (number / 1e6).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " M"
    );
  } else {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
}
const calculateLineColor = (prices) => {
  if (prices.length < 2) return "blue"; // Default color

  const firstPrice = prices[0];
  const lastPrice = prices[prices.length - 1];

  return firstPrice <= lastPrice ? "green" : "red"; // Green for uptrend, red for downtrend
};

// Custom hook for window size
const useWindowDimensions = () => {
  const [windowDimensions, setWindowDimensions] = useState({
    width: undefined,
    height: undefined,
  });

  useEffect(() => {
    function handleResize() {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    // Only add the event listener client-side
    if (typeof window !== "undefined") {
      handleResize(); // Initial size
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  return windowDimensions;
};

export function DataTable() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const router = useRouter();

  const handleRowClick = (coinId) => {
    router.push(`/coins/${coinId}`);
  };
  const aud = "aud";
  const fetcher = (...args) =>
    fetch(...args, {
      method: "GET",
      headers: {
        "x-cg-demo-api-key": GECKO_API_KEY,
      },
    }).then((res) => res.json());

  const URL = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${aud}&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=24h`;

  const { data: topCoins, error } = useSWR(URL, fetcher);

  console.log("TopCoins : ", topCoins);
  console.log(error);
  if (error) return <div>Failed to load Top Coins</div>;
  if (!topCoins) return <div>Loading...</div>;

  const filteredCoins = topCoins?.filter(
    (coin) =>
      coin.name.toLowerCase().includes(search.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(search.toLowerCase())
  );

  const pageCount = Math.ceil((filteredCoins?.length || 0) / 10);
  const maxVisiblePages = 7; // Adjust this value to set the maximum visible page links

  // Function to generate an array of page numbers to display
  const generatePageNumbers = () => {
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(pageCount, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    return Array.from(
      { length: endPage - startPage + 1 },
      (_, index) => startPage + index
    );
  };
  return (
    <>
      <div className="flex py-4 ">
        <Input
          placeholder="Search for a Cryptocurrency..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm rounded-xl "
        />
      </div>
      <div>
        {/* className="rounded-md border" */}
        <Table className="border dark:border dark:border-stone-700 rounded-md">
          <TableHeader className="bg-slate-100 dark:bg-slate-950 ">
            <TableRow className="dark:border-stone-700 ">
              {[
                "Coin",
                "Price",
                "24h Change",
                "24h Volume",
                "Market Cap",
                "7D Sparkline",
              ].map((head) => (
                <TableHead
                  className="font-bold [&[align=center]]:text-center [&[align=right]]:text-right "
                  key={head}
                >
                  {head}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="bg-slate-100 dark:bg-slate-950 ">
            {filteredCoins?.slice((page - 1) * 10, page * 10).map((coin) => (
              // <Link href={`/coins/${coin.id}`} passHref>
              <TableRow
                className="hover:bg-white dark:border-stone-700" //hover:bg-white transition-all duration-700 hover:scale-110 p-2 rounded-full mr-1
                key={coin.id}
                onClick={() => handleRowClick(coin.id)} //<Link to={`/coins/${coin.id}`}> <<=this changes layout
              >
                <TableCell className="p-1">
                  <div className="flex items-center space-x-2 mr-9">
                    <img
                      className="shadow-lg p-2 rounded-full duration-700 hover:scale-110"
                      src={coin.image}
                      alt={`${coin?.name} Ticker`}
                      width={70}
                      height={70}
                    />
                    <div

                    //className="flex flex-col" //</TableCell>style={{ display: "flex", flexDirection: "column" }}
                    >
                      <span>{coin.name}</span>
                      <br></br>
                      <span
                        className="text-gray-500" //style={{ color: "darkgrey" }}
                      >
                        {coin.symbol.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  AU$ {numberWithCommas(coin.current_price.toFixed(2))}
                </TableCell>
                <TableCell
                  className={
                    coin.price_change_percentage_24h != null &&
                    coin.price_change_percentage_24h >= 0
                      ? "text-green-700"
                      : "text-red-500"
                  }
                >
                  {
                    coin.price_change_percentage_24h != null
                      ? `${coin.price_change_percentage_24h.toFixed(2)}%`
                      : "N/A" /* Or any other placeholder text or UI element */
                  }
                </TableCell>
                <TableCell>AU$ {formatNumber(coin.total_volume)}</TableCell>
                <TableCell>AU$ {formatNumber(coin.market_cap)}</TableCell>
                <TableCell className="p-1">
                  {coin.sparkline_in_7d && (
                    // <ResponsiveContainer width="100%" height="100%">

                    <LineChart
                      width={150}
                      height={50}
                      className="shadow-sm rounded-xl"
                      // margin={{
                      //   top: 0,
                      //   right: 0,
                      //   left: 0,
                      //   bottom: 0,
                      // }}
                      data={coin.sparkline_in_7d.price.map((price, index) => ({
                        price: price,
                        time: index, // Assuming the time is linearly increasing
                      }))}
                    >
                      {/* <CartesianGrid strokeDasharray="3 3" /> */}
                      <YAxis hide="true" domain={["auto", "auto"]} />
                      <XAxis hide="true" domain={["auto", "auto"]} />

                      <Line
                        // type="monotone"
                        dataKey="price"
                        stroke={calculateLineColor(coin.sparkline_in_7d.price)}
                        strokeWidth={1}
                        dot={false}

                        // width={50}
                        // height={50}
                        // yAxisId="left"
                      />
                    </LineChart>
                    // </ResponsiveContainer>
                  )}
                </TableCell>
              </TableRow>
              // </Link>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Pagination>
          <PaginationContent className="flex flex-wrap justify-center items-center ">
            {page !== 1 && ( // Render PaginationPrevious only if page is not the first page
              <PaginationItem>
                <PaginationPrevious onClick={() => setPage(page - 1)} />
              </PaginationItem>
            )}

            {generatePageNumbers().map((pageNumber) => (
              <PaginationItem key={pageNumber}>
                <PaginationLink
                  onClick={() => setPage(pageNumber)}
                  isActive={pageNumber === page}
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            ))}

            {pageCount > maxVisiblePages && page < pageCount && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}

            {page !== pageCount && ( // Render PaginationNext only if page is not the last page
              <PaginationItem>
                <PaginationNext onClick={() => setPage(page + 1)} />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      </div>
    </>
  );
}
