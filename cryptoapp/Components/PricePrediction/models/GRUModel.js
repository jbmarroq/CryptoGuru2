import React, { useEffect, useState, useRef } from "react";
import * as tf from "@tensorflow/tfjs";
import ProgressIndicator from "../components/ProgressIndicator";

const GRUModel = ({
  historicalData,
  onPredictionComplete,
  isEnabled = false,
  index = 0,
}) => {
  const [isTraining, setIsTraining] = useState(false);
  const [error, setError] = useState(null);
  const [currentEpoch, setCurrentEpoch] = useState(0);
  const [progress, setProgress] = useState(0);
  const [loss, setLoss] = useState(null);
  const [additionalMetrics, setAdditionalMetrics] = useState({});
  const modelTrainedRef = useRef(false);
  const totalEpochs = 15; // Aligned with LSTM

  const getModelParams = (dataLength) => {
    // For 24 hours (around 288 points, 5-minute intervals)
    if (dataLength <= 300) {
      return {
        lookback: 24,
        units: [28, 14],
        learningRate: 0.01,
        batchSize: 16,
        subsampleSize: Math.min(dataLength, 144),
        smoothingWindow: 3,
        trendAmplification: 1.2,
      };
    }
    // For 7 days (around 169 points, hourly intervals)
    else if (dataLength <= 170) {
      return {
        lookback: 16,
        units: [24, 12],
        learningRate: 0.008,
        batchSize: 12,
        subsampleSize: Math.min(dataLength, 120),
        smoothingWindow: 2,
        trendAmplification: 1.4,
      };
    }
    // For 1 month (around 721 points, hourly intervals)
    else if (dataLength <= 750) {
      return {
        lookback: 24,
        units: [32, 16],
        learningRate: 0.006,
        batchSize: 24,
        subsampleSize: Math.min(dataLength, 168),
        smoothingWindow: 4,
        trendAmplification: 1.3,
      };
    }
    // For 1 year (around 366 points, daily intervals)
    else {
      return {
        lookback: 30,
        units: [40, 20],
        learningRate: 0.004,
        batchSize: 32,
        subsampleSize: Math.min(dataLength, 180),
        smoothingWindow: 5,
        trendAmplification: 1.5,
      };
    }
  };

  const smoothData = (data, windowSize) => {
    const smoothed = [];
    for (let i = 0; i < data.length; i++) {
      let sum = 0;
      let count = 0;
      const start = Math.max(0, i - windowSize);
      const end = Math.min(data.length - 1, i + windowSize);
      for (let j = start; j <= end; j++) {
        sum += data[j];
        count++;
      }
      smoothed.push(sum / count);
    }
    return smoothed;
  };

  const preprocessData = (data, params) => {
    let prices = data.map((d) => d.price);
    const { subsampleSize, smoothingWindow } = params;

    // Apply subsampling while preserving recent data
    if (data.length > subsampleSize) {
      const recentCount = Math.floor(subsampleSize * 0.3); // 30% recent data
      const historicalCount = subsampleSize - recentCount;

      const recentData = prices.slice(-recentCount);
      const stride = Math.max(
        1,
        Math.ceil((prices.length - recentCount) / historicalCount)
      );
      const historicalData = [];

      for (
        let i = 0;
        i < prices.length - recentCount &&
        historicalData.length < historicalCount;
        i += stride
      ) {
        historicalData.push(prices[i]);
      }

      prices = [...historicalData, ...recentData];
    }

    // Apply smoothing
    prices = smoothData(prices, smoothingWindow);

    // Calculate momentum indicators
    const momentum = prices.map((price, i) => {
      if (i === 0) return 0;
      return (price - prices[i - 1]) / prices[i - 1];
    });

    // Normalize data
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const minMomentum = Math.min(...momentum);
    const maxMomentum = Math.max(...momentum);

    const normalizedPrices = prices.map(
      (price) => (price - minPrice) / (maxPrice - minPrice)
    );

    const normalizedMomentum = momentum.map(
      (m) => (m - minMomentum) / (maxMomentum - minMomentum || 1)
    );

    // Calculate trend using recent data
    const trendWindow = Math.min(5, Math.floor(prices.length * 0.05));
    const recentPrices = prices.slice(-trendWindow);
    const trend =
      (recentPrices[recentPrices.length - 1] - recentPrices[0]) /
      (maxPrice - minPrice);

    return {
      normalizedPrices,
      normalizedMomentum,
      minPrice,
      maxPrice,
      trend,
      lastValue: normalizedPrices[normalizedPrices.length - 1],
      sampleRate: data.length / prices.length,
    };
  };

  const createSequences = (prices, momentum, lookback) => {
    const sequences = [];
    const targets = [];

    for (let i = lookback; i < prices.length; i++) {
      const sequence = [];
      for (let j = i - lookback; j < i; j++) {
        sequence.push([prices[j], momentum[j]]);
      }
      sequences.push(sequence);
      targets.push(prices[i]);
    }

    return {
      sequences: tf.tensor3d(sequences),
      targets: tf.tensor2d(targets.map((x) => [x])),
    };
  };

  useEffect(() => {
    const runPrediction = async () => {
      if (!isEnabled || modelTrainedRef.current || !historicalData?.length)
        return;

      try {
        setIsTraining(true);
        setError(null);
        setProgress(0);

        const params = getModelParams(historicalData.length);
        const {
          normalizedPrices,
          normalizedMomentum,
          minPrice,
          maxPrice,
          trend,
          lastValue,
          sampleRate,
        } = preprocessData(historicalData, params);

        const predictionLength = Math.floor(historicalData.length * 0.2);
        const { sequences, targets } = createSequences(
          normalizedPrices,
          normalizedMomentum,
          params.lookback
        );

        // Create model
        const model = tf.sequential();

        // First GRU layer
        model.add(
          tf.layers.gru({
            units: params.units[0],
            returnSequences: true,
            inputShape: [params.lookback, 2],
            activation: "tanh",
            recurrentActivation: "sigmoid",
            kernelRegularizer: tf.regularizers.l2({ l2: 0.01 }),
            recurrentRegularizer: tf.regularizers.l2({ l2: 0.01 }),
            kernelInitializer: "glorotNormal",
            recurrentInitializer: "glorotUniform",
          })
        );

        model.add(tf.layers.batchNormalization());
        model.add(tf.layers.dropout({ rate: 0.2 }));

        // Second GRU layer
        model.add(
          tf.layers.gru({
            units: params.units[1],
            returnSequences: false,
            kernelInitializer: "glorotNormal",
            recurrentInitializer: "glorotUniform",
          })
        );

        model.add(tf.layers.dropout({ rate: 0.1 }));
        model.add(tf.layers.dense({ units: 16, activation: "relu" }));
        model.add(tf.layers.dense({ units: 1 }));

        const optimizer = tf.train.adam(params.learningRate);
        model.compile({
          optimizer,
          loss: "meanSquaredError",
          metrics: ["mse"],
        });

        // Train model
        await model.fit(sequences, targets, {
          epochs: totalEpochs,
          batchSize: params.batchSize,
          shuffle: true,
          validationSplit: 0.15,
          callbacks: {
            onEpochEnd: (epoch, logs) => {
              setCurrentEpoch(epoch + 1);
              setProgress(((epoch + 1) / totalEpochs) * 100);
              setLoss(logs.loss);
              setAdditionalMetrics({
                "Window Size": params.lookback,
                "GRU Units": `${params.units[0]},${params.units[1]}`,
                "Sample Rate": `1/${Math.round(sampleRate)}`,
                "Val Loss": logs.val_loss?.toFixed(6) || "N/A",
              });
            },
          },
        });

        // Generate predictions with better initial alignment
        const lastHistoricalValue =
          normalizedPrices[normalizedPrices.length - 1];
        let lastWindow = sequences
          .slice([sequences.shape[0] - 1])
          .arraySync()[0];
        const predictions = [];

        for (let i = 0; i < predictionLength; i++) {
          const input = tf.tensor3d([lastWindow]);
          const predictedValue = model.predict(input).dataSync()[0];

          // Simple alignment fix: Force first few predictions to stay closer to the last historical value
          if (i < 2) {
            // First two predictions stay very close to last historical value
            predictions.push(
              lastHistoricalValue * 0.95 + predictedValue * 0.05
            );
          } else if (i < 4) {
            // Next two predictions transition more smoothly
            predictions.push(lastHistoricalValue * 0.7 + predictedValue * 0.3);
          } else {
            // Rest of predictions follow the model
            predictions.push(predictedValue);
          }

          // Update window for next prediction
          lastWindow = [
            ...lastWindow.slice(1),
            [
              predictions[predictions.length - 1],
              i === 0
                ? normalizedMomentum[normalizedMomentum.length - 1]
                : predictions[predictions.length - 1] -
                  predictions[predictions.length - 2],
            ],
          ];

          input.dispose();
        }

        // // Generate predictions
        // let lastWindow = sequences
        //   .slice([sequences.shape[0] - 1])
        //   .arraySync()[0];
        // const predictions = [];
        // const lastHistoricalValue =
        //   normalizedPrices[normalizedPrices.length - 1];
        // let currentTrend = trend;

        // for (let i = 0; i < predictionLength; i++) {
        //   const input = tf.tensor3d([lastWindow]);
        //   const predictedValue = model.predict(input).dataSync()[0];

        //   // Smooth transition between historical and predicted data
        //   if (i < 3) {
        //     const transitionWeight = Math.exp(-(i + 1) * 0.5);
        //     const baseValue =
        //       lastHistoricalValue * transitionWeight +
        //       predictedValue * (1 - transitionWeight);

        //     // Apply minimal trend during transition
        //     const adjustedPrediction = baseValue + currentTrend * 0.1;
        //     predictions.push(adjustedPrediction);
        //   } else {
        //     // Regular predictions with trend
        //     const trendDecay = Math.exp(-((i - 3) / (predictionLength / 2)));
        //     const trendAdjustment =
        //       currentTrend * params.trendAmplification * trendDecay;
        //     predictions.push(predictedValue + trendAdjustment);
        //   }

        //   // Update window for next prediction
        //   lastWindow = [
        //     ...lastWindow.slice(1),
        //     [
        //       predictions[predictions.length - 1],
        //       i === 0
        //         ? normalizedMomentum[normalizedMomentum.length - 1]
        //         : predictions[predictions.length - 1] -
        //           predictions[predictions.length - 2],
        //     ],
        //   ];

        //   // Update trend smoothly
        //   if (i > 0) {
        //     currentTrend =
        //       (predictions[predictions.length - 1] -
        //         predictions[predictions.length - 2]) *
        //         0.7 +
        //       currentTrend * 0.3;
        //   }

        //   input.dispose();
        // }

        // // Denormalize predictions with bounds checking
        // const denormalizedPredictions = predictions.map((value) => {
        //   const boundedValue = Math.max(0, Math.min(1, value));
        //   return boundedValue * (maxPrice - minPrice) + minPrice;
        // });

        // onPredictionComplete(
        //   denormalizedPredictions.map((value) => ({
        //     gruPrediction: value,
        //   }))
        // );

        // Denormalize predictions with bounds checking
        const denormalizedPredictions = predictions.map((value) => {
          const boundedValue = Math.max(0, Math.min(1, value));
          return boundedValue * (maxPrice - minPrice) + minPrice;
        });

        onPredictionComplete(
          denormalizedPredictions.map((value) => ({
            gruPrediction: value,
          }))
        );

        modelTrainedRef.current = true;

        // Cleanup
        sequences.dispose();
        targets.dispose();
        model.dispose();
      } catch (err) {
        console.error("GRU Training error:", err);
        setError(err.message);
      } finally {
        setIsTraining(false);
      }
    };

    runPrediction();
  }, [isEnabled, historicalData]);

  if (error) {
    return (
      <div className="text-sm text-red-500 p-2 bg-red-50 dark:bg-red-900/20 rounded">
        GRU training failed: {error}
      </div>
    );
  }

  if (isTraining || modelTrainedRef.current) {
    return (
      <ProgressIndicator
        progress={progress}
        currentEpoch={currentEpoch}
        totalEpochs={totalEpochs}
        loss={loss}
        modelName="GRU"
        metrics={additionalMetrics}
        index={index} // Pass the index
      />
    );
  }

  return null;
};

export default GRUModel;
