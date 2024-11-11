// Components/PricePrediction/components/ProgressBar.js

import * as Progress from "@radix-ui/react-progress";

const ProgressBar = ({ value, className }) => {
  return (
    <Progress.Root
      className="relative overflow-hidden bg-slate-200 dark:bg-slate-700 rounded-full w-full h-2"
      style={{
        transform: "translateZ(0)",
      }}
    >
      <Progress.Indicator
        className="bg-amber-500 w-full h-full transition-transform duration-300 ease-in-out rounded-full"
        style={{
          transform: `translateX(-${100 - (value || 0)}%)`,
        }}
      />
    </Progress.Root>
  );
};

export { ProgressBar };
