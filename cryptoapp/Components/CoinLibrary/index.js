// import { useState, useEffect } from "react";
// import { CoinRow } from "../CoinRow";

import { CoinsTable } from "../CoinTable/CoinTable";
import { GECKO_API_KEY } from "@/Config/CoinGeckoAPI";
import Link from "next/link";
// import AddToQueueIcon from "@mui/icons-material/AddToQueue";

import { useRouter } from "next/router";
import { Container, Typography, Box } from "@mui/material";
import { SyncChart } from "../CoinChart";
import { Button } from "../ui/button";
import { ArrowLeft } from "lucide-react";

// import { MultiCarousel } from "../MultiCarousel";
import { EmblaCarousel } from "../emblacarousel";
import { CoinsDataTable } from "../ShadTable";
import { NavMenu } from "../NavMenu";
import { ModeToggle } from "../ToggleMode/ModeToggle";
import { MenuBar } from "../Menubar";

export function CoinLibrary({}) {
  return (
    <>
      <div className="sticky p-1 top-0 z-50 w-full border-transparent bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60  flex flex-wrap items-center justify-between dark:border-transparent  md:px-6">
        {/* <NavMenu />
        <MenuBar /> */}
        <Link href={"/"}>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 "
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Guru
          </Button>
        </Link>
        <ModeToggle />
      </div>
      {/* </div> */}
      <h1 className="scroll-m-20 border-b pt-4 pb-2  ml-0 md:ml-4 text-3xl font-semibold tracking-tight first:mt-0 dark:border-stone-700">
        Trending Coins
      </h1>

      <EmblaCarousel />
      <div className="max-w-7xl mx-auto px-0 sm:px-0 lg:px-8">
        <h1 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 dark:border-stone-700 text-center p-10">
          Cryptocurrency Prices by Market Cap
        </h1>

        <CoinsDataTable />
      </div>
    </>
  );
}
