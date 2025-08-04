import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { BarChart3, User, LogOut, Info, BookOpen, LineChart, Star, PieChart, FileText } from 'lucide-react';
import image from "../../assets/image.png";

const Navbar = () => {
  const { isAuthenticated, setUser } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear Zustand state
    setUser(null);
  
    // Clear localStorage
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  
    // Redirect to login
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center text-xl font-bold text-gray-800">
              <img 
                src={image}
                alt="GrowUp Logo" 
                className="h-8 w-8 mr-2"
              />
              GrowUp
            </Link>
          </div>
          
          <div className="flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                <Link to="/learn" className="text-gray-600 hover:text-gray-900 flex items-center">
                  <BookOpen className="h-4 w-4 mr-1" />
                  Learn
                </Link>
                <Link to="/stocks" className="text-gray-600 hover:text-gray-900 flex items-center">
                  <LineChart className="h-4 w-4 mr-1" />
                  Stocks
                </Link>
                <Link to="/watchlist" className="text-gray-600 hover:text-gray-900 flex items-center">
                  <Star className="h-4 w-4 mr-1" />
                  Watchlist
                </Link>
                <Link to="/holding" className="text-gray-600 hover:text-gray-900 flex items-center">
                  <PieChart className="h-4 w-4 mr-1" />
                  Holdings
                </Link>
                <Link to="/orders" className="text-gray-600 hover:text-gray-900 flex items-center">
                  <FileText className="h-4 w-4 mr-1" />
                  Orders
                </Link>
                <Link to="/about" className="text-gray-600 hover:text-gray-900 flex items-center">
                  <Info className="h-4 w-4 mr-1" />
                  About
                </Link>
                <Link to="/" className="text-gray-600 hover:text-gray-900">
                  <User className="h-5 w-5" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <>
                <Link to="/learn" className="text-gray-600 hover:text-gray-900 flex items-center">
                  <BookOpen className="h-4 w-4 mr-1" />
                  Learn
                </Link>
                <Link to="/about" className="text-gray-600 hover:text-gray-900 flex items-center">
                  <Info className="h-4 w-4 mr-1" />
                  About
                </Link>
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;