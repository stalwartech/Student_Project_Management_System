import { useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { authApi } from "@/api/auth";
import { getErrorMessage } from "@/api/client";
import { useForm } from "@/hooks/useForm";
import { PageHeader } from "@/components/ui/misc";
import { TextField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastContext";

export function AccountSettingsPage() {
  const { user } = useAuth();
  const { show } = useToast();
  const { values, update, reset } = useForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (values.newPassword !== values.confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await authApi.changePassword(values.oldPassword, values.newPassword);
      show("Password changed successfully", "success");
      reset();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Account settings" description="Your profile and security" />

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-900">Profile</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Name</dt>
              <dd className="text-gray-900">{user?.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Email</dt>
              <dd className="text-gray-900">{user?.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Role</dt>
              <dd className="capitalize text-gray-900">{user?.role}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Department</dt>
              <dd className="text-gray-900">{user?.department}</dd>
            </div>
          </dl>
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-900">Change password</h2>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <TextField label="Current password" type="password" value={values.oldPassword} onChange={update("oldPassword")} required />
            <TextField label="New password" type="password" value={values.newPassword} onChange={update("newPassword")} required />
            <TextField label="Confirm new password" type="password" value={values.confirmPassword} onChange={update("confirmPassword")} required />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" loading={loading}>
              Update password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
