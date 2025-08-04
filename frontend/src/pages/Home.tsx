import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BarChart3, TrendingUp, Shield, DollarSign, Clock, LineChart, ArrowUpRight, ArrowDownRight, Info } from "lucide-react";

const Home = () => {
  interface Stock {
    index: string;
    last: number;
    yearHigh: number;
    yearLow: number;
    percentChange: number;
  }
  const navigate=useNavigate()

  const [stocks, setStocks] = useState<Stock[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const activeTab="topIndices";

  useEffect(() => {
    let isMounted = true;
    const fetchStockData = async () => {
      if (!isMounted) return;
      setIsLoading(true);
      try {
        const endpoint = activeTab === "topIndices" 
          ? `${import.meta.env.VITE_FLASK_BACKEND_URL}/api/indices`
          : `${import.meta.env.VITE_FLASK_BACKEND_URL}/api/market-status`;
        
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error("Failed to fetch data");
  
        const data = await response.json();
        if (isMounted) setStocks(Array.isArray(data.data) ? data.data.slice(0, 10) : []);
      } catch (error) {
        if (isMounted) setError("Error fetching stock data");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
  
    fetchStockData();
    
  
    




    // Initialize TradingView Widget
    const widgetContainer = document.getElementById("tradingview-widget");
    if (widgetContainer) widgetContainer.innerHTML = "";

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.innerHTML = JSON.stringify({
      symbols: [
        { description: "ADANI", proName: "BSE:ADANIENT" },
        { description: "SENSEX", proName: "BSE:SENSEX" },
        { description: "BAJAJ FINSERV", proName: "BSE:BAJAJFINSV" },
        { description: "RELIANCE POWER", proName: "BSE:RPOWER" },
        { description: "BITCOIN", proName: "BITSTAMP:BTCUSD" },
        { description: "SKYGOLD", proName: "BSE:SKYGOLD" },
        { description: "RBZJEWEL", proName: "BSE:RBZJEWEL" },
        { description: "VPRPL", proName: "BSE:VPRPL" },
        { description: "IRCTC", proName: "BSE:IRCTC" },
        { description: "IREDA", proName: "BSE:IREDA" },
        { description: "IRFC", proName: "BSE:IRFC" },
      ],
      showSymbolLogo: true,
      isTransparent: false,
      displayMode: "adaptive",
      colorTheme: "light",
      locale: "in",
    });

    if (widgetContainer) widgetContainer.appendChild(script);
    const interval = setInterval(fetchStockData, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeTab]);
  

  const fadeInUpVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* TradingView Widget */}
      <div className="w-full overflow-hidden h-[40px] bg-white shadow-sm z-10 pointer-events-none">
        <div id="tradingview-widget" className="w-full h-full" style={{ pointerEvents: 'none', cursor: 'default' }}></div>
      </div>
      
      <div className="max-w-7xl mx-auto pt-[40px]">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center py-16"
        >
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            <span className="text-blue-600">Grow</span>Up Trader
          </h1>
          <div className="flex justify-center items-center mb-6">
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-semibold flex items-center">
              <ArrowUpRight className="mr-2 h-5 w-5" />
              <span>Virtual Trading - Real Experience</span>
            </div>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Master the market without the risk. Our advanced virtual stock simulator gives you $100,000 in virtual cash to build your perfect portfolio and test your strategies in real market conditions.
          </p>
          
          <motion.div 
            className="mt-10 flex flex-wrap justify-center gap-4"
            variants={fadeInUpVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.4 }}
          >
            <button 
             onClick={() => navigate('/stocks')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition transform hover:-translate-y-1">
              Start Trading Now
            </button>
            <button
            onClick={() => navigate('/about')}
            className="bg-white hover:bg-gray-100 text-blue-600 border border-blue-600 px-8 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition transform hover:-translate-y-1">
              Take the Tour
            </button>
          </motion.div>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-3 gap-8 py-12"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
          }}
        >
          {[
            { 
              icon: DollarSign, 
              title: "Risk-Free Trading", 
              desc: "Practice with $100,000 virtual cash and build your confidence with zero risk." 
            },
            { 
              icon: LineChart, 
              title: "Real Market Data", 
              desc: "Trade with real-time market data and develop strategies based on actual market conditions." 
            },
            { 
              icon: Clock, 
              title: "Accelerated Learning", 
              desc: "Learn in weeks what usually takes years of experience in the real market." 
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
              }}
              whileHover={{ scale: 1.03 }}
            >
              <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all border-t-4 border-blue-500">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <feature.icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold ml-4">{feature.title}</h3>
                </div>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="my-16"
        >
          <div className="flex justify-center items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800 ">Market Overview</h2>
            
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading market data...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <div className="text-red-600 text-xl mb-2">⚠️ {error}</div>
                <p className="text-gray-600">Please try again later or check your connection.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-600">STOCK</th>
                      <th className="py-4 px-6 text-center text-sm font-semibold text-gray-600">PRICE</th>
                      <th className="py-4 px-6 text-center text-sm font-semibold text-gray-600">24H CHANGE</th>
                      <th className="py-4 px-6 text-center text-sm font-semibold text-gray-600">Year High</th>
                      <th className="py-4 px-6 text-center text-sm font-semibold text-gray-600">Year Low</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stocks.length > 0 ? (
                      stocks.map((stock, index) => (
                        <motion.tr 
                          key={index}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-gray-100 hover:bg-blue-50 transition cursor-pointer"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center">
                            {stock.index}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center font-mono font-semibold">
                            ₹{stock.last?.toFixed(2) || "N/A"}
                          </td>
                          <td className={`py-4 px-6 text-center font-semibold ${
                            stock.percentChange > 0 ? "text-green-600" : 
                            stock.percentChange < 0 ? "text-red-600" : "text-gray-600"
                          }`}>
                            {stock.percentChange > 0 ? "+" : ""}{stock.percentChange?.toFixed(2) || 0}%
                          </td>
                          <td className="py-4 px-6 text-center text-gray-700">
                            {stock.yearHigh?.toLocaleString() || "N/A"}
                          </td>
                          <td className="py-4 px-6 text-center font-medium text-gray-700">
                            {stock.yearLow || "N/A"}
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-gray-500">
                          No data available at the moment
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* <div className="text-center mt-4 text-sm text-gray-500 flex items-center justify-center">
            <Clock className="h-4 w-4 mr-1" />
            <span>Data updates every 1 minute - Last update: {new Date().toLocaleTimeString()}</span>
          </div> */}
        </motion.div>
        
        <motion.div 
          className="bg-blue-600 rounded-xl p-8 text-white my-16 shadow-lg"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">Ready to Become a Trading Pro?</h2>
              <p className="mb-6 text-blue-100">Join thousands of traders who are mastering the market with our risk-free platform. Start with $100,000 in virtual cash today.</p>
              <button 
                onClick={() => navigate('/signup')}
                className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition"
              >
                Create Free Account
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { number: "50K+", label: "Active Traders" },
                { number: "$2.3B", label: "Virtual Assets" },
                { number: "24/7", label: "Market Access" },
                { number: "0", label: "Financial Risk" },
                { number: "100%", label: "Real Market Data" },
                { number: "5min", label: "Setup Time" }
              ].map((stat, index) => (
                <div key={index} className="bg-blue-700 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold">{stat.number}</div>
                  <div className="text-xs text-blue-200">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;