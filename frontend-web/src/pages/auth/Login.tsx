import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { useState } from "react";
import { Eye, EyeOff, LogIn, CarFront, AlertTriangle } from "lucide-react";
import { motion, type Variants } from "framer-motion";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const { loginUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setError("");
      await loginUser(data);
      navigate("/dashboard");
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Invalid email or password.");
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  return (
    <div className="flex flex-col lg:flex-row-reverse h-screen bg-gray-50 font-sans overflow-hidden">
      {/* Right side */}
      <div className="flex flex-1 flex-col px-4 py-12 sm:px-6 lg:flex-none lg:w-1/2 lg:px-20 xl:px-24 bg-white z-10 shadow-2xl overflow-y-auto">
        <motion.div
          className="mx-auto my-auto w-full max-w-sm lg:w-96 py-8"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants}>
            <Link to="/" className="inline-flex items-center gap-2 mb-8 group">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:bg-blue-700 transition-colors">
                <span className="text-xl font-bold">Q</span>
              </div>
              <span className="text-2xl font-extrabold text-gray-900 tracking-tight group-hover:text-blue-600 transition-colors">
                QuickPark
              </span>
            </Link>

            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Please enter your details to sign in.
            </p>
          </motion.div>

          <motion.div className="mt-8" variants={itemVariants}>
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 flex items-start gap-3"
                >
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p>{error}</p>
                </motion.div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email
                </label>
                <div>
                  <input
                    {...register("email")}
                    type="email"
                    placeholder="Enter your email"
                    className="block w-full rounded-xl border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all duration-200 ease-in-out"
                  />
                  {errors.email && (
                    <p className="mt-1.5 text-sm font-medium text-red-500">
                      {errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="block w-full rounded-xl border-0 py-3 pl-4 pr-12 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all duration-200 ease-in-out"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-sm font-medium text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a
                    href="#"
                    className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    Forgot password?
                  </a>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full justify-center items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    "Signing in..."
                  ) : (
                    <>
                      Sign in <LogIn size={18} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>

          <motion.p
            className="mt-10 text-center text-sm text-gray-500"
            variants={itemVariants}
          >
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold leading-6 text-blue-600 hover:text-blue-500 transition-colors"
            >
              Start for free
            </Link>
          </motion.p>
        </motion.div>
      </div>

      {/* Left side */}
      <div className="relative hidden w-0 flex-1 lg:block bg-blue-900 h-full overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-900 opacity-90"></div>
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-1/2 -left-24 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-24 right-1/4 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 flex h-full flex-col items-center justify-center p-12 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full max-w-lg bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-3xl shadow-2xl"
          >
            <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 shadow-inner">
              <CarFront className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Smart Parking Solutions
            </h2>
            <p className="text-blue-100 text-lg leading-relaxed">
              Find, reserve, and manage parking spaces effortlessly. Join
              thousands of users who have streamlined their daily commute with
              QuickPark.
            </p>

            <div className="mt-8 flex justify-center gap-4">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-white">10k+</span>
                <span className="text-xs text-blue-200 uppercase tracking-wider font-semibold">
                  Active Users
                </span>
              </div>
              <div className="w-px h-12 bg-white/20"></div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-white">500+</span>
                <span className="text-xs text-blue-200 uppercase tracking-wider font-semibold">
                  Parking Lots
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;
