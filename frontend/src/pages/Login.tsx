import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Eye, EyeOff, Mail, Lock, Github, Twitter, Facebook } from "lucide-react"
import { motion } from "framer-motion"
import { useAuthStore } from "../store/authStore"
import { useNavigate } from "react-router-dom"

export default function LoginPage() {
  const navigate = useNavigate();
  const [Email, setEmail] = useState("");
  const [Password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tab, setTab] = useState<"email" | "social">("email");

  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("first")
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log(import.meta.env.VITE_BACKEND_URL);
      console.log("working")
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ Email, Password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong!");
      }

      const { token, user } = data;

      // Save to localStorage manually
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);

      // Update Zustand state
      setAuth(user, token);

      // Redirect or show success
      navigate("/stocks");
    } catch (error: any) {
      console.error("Login failed:", error.message);
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome Back</h1>
          <p className="text-gray-500">Sign in to your account to continue</p>
        </div>

        <div className="bg-white border rounded-lg shadow-lg">
          <div className="p-6">
            <div className="grid grid-cols-2 gap-2 mb-6">
              <button
                onClick={() => setTab("email")}
                className={`py-2 px-4 rounded ${
                  tab === "email" ? "bg-blue-600 text-white" : "bg-gray-100"
                }`}
              >
                Email
              </button>
              <button
                onClick={() => setTab("social")}
                className={`py-2 px-4 rounded ${
                  tab === "social" ? "bg-blue-600 text-white" : "bg-gray-100"
                }`}
              >
                Social Login
              </button>
            </div>

            {tab === "email" && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={Email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-10 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-sm font-medium">
                      Password
                    </label>
                    <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={Password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="remember" className="h-4 w-4" />
                  <label htmlFor="remember" className="text-sm font-medium">
                    Remember me for 30 days
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </button>
              </form>
            )}

            {tab === "social" && (
              <div className="space-y-4">
                {[{ icon: Github, text: "GitHub" }, { icon: Twitter, text: "Twitter", color: "text-sky-500" }, { icon: Facebook, text: "Facebook", color: "text-blue-600" }].map(
                  ({ icon: Icon, text, color }) => (
                    <motion.div key={text} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <button className="w-full flex items-center justify-center gap-2 border py-2 rounded hover:bg-gray-100 transition">
                        <Icon className={`h-5 w-5 ${color || ""}`} />
                        <span>Continue with {text}</span>
                      </button>
                    </motion.div>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Don't have an account?{" "}
            <Link href="/signup" className="text-blue-600 font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
