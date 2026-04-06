import React, { useState } from 'react';
import { Music, Video, Play, X, Volume2, FileText, ChevronDown, ChevronUp, PlayIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getFullStorageUrl } from '@/lib/storage';

interface InlineMediaPlayerProps {
    url: string;
    type: 'audio' | 'video';
    transcript?: string | null;
    onOpen?: () => void;
}

export const InlineMediaPlayer: React.FC<InlineMediaPlayerProps> = ({ url, type, transcript, onOpen }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showTranscript, setShowTranscript] = useState(false);
    console.log("DSds", url);

    // If onOpen is provided, use it instead of internal expansion
    const handleOpen = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (onOpen) {
            onOpen();
        } else {
            setIsExpanded(true);
        }
    };

    if (type === 'audio') {
        return (
            <div className="mt-4 max-w-md">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <Music className="w-4 h-4 text-[#D05E2E]" />

                        <span className="text-sm font-medium" style={{ color: '#472b20' }}>Guided Meditation Audio</span>
                    </div>
                    <audio
                        key={url}
                        src={url}
                        controls
                        className="w-full [&::-webkit-media-controls-panel]:bg-[#ded3cb]"
                        preload="auto"
                    >
                        Your browser does not support the audio element.
                    </audio>
                </div>
            </div>
        );
    }

    // Video case
    if (isExpanded && !onOpen) {
        return (
            <div className="mt-4 max-w-2xl animate-in fade-in zoom-in duration-200">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Video className="w-4 h-4 text-purple-600" />
                            <span className="text-sm font-medium text-purple-800">Meditation Video</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-purple-100 rounded-full"
                            onClick={() => setIsExpanded(false)}
                        >
                            <X className="w-4 h-4 text-purple-600" />
                        </Button>
                    </div>
                    <video
                        src={url}
                        controls
                        autoPlay
                        className="w-full rounded-lg shadow-sm mb-2"
                        preload="metadata"
                    >
                        Your browser does not support the video element.
                    </video>

                    {transcript && (
                        <div className="mt-3 border-t border-purple-200 pt-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full flex items-center justify-between text-purple-700 hover:text-purple-800 hover:bg-purple-100 p-2 h-auto"
                                onClick={() => setShowTranscript(!showTranscript)}
                            >
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    <span className="text-xs font-medium">Transcript</span>
                                </div>
                                {showTranscript ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>

                            {showTranscript && (
                                <div className="mt-2 text-sm text-gray-700 bg-white/50 p-3 rounded-lg max-h-60 overflow-y-auto whitespace-pre-wrap">
                                    {transcript}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="mt-4 max-w-md">
            <div className='flex flex-col gap-2'>

            <div className="flex items-center gap-2">
                <PlayIcon className="w-4 h-4 text-[#D05E2E]" />

                <span className="text-sm font-medium" style={{ color: '#472b20' }}>Guided Meditation Video</span>
            </div>
            <div className="relative group cursor-pointer overflow-hidden rounded-lg aspect-video"
                onClick={handleOpen}>
                <video
                    src={getFullStorageUrl(url || '')}
                    className="w-full h-full object-cover"
                    muted
                    preload="metadata"
                    onMouseOver={event => (event.target as HTMLVideoElement).play()}
                    onMouseOut={event => {
                        const vid = event.target as HTMLVideoElement;
                        vid.pause();
                        vid.currentTime = 0;
                    }}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity">
                    <div className="bg-black/30 backdrop-blur-sm rounded-full p-3">
                        <Play className="w-6 h-6 text-white fill-white" />
                    </div>
                </div>
            </div>
            </div>

        </div>
    );
};
