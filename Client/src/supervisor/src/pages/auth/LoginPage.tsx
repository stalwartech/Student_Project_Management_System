import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/api/client";
import { useForm } from "@/hooks/useForm";
import { TextField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { values, update } = useForm({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(values.identifier, values.password);
      if (user.role !== "supervisor") {
        window.location.assign(
          user.role === "student"
            ? "/student/dashboard"
            : "/coordinator/dashboard"
        );
        return;
      }
      navigate("/supervisor/dashboard");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        {/* Single card */}
        <div className="w-full rounded-2xl border border-gray-100 bg-white p-8 shadow-[0_20px_60px_-15px_rgba(11,27,59,0.35)]">
          {/* Logo */}
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0B1B3B]">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <p className="mt-3 text-lg font-bold text-[#0B1B3B]">SPMS</p>
            <p className="text-xs text-gray-500">Student Project Management System</p>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h1 className="text-lg font-semibold text-gray-900">Welcome back!</h1>
            <p className="mt-1 text-sm text-gray-500">Login to continue</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <TextField
                label="Staff ID or email"
                placeholder="e.g. ST12345 or you@school.edu"
                value={values.identifier}
                onChange={update("identifier")}
                required
              />
              <TextField
                label="Password"
                type="password"
                value={values.password}
                onChange={update("password")}
                required
              />

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex justify-end text-sm">
                <Link to="/supervisor/forgot-password" className="text-brand-600 hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="w-full bg-[#0B1B3B] hover:bg-[#152750]" loading={loading}>
                Sign in
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-gray-500">
              Need to set up your account?{" "}
              <Link to="/supervisor/activate" className="text-brand-600 hover:underline">
                Activate account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}