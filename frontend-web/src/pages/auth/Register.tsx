import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { useState } from "react";
import { Role } from "../../features/auth/types/authTypes";
import {
  Eye,
  EyeOff,
  UserPlus,
  Car,
  Building2,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

const registerSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be valid"),
  nic: z.string().min(5, "NIC is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum([Role.DRIVER, Role.PARKING_OWNER]),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const Register = () => {
  const { registerUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: Role.DRIVER,
    },
  });

  const selectedRole = useWatch({ control, name: "role" });

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setError("");
      await registerUser(data);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(
        error.response?.data?.message ||
          "Failed to register. Please try again.",
      );
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
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
          className="mx-auto my-auto w-full max-w-sm lg:w-full lg:max-w-md py-8"
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
              Create an account
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Join QuickPark to streamline your parking experience.
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="mt-12 text-center py-12 bg-green-50 rounded-3xl border border-green-100"
              >
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
                  <motion.svg
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="w-10 h-10 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </motion.svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Registration Successful!
                </h3>
                <p className="text-gray-600">
                  You will be redirected to login momentarily...
                </p>
              </motion.div>
            ) : (
              <motion.div key="form" className="mt-8" variants={itemVariants}>
                <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      I am a...
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() =>
                          setValue("role", Role.DRIVER, {
                            shouldValidate: true,
                          })
                        }
                        className={`relative p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center text-center focus:outline-none ${
                          selectedRole === Role.DRIVER
                            ? "border-blue-600 bg-blue-50 text-blue-700"
                            : "border-gray-200 hover:border-blue-200 hover:bg-gray-50 text-gray-600"
                        }`}
                      >
                        <Car
                          size={28}
                          className={`mb-2 ${selectedRole === Role.DRIVER ? "text-blue-600" : "text-gray-400"}`}
                        />
                        <span className="font-semibold text-sm">Driver</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setValue("role", Role.PARKING_OWNER, {
                            shouldValidate: true,
                          })
                        }
                        className={`relative p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center text-center focus:outline-none ${
                          selectedRole === Role.PARKING_OWNER
                            ? "border-blue-600 bg-blue-50 text-blue-700"
                            : "border-gray-200 hover:border-blue-200 hover:bg-gray-50 text-gray-600"
                        }`}
                      >
                        <Building2
                          size={28}
                          className={`mb-2 ${selectedRole === Role.PARKING_OWNER ? "text-blue-600" : "text-gray-400"}`}
                        />
                        <span className="font-semibold text-sm">
                          Parking Owner
                        </span>
                      </button>
                    </div>
                    <input
                      type="hidden"
                      {...register("role")}
                      value={selectedRole}
                    />
                    {errors.role && (
                      <p className="mt-1.5 text-sm font-medium text-red-500">
                        {errors.role.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Full Name
                    </label>
                    <input
                      {...register("fullName")}
                      type="text"
                      placeholder="Kavindu Rathnayaka"
                      className="block w-full rounded-xl border-0 py-2.5 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all"
                    />
                    {errors.fullName && (
                      <p className="mt-1.5 text-sm font-medium text-red-500">
                        {errors.fullName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email address
                    </label>
                    <input
                      {...register("email")}
                      type="email"
                      placeholder="Kavindu@example.com"
                      className="block w-full rounded-xl border-0 py-2.5 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all"
                    />
                    {errors.email && (
                      <p className="mt-1.5 text-sm font-medium text-red-500">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Phone
                      </label>
                      <input
                        {...register("phone")}
                        type="text"
                        placeholder="07XXXXXXXX"
                        className="block w-full rounded-xl border-0 py-2.5 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all"
                      />
                      {errors.phone && (
                        <p className="mt-1.5 text-sm font-medium text-red-500">
                          {errors.phone.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        NIC
                      </label>
                      <input
                        {...register("nic")}
                        type="text"
                        placeholder="123456789V"
                        className="block w-full rounded-xl border-0 py-2.5 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all"
                      />
                      {errors.nic && (
                        <p className="mt-1.5 text-sm font-medium text-red-500">
                          {errors.nic.message}
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
                        className="block w-full rounded-xl border-0 py-2.5 pl-4 pr-12 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1.5 text-sm font-medium text-red-500">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex w-full justify-center items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {isSubmitting ? (
                        "Creating account..."
                      ) : (
                        <>
                          Sign up <UserPlus size={18} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {!success && (
            <motion.p
              className="mt-8 text-center text-sm text-gray-500"
              variants={itemVariants}
            >
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold leading-6 text-blue-600 hover:text-blue-500 transition-colors"
              >
                Log in here
              </Link>
            </motion.p>
          )}
        </motion.div>
      </div>

      {/* Left side */}
      <div className="relative hidden w-0 flex-1 lg:block bg-blue-900 h-full overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-blue-700 opacity-90"></div>
          <div className="absolute top-1/4 -right-24 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute -top-24 left-1/4 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 flex h-full flex-col items-center justify-center p-12 text-center">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="w-full max-w-lg bg-white/10 backdrop-blur-lg border border-white/20 p-10 rounded-[2rem] shadow-2xl"
          >
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                <Car className="text-blue-200 w-8 h-8 mb-2 mx-auto" />
                <h4 className="text-white font-semibold text-sm">
                  Find Parking
                </h4>
                <p className="text-blue-100/70 text-xs mt-1">
                  Real-time availability
                </p>
              </div>
              <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                <Building2 className="text-blue-200 w-8 h-8 mb-2 mx-auto" />
                <h4 className="text-white font-semibold text-sm">
                  Manage Lots
                </h4>
                <p className="text-blue-100/70 text-xs mt-1">
                  Full access control
                </p>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
              Join the QuickPark Network
            </h2>
            <p className="text-blue-100 text-lg leading-relaxed">
              Whether you're looking for a spot or managing a facility, we
              provide the tools you need for a seamless experience.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Register;
