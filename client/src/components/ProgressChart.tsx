import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProgressData {
  day: string;
  hours: number;
}

interface ProgressChartProps {
  data: ProgressData[];
  title?: string;
}

export default function ProgressChart({ data, title = "Weekly Progress" }: ProgressChartProps) {
  const maxHours = Math.max(...data.map(d => d.hours), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item) => (
            <div key={item.day} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 w-20">{item.day}</span>
              <div className="flex-1 mx-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${(item.hours / maxHours) * 100}%` }}
                  ></div>
                </div>
              </div>
              <span className="text-sm text-gray-500 w-12 text-right">{item.hours.toFixed(1)}h</span>
            </div>
          ))}
        </div>
        
        {data.every(item => item.hours === 0) && (
          <div className="text-center py-8 text-gray-500">
            <i className="fas fa-chart-line text-4xl mb-4"></i>
            <p>No study data available for this period.</p>
            <p className="text-sm mt-2">Start studying to see your progress!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
