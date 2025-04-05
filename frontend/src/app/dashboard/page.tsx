"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Video, CheckSquare, Link } from "lucide-react";

interface Activity {
  id: string;
  title: string;
  date: string;
  status: string;
}

export default function Dashboard() {
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
          <p className="text-muted-foreground">
            Track your documents and applications from one place.
          </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-bold">Record Video</CardTitle>
            <Video className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <CardDescription className="min-h-[60px]">
              Record a new video to explain your situation in your native
              language.
            </CardDescription>
            <Button asChild className="w-full mt-4">
              <a href="/record">
                Start Recording <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-bold">My Documents</CardTitle>
            <FileText className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <CardDescription className="min-h-[60px]">
              View, download, or continue working on your processed documents.
            </CardDescription>
            <Button asChild variant="outline" className="w-full mt-4">
              <Link href="/dashboard/documents">
                View Documents <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-bold">
              Application Status
            </CardTitle>
            <CheckSquare className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <CardDescription className="min-h-[60px]">
              Check the status of your applications and any pending actions.
            </CardDescription>
            <Button asChild variant="outline" className="w-full mt-4">
              <Link to="/dashboard/applications">
                View Status <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Your recent document and application activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div>
                  <h3 className="font-semibold">{activity.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {activity.date}
                  </p>
                </div>
                <div>
                  <span
                    className={`px-3 py-1 text-xs rounded-full ${
                      activity.status === "Completed"
                        ? "bg-green-100 text-green-800"
                        : activity.status === "Processing"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {activity.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}