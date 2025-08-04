import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import AboutContact from './pages/AboutContact';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import StockList from './pages/StockList';
import StockDetail from './pages/StockDetail';
import Dashboard from './pages/Dashboard';
import Footer from './components/Footer';
import Watchlist from './pages/Watchlist';
import { useAuthStore } from './store/authStore';
import PrivateRoute from './components/PrivateRoute';
import LearnPage from './pages/Learn';
import StockDashboard from './pages/Holding';
import Orders from './pages/Orders';

function App() {
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<AboutContact />} />
            <Route path="/contact" element={<AboutContact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/learn" element={<LearnPage />} />

            <Route path="/stocks" element={<StockList />} />
            <Route path="/holding" element={<StockDashboard/>} />
            <Route path="/stocks/:symbol" element={<StockDetail />} />
            <Route
              path="/dashboard"
              element={
                // <PrivateRoute>
                  <Dashboard />
                // </PrivateRoute>
              }
            />
            <Route path="/stocks" element={<PrivateRoute><StockList /></PrivateRoute> } />
            <Route path="/watchlist" element={<PrivateRoute><Watchlist /></PrivateRoute> } />
            <Route path="/orders" element={<Orders /> } />
          </Routes>
        </main>
        <Footer/>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
    </Router>
  );
}

export default App;
