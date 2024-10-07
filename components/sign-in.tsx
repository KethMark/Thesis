"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { OAuthGithub, OAuthGoogle } from "./provider";

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters long.",
  }),
});

interface Auth {
  password: string;
  email: string;
}

export function SignInComponent() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async (data: Auth): Promise<Auth> => {
      const response = await axios.post("/api/signin", data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Account verified");
      router.refresh();
      form.reset();
    },
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response) {
        const errorMessage = error.response.data.error || "Failed to sign in";
        toast.error(errorMessage);
        
        // Set form errors based on the error message
        if (errorMessage.toLowerCase().includes("email")) {
          form.setError("email", {
            type: "manual",
            message: errorMessage
          });
        } else if (errorMessage.toLowerCase().includes("password")) {
          form.setError("password", {
            type: "manual",
            message: errorMessage
          });
        } else {
          // If it's a general error, set it on both fields
          form.setError("email", { type: "manual", message: errorMessage });
          form.setError("password", { type: "manual", message: errorMessage });
        }
      } else {
        toast.error("An unexpected error occurred");
      }
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    mutation.mutate(values);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
          <CardDescription>
            Enter your email and password to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="m@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                className="w-full"
                type="submit"
                disabled={mutation.isPending}
              >
                Sign in
              </Button>
            </form>
          </Form>
          <div className="relative mt-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <OAuthGithub />
            <OAuthGoogle />
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-muted-foreground">
            <Link 
              href="/forget-password"
              className="underline underline-offset-4 hover:text-primary"
            >
              Reset Password
            </Link>
          </div>
          <div className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link
              className="underline underline-offset-4 hover:text-primary"
              href="/auth/signup"
            >
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}