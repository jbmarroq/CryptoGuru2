# CryptoGuru 🚀

A sophisticated cryptocurrency tracking application that provides real-time market data, detailed coin analysis, and advanced price forecasting using machine learning models.

![CryptoGuru](public/CryptoGuru.png)

## Features 🌟

### Real-Time Market Data

- Track cryptocurrency prices, market caps, and trading volumes
- View price changes over multiple timeframes (24h, 7d, 30d, 1y)
- Interactive charts with comprehensive market metrics
- Responsive design for seamless desktop and mobile experience

### Trending Coins Carousel 🔥

- Auto-updating carousel of trending cryptocurrencies
- Quick access to hot market movers
- Real-time price and trend indicators
- Sparkline visualizations for quick trend analysis

### Detailed Coin Analysis 📊

- In-depth information for each cryptocurrency
- Historical price data visualization
- Market capitalization tracking
- Trading volume analysis
- Price correlation insights

### Advanced Price Forecasting 🔮

Incorporating multiple predictive models using TensorFlow.js:

- **Traditional Analysis**
  - Moving Average (SMA) predictions
  - Linear Regression forecasting
- **Machine Learning Models**
  - LSTM (Long Short-Term Memory) neural networks
  - GRU (Gated Recurrent Unit) networks
  - Real-time model training and visualization
  - Custom-tuned parameters for different timeframes

## Tech Stack 💻

- **Frontend Framework**: Next.js
- **Styling**: Tailwind CSS, shadcn/ui
- **Data Visualization**: Recharts
- **Machine Learning**: TensorFlow.js
- **State Management**: SWR
- **API Integration**: CoinGecko API
- **UI Components**:
  - Material-UI
  - Radix UI
  - Embla Carousel

## Getting Started 🚀

1. Clone the repository:

```bash
git clone https://github.com/yourusername/cryptoguru.git
```

2. Install dependencies:

```bash
cd cryptoguru
npm install
```

3. Create a `.env` file and add your CoinGecko API key:

```env
GECKO_API_KEY=your_api_key_here
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Key Components 🔧

- **CoinsDataTable**: Main cryptocurrency listing with sorting and filtering
- **EmblaCarousel**: Trending coins showcase with auto-play functionality
- **SyncChart**: Synchronized multi-metric charts for price, volume, and market cap
- **PricePrediction**: ML-powered price forecasting system with multiple models

## Machine Learning Features 🤖

The application incorporates sophisticated machine learning models for price prediction:

- **LSTM Model**

  - Specialized for time series forecasting
  - Adaptive learning rates based on data timeframes
  - Dynamic sequence generation for optimal predictions

- **GRU Model**
  - Efficient recurrent neural network implementation
  - Momentum-based prediction enhancement
  - Advanced trend detection capabilities

Both models include:

- Automated parameter tuning
- Real-time training progress visualization
- Confidence metrics display
- Interactive prediction comparisons

## Future Enhancements 🎯

- Portfolio tracking functionality
- Advanced technical indicators
- Social sentiment analysis
- Price alerts and notifications
- Enhanced ML model customization
- Backtesting capabilities for prediction models

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request.

## License 📝

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments 🙏

- CoinGecko API for comprehensive cryptocurrency data
- TensorFlow.js team for the amazing machine learning capabilities
- The open-source community for various UI components and libraries
