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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
          <p className="text-muted-foreground">
            Track your documents and applications from one place.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <h3 className="font-medium">John Doe</h3>
            <p className="text-sm text-muted-foreground">john.doe@example.com</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-muted overflow-hidden">
            <img
              src="/placeholder-avatar.jpg"
              alt="Profile"
              className="h-full w-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://ui-avatars.com/api/?name=John+Doe";
              }}
            />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Your recent document and application activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
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
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No recent activity to display</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}