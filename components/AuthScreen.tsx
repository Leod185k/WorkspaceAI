"use client";

import { FormEvent, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type AuthScreenProps = { passwordRecovery: boolean; onRecoveryComplete: () => void };
type AuthMode = "sign-in" | "sign-up" | "reset";

export function AuthScreen({ passwordRecovery, onRecoveryComplete }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setBusy(true);

    try {
      const supabase = getSupabaseBrowserClient();
      if (passwordRecovery) {
        if (newPassword.length < 8) throw new Error("Use a password with at least 8 characters.");
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        setNewPassword("");
        window.history.replaceState(null, "", window.location.pathname);
        onRecoveryComplete();
        setSuccessMessage("Your password has been updated.");
      } else if (mode === "sign-in") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      } else if (mode === "sign-up") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) setSuccessMessage("Check your email for a confirmation link to finish creating your account.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setSuccessMessage("If an account exists for that email, a password reset link is on its way.");
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Authentication failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const heading = passwordRecovery
    ? "Choose a new password"
    : mode === "sign-in" ? "Welcome back" : mode === "sign-up" ? "Create your account" : "Reset your password";

  return (
    <main className="app-shell flex min-h-dvh items-center justify-center px-4 py-10">
      <section className="settings-panel w-full max-w-md rounded-2xl border p-6 shadow-xl">
        <div className="mb-6">
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">AI Wrapper</div>
          <h1 className="text-2xl font-semibold text-[color:var(--text)]">{heading}</h1>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            {passwordRecovery ? "Set a new password for your account." : "Sign in to keep your conversations private and synced."}
          </p>
        </div>

        <form className="space-y-4" onSubmit={submit}>
          {!passwordRecovery && mode !== "reset" ? (
            <label className="block text-sm text-[color:var(--muted-strong)]">
              Password
              <input
                autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
                className="field-surface mt-1.5 h-10 w-full rounded-md border px-3 outline-none"
                minLength={8}
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </label>
          ) : null}

          {passwordRecovery ? (
            <label className="block text-sm text-[color:var(--muted-strong)]">
              New password
              <input
                autoComplete="new-password"
                className="field-surface mt-1.5 h-10 w-full rounded-md border px-3 outline-none"
                minLength={8}
                onChange={(event) => setNewPassword(event.target.value)}
                required
                type="password"
                value={newPassword}
              />
            </label>
          ) : null}

          {!passwordRecovery ? (
            <label className="block text-sm text-[color:var(--muted-strong)]">
              Email
              <input
                autoComplete="email"
                className="field-surface mt-1.5 h-10 w-full rounded-md border px-3 outline-none"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </label>
          ) : null}

          {errorMessage ? <p className="text-sm text-red-400" role="alert">{errorMessage}</p> : null}
          {successMessage ? <p className="text-sm text-emerald-400" role="status">{successMessage}</p> : null}

          <button className="primary-soft-button h-10 w-full rounded-md font-medium disabled:opacity-50" disabled={busy} type="submit">
            {busy ? "Please wait…" : passwordRecovery ? "Update password" : mode === "sign-in" ? "Sign in" : mode === "sign-up" ? "Create account" : "Send reset link"}
          </button>
        </form>

        {!passwordRecovery ? (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
            {mode === "sign-in" ? (
              <>
                <button className="text-[color:var(--accent-strong)] hover:underline" onClick={() => { setMode("sign-up"); setErrorMessage(""); setSuccessMessage(""); }} type="button">Create account</button>
                <button className="text-[color:var(--muted)] hover:underline" onClick={() => { setMode("reset"); setErrorMessage(""); setSuccessMessage(""); }} type="button">Forgot password?</button>
              </>
            ) : (
              <button className="text-[color:var(--accent-strong)] hover:underline" onClick={() => { setMode("sign-in"); setErrorMessage(""); setSuccessMessage(""); }} type="button">Back to sign in</button>
            )}
          </div>
        ) : null}
      </section>
    </main>
  );
}
