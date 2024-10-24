"use client";

import { Upload } from "lucide-react";
import { useDropzone } from "react-dropzone";
import React, { useCallback, useState } from "react";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client-props";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Progress } from "./ui/progress";

const supabase = createClient();

export const ClientDashboard: React.FC = () => {
  const maxfile = 6 * 1024 * 1024;
  const router = useRouter();
  const [uploading, setUploading] = useState(false);

  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [currentFile, setCurrentFile] = useState<string>("");

  const uploadFileToSupabase = async (
    file: File,
    bucket: string,
    onUploadProgress?: (progress: number) => void
  ) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
      throw new Error("No access token available");
    }

    try {
      // Simulate upload progress since Supabase doesn't provide progress events
      const uploadPromise = supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      // Simulate progress updates
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const { error } = await uploadPromise;
      clearInterval(interval);

      if (error) throw error;

      setUploadProgress(100);
      onUploadProgress?.(100);

      return filePath;
    } catch (error) {
      console.error("Upload failed:", error);
      throw error;
    }
  };

  const ingestPDF = useCallback(
    async (fileUrl: string, fileName: string) => {
      try {
        const res = await fetch("/api/ingestPdf", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileUrl,
            fileName,
          }),
        });

        const data = await res.json();
        router.push(`/document/${data.id}`);
      } catch (error) {
        console.error("Ingest failed:", error);
      }
    },
    [router]
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        try {
          const size = file.size > maxfile;
          const limit = "6mb";
          setUploading(true);
          setCurrentFile(file.name);
          setUploadProgress(0);

          if (!size) {
            try {
              const filePath = await uploadFileToSupabase(
                file,
                "pdf",
                (progress) => {
                  setUploadProgress(progress);
                }
              );

              const { data } = supabase.storage
                .from("pdf")
                .getPublicUrl(filePath);

              if (data) {
                await ingestPDF(data.publicUrl, file.name);
              } else {
                throw new Error("Failed to get public URL");
              }
            } catch (error) {
              console.error("Error uploading file:", file.name, error);
              setUploadProgress(0);
            }
          } else {
            toast.error(`File ${file.name} exceeds ${limit}`, {
              position: "top-right",
            });
          }
        } catch (error) {
          toast.error(`There's something wrong: ${error}`, {
            position: "top-right",
          });
        }
      }
      setUploading(false);
      setCurrentFile("");
      setUploadProgress(0);
    },
    [ingestPDF, maxfile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
  });

  return (
    <div className="flex-grow p-4">
      <div className="max-w-2xl mx-auto mt-32">
        <h1 className="text-2xl font-bold mb-2">Upload Your files</h1>
        <p className="text-muted-foreground mb-4">
          Start to uploaded your pdf files.
        </p>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center mb-4 ${
            isDragActive ? "border-primary" : "border-muted-foreground"
          }`}
        >
          <Input
            {...getInputProps()}
            id="dropzone-file"
            accept="application/pdf"
            type="file"
            className="hidden"
          />
          {uploading ? (
            <div className="translate-x-1">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4 animate-bounce" />
              <p className="text-lg mb-2">We are processing..</p>
            </div>
          ) : (
            <div className="translate-x-1">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg mb-2">Drag files</p>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Click to upload files (files should be under 6 MB )
          </p>
        </div>
      </div>

      {uploading && (
        <div className="fixed bottom-10 right-10 w-64 p-4 bg-white rounded-lg border border-gray-700 shadow-lg z-50">
          <div className="flex items-center space-x-4">
            <Avatar className="w-10 h-10 border border-gray-600">
              <AvatarFallback className="text-gray-400">
                {currentFile.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-sm font-medium truncate w-40" title={currentFile}>
                {currentFile}
              </h3>
              <div className="flex items-center mt-1">
                <Progress value={uploadProgress} className="flex-1 h-2" />
                <span className="ml-2 text-xs">{uploadProgress}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
