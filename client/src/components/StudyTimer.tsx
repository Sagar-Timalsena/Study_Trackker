import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { SubjectWithStats } from "@shared/schema";

interface StudyTimerProps {
  subject: SubjectWithStats;
  onStop: () => void;
}

export default function StudyTimer({ subject, onStop }: StudyTimerProps) {
  const [startTime] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveSessionMutation = useMutation({
    mutationFn: async (sessionData: {
      subjectId: string;
      duration: string;
      notes?: string;
      sessionDate: string;
    }) => {
      return apiRequest("POST", "/api/study-sessions", sessionData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/study-sessions"] });
      toast({
        title: "Success",
        description: "Study session saved successfully!",
      });
      onStop();
    },
    onError: (error) => {
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
        description: "Failed to save study session. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      setElapsedSeconds(elapsed);
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCurrentTime = () => {
    return currentTime.toLocaleTimeString('en-US', {
      hour12: true,
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatCurrentDate = () => {
    return currentTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleStopSession = () => {
    const duration = (elapsedSeconds / 3600).toFixed(2); // Convert to hours
    
    saveSessionMutation.mutate({
      subjectId: subject.id,
      duration,
      notes: notes.trim() || undefined,
      sessionDate: startTime.toISOString(),
    });
  };

  const handleDiscardSession = () => {
    if (confirm("Are you sure you want to discard this study session?")) {
      onStop();
    }
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200 shadow-lg">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center mr-4"
              style={{ backgroundColor: subject.color }}
            >
              <i 
                className={`${subject.icon} text-xl text-white`}
              ></i>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{subject.name}</h3>
              <p className="text-sm text-gray-600">Study Session Active</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-red-600">RECORDING</span>
          </div>
        </div>

        {/* Digital Watch Display */}
        <div className="bg-black rounded-lg p-6 mb-6 text-center">
          {/* Elapsed Time */}
          <div className="mb-4">
            <div className="text-green-400 font-mono text-4xl md:text-6xl font-bold mb-2">
              {formatTime(elapsedSeconds)}
            </div>
            <div className="text-green-300 text-sm uppercase tracking-widest">
              Study Time
            </div>
          </div>

          {/* Current Time & Date */}
          <div className="border-t border-gray-700 pt-4">
            <div className="text-blue-400 font-mono text-xl md:text-2xl font-semibold mb-1">
              {formatCurrentTime()}
            </div>
            <div className="text-gray-400 text-sm">
              {formatCurrentDate()}
            </div>
          </div>
        </div>

        {/* Session Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {startTime.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              })}
            </div>
            <div className="text-sm text-gray-600">Started</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {(elapsedSeconds / 60).toFixed(0)}
            </div>
            <div className="text-sm text-gray-600">Minutes</div>
          </div>
        </div>

        {/* Session Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Session Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What did you learn or work on during this session?"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
            maxLength={500}
          />
          <div className="text-xs text-gray-500 mt-1">
            {notes.length}/500 characters
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={handleDiscardSession}
            className="flex-1"
            disabled={saveSessionMutation.isPending}
          >
            <i className="fas fa-times mr-2"></i>
            Discard
          </Button>
          <Button
            onClick={handleStopSession}
            className="flex-1 bg-green-600 hover:bg-green-700"
            disabled={saveSessionMutation.isPending}
          >
            {saveSessionMutation.isPending ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Saving...
              </>
            ) : (
              <>
                <i className="fas fa-stop mr-2"></i>
                Stop & Save
              </>
            )}
          </Button>
        </div>

        {/* Motivational Message */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <i className="fas fa-lightbulb text-yellow-500 mr-2"></i>
            <span className="text-sm text-yellow-800">
              {elapsedSeconds < 300 ? "Great start! Keep focused." :
               elapsedSeconds < 1800 ? "You're in the zone! Stay concentrated." :
               elapsedSeconds < 3600 ? "Excellent progress! You're doing amazing." :
               "Outstanding dedication! You're a study champion!"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}