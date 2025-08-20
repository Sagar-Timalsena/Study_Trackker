import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { StudySession, Subject } from "@shared/schema";

type SessionWithSubject = StudySession & { subject: Subject };

interface ReportPeriod {
  label: string;
  value: string;
  startDate: Date;
  endDate: Date;
}

export default function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState("daily");
  const { toast } = useToast();

  const getReportPeriods = (): Record<string, ReportPeriod> => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Weekly (current week)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Monthly (current month)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Yearly (current year)
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    // Tomorrow for daily
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    return {
      daily: {
        label: "Daily",
        value: "daily",
        startDate: today,
        endDate: tomorrow,
      },
      weekly: {
        label: "Weekly",
        value: "weekly",
        startDate: startOfWeek,
        endDate: endOfWeek,
      },
      monthly: {
        label: "Monthly",
        value: "monthly",
        startDate: startOfMonth,
        endDate: endOfMonth,
      },
      yearly: {
        label: "Yearly",
        value: "yearly",
        startDate: startOfYear,
        endDate: endOfYear,
      },
    };
  };

  const periods = getReportPeriods();
  const currentPeriod = periods[selectedPeriod];

  const { data: sessions = [], isLoading, error } = useQuery<SessionWithSubject[]>({
    queryKey: ["/api/study-sessions", currentPeriod.startDate.toISOString(), currentPeriod.endDate.toISOString()],
    queryKey: ["/api/study-sessions", { 
      startDate: currentPeriod.startDate.toISOString(), 
      endDate: currentPeriod.endDate.toISOString() 
    }],
  });

  const handleShareReport = async () => {
    try {
      await apiRequest("POST", "/api/progress/share", {});
      toast({
        title: "Success",
        description: "Report shared successfully!",
      });
    } catch (error) {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to share report. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Calculate statistics
  const totalHours = sessions.reduce((acc, session) => acc + Number(session.duration), 0);
  const totalSessions = sessions.length;
  
  const subjectStats = sessions.reduce((acc, session) => {
    const subjectName = session.subject.name;
    if (!acc[subjectName]) {
      acc[subjectName] = {
        name: subjectName,
        color: session.subject.color,
        hours: 0,
        sessions: 0,
      };
    }
    acc[subjectName].hours += Number(session.duration);
    acc[subjectName].sessions += 1;
    return acc;
  }, {} as Record<string, { name: string; color: string; hours: number; sessions: number }>);

  const subjectArray = Object.values(subjectStats).sort((a, b) => b.hours - a.hours);

  if (error && isUnauthorizedError(error)) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded animate-pulse mb-2 w-32"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-64"></div>
        </div>
        <div className="h-12 bg-gray-200 rounded animate-pulse mb-8 w-80"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-4"></div>
                <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports</h1>
        <p className="text-gray-600">Comprehensive analytics of your study patterns and progress.</p>
      </div>

      {/* Time Period Tabs */}
      <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod} className="mb-8">
        <TabsList className="bg-gray-100 rounded-lg p-1">
          {Object.values(periods).map((period) => (
            <TabsTrigger
              key={period.value}
              value={period.value}
              className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              {period.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Report Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">{totalHours.toFixed(1)}h</div>
            <div className="text-sm text-gray-600">Total Study Hours</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-secondary mb-2">{totalSessions}</div>
            <div className="text-sm text-gray-600">Study Sessions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-accent mb-2">{subjectArray.length}</div>
            <div className="text-sm text-gray-600">Active Subjects</div>
          </CardContent>
        </Card>
      </div>

      {/* Report Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Subject Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Subject Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {subjectArray.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <i className="fas fa-chart-bar text-4xl mb-4"></i>
                <p>No study sessions found for this period.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {subjectArray.map((subject) => (
                  <div key={subject.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                        style={{ backgroundColor: subject.color }}
                      >
                        <i className="fas fa-book text-white text-sm"></i>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{subject.name}</p>
                        <p className="text-sm text-gray-500">{subject.hours.toFixed(1)} hours this {selectedPeriod.replace('ly', '')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">
                        {totalHours > 0 ? Math.round((subject.hours / totalHours) * 100) : 0}%
                      </p>
                      <p className="text-sm text-gray-500">{subject.sessions} sessions</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Study Pattern Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Study Pattern Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Average Session Length</h4>
                <div className="text-2xl font-bold text-primary">
                  {totalSessions > 0 ? (totalHours / totalSessions).toFixed(1) : 0}h
                </div>
                <p className="text-sm text-gray-500">per study session</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Most Studied Subject</h4>
                {subjectArray.length > 0 ? (
                  <div className="flex items-center">
                    <div 
                      className="w-6 h-6 rounded-full mr-3"
                      style={{ backgroundColor: subjectArray[0].color }}
                    ></div>
                    <div>
                      <p className="font-medium text-gray-900">{subjectArray[0].name}</p>
                      <p className="text-sm text-gray-500">{subjectArray[0].hours.toFixed(1)}h total</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No data available</p>
                )}
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Study Consistency</h4>
                <div className="text-2xl font-bold text-secondary">
                  {selectedPeriod === 'daily' ? (totalSessions > 0 ? '100' : '0') : 
                   selectedPeriod === 'weekly' ? Math.round((totalSessions / 7) * 100) :
                   selectedPeriod === 'monthly' ? Math.round((totalSessions / 30) * 100) :
                   Math.round((totalSessions / 365) * 100)}%
                </div>
                <p className="text-sm text-gray-500">consistency score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Study Log */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Detailed Study Log</CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <i className="fas fa-download mr-2"></i>Export
              </Button>
              <Button onClick={handleShareReport} size="sm">
                <i className="fas fa-share mr-2"></i>Share
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <i className="fas fa-clipboard-list text-4xl mb-4"></i>
              <p>No study sessions recorded for this period.</p>
              <p className="text-sm mt-2">Start studying and your sessions will appear here!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(session.sessionDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: selectedPeriod === 'yearly' ? 'numeric' : undefined,
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div 
                            className="w-6 h-6 rounded-full flex items-center justify-center mr-3"
                            style={{ backgroundColor: session.subject.color }}
                          >
                            <i className="fas fa-book text-white text-xs"></i>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{session.subject.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {Number(session.duration)} hours
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {session.notes || "No notes"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
