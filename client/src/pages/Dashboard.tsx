import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect } from "react";
import ProgressChart from "@/components/ProgressChart";

interface DashboardStats {
  totalStudyHours: number;
  activeSubjectsCount: number;
  currentStreak: number;
  activeFriendsCount: number;
  weeklyProgress: { day: string; hours: number }[];
  subjectDistribution: { name: string; percentage: number; color: string }[];
}

export default function Dashboard() {
  const { toast } = useToast();

  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  useEffect(() => {
    if (error && isUnauthorizedError(error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

  const handleShareProgress = async () => {
    try {
      await apiRequest("POST", "/api/progress/share", {});
      toast({
        title: "Success",
        description: "Daily progress report shared successfully!",
      });
    } catch (error) {
      console.error("Error sharing progress:", error);
      toast({
        title: "Error",
        description: "Failed to share progress report. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-4"></div>
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-gray-500">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's your study progress overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Study Hours</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalStudyHours}</p>
              </div>
              <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center">
                <i className="fas fa-clock text-primary text-xl"></i>
              </div>
            </div>
            <p className="text-sm text-secondary mt-4">
              <i className="fas fa-arrow-up mr-1"></i>
              Keep up the great work!
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Subjects</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeSubjectsCount}</p>
              </div>
              <div className="w-12 h-12 bg-secondary bg-opacity-10 rounded-lg flex items-center justify-center">
                <i className="fas fa-book text-secondary text-xl"></i>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">Subjects in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Study Streak</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.currentStreak}</p>
              </div>
              <div className="w-12 h-12 bg-accent bg-opacity-10 rounded-lg flex items-center justify-center">
                <i className="fas fa-fire text-accent text-xl"></i>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">Days in a row</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Friends Active</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeFriendsCount}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-users text-orange-500 text-xl"></i>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">Connected friends</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.weeklyProgress.map((day) => (
                <div key={day.day} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 w-20">{day.day}</span>
                  <div className="flex-1 mx-4">
                    <Progress value={(day.hours / 6) * 100} className="h-2" />
                  </div>
                  <span className="text-sm text-gray-500">{day.hours}h</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subject Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.subjectDistribution.map((subject) => (
                <div key={subject.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded-full mr-3" 
                      style={{ backgroundColor: subject.color }}
                    ></div>
                    <span className="text-sm font-medium text-gray-700">{subject.name}</span>
                  </div>
                  <span className="text-sm text-gray-500">{subject.percentage}%</span>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <Button onClick={handleShareProgress} className="w-full">
                <i className="fas fa-share mr-2"></i>
                Share Daily Progress
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
