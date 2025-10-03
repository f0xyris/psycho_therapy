import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { queryClient } from "@/lib/queryClient";

export default function LoginAdmin() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/demo-login", { method: "POST" });
        if (!res.ok) throw new Error("Demo login failed");
        const data = await res.json();
        if (data.token) {
          localStorage.setItem("auth_token", data.token);
        }
        // Prefetch and warm cache so Admin sees user immediately
        const userRes = await fetch("/api/auth/user", {
          headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
          credentials: "include",
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          queryClient.setQueryData(["/api/auth/user"], userData);
        }
        setLocation("/admin", { replace: true });
      } catch (e: any) {
        setError(e?.message || "Failed to login to demo admin");
      }
    })();
  }, [setLocation]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-600">{error}</p>
          <button
            className="px-4 py-2 rounded bg-amber-600 text-white"
            onClick={() => {
              setError(null);
              window.location.reload();
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );
}