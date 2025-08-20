import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { SubjectWithStats } from "@shared/schema";

interface SubjectCardProps {
  subject: SubjectWithStats;
  onEdit: (subject: SubjectWithStats) => void;
  onDelete: (id: string) => void;
}

export default function SubjectCard({ subject, onEdit, onDelete }: SubjectCardProps) {
  const formatLastStudyDate = (date: Date | null) => {
    if (!date) return "Never";
    
    const now = new Date();
    const studyDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - studyDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return studyDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getProgressColor = () => {
    if (subject.weeklyProgress >= 100) return "bg-green-500";
    if (subject.weeklyProgress >= 75) return "bg-blue-500";
    if (subject.weeklyProgress >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center flex-1 min-w-0">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center mr-4 flex-shrink-0"
              style={{ backgroundColor: `${subject.color}20` }}
            >
              <i 
                className={`${subject.icon} text-xl`}
                style={{ color: subject.color }}
              ></i>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 truncate">{subject.name}</h3>
              <p className="text-sm text-gray-500 truncate">{subject.description || "No description"}</p>
            </div>
          </div>
          <div className="flex space-x-2 ml-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onEdit(subject)}
              className="text-gray-400 hover:text-primary p-2"
            >
              <i className="fas fa-edit"></i>
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onDelete(subject.id)}
              className="text-gray-400 hover:text-red-500 p-2"
            >
              <i className="fas fa-trash"></i>
            </Button>
          </div>
        </div>
        
        {/* Stats */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Study Hours</span>
            <span className="font-medium">{subject.totalHours.toFixed(1)}h</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Sessions</span>
            <span className="font-medium">{subject.sessionsCount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Last Study</span>
            <span className="font-medium">{formatLastStudyDate(subject.lastStudyDate)}</span>
          </div>
          
          {/* Weekly Progress */}
          <div className="pt-3 border-t border-gray-200">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Weekly Goal</span>
              <span className="font-medium">
                {(subject.weeklyProgress / 100 * Number(subject.weeklyGoal)).toFixed(1)}/{subject.weeklyGoal}h
              </span>
            </div>
            <Progress 
              value={Math.min(subject.weeklyProgress, 100)} 
              className="h-2"
            />
          </div>
        </div>
        
        {/* Start Session Button */}
        <Button 
          variant="secondary" 
          className="w-full mt-4"
          onClick={() => {
            // TODO: Implement study session start functionality
            console.log("Start study session for:", subject.name);
          }}
        >
          <i className="fas fa-play mr-2"></i>
          Start Session
        </Button>
      </CardContent>
    </Card>
  );
}
