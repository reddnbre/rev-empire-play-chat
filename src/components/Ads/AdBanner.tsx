import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdBannerProps {
  position: "top" | "sidebar" | "bottom" | "popup";
  className?: string;
}

interface Ad {
  id: number;
  title: string;
  content: string;
  position: string;
  targetUrl: string;
  isActive: boolean;
  detailedInfo?: string;
  bannerImage?: string;
  bannerUrl?: string;
  showPopup?: boolean;
}

const AdBanner = ({ position, className = "" }: AdBannerProps) => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [currentAd, setCurrentAd] = useState<Ad | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showDetailPopup, setShowDetailPopup] = useState(false);

  // Sample ads data (in production, this would come from Supabase)
  const sampleAds: Ad[] = [
    {
      id: 1,
      title: "RevEmpire ChatBox",
      content: "Connect with players worldwide! 14 multiplayer games and real-time chat - all free!",
      position: "top",
      targetUrl: "https://revempire.com",
      isActive: true,
      detailedInfo: "Experience the ultimate gaming community with RevEmpire ChatBox! Join thousands of players in real-time multiplayer action. Our platform features 14 different games including strategy games like Chess and Checkers, puzzle games like Memory and Number Puzzle, action games like Battleship, and party games like Would Rather and Trivia. Chat with players from around the world while you play!",
      showPopup: true,
      bannerImage: "https://via.placeholder.com/468x60/2563eb/ffffff?text=Join+RevEmpire+Now",
      bannerUrl: "https://revempire.com/register"
    },
    {
      id: 2,
      title: "New Game Alert!",
      content: "Try our latest multiplayer puzzle games - Challenge your friends now!",
      position: "sidebar",
      targetUrl: "https://revempire.com/games",
      isActive: true,
      detailedInfo: "Discover our newest additions to the game collection! Challenge your mind with advanced puzzle mechanics, compete in real-time with friends, and climb the global leaderboards. New games are added monthly with enhanced graphics and innovative gameplay features.",
      showPopup: true,
      bannerImage: "https://via.placeholder.com/468x60/16a34a/ffffff?text=Play+New+Games",
      bannerUrl: "https://revempire.com/games/new"
    },
    {
      id: 3,
      title: "Join the Tournament",
      content: "Weekly tournaments starting soon. Win prizes and climb the leaderboard!",
      position: "bottom",
      targetUrl: "https://revempire.com/tournaments",
      isActive: true,
      detailedInfo: "Participate in our weekly tournaments and compete for amazing prizes! Each week features different game categories with cash prizes, premium memberships, and exclusive titles. Tournament brackets are organized by skill level, ensuring fair competition for all players.",
      showPopup: true,
      bannerImage: "https://via.placeholder.com/468x60/dc2626/ffffff?text=Tournament+Registration",
      bannerUrl: "https://revempire.com/tournaments/register"
    },
    {
      id: 4,
      title: "Play More Games!",
      content: "🎮 Discover 14 amazing multiplayer games - Strategy, Action, Puzzle & more!",
      position: "popup",
      targetUrl: "https://revempire.com/games",
      isActive: true,
      detailedInfo: "Explore our complete game library featuring 14 unique multiplayer experiences! From classic strategy games to modern puzzle challenges, there's something for every player. All games support real-time multiplayer, chat integration, and achievement systems.",
      showPopup: true,
      bannerImage: "https://via.placeholder.com/468x60/7c3aed/ffffff?text=Explore+All+Games",
      bannerUrl: "https://revempire.com/games/all"
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

  const handleAdClick = (ad: Ad) => {
    // Track click (in production, update clicks_count in Supabase)
    console.log("Ad clicked:", ad.title);
    
    if (ad.showPopup && ad.detailedInfo) {
      setShowDetailPopup(true);
    } else if (ad.targetUrl && ad.targetUrl !== "#") {
      window.open(ad.targetUrl, "_blank");
    }
  };

  const handleBannerClick = (url?: string) => {
    if (url && url !== "#") {
      window.open(url, "_blank");
    }
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  const closeDetailPopup = () => {
    setShowDetailPopup(false);
  };

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

  // Show placeholder if no ad available
  if (!currentAd) {
    return (
      <Card className={`${getBannerClass()} ${className} border-dashed border-2 border-muted`}>
        <div className="h-full flex items-center justify-center p-4 bg-muted/20">
          <div className="text-center">
            <p className="text-sm text-muted-foreground font-medium">
              Ad Space - {position.charAt(0).toUpperCase() + position.slice(1)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Configure ads in Admin Panel
            </p>
          </div>
        </div>
      </Card>
    );
  }

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

  // Detail popup
  if (showDetailPopup && currentAd) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="max-w-2xl mx-4 p-6 relative max-h-[80vh] overflow-y-auto">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-6 w-6 p-0"
            onClick={closeDetailPopup}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">{currentAd.title}</h3>
              <p className="text-muted-foreground">{currentAd.detailedInfo}</p>
            </div>
            
            {currentAd.bannerImage && (
              <div className="border-t pt-6">
                <div 
                  className="w-full h-[60px] bg-cover bg-center rounded cursor-pointer overflow-hidden"
                  style={{ 
                    backgroundImage: `url(${currentAd.bannerImage})`,
                    width: '468px',
                    height: '60px',
                    maxWidth: '100%',
                    margin: '0 auto'
                  }}
                  onClick={() => handleBannerClick(currentAd.bannerUrl)}
                />
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Advertisement - 468x60 Banner
                </p>
              </div>
            )}
            
            <div className="flex gap-2 pt-4 border-t">
              <Button 
                onClick={() => {
                  if (currentAd.targetUrl && currentAd.targetUrl !== "#") {
                    window.open(currentAd.targetUrl, "_blank");
                  }
                }}
                className="flex-1"
              >
                Visit Website
              </Button>
              <Button variant="outline" onClick={closeDetailPopup}>
                Close
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Banner ads
  return (
    <Card 
      className={`${getBannerClass()} ${className} cursor-pointer hover:shadow-md transition-shadow overflow-hidden`}
      onClick={() => handleAdClick(currentAd)}
    >
      <div className="h-full flex items-center justify-between p-4 bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/20">
        <div className="flex-1">
          <h4 className="font-semibold text-sm">{currentAd.title}</h4>
          {position !== "bottom" && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {currentAd.content}
            </p>
          )}
        </div>
        
        <div className="text-xs text-primary font-medium ml-4">
          {currentAd.showPopup ? "Click for Details →" : "Learn More →"}
        </div>
      </div>
    </Card>
  );
};

export default AdBanner;