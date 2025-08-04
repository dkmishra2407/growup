import { useState } from "react"

import Link from "next/link"
import { Eye, EyeOff, User, Mail, Lock, Github, Twitter, Facebook, Check, X, PhoneCallIcon } from "lucide-react"
import { motion } from "framer-motion"
import { useAuthStore } from "../store/authStore"
import { useNavigate } from "react-router-dom"



export default function SignUp() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({ Name: "", Email: "", Password: "",MobileNo:"" })
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

const setAuth = useAuthStore((state) => state.setAuth)

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!agreedToTerms) return

  setIsLoading(true)

  try {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.message || "Registration failed")
    }

    const { user, token } = data
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("token", token);
    // Save to Zustand and localStorage
    setAuth(user, token)

    // Redirect to dashboard or homepage
    navigate("/stocks") // Change this path as needed
  } catch (err: any) {
    console.error("Signup error:", err.message)
    alert(err.message)
  } finally {
    setIsLoading(false)
  }
}

  const calculatePasswordStrength = (password: string): number => {
    if (!password) return 0
    let strength = 0
    if (password.length >= 8) strength += 25
    if (/[A-Z]/.test(password)) strength += 25
    if (/[0-9]/.test(password)) strength += 25
    if (/[^A-Za-z0-9]/.test(password)) strength += 25
    return strength
  }

  const passwordStrength = calculatePasswordStrength(formData.Password)
  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return ""
    if (passwordStrength <= 25) return "Weak"
    if (passwordStrength <= 50) return "Fair"
    if (passwordStrength <= 75) return "Good"
    return "Strong"
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 25) return "bg-red-500"
    if (passwordStrength <= 50) return "bg-yellow-500"
    if (passwordStrength <= 75) return "bg-blue-500"
    return "bg-green-500"
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Create an Account</h1>
          <p className="text-muted-foreground">Join our community today</p>
        </div>

        <div className="border rounded-lg shadow-lg p-6 bg-white">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  id="Name"
                  name="Name"
                  value={formData.Name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="pl-10 w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="Email" className="text-sm font-medium">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  id="Email"
                  name="Email"
                  type="Email"
                  value={formData.Email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className="pl-10 w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">
                Mobile No
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <PhoneCallIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  id="MobileNo"
                  name="MobileNo"
                  type="PhoneNo"
                  pattern="[0-9]{10}"
                  value={formData.MobileNo}
                  onChange={handleChange}
                  placeholder="9857420355"
                  className="pl-10 w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="Password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  id="Password"
                  name="Password"
                  type={showPassword ? "text" : "Password"}
                  value={formData.Password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="pl-10 w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Eye className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
              </div>

              {formData.Password && (
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Password Strength: {getPasswordStrengthText()}</span>
                    <span>{passwordStrength}%</span>
                  </div>
                  <div className="w-full h-2 rounded bg-gray-200 overflow-hidden">
                    <div className={`h-2 ${getPasswordStrengthColor()}`} style={{ width: `${passwordStrength}%` }} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                    <StrengthCheck condition={/[A-Z]/.test(formData.Password)} text="Uppercase letter" />
                    <StrengthCheck condition={/[0-9]/.test(formData.Password)} text="Number" />
                    <StrengthCheck condition={/[^A-Za-z0-9]/.test(formData.Password)} text="Special character" />
                    <StrengthCheck condition={formData.Password.length >= 8} text="8+ characters" />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-start space-x-2 pt-2">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1"
              />
              <label htmlFor="terms" className="text-sm leading-tight">
                I agree to the{" "}
                <Link href="/terms" className="text-blue-600 hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-blue-600 hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 rounded bg-blue-600 text-white hover:bg-blue-700"
              disabled={isLoading || !agreedToTerms}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <Github className="h-5 w-5" />, name: "GitHub" },
              { icon: <Twitter className="h-5 w-5 text-sky-500" />, name: "Twitter" },
              { icon: <Facebook className="h-5 w-5 text-blue-600" />, name: "Facebook" },
            ].map(({ icon, name }) => (
              <motion.div key={name} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <button className="w-full h-11 border rounded flex justify-center items-center">{icon}</button>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
};

const StrengthCheck = ({ condition, text }: { condition: boolean; text: string }) => (
  <div className="flex items-center gap-1">
    {condition ? <Check className="h-3 w-3 text-green-500" /> : <X className="h-3 w-3 text-red-500" />}
    <span>{text}</span>
  </div>
)
