import { Video, VideoOff, MapPin } from 'lucide-react';

interface CameraCardProps {
  id: number;
  name: string;
  location: string;
  rtspUrl: string;
  isActive: boolean;
  createdAt: string;
}

export default function CameraCard({
  id,
  name,
  location,
  rtspUrl,
  isActive,
  createdAt,
}: CameraCardProps) {
  return (
    <div className={`bg-dark-card rounded-xl border p-6 transition-colors ${
      isActive 
        ? 'border-green-500/50 hover:border-green-500' 
        : 'border-dark-border opacity-60'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
            isActive ? 'bg-green-600' : 'bg-gray-600'
          }`}>
            {isActive ? (
              <Video className="h-5 w-5 text-white" />
            ) : (
              <VideoOff className="h-5 w-5 text-white" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{name}</h3>
            <p className="text-sm text-gray-400">ID: {id}</p>
          </div>
        </div>
        
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          isActive 
            ? 'bg-green-600/20 text-green-400' 
            : 'bg-gray-600/20 text-gray-400'
        }`}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center text-sm text-gray-400">
          <MapPin className="h-4 w-4 mr-2" />
          {location}
        </div>
        
        <div className="text-xs text-gray-500 break-all">
          RTSP: {rtspUrl}
        </div>
      </div>
    </div>
  );
}
