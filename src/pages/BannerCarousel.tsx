// components/BannerCarousel.tsx
import { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface Banner {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  video_url?: string;
  animation_url?: string;
  media_type: "image" | "video" | "animation";
  target_url?: string;
  type: string;
  button_text?: string;
  button_color?: string;
  text_color?: string;
  priority: number;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
}

export function BannerCarousel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [videoStates, setVideoStates] = useState<{
    [key: string]: { playing: boolean; muted: boolean };
  }>({});

  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadBanners();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;

    if (!isPaused) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [banners.length, isPaused]);

  // Reset progress animation when banner changes or pause state changes
  useEffect(() => {
    if (progressRef.current) {
      progressRef.current.style.animation = "none";
      progressRef.current.offsetHeight; // Trigger reflow

      if (!isPaused && banners.length > 1) {
        progressRef.current.style.animation = "progress 5s linear";
      }
    }
  }, [currentIndex, isPaused, banners.length]);

  const loadBanners = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("status", "active")
        .gte("priority", 1)
        .or("end_date.is.null,end_date.gt.now()")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;

      const initialVideoStates: {
        [key: string]: { playing: boolean; muted: boolean };
      } = {};
      data?.forEach((banner) => {
        if (
          banner.media_type === "video" ||
          banner.media_type === "animation"
        ) {
          initialVideoStates[banner.id] = {
            playing: banner.autoplay ?? true,
            muted: banner.muted ?? true,
          };
        }
      });

      setVideoStates(initialVideoStates);
      setBanners(data || []);
    } catch (error) {
      console.error("Error loading banners:", error);
    } finally {
      setLoading(false);
    }
  };

  const nextBanner = () => {
    const currentBanner = banners[currentIndex];
    if (
      (currentBanner?.media_type === "video" ||
        currentBanner?.media_type === "animation") &&
      videoRefs.current[currentBanner.id]
    ) {
      videoRefs.current[currentBanner.id]?.pause();
    }
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const prevBanner = () => {
    const currentBanner = banners[currentIndex];
    if (
      (currentBanner?.media_type === "video" ||
        currentBanner?.media_type === "animation") &&
      videoRefs.current[currentBanner.id]
    ) {
      videoRefs.current[currentBanner.id]?.pause();
    }
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToBanner = (index: number) => {
    const currentBanner = banners[currentIndex];
    if (
      (currentBanner?.media_type === "video" ||
        currentBanner?.media_type === "animation") &&
      videoRefs.current[currentBanner.id]
    ) {
      videoRefs.current[currentBanner.id]?.pause();
    }
    setCurrentIndex(index);
  };

  const toggleVideoPlayback = (bannerId: string) => {
    const video = videoRefs.current[bannerId];
    if (!video) return;

    if (video.paused) {
      video.play();
      setVideoStates((prev) => ({
        ...prev,
        [bannerId]: { ...prev[bannerId], playing: true },
      }));
    } else {
      video.pause();
      setVideoStates((prev) => ({
        ...prev,
        [bannerId]: { ...prev[bannerId], playing: false },
      }));
    }
  };

  const toggleVideoMute = (bannerId: string) => {
    const video = videoRefs.current[bannerId];
    if (!video) return;

    video.muted = !video.muted;
    setVideoStates((prev) => ({
      ...prev,
      [bannerId]: { ...prev[bannerId], muted: video.muted },
    }));
  };

  // Don't show anything if loading or no banners
  if (loading || banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];
  const isVideo =
    currentBanner.media_type === "video" ||
    currentBanner.media_type === "animation";
  const currentVideoState = videoStates[currentBanner.id] || {
    playing: false,
    muted: true,
  };

  return (
    <div
      className="relative w-full h-24 bg-gray-900 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Media */}
      <div className="absolute inset-0">
        {/* Image Background */}
        {!isVideo && currentBanner.image_url && (
          <>
            <div
              className="w-full h-full bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url('${currentBanner.image_url}')`,
              }}
            />
            <div className="absolute inset-0 bg-black/50" />
          </>
        )}

        {/* Video/Animation Background */}
        {isVideo && currentBanner.video_url && (
          <>
            <video
              ref={(el) => (videoRefs.current[currentBanner.id] = el)}
              src={currentBanner.video_url}
              className="w-full h-full object-cover"
              muted={currentVideoState.muted}
              loop={currentBanner.loop ?? true}
              autoPlay={currentBanner.autoplay ?? true}
              playsInline
              onLoadedData={() => {
                const video = videoRefs.current[currentBanner.id];
                if (video && currentBanner.autoplay !== false) {
                  video.play().catch(console.error);
                }
              }}
            />
            <div className="absolute inset-0 bg-black/40" />

            {/* Video Controls */}
            <div className="absolute top-2 right-2 z-20 flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 bg-black/60 hover:bg-black/80 text-white rounded-full border-0 transition-colors duration-200"
                onClick={() => toggleVideoPlayback(currentBanner.id)}
              >
                {currentVideoState.playing ? (
                  <Pause className="h-3 w-3" />
                ) : (
                  <Play className="h-3 w-3" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 bg-black/60 hover:bg-black/80 text-white rounded-full border-0 transition-colors duration-200"
                onClick={() => toggleVideoMute(currentBanner.id)}
              >
                {currentVideoState.muted ? (
                  <VolumeX className="h-3 w-3" />
                ) : (
                  <Volume2 className="h-3 w-3" />
                )}
              </Button>
            </div>
          </>
        )}

        {/* Fallback if no media */}
        {!currentBanner.image_url && !isVideo && (
          <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-blue-600" />
        )}
      </div>

      {/* Progress Bar */}
      {banners.length > 1 && (
        <div className="absolute top-0 left-0 right-0 z-30 h-1 bg-gray-700">
          <div
            ref={progressRef}
            className="h-full bg-green-500"
            style={{
              animation: !isPaused ? "progress 5s linear" : "none",
              width: isPaused ? "100%" : "0%",
            }}
          />
          <style>{`
            @keyframes progress {
              0% {
                width: 100%;
              }
              100% {
                width: 0%;
              }
            }
          `}</style>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 h-full flex items-center justify-center px-4 sm:px-8">
        <div className="flex items-center gap-2 sm:gap-4 text-white max-w-4xl mx-auto w-full">
          {/* Navigation Arrows */}
          {banners.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 sm:h-7 sm:w-7 bg-white/20 hover:bg-white/30 text-white rounded-full border-0 transition-opacity duration-200 flex-shrink-0"
              onClick={prevBanner}
            >
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          )}

          {/* Banner Content */}
          <div className="flex items-center gap-2 flex-1 justify-center min-w-0">
            <div className="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0" />
            <div className="text-center min-w-0 flex-1">
              <h3 className="text-xs sm:text-sm font-semibold truncate px-2">
                {currentBanner.title}
              </h3>
              {currentBanner.description && (
                <p className="text-[10px] sm:text-xs opacity-90 truncate mt-0.5">
                  {currentBanner.description}
                </p>
              )}
            </div>
          </div>

          {/* CTA Button */}
          {currentBanner.target_url && currentBanner.button_text && (
            <Button
              size="sm"
              className="h-6 sm:h-7 text-[10px] sm:text-xs font-medium text-white hover:bg-white/20 border border-white/30 rounded-lg px-2 sm:px-3 transition-colors duration-200 flex-shrink-0"
              style={{
                backgroundColor:
                  currentBanner.button_color || "rgba(255,255,255,0.2)",
              }}
              asChild
            >
              <a
                href={currentBanner.target_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {currentBanner.button_text}
              </a>
            </Button>
          )}

          {/* Navigation Arrows */}
          {banners.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 sm:h-7 sm:w-7 bg-white/20 hover:bg-white/30 text-white rounded-full border-0 transition-opacity duration-200 flex-shrink-0"
              onClick={nextBanner}
            >
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-20 flex gap-1">
          {banners.map((_, index) => (
            <button
              key={index}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-colors duration-200 border border-white/30",
                index === currentIndex
                  ? "bg-white"
                  : "bg-white/50 hover:bg-white/70"
              )}
              onClick={() => goToBanner(index)}
            />
          ))}
        </div>
      )}

      {/* Media Type Badge */}
      <div className="absolute top-2 left-2 z-20">
        <div
          className={cn(
            "px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm border border-white/20",
            isVideo ? "bg-blue-500/90 text-white" : "bg-green-500/90 text-white"
          )}
        >
          {isVideo
            ? currentBanner.media_type === "animation"
              ? "🎬"
              : "🎥"
            : "🖼️"}
        </div>
      </div>
    </div>
  );
}
