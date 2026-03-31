import React from 'react';
import { Calendar, Clock, Play, Pause } from 'lucide-react';

interface HistoricalPlaybackProps {
  currentTimestamp: number;
  minTimestamp: number;
  maxTimestamp: number;
  onTimestampChange: (timestamp: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

const HistoricalPlayback: React.FC<HistoricalPlaybackProps> = ({
  currentTimestamp,
  minTimestamp,
  maxTimestamp,
  onTimestampChange,
  isPlaying,
  onTogglePlay,
}) => {
  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl z-50">
      <div className="bg-white/90 backdrop-blur-xl p-4 rounded-3xl shadow-2xl border border-gray-100 flex flex-col gap-3">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2 text-blue-600">
            <Calendar className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Historical Playback</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-mono font-bold">{formatDate(currentTimestamp)}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onTogglePlay}
            className={`p-3 rounded-2xl transition-all ${
              isPlaying 
                ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
            }`}
          >
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
          </button>
          
          <div className="flex-1 relative h-2 bg-gray-200 rounded-full overflow-hidden">
            <input
              type="range"
              min={minTimestamp}
              max={maxTimestamp}
              value={currentTimestamp}
              onChange={(e) => onTimestampChange(parseInt(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div 
              className="absolute inset-y-0 left-0 bg-blue-500 transition-all duration-100"
              style={{ width: `${((currentTimestamp - minTimestamp) / (maxTimestamp - minTimestamp)) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoricalPlayback;
