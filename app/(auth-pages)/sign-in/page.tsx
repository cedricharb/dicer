import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/src/components/form-message";
import { SubmitButton } from "@/src/components/submit-button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import Link from "next/link";
import { getSession } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function Login({
  searchParams,
}: {
  searchParams: Message;
}) {
  const session = await getSession();

  if (session) {
    redirect("/");
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 w-full h-full">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center">
            Sign in
          </CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            Enter your email and password to sign in to your account
          </p>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" action={signInAction}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
                <Link
                  className="text-sm text-primary underline"
                  href="/forgot-password"
                >
                  Forgot Password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                name="password"
                placeholder="Your password"
                required
              />
            </div>
            <SubmitButton
              pendingText="Signing In..."
              formAction={signInAction}
              className="bg-primary text-white hover:bg-primary/90"
            >
              Sign in
            </SubmitButton>
            <FormMessage message={searchParams} />
            <p className="text-sm text-muted-foreground text-center">
              Don't have an account?{" "}
              <Link
                className="text-primary font-medium underline"
                href="/sign-up"
              >
                Sign up
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
