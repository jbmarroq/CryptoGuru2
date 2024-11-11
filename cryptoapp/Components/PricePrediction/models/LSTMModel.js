import React, { useEffect, useState, useRef } from "react";
import * as tf from "@tensorflow/tfjs";
import ProgressIndicator from "../components/ProgressIndicator";

const LSTMModel = ({
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
  const totalEpochs = 15;

  const getModelParams = (dataLength) => {
    // For 24 hours (around 288 points, 5-minute intervals)
    if (dataLength <= 300) {
      return {
        lookback: 24,
        units: 28, // Reduced from 32
        learningRate: 0.01,
        batchSize: 16,
        subsampleSize: Math.min(dataLength, 144), // 12 hours worth of data
        smoothingWindow: 3, // Light smoothing for 5-min data
        trendAmplification: 1.2,
      };
    }
    // For 7 days (around 169 points, hourly intervals)
    else if (dataLength <= 170) {
      return {
        lookback: 18,
        units: 24, // Already good
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
        units: 28, // Reduced from 32
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
        units: 32, // Reduced from 48
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
      for (
        let j = Math.max(0, i - windowSize);
        j <= Math.min(data.length - 1, i + windowSize);
        j++
      ) {
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

    if (data.length > subsampleSize) {
      const recentCount = Math.min(subsampleSize * 0.3, data.length * 0.3);
      const historicalCount = subsampleSize - recentCount;

      const recentData = prices.slice(-recentCount);
      const stride = Math.ceil((prices.length - recentCount) / historicalCount);
      const historicalData = prices
        .slice(0, -recentCount)
        .filter((_, i) => i % stride === 0)
        .slice(-historicalCount);

      prices = [...historicalData, ...recentData];
    }

    // Apply smoothing
    prices = smoothData(prices, smoothingWindow);

    // Normalize
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const normalizedData = prices.map((price) => (price - min) / (max - min));

    // Calculate trend using more recent data points
    const trendWindow = Math.min(5, Math.floor(prices.length * 0.05)); // Reduced window
    const recentPrices = prices.slice(-trendWindow);
    const trend =
      (recentPrices[recentPrices.length - 1] - recentPrices[0]) / (max - min); // Normalize differently

    return {
      normalizedData,
      min,
      max,
      trend,
      lastValue: normalizedData[normalizedData.length - 1],
      sampleRate: data.length / prices.length,
    };
  };

  const createSequences = (data, lookback) => {
    const sequences = [];
    const targets = [];

    for (let i = lookback; i < data.length; i++) {
      sequences.push(data.slice(i - lookback, i));
      targets.push(data[i]);
    }

    return {
      sequences: tf.tensor3d(sequences.map((seq) => seq.map((x) => [x]))),
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
        const { normalizedData, min, max, trend, sampleRate } = preprocessData(
          historicalData,
          params
        );
        const predictionLength = Math.floor(historicalData.length * 0.2);

        const { sequences, targets } = createSequences(
          normalizedData,
          params.lookback
        );

        // Create and configure model
        const model = tf.sequential();

        // Input LSTM layer with regularization
        model.add(
          tf.layers.lstm({
            units: params.units,
            returnSequences: false,
            inputShape: [params.lookback, 1],
            activation: "tanh",
            recurrentActivation: "sigmoid",
            kernelRegularizer: tf.regularizers.l2({ l2: 0.01 }),
            recurrentRegularizer: tf.regularizers.l2({ l2: 0.01 }),
            kernelInitializer: "glorotNormal", // Changed from orthogonal
            recurrentInitializer: "glorotNormal", // Changed from orthogonal
          })
        );

        // Add dropout for regularization
        model.add(tf.layers.dropout({ rate: 0.2 }));

        // Dense output layer
        model.add(
          tf.layers.dense({
            units: 1,
            activation: "linear",
          })
        );

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
          validationSplit: 0.1,
          callbacks: {
            onEpochEnd: (epoch, logs) => {
              setCurrentEpoch(epoch + 1);
              setProgress(((epoch + 1) / totalEpochs) * 100);
              setLoss(logs.loss);
              setAdditionalMetrics({
                "Window Size": params.lookback,
                "LSTM Units": params.units,
                "Sample Rate": `1/${Math.round(sampleRate)}`,
                "Val Loss": logs.val_loss?.toFixed(6) || "N/A",
              });
            },
          },
        });

        // Generate predictions
        let currentWindow = normalizedData.slice(-params.lookback);
        let currentTrend = trend;
        const predictions = [];
        const lastHistoricalValue = normalizedData[normalizedData.length - 1];

        for (let i = 0; i < predictionLength; i++) {
          const input = tf.tensor3d([currentWindow.map((x) => [x])]);
          const predictedValue = model.predict(input).dataSync()[0];

          // Improved transition handling
          if (i < 3) {
            const transitionWeight = Math.exp(-(i + 1) * 0.5); // Smoother decay
            const baseValue =
              lastHistoricalValue * transitionWeight +
              predictedValue * (1 - transitionWeight);

            // Apply minimal trend during transition
            const adjustedPrediction = baseValue + currentTrend * 0.1;
            predictions.push(adjustedPrediction);
          } else {
            // Regular predictions with trend
            const trendDecay = Math.exp(-((i - 3) / (predictionLength / 2)));
            const trendAdjustment =
              currentTrend * params.trendAmplification * trendDecay;
            predictions.push(predictedValue + trendAdjustment);
          }

          currentWindow = [
            ...currentWindow.slice(1),
            predictions[predictions.length - 1],
          ];
          if (i > 0) {
            currentTrend =
              (predictions[predictions.length - 1] -
                predictions[predictions.length - 2]) *
                0.7 +
              currentTrend * 0.3; // Smoothed trend update
          }

          input.dispose();
        }

        // Denormalize and format predictions
        const denormalizedPredictions = predictions.map((value) =>
          Math.max(0, value * (max - min) + min)
        );

        onPredictionComplete(
          denormalizedPredictions.map((value) => ({
            lstmPrediction: value,
          }))
        );

        modelTrainedRef.current = true;

        // Cleanup
        sequences.dispose();
        targets.dispose();
        model.dispose();
      } catch (err) {
        console.error("LSTM Training error:", err);
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
        LSTM training failed: {error}
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
        modelName="LSTM"
        metrics={additionalMetrics}
        index={index} // Pass the index
      />
    );
  }

  return null;
};

export default LSTMModel;
