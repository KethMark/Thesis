"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export function HeroSectionComponent() {
  return (
    <>
      <div className="absolute z-[-1] bottom-0 left-0 right-0 top-16 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_80%)]"></div>
      <div className="min-h-screen flex flex-col items-center pt-56 relative z-[10]">
        <h1 className="bg-gradient-to-r text-center from-gray-600 font-bold text-6xl to-gray-900 inline-block text-transparent bg-clip-text">
          The minimalistic, <br />
          AI-powered pdf client.
        </h1>
        <div className="h-4"></div>
        <p className="text-xl mb-8 text-gray-600 max-w-xl text-center">
          Normal Human is a minimalistic, AI-powered pdf client that empowers
          you to manage your pdf with ease.
        </p>
        <div className="space-x-4">
          <Button>
            <Link href="/dashboard">Get Started</Link>
          </Button>
          {/* <Link href="/dashboard"> */}
            <Button variant="outline" disabled>Learn More</Button>
          {/* </Link> */}
        </div>
        <div className="mt-12 max-w-5xl mx-auto">
          <h2 className="text-2xl font-semibold mb-4 text-center">
            Experience the power of:
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white border rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-2">
                AI-driven pdf RAG
              </h3>
              <p className="text-gray-600">
                Automatically prioritize your pdf with our advanced AI
                system.
              </p>
            </div>
            <div className="bg-white border rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-2">Full-text search</h3>
              <p className="text-gray-600">
                Quickly find any text of your pdf with our powerful search functionality.
              </p>
            </div>
            <div className="bg-white border rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-2">
                Suggested Question
              </h3>
              <p className="text-gray-600">
                Automatically you are given an related question to your file with our advanced AI.
              </p>
            </div>
          </div>
        </div>
        <Image
          src="/Pdf.png"
          alt="demo"
          width={1000}
          height={1000}
          className="my-12 border rounded-md transition-all hover:shadow-2xl hover:scale-[102%] shadow-xl w-[70vw] h-auto"
        />
      </div>
    </>
  );
}