// Components/PricePrediction/components/ProgressIndicator.js
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Brain, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/Components/ui/button";
import { ProgressBar } from "./ProgressBar";
import { motion, AnimatePresence } from "framer-motion";

const ProgressIndicator = ({
  progress,
  currentEpoch,
  totalEpochs,
  loss,
  modelName = "Neural Network",
  metrics = {},
  index = 0,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Calculate position based on index for horizontal stacking
  const rightPosition = 16 + index * 320; // 320px is card width (300px) + gap (20px)

  return (
    <Card
      className="w-[300px] bg-white/40 dark:bg-slate-950/40 backdrop-blur-xs fixed top-12 z-50 shadow-lg border-white/20 dark:border-slate-700/30"
      style={{
        right: `${rightPosition}px`,
        transition: "right 0.2s ease-in-out",
      }}
    >
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Brain className="h-4 w-4" />
          {modelName} Training
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-white/20 dark:hover:bg-slate-800/50"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <Maximize2 className="h-4 w-4" />
          ) : (
            <Minimize2 className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent>
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <ProgressBar value={progress} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">Epoch</span>
                    <span className="font-medium">
                      {currentEpoch} / {totalEpochs}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">Loss</span>
                    <span className="font-medium">
                      {loss?.toFixed(6) || "N/A"}
                    </span>
                  </div>

                  {Object.entries(metrics).map(([key, value]) => (
                    <div key={key} className="flex flex-col">
                      <span className="text-muted-foreground">{key}</span>
                      <span className="font-medium">
                        {typeof value === "number" ? value.toFixed(6) : value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default ProgressIndicator;
