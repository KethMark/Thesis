"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
});

interface ResetPass {
  email: string
}

export function ForgotPassword() {

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (email: ResetPass): Promise<ResetPass> => {
      return await axios.post("/api/forget-password", email).then((res) => res.data);
    },
    onSuccess: () => {
      toast.success('Success', {
        description: "Password reset email sent successfully.",
      });
      form.reset();
    },
    onError: () => {
      toast.error('Error', {
        description: "Failed to send password reset email. Please try again.",
      })
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    mutation.mutate(values);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <section className="max-w-7xl mx-auto py-12 md:py-24 lg:py-32 xl:py-52">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Forgot your password?
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Don't worry, it happens to the best of us. Enter your email
                  address below and we'll send you instructions to reset your
                  password.
                </p>
              </div>
              <div className="w-full max-w-sm space-y-2">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your email"
                              type="email"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            We'll send you an email with instructions on how to
                            reset your password.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled
                    >
                      {mutation.isPending ? "Sending..." : "Not available right now"}
                    </Button>
                  </form>
                </Form>
              </div>
              <div className="flex justify-center">
                <Link
                  className="inline-flex items-center text-sm font-medium text-primary"
                  href="/auth/signin"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to login
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
