import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Download,
    X,
    ExternalLink,
    Search,
    LayoutGrid,
    Play,
    Image as ImageIcon,
    MessageSquare,
    ChevronLeft,
    ChevronRight,
    Copy,
    Link
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { contentAPI } from "@/apis/api";
import { type ContentGeneration } from "@/apis/wire";
import { getFullStorageUrl } from "@/lib/storage";
import { useNavigate } from "react-router-dom";
import VideoPlayer from "@/components/VideoPlayer";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const Library = () => {
    const navigate = useNavigate();
    const [images, setImages] = useState<ContentGeneration[]>([]);
    const [media, setMedia] = useState<ContentGeneration[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<ContentGeneration | null>(null);
    const [activeTab, setActiveTab] = useState("cards");

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [imagesRes, mediaRes] = await Promise.all([
                contentAPI.getImages(1, 40),
                contentAPI.getMedia(1, 40)
            ]);
            setImages(imagesRes);
            setMedia(mediaRes);
        } catch (error) {
            console.error("Failed to fetch library content:", error);
            toast.error("Failed to load library content");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDownload = async (item: ContentGeneration, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!item.content_url) return;

        try {
            const response = await fetch(getFullStorageUrl(item.content_url));
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `meditation-${item.id}.${item.content_type === 'image' ? 'png' : 'mp4'}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Download failed:", error);
            toast.error("Failed to download file");
        }
    };

    const openRespectiveChat = (conversationId: string) => {
        navigate(`/chat/${conversationId}`);
    };

    const handleCopyLink = async (item: ContentGeneration) => {
        if (!item.content_url) return;
        try {
            const url = getFullStorageUrl(item.content_url);
            await navigator.clipboard.writeText(url);
            toast.success("Link copied to clipboard");
        } catch (err) {
            toast.error("Failed to copy link");
        }
    };

    const getCurrentList = () => {
        if (activeTab === "cards") return images;
        return media;
    };

    const handleNext = () => {
        if (!selectedItem) return;
        const list = getCurrentList();
        const currentIndex = list.findIndex(item => item.id === selectedItem.id);
        if (currentIndex < list.length - 1) {
            setSelectedItem(list[currentIndex + 1]);
        } else {
            setSelectedItem(list[0]); // Loop back to start
        }
    };

    const handlePrev = () => {
        if (!selectedItem) return;
        const list = getCurrentList();
        const currentIndex = list.findIndex(item => item.id === selectedItem.id);
        if (currentIndex > 0) {
            setSelectedItem(list[currentIndex - 1]);
        } else {
            setSelectedItem(list[list.length - 1]); // Loop to end
        }
    };

    const renderGridItem = (item: ContentGeneration) => (
        <div
            key={item.id}
            className={cn(
                "relative rounded-lg overflow-hidden cursor-pointer group bg-black/5 border border-black/5 hover:border-black/10 transition-all duration-300",
                item.content_type === 'image' ? "aspect-[3/2]" : "aspect-video"
            )}
            onClick={() => setSelectedItem(item)}
        >
            {item.content_type === 'image' ? (
                <img
                    src={getFullStorageUrl(item.content_url || '')}
                    alt="Contemplation Card"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
            ) : item.content_type === 'video' ? (
                <div className="w-full h-full relative">
                    <video
                        src={getFullStorageUrl(item.content_url || '')}
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
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#E5DED6] to-[#D5CDC6] text-[#472B20]">
                    <Play className="w-12 h-12 mb-3 text-[#472B20] opacity-80 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-medium text-[#472B20] text-center line-clamp-2">
                        {new Date(item.created_at).toLocaleString(undefined, {
                            weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                    </span>
                </div>
            )}

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300">
                <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 rounded-full bg-white/90 backdrop-blur shadow-lg hover:bg-white"
                        onClick={(e) => handleDownload(item, e)}
                    >
                        <Download className="h-4 w-4 text-gray-800" />
                    </Button>
                </div>
            </div>
        </div>
    );

    const LoaderSkeleton = () => (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
                <div key={i} className={cn(
                    "rounded-lg bg-[#E5DED6] animate-pulse",
                    activeTab === "cards" ? "aspect-[4/3]" : "aspect-video"
                )} />
            ))}
        </div>
    );

    return (
        <div className="flex-1 flex flex-col bg-[#F5F0EC]">
            {/* Header */}
            <header className="px-8 py-8">
                <h1 className="text-3xl  text-[#472b20]">Library</h1>
                <p className=" text-[#472b20]/60 mt-2 f">Your collection of contemplation cards and personalized meditations.</p>
            </header>

            <Tabs defaultValue="cards" className="flex-1 flex flex-col" onValueChange={setActiveTab}>
                <div className="px-8 border-b border-[#ECE5DF]">
                    <TabsList className="bg-transparent h-12 p-0 gap-8 justify-start w-full">
                        <TabsTrigger
                            value="cards"
                            className="px-0 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-[#472b20] data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[#472b20]/60 data-[state=active]:text-[#472b20] font-medium transition-all text-base"
                        >
                            Contemplation Cards
                        </TabsTrigger>
                        <TabsTrigger
                            value="meditations"
                            className="px-0 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-[#472b20] data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[#472b20]/60 data-[state=active]:text-[#472b20] font-medium transition-all text-base"
                        >
                            Guided Meditations
                        </TabsTrigger>
                    </TabsList>
                </div>

                <ScrollArea className="flex-1 px-8">
                    <TabsContent value="cards" className="m-0 py-8 focus-visible:ring-0">
                        {isLoading ? (
                            <LoaderSkeleton />
                        ) : images.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-32 text-center text-[#472b20]/60">
                                <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
                                <h3 className="text-xl font-medium mb-2">No cards yet</h3>
                                <p className="text-sm max-w-xs font-light">Generate your first contemplation card by talking with the guide.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {images.map(renderGridItem)}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="meditations" className="m-0 py-8 focus-visible:ring-0">
                        {isLoading ? (
                            <LoaderSkeleton />
                        ) : media.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-32 text-center text-[#472b20]/60">
                                <Play className="w-16 h-16 mb-4 opacity-20" />
                                <h3 className="text-xl font-medium mb-2">No meditations yet</h3>
                                <p className="text-sm max-w-xs font-light">Ask the guide for a personalized meditation session to see it here.</p>
                            </div>
                        ) : (
                            <Tabs defaultValue="audio" className="w-full">
                                <div className="mb-6 flex items-center overflow-x-auto no-scrollbar">
                                    <TabsList className="bg-transparent h-auto p-0 gap-2">
                                        <TabsTrigger
                                            value="audio"
                                            className="px-5 py-2 h-auto rounded-full text-sm font-medium text-gray-500 data-[state=active]:bg-[#ECE5DF] data-[state=active]:text-[#472b20] data-[state=active]:shadow-none transition-all"
                                        >
                                            Audio
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="video"
                                            className="px-5 py-2 h-auto rounded-full text-sm font-medium text-gray-500 data-[state=active]:bg-[#ECE5DF] data-[state=active]:text-[#472b20] data-[state=active]:shadow-none transition-all"
                                        >
                                            Video
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                <TabsContent value="audio" className="m-0 focus-visible:ring-0">
                                    {media.filter(m => m.content_type === 'audio').length === 0 ? (
                                        <div className="py-20 text-center text-[#472b20]/40 text-sm font-light">No audio meditations found.</div>
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                            {media.filter(m => m.content_type === 'audio').map(renderGridItem)}
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="video" className="m-0 focus-visible:ring-0">
                                    {media.filter(m => m.content_type === 'video').length === 0 ? (
                                        <div className="py-20 text-center text-[#472b20]/40 text-sm font-light">No video meditations found.</div>
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                            {media.filter(m => m.content_type === 'video').map(renderGridItem)}
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        )}
                    </TabsContent>
                </ScrollArea>
            </Tabs>

            {/* ChatGPT-style Full Screen Preview */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-md animate-in fade-in duration-200">
                    {/* Top Action Bar */}
                    <div className="flex items-center justify-between px-4 py-3 z-50 bg-black/20">
                        {/* Info - Top Left */}
                        <div className="flex items-center gap-2">
                            <div className="bg-white/10 backdrop-blur rounded-lg px-3 py-1.5 text-white/90 text-xs font-medium border border-white/10 uppercase tracking-wider">
                                {selectedItem.content_type === 'image' ? 'Contemplation Cards' : 'Guided Meditation'}
                            </div>
                            {/* <Button
                                variant="ghost"
                                size="sm"
                                className="text-white/70 hover:text-white hover:bg-white/10 gap-2 h-9 px-3 text-xs"
                                onClick={() => openRespectiveChat(selectedItem.conversation_id)}
                            >
                                <MessageSquare className="w-4 h-4" />
                                Open Chat
                            </Button> */}
                        </div>

                        {/* Actions - Top Right */}
                        <div className="flex items-center gap-1 sm:gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-white/70 hover:text-white hover:bg-white/10 rounded-lg w-10 h-10"
                                onClick={(e) => handleDownload(selectedItem, e)}
                                title="Download"
                            >
                                <Download className="w-5 h-5" />
                            </Button>
                            {/* <Button
                                variant="ghost"
                                size="icon"
                                className="text-white/70 hover:text-white hover:bg-white/10 rounded-lg w-10 h-10"
                                onClick={() => handleCopyLink(selectedItem)}
                                title="Copy Link"
                            >
                                <Copy className="w-5 h-5" />
                            </Button> */}
                            {/* <Button
                                variant="ghost"
                                size="icon"
                                className="text-white/70 hover:text-white hover:bg-white/10 rounded-lg w-10 h-10"
                                onClick={() => handleCopyLink(selectedItem)}
                                title="Share"
                            >
                                <Link className="w-5 h-5" />
                            </Button> */}

                            <div className="w-px h-6 bg-white/10 mx-1 hidden sm:block" />

                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-white/70 hover:text-white hover:bg-white/10 rounded-lg w-10 h-10"
                                onClick={handlePrev}
                                title="Previous"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-white/70 hover:text-white hover:bg-white/10 rounded-lg w-10 h-10"
                                onClick={handleNext}
                                title="Next"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-white/70 hover:text-white hover:bg-white/10 rounded-lg w-10 h-10 ml-2"
                                onClick={() => setSelectedItem(null)}
                                title="Close"
                            >
                                <X className="w-6 h-6" />
                            </Button>
                        </div>
                    </div>


                    {/* Main Content Area */}
                    <div className="flex-1 flex items-center justify-center p-4 sm:p-12 relative w-full overflow-hidden">
                        {/* Keyboard Navigation Hint - Optional */}

                        {selectedItem.content_type === 'image' ? (
                            <img
                                src={getFullStorageUrl(selectedItem.content_url || '')}
                                alt="Preview"
                                className="max-w-full max-h-full object-contain shadow-2xl rounded-lg animate-in zoom-in-95 duration-300"
                            />
                        ) : selectedItem.content_type === 'video' ? (
                            <div className="w-full max-w-2xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl ring-1 ring-white/10">
                                <VideoPlayer
                                    src={getFullStorageUrl(selectedItem.content_url || '')}
                                // className="w-full h-full"
                                // autoPlay
                                />
                            </div>
                        ) : (
                            <div className="w-full max-w-2xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 sm:p-12 text-center text-white shadow-2xl">
                                {/* <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-8 ring-1 ring-white/20">
                                    <Play className="w-10 h-10 ml-1 text-white fill-white" />
                                </div> */}
                                <h3 className="text-2xl  mb-2 text-white">Meditation Session</h3>
                                <p className="text-white/50 text-sm mb-8 font-light">
                                    {new Date(selectedItem.created_at).toLocaleString(undefined, {
                                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                                        hour: '2-digit', minute: '2-digit'
                                    })}
                                </p>

                                <audio
                                    src={getFullStorageUrl(selectedItem.content_url || '')}
                                    controls
                                    className="w-full mb-8"
                                // className="w-full mb-8 [&::-webkit-media-controls-panel]:bg-white/10 [&::-webkit-media-controls-current-time-display]:text-white/10 [&::-webkit-media-controls-time-remaining-display]:text-white"
                                />

                                {/* {selectedItem.transcript && (
                                    <div className="text-left bg-black/20 rounded-xl p-6 max-h-48 overflow-y-auto custom-scrollbar border border-white/5">
                                        <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap font-light">
                                            {selectedItem.transcript}
                                        </p>
                                    </div>
                                )} */}
                            </div>
                        )}
                    </div>

                    {/* Footer - Breadcrumbs / Filename equivalent */}
                    {/* <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/90 text-xs font-light tracking-wide flex items-center gap-2">
                        <span>{activeTab === 'cards' ? 'CARD' : 'MEDITATION'}</span>
                    
                        <span>

                            {new Date(selectedItem.created_at).toLocaleString(undefined, {
                                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                            })}
                        </span>
                    </div>
                     */}
                </div>
            )}
        </div>
    );
};

export default Library;
