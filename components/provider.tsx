"use client";
import React, { useState } from "react";
import { Button } from "./ui/button";
import { createClient } from "@/utils/supabase/client-props";
import { Icon } from "./ui/icon";

export const OAuthGoogle = () => {
  const supabase = createClient();

  const [loading, isLoading] = useState(false);

  const GoogleOAuth = async () => {
    isLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
  };

  return (
    <Button 
      variant="outline" 
      onClick={GoogleOAuth} 
      disabled={loading}
    >
      <Icon.Google className="mr-2 h-4 w-4"/>
      Google
    </Button>
  );
};

export const OAuthGithub = () => {
  const supabase = createClient();

  const [loading, isLoading] = useState(false);

  const GithubOAuth = async () => {
    isLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback/`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
  };

  return (
    <Button 
      variant="outline"
      onClick={GithubOAuth}
      disabled={loading}
    >
      <Icon.Github className="mr-2 h-4 w-4 fill-black" />
      Github
    </Button>
  );
};