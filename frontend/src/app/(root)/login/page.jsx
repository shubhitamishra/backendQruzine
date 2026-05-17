"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { Eye, EyeOff, Shield, Store, AlertCircle, CheckCircle } from "lucide-react";

const Login = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    adminId: "",
    password: "",
  });
  
  const base_url = process.env.NEXT_PUBLIC_API_BASE_URL;
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");
    
    // Validation
    if (!formData.adminId.trim()) {
      setError("Admin ID is required");
      setIsLoading(false);
      return;
    }
    
    if (!formData.password.trim()) {
      setError("Password is required");
      setIsLoading(false);
      return;
    }
    
    const apiEndpoint = isAdmin 
      ? `${base_url}/auth/superadmin/login`
      : `${base_url}/auth/subadmin/login`;
    
    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminId: formData.adminId.trim(),
          password: formData.password
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setSuccess(data.message || "Login successful!");
        
        // Store token in localStorage
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("userRole", data.user.role);
        
        // Small delay to show success message
        setTimeout(() => {
          if (isAdmin) {
            window.location.href = "/admin";
          } else {
            const resId = data.user.resID || "default";
            window.location.href = `/restaurant/${resId}`;
          }
        }, 1000);
        
      } else {
        setError(data.message || "Login failed. Please check your credentials.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Network error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear errors when user starts typing
    if (error) setError("");
  };

  const toggleUserType = () => {
    setIsAdmin(!isAdmin);
    setError("");
    setSuccess("");
    setFormData({ adminId: "", password: "" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Logo in top-left corner - matches splash screen positioning */}
      <div className="fixed top-6 left-6 z-50">
        <div className="w-14 h-14 relative">
          <Image
            src="/images/logo.png"
            alt="Logo"
            fill
            className="object-contain filter drop-shadow-lg"
            priority
          />
        </div>
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div 
          className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-blue-400 to-indigo-600 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '0s', animationDuration: '4s' }}
        ></div>
        <div 
          className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-l from-purple-500 to-blue-600 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '1s', animationDuration: '6s' }}
        ></div>
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '2s', animationDuration: '5s' }}
        ></div>
      </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-30 animate-ping"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          ></div>
        ))}
      </div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="transform transition-all duration-700 hover:scale-105">
            
          </div>
          <p className="text-gray-300 text-lg font-light">
            {isAdmin ? "Access your admin dashboard" : "Manage your restaurant"}
          </p>
          
          {/* Decorative line */}
          <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent mx-auto"></div>
        </div>

        {/* Login Card */}
        <div className="transform transition-all duration-500 hover:scale-[1.02]">
          <Card className="shadow-2xl border border-gray-800/50 bg-gradient-to-b from-gray-900/95 to-black/95 backdrop-blur-xl relative overflow-hidden">
            {/* Card glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 via-indigo-500/5 to-purple-600/5 rounded-lg"></div>
            
            <CardHeader className="space-y-6 pb-8 relative z-10">
              <div className="text-center">
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                  {isAdmin ? "Super Admin Portal" : "Restaurant Admin Portal"}
                </CardTitle>
                
                {/* Icon indicator */}
                <div className="mt-4 w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                  {isAdmin ? (
                    <Shield className="text-white w-8 h-8" />
                  ) : (
                    <Store className="text-white w-8 h-8" />
                  )}
                </div>
              </div>
              
              {/* Role Switch Button */}
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleUserType}
                  disabled={isLoading}
                  className="text-gray-400 hover:text-blue-400 transition-all duration-300 border border-transparent hover:border-blue-400/30 rounded-full px-6 py-2 hover:bg-blue-400/10 transform hover:scale-105"
                >
                  {isAdmin ? "Switch to Restaurant Admin" : "Switch to Super Admin"}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pb-8 relative z-10">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Alert */}
                {error && (
                  <Alert className="border-red-500/50 bg-red-500/10">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-400">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Success Alert */}
                {success && (
                  <Alert className="border-green-500/50 bg-green-500/10">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <AlertDescription className="text-green-400">
                      {success}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-5">
                  {/* Admin ID Field */}
                  <div className="space-y-2 group">
                    <Label htmlFor="adminId" className="text-blue-400 font-medium text-sm flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      Admin ID
                    </Label>
                    <Input
                      id="adminId"
                      name="adminId"
                      type="text"
                      placeholder="Enter your admin ID"
                      value={formData.adminId}
                      onChange={handleInputChange}
                      required
                      disabled={isLoading}
                      className="h-14 px-4 bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 rounded-lg hover:bg-gray-800/70 group-hover:border-blue-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2 group">
                    <Label htmlFor="password" className="text-blue-400 font-medium text-sm flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        disabled={isLoading}
                        className="h-14 px-4 pr-12 bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 rounded-lg hover:bg-gray-800/70 group-hover:border-blue-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isLoading}
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-400 h-10 w-10 p-0"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div>
                  <Button
                    type="submit"
                    disabled={isLoading || !formData.adminId || !formData.password}
                    className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed rounded-lg shadow-lg hover:shadow-blue-400/25 relative overflow-hidden"
                  >
                    {/* Button shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700"></div>
                    
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Signing In...</span>
                      </div>
                    ) : (
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {isAdmin ? <Shield className="w-5 h-5" /> : <Store className="w-5 h-5" />}
                        Sign In
                      </span>
                    )}
                  </Button>
                </div>
              </form>

              {/* Footer Links */}
              <div className="mt-8 text-center space-y-3">
                <a 
                  href="#" 
                  className="text-gray-400 hover:text-blue-400 transition-all duration-300 text-sm relative inline-block group"
                >
                  Forgot your password?
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300"></div>
                </a>
                
                <div className="text-xs text-gray-500">
                  Need help? Contact your system administrator
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>
            By signing in, you agree to our{" "}
            <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors duration-300 hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors duration-300 hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-r from-blue-400/20 to-indigo-600/20 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute -bottom-20 -right-20 w-32 h-32 bg-gradient-to-l from-indigo-500/20 to-purple-600/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-5" 
        style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      ></div>
    </div>
  );
};

export default Login;