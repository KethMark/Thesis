"use client";

import { ChevronLeft, Upload } from "lucide-react";
import { useDropzone } from "react-dropzone";
import React, { useCallback, useState } from "react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client-props";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const supabase = createClient();

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
    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    onUploadProgress?.(100);

    return filePath;
  } catch (error) {
    console.error("Upload failed:", error);
    throw error;
  }
};

export const ClientDashboard: React.FC = () => {
  const maxfile = 6 * 1024 * 1024;
  const router = useRouter();
  const [uploading, setUploading] = useState(false);

  const ingestPDF = useCallback(async (fileUrl: string, fileName: string) => {
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
  }, [router]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      try {
        const size = file.size > maxfile;
        const limit = "6mb";
        setUploading(true);

        if (!size) {
          const toastId = toast.loading(`Uploading ${file.name}`, {
            position: "top-right",
          });

          try {
            const filePath = await uploadFileToSupabase(file, "pdf", () => {
              toast.loading(`Preparing ${file.name}`, {
                id: toastId,
                position: "top-right",
              });
            });

            const { data } = supabase.storage
              .from("pdf")
              .getPublicUrl(filePath);

            if (data) {
              await ingestPDF(data.publicUrl, file.name);
              toast.success(`${file.name}`, {
                id: toastId,
                position: "top-right",
              });
            } else {
              throw new Error("Failed to get public URL");
            }
          } catch (error) {
            console.error("Error uploading file:", file.name, error);
            toast.error(`Failed to upload ${file.name}`, {
              id: toastId,
              position: "top-right",
            });
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
  }, [ingestPDF, maxfile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
  });

  return (
    <div className="flex-grow p-4">
      <Link className="flex items-center mb-6" href="/">
        <ChevronLeft className="mr-1" />
        <span>Home</span>
      </Link>

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
    </div>
  );
};
