import { Users, Video, MapPin, Activity } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: 'users' | 'cameras' | 'locations' | 'activity';
  change?: string;
}

export default function StatsCard({ title, value, icon, change }: StatsCardProps) {
  const iconMap = {
    users: <Users className="h-6 w-6" />,
    cameras: <Video className="h-6 w-6" />,
    locations: <MapPin className="h-6 w-6" />,
    activity: <Activity className="h-6 w-6" />,
  };

  const colorMap = {
    users: 'bg-blue-600',
    cameras: 'bg-green-600',
    locations: 'bg-purple-600',
    activity: 'bg-orange-600',
  };

  return (
    <div className="bg-dark-card rounded-xl border border-dark-border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {change && (
            <p className="text-xs text-green-400 mt-1">{change}</p>
          )}
        </div>
        <div className={`h-12 w-12 rounded-lg ${colorMap[icon]} flex items-center justify-center text-white`}>
          {iconMap[icon]}
        </div>
      </div>
    </div>
  );
}
