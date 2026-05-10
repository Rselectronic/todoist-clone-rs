"use client";
import { signInAction } from "@/actions/auth-action";
import { Button } from "@/components/ui/button";
import { CheckSquare, Loader, LogIn } from "lucide-react";
import { useFormStatus } from "react-dom";

export default function LoginForm() {
  return (
    <main className="bg-gradient-to-br from-slate-50 to-slate-100 h-full min-h-screen">
      <div className="container relative m-0 mx-auto py-10 md:px-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white">
              <CheckSquare className="h-6 w-6" />
            </div>
            <span className="text-xl font-semibold tracking-tight md:text-2xl">
              RS Tasks
            </span>
          </div>
          <div className="hidden lg:flex w-fit items-center">
            <form action={signInAction}>
              <GoogleSignInButton />
            </form>
          </div>
        </header>

        <section className="w-full px-4 pt-24 md:px-4 lg:px-8 xl:px-10 2xl:px-0">
          <div className="flex h-full w-full flex-col items-center justify-center text-center">
            <span className="mb-6 rounded-full border border-slate-300 bg-white/60 px-4 py-1 text-xs text-slate-600 sm:text-sm">
              Internal tool — RS PCB Assembly team only
            </span>
            <h1 className="inline-block text-4xl font-semibold tracking-tight text-slate-900 lg:text-6xl">
              Tasks for the
              <br className="hidden lg:inline-block" /> RS team.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-slate-600 lg:text-xl">
              One place for the office and the shop floor. Projects, due dates,
              priorities, comments — synced live across everyone&apos;s
              computers and phones.
            </p>
            <div className="mt-10">
              <form action={signInAction}>
                <SignInButton />
              </form>
              <p className="mt-3 text-xs text-slate-500">
                Sign in with your <span className="font-medium">@rspcbassembly.com</span> Google account.
              </p>
            </div>
          </div>
        </section>
      </div>

      <footer className="container mx-auto mt-16 flex items-center justify-center border-t pt-6 pb-10 text-sm text-slate-500">
        © {new Date().getFullYear()} R.S. Électronique Inc. — internal use only.
      </footer>
    </main>
  );
}

function SignInButton() {
  const { pending } = useFormStatus();

  return (
    <button
      disabled={pending}
      type="submit"
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-8 py-4 text-lg font-medium text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-60"
    >
      {pending ? (
        <Loader className="h-5 w-5 animate-spin" />
      ) : (
        <>
          Sign in with Google
          <LogIn className="h-5 w-5" />
        </>
      )}
    </button>
  );
}

function GoogleSignInButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      disabled={pending}
      type="submit"
      variant="outline"
      className="rounded-lg"
    >
      {pending ? <Loader className="h-4 w-4 animate-spin" /> : "Sign in"}
    </Button>
  );
}
