import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { authApi } from "@/api/auth";
import { getErrorMessage } from "@/api/client";
import { useForm } from "@/hooks/useForm";
import { TextField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";

type Step = 1 | 2 | 3;

function StepIndicator({ step }: { step: Step }) {
  return (
    <div className="mb-6 flex items-center justify-center gap-2">
      {[1, 2, 3].map((n) => (
        <div key={n} className={`h-1.5 w-10 rounded-full ${n <= step ? "bg-brand-600" : "bg-gray-200"}`} />
      ))}
    </div>
  );
}

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activationToken, setActivationToken] = useState("");

  const identifierForm = useForm({ identifier: "" });
  const otpForm = useForm({ code: "" });
  const passwordForm = useForm({ password: "", confirmPassword: "" });

  const handleStep1 = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.forgotPassword(identifierForm.values.identifier);
      setStep(2);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authApi.verifyResetOtp(identifierForm.values.identifier, otpForm.values.code);
      setActivationToken(res.data.data.activationToken);
      setStep(3);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleStep3 = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (passwordForm.values.password !== passwordForm.values.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(activationToken, passwordForm.values.password);
      navigate("/student/login");
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
            <h1 className="text-lg font-semibold text-gray-900">Reset your password</h1>
            <p className="mt-1 text-sm text-gray-500">Step {step} of 3</p>
            <StepIndicator step={step} />

            {step === 1 && (
              <form onSubmit={handleStep1} className="space-y-4">
                <TextField
                  label="Matric number or email"
                  value={identifierForm.values.identifier}
                  onChange={identifierForm.update("identifier")}
                  required
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" className="w-full bg-[#0B1B3B] hover:bg-[#152750]" loading={loading}>
                  Send OTP
                </Button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleStep2} className="space-y-4">
                <p className="text-sm text-gray-500">If an account exists, a code was sent to its registered email.</p>
                <TextField label="OTP code" value={otpForm.values.code} onChange={otpForm.update("code")} maxLength={6} required />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" className="w-full bg-[#0B1B3B] hover:bg-[#152750]" loading={loading}>
                  Verify OTP
                </Button>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleStep3} className="space-y-4">
                <TextField
                  label="New password"
                  type="password"
                  value={passwordForm.values.password}
                  onChange={passwordForm.update("password")}
                  required
                />
                <TextField
                  label="Confirm password"
                  type="password"
                  value={passwordForm.values.confirmPassword}
                  onChange={passwordForm.update("confirmPassword")}
                  required
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" className="w-full bg-[#0B1B3B] hover:bg-[#152750]" loading={loading}>
                  Reset password
                </Button>
              </form>
            )}

            <p className="mt-4 text-center text-sm text-gray-500">
              <Link to="/student/login" className="text-brand-600 hover:underline">
                Back to sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}