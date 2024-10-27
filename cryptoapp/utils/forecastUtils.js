// // utils/forecastUtils.js

// /**
//  * Generates future dates based on the last available date
//  * @param {Date} lastDate - The last date in the historical data
//  * @param {number} numPoints - Number of prediction points to generate
//  * @param {number} timeframe - Original timeframe in days
//  * @returns {Date[]} Array of future dates
//  */
// const generateFutureDates = (lastDate, numPoints, timeframe) => {
//   const interval = (timeframe * 24 * 60 * 60 * 1000) / numPoints; // Convert timeframe to milliseconds and divide by points
//   return Array.from(
//     { length: numPoints },
//     (_, i) => new Date(lastDate.getTime() + interval * (i + 1))
//   );
// };

// /**
//  * Simple Moving Average prediction
//  * @param {Array} historicalData - Array of historical price data points
//  * @param {number} window - Window size for moving average
//  * @returns {Object} Prediction results
//  */
// const simpleMovingAverage = (historicalData, window = 20) => {
//   const values = historicalData.slice(-window).map((d) => d.value);
//   const avgValue = values.reduce((a, b) => a + b, 0) / values.length;

//   const lastDate = new Date(historicalData[historicalData.length - 1].date);
//   const numPredictionPoints = Math.floor(historicalData.length * 0.2);

//   const futureDates = generateFutureDates(
//     lastDate,
//     numPredictionPoints,
//     window
//   );

//   return {
//     method: "SMA",
//     predictions: futureDates.map((date) => ({
//       date: date.toLocaleString("en-AU", {
//         month: "short",
//         day: "numeric",
//         hour: "2-digit",
//         minute: "2-digit",
//       }),
//       predicted: avgValue,
//     })),
//   };
// };

// /**
//  * Linear Regression prediction
//  * @param {Array} historicalData - Array of historical price data points
//  * @param {number} window - Training window size
//  * @returns {Object} Prediction results
//  */
// const linearRegression = (historicalData, window = 30) => {
//   const trainingData = historicalData.slice(-window);

//   // Convert dates to numerical values (days since first date)
//   const firstDate = new Date(trainingData[0].date).getTime();
//   const x = trainingData.map(
//     (d) => (new Date(d.date).getTime() - firstDate) / (24 * 60 * 60 * 1000)
//   );
//   const y = trainingData.map((d) => d.value);

//   // Calculate linear regression parameters
//   const n = x.length;
//   const sumX = x.reduce((a, b) => a + b, 0);
//   const sumY = y.reduce((a, b) => a + b, 0);
//   const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
//   const sumXX = x.reduce((a, b) => a + b * b, 0);

//   const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
//   const intercept = (sumY - slope * sumX) / n;

//   const lastDate = new Date(historicalData[historicalData.length - 1].date);
//   const numPredictionPoints = Math.floor(historicalData.length * 0.2);

//   const futureDates = generateFutureDates(
//     lastDate,
//     numPredictionPoints,
//     window
//   );

//   return {
//     method: "Linear Regression",
//     predictions: futureDates.map((date) => ({
//       date: date.toLocaleString("en-AU", {
//         month: "short",
//         day: "numeric",
//         hour: "2-digit",
//         minute: "2-digit",
//       }),
//       predicted:
//         slope * ((date.getTime() - firstDate) / (24 * 60 * 60 * 1000)) +
//         intercept,
//     })),
//   };
// };

// export const generatePredictions = (
//   historicalData,
//   methods = ["sma", "linear"]
// ) => {
//   const predictions = {};

//   if (methods.includes("sma")) {
//     predictions.sma = simpleMovingAverage(historicalData);
//   }

//   if (methods.includes("linear")) {
//     predictions.linear = linearRegression(historicalData);
//   }

//   return predictions;
// };

// utils/forecastUtils.js

/**
 * Generates future dates based on the last available date and data interval
 * @param {Array} historicalData - Historical data points
 * @param {number} numPoints - Number of prediction points to generate
 * @returns {Array} Array of prediction timestamps
 */
const generateFutureDates = (historicalData, numPoints) => {
  const lastDate = new Date(
    historicalData[historicalData.length - 1].date
  ).getTime();
  const interval =
    new Date(historicalData[1].date).getTime() -
    new Date(historicalData[0].date).getTime();

  return Array.from(
    { length: numPoints },
    (_, i) => lastDate + (i + 1) * interval
  );
};

/**
 * Simple Moving Average prediction
 */
const simpleMovingAverage = (historicalData, window = 20) => {
  const values = historicalData.slice(-window).map((d) => d.value);
  const avgValue = values.reduce((a, b) => a + b, 0) / values.length;

  const numPredictionPoints = Math.floor(historicalData.length * 0.2);
  const futureDates = generateFutureDates(historicalData, numPredictionPoints);

  return {
    method: "SMA",
    predictions: futureDates.map((timestamp) => ({
      date: new Date(timestamp).toLocaleString("en-AU", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      predicted: avgValue,
    })),
  };
};

/**
 * Linear Regression prediction
 */
const linearRegression = (historicalData, window = 30) => {
  const trainingData = historicalData.slice(-window);

  // Convert dates to numerical values (milliseconds since epoch)
  const x = trainingData.map((d) => new Date(d.date).getTime());
  const y = trainingData.map((d) => d.value);

  // Calculate linear regression parameters
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
  const sumXX = x.reduce((a, b) => a + b * b, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const numPredictionPoints = Math.floor(historicalData.length * 0.2);
  const futureDates = generateFutureDates(historicalData, numPredictionPoints);

  return {
    method: "Linear Regression",
    predictions: futureDates.map((timestamp) => ({
      date: new Date(timestamp).toLocaleString("en-AU", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      predicted: slope * timestamp + intercept,
    })),
  };
};

export const generatePredictions = (
  historicalData,
  methods = ["sma", "linear"]
) => {
  const predictions = {};

  if (methods.includes("sma")) {
    predictions.sma = simpleMovingAverage(historicalData);
  }

  if (methods.includes("linear")) {
    predictions.linear = linearRegression(historicalData);
  }

  return predictions;
};
