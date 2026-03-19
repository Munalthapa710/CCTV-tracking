import { User } from 'lucide-react';

interface PersonCardProps {
  id: number;
  name: string;
  department: string;
  location: string | null;
  cameraName: string | null;
  lastSeen: string | null;
  confidenceScore: number;
}

export default function PersonCard({
  id,
  name,
  department,
  location,
  cameraName,
  lastSeen,
  confidenceScore,
}: PersonCardProps) {
  const formatTime = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-400';
    if (score >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-dark-card rounded-xl border border-dark-border p-6 hover:border-primary-500 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 rounded-full bg-primary-600 flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{name}</h3>
            <p className="text-sm text-gray-400">{department}</p>
          </div>
        </div>
        
        <div className={`text-sm font-medium ${getConfidenceColor(confidenceScore)}`}>
          {(confidenceScore * 100).toFixed(0)}% match
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Location:</span>
          <span className="text-white font-medium">{location || 'Unknown'}</span>
        </div>
        
        {cameraName && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Camera:</span>
            <span className="text-white">{cameraName}</span>
          </div>
        )}
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Last Seen:</span>
          <span className="text-white">{formatTime(lastSeen)}</span>
        </div>
      </div>
    </div>
  );
}
