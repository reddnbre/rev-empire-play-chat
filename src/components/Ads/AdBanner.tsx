import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdBannerProps {
  position: "top" | "sidebar" | "bottom" | "popup";
  className?: string;
}

const AdBanner = ({ position, className = "" }: AdBannerProps) => {
  const [ads, setAds] = useState<any[]>([]);
  const [currentAd, setCurrentAd] = useState<any>(null);
  const [showPopup, setShowPopup] = useState(false);

  // Sample ads data (in production, this would come from Supabase)
  const sampleAds = [
    {
      id: 1,
      title: "RevEmpire ChatBox",
      content: "Connect with players worldwide! 14 multiplayer games and real-time chat - all free!",
      position: "top",
      targetUrl: "#",
      isActive: true
    },
    {
      id: 2,
      title: "New Game Alert!",
      content: "Try our latest multiplayer puzzle games - Challenge your friends now!",
      position: "sidebar",
      targetUrl: "#",
      isActive: true
    },
    {
      id: 3,
      title: "Join the Tournament",
      content: "Weekly tournaments starting soon. Win prizes and climb the leaderboard!",
      position: "bottom",
      targetUrl: "#",
      isActive: true
    },
    {
      id: 4,
      title: "Play More Games!",
      content: "🎮 Discover 14 amazing multiplayer games - Strategy, Action, Puzzle & more!",
      position: "popup",
      targetUrl: "#",
      isActive: true
    }
  ];

  useEffect(() => {
    // Filter ads by position
    const positionAds = sampleAds.filter(ad => ad.position === position && ad.isActive);
    setAds(positionAds);
    
    if (positionAds.length > 0) {
      setCurrentAd(positionAds[0]);
      
      // Show popup ad after delay
      if (position === "popup") {
        const timer = setTimeout(() => {
          setShowPopup(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [position]);

  const handleAdClick = (ad: any) => {
    // Track click (in production, update clicks_count in Supabase)
    console.log("Ad clicked:", ad.title);
    
    if (ad.targetUrl && ad.targetUrl !== "#") {
      window.open(ad.targetUrl, "_blank");
    }
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  if (!currentAd) return null;

  // Popup ad
  if (position === "popup" && showPopup) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="max-w-md mx-4 p-6 relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-6 w-6 p-0"
            onClick={closePopup}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{currentAd.title}</h3>
            <p className="text-sm text-muted-foreground">{currentAd.content}</p>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => handleAdClick(currentAd)}
                className="flex-1"
              >
                Learn More
              </Button>
              <Button variant="outline" onClick={closePopup}>
                Close
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Banner ads
  const getBannerClass = () => {
    switch (position) {
      case "top":
        return "w-full h-20";
      case "sidebar":
        return "w-full h-32";
      case "bottom":
        return "w-full h-16";
      default:
        return "w-full";
    }
  };

  return (
    <Card 
      className={`${getBannerClass()} ${className} cursor-pointer hover:shadow-md transition-shadow overflow-hidden`}
      onClick={() => handleAdClick(currentAd)}
    >
      <div className="h-full flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="flex-1">
          <h4 className="font-semibold text-sm">{currentAd.title}</h4>
          {position !== "bottom" && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {currentAd.content}
            </p>
          )}
        </div>
        
        <div className="text-xs text-primary font-medium ml-4">
          {position === "bottom" ? "Learn More →" : "Click to Learn More"}
        </div>
      </div>
    </Card>
  );
};

export default AdBanner;