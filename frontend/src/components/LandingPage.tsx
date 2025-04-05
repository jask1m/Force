"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <section className="py-20 px-6">
          <div className="container mx-auto max-w-5xl text-center">
            <h1 className="text-5xl font-bold mb-6">Tell your story. We'll handle the paperwork.</h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto">
            Share your story in your language — our AI helps complete your immigration forms with ease and support.
            </p>
            <Button size="lg" asChild>
              <Link href="/dashboard">
                Start Your Journey <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="py-16 px-6 bg-muted/50">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-background p-6 rounded-lg shadow-sm">
                <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <span className="text-primary font-bold">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Record or Upload a Video of Your Story</h3>
                <p className="text-muted-foreground">
                  Explain your situation in any language using our video recording tool.
                </p>
              </div>
              <div className="bg-background p-6 rounded-lg shadow-sm">
                <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <span className="text-primary font-bold">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Upload Documents</h3>
                <p className="text-muted-foreground">
                  Securely upload and manage all your immigration-related documents in one place.
                </p>
              </div>
              <div className="bg-background p-6 rounded-lg shadow-sm">
                <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <span className="text-primary font-bold">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Track Progress</h3>
                <p className="text-muted-foreground">
                  Monitor your application status and receive updates throughout the process.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
