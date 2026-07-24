import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
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
      <div className="card w-full max-w-sm p-6">
        <h1 className="text-lg font-semibold text-gray-900">Sign in</h1>
        <p className="mt-1 text-sm text-gray-500">Student Project Management System</p>

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

          <Button type="submit" className="w-full" loading={loading}>
            Sign in
          </Button>
        </form>

        <div className="mt-4 flex justify-between text-sm">
          <Link to="/supervisor/activate" className="text-brand-600 hover:underline">
            Activate account
          </Link>
          <Link to="/supervisor/forgot-password" className="text-brand-600 hover:underline">
            Forgot password?
          </Link>
        </div>
      </div>
    </div>
  );
}
