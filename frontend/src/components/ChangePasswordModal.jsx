import React, { useState } from "react";
import { X, Lock, Eye, EyeOff, ShieldCheck, RefreshCw } from "lucide-react";
import api from "../utils/api";
import { useLanguage } from "../hooks/useLanguage";

export default function ChangePasswordModal({ isOpen, onClose }) {
  const { language } = useLanguage();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  const isPasswordTyped = newPassword.length > 0;
  const isPasswordValid = passwordRegex.test(newPassword);
  const isConfirmTyped = confirmPassword.length > 0;
  const isPasswordMatch = newPassword === confirmPassword;

  if (!isOpen) return null;

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (newPassword !== confirmPassword) {
      setError(
        language === "en"
          ? "Confirm password does not match the new password."
          : "Mật khẩu xác nhận không khớp với mật khẩu mới."
      );
      return;
    }

    if (!passwordRegex.test(newPassword)) {
      setError(
        language === "en"
          ? "New password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters."
          : "Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      if (response.data && response.data.success) {
        setSuccessMessage(
          language === "en" ? "Password updated successfully!" : "Đổi mật khẩu thành công!"
        );

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err) {
      console.error("[Change Password API Failure]:", err);
      const serverMessage = err.response?.data?.message;
      setError(
        serverMessage ||
          (language === "en"
            ? "Failed to update password. Please verify your current credentials."
            : "Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 font-sans antialiased">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-6 z-10 text-slate-700 dark:text-slate-300">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors">
          <X size={16} />
        </button>

        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
              {language === "en" ? "Change Password" : "Đổi mật khẩu tài khoản"}
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              {language === "en" ? "Security Credentials" : "Bảo mật tài khoản"}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl">
            ✕ {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-xl">
            ✓ {successMessage}
          </div>
        )}

        <form onSubmit={handlePasswordChangeSubmit} className="space-y-4 font-medium text-xs">
          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1.5 font-bold">
              {language === "en" ? "Current Password" : "Mật khẩu hiện tại"}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type={showCurrent ? "text" : "password"}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={language === "en" ? "Enter your active password" : "Nhập mật khẩu hiện tại"}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition text-sm"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none">
                {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1.5 font-bold">
              {language === "en" ? "New Password" : "Mật khẩu mới"}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type={showNew ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={language === "en" ? "Minimum 8 complex secure characters" : "Tối thiểu 8 ký tự kèm chữ hoa, số & ký tự đặc biệt"}
                className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition text-sm ${
                  !isPasswordTyped
                    ? "border-slate-200 dark:border-slate-700 focus:border-blue-500"
                    : isPasswordValid
                    ? "border-green-500 dark:border-green-500 focus:border-green-500"
                    : "border-red-500 dark:border-red-500 focus:border-red-500"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none">
                {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {isPasswordTyped && (
              <p className={`text-xs mt-1.5 font-bold leading-relaxed transition-colors ${isPasswordValid ? "text-green-500" : "text-red-500"}`}>
                {isPasswordValid
                  ? language === "en" ? "✓ Password is strong and secure." : "✓ Mật khẩu đủ độ bảo mật."
                  : language === "en" ? "✕ Must be 8+ characters with uppercase, lowercase, numbers, and special characters." : "✕ Cần tối thiểu 8 ký tự với chữ hoa, chữ thường, số và ký tự đặc biệt."}
              </p>
            )}
          </div>

          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1.5 font-bold">
              {language === "en" ? "Confirm New Password" : "Xác nhận mật khẩu mới"}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={language === "en" ? "Re-enter new password to verify" : "Nhập lại mật khẩu mới để xác nhận"}
                className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition text-sm ${
                  !isConfirmTyped
                    ? "border-slate-200 dark:border-slate-700 focus:border-blue-500"
                    : isPasswordMatch
                    ? "border-green-500 dark:border-green-500 focus:border-green-500"
                    : "border-red-500 dark:border-red-500 focus:border-red-500"
                }`}
              />
            </div>
            {isConfirmTyped && (
              <p className={`text-xs mt-1.5 font-bold transition-colors ${isPasswordMatch ? "text-green-500" : "text-red-500"}`}>
                {isPasswordMatch
                  ? language === "en" ? "✓ Passwords match." : "✓ Mật khẩu khớp hoàn toàn."
                  : language === "en" ? "✕ Passwords do not match." : "✕ Mật khẩu xác nhận không khớp."}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !newPassword || !confirmPassword || !isPasswordValid || !isPasswordMatch}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-400 text-white font-bold py-2.5 px-4 rounded-xl transition duration-200 focus:outline-none mt-4 flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:cursor-not-allowed">
            {loading && <RefreshCw size={14} className="animate-spin" />}
            {loading
              ? (language === "en" ? "Processing..." : "Đang xử lý...")
              : (language === "en" ? "Update Password" : "Cập nhật mật khẩu")}
          </button>
        </form>
      </div>
    </div>
  );
}
