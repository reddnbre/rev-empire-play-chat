import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface AdBannerProps {
  position: "top" | "sidebar" | "bottom" | "popup";
  className?: string;
}

interface Ad {
  id: string;
  title: string;
  content: string;
  position: string;
  target_url: string | null;
  is_active: boolean;
  detailed_info?: string | null;
  banner_image?: string | null;
  banner_url?: string | null;
  show_popup?: boolean;
  clicks_count: number;
  impressions_count: number;
}

const AdBanner = ({ position, className = "" }: AdBannerProps) => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [currentAd, setCurrentAd] = useState<Ad | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showDetailPopup, setShowDetailPopup] = useState(false);

  useEffect(() => {
    fetchAds();
  }, [position]);

  const fetchAds = async () => {
    try {
      console.log('Fetching ads for position:', position);
      const { data: ads, error } = await supabase
        .from('ads')
        .select('*')
        .eq('position', position)
        .eq('is_active', true)
        .order('priority', { ascending: false });

      console.log('Ads query result:', { ads, error, position });

      if (error) {
        console.error('Error fetching ads:', error);
        return;
      }

      if (ads && ads.length > 0) {
        console.log(`Found ${ads.length} ads for position ${position}:`, ads);
        setAds(ads);
        setCurrentAd(ads[0]);
        
        // Track impression
        await supabase
          .from('ads')
          .update({ impressions_count: ads[0].impressions_count + 1 })
          .eq('id', ads[0].id);
        
        // Show popup ad after delay
        if (position === "popup") {
          const timer = setTimeout(() => {
            setShowPopup(true);
          }, 3000);
          return () => clearTimeout(timer);
        }
      }
    } catch (error) {
      console.error('Error in fetchAds:', error);
    }
  };

  const handleAdClick = async (ad: Ad) => {
    // Track click
    try {
      await supabase
        .from('ads')
        .update({ clicks_count: ad.clicks_count + 1 })
        .eq('id', ad.id);
    } catch (error) {
      console.error('Error tracking click:', error);
    }

    console.log("Ad clicked:", ad.title, "Data:", ad);
    
    if (ad.show_popup && ad.detailed_info) {
      setShowDetailPopup(true);
    } else if (ad.target_url && ad.target_url !== "#") {
      window.open(ad.target_url, "_blank");
    } else {
      // Fallback: close the popup if no other action is defined
      if (position === "popup") {
        setShowPopup(false);
      }
    }
  };

  const handleBannerClick = (url?: string | null) => {
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
    const baseClass = className || "";
    switch (position) {
      case "top":
        return `w-full h-20 ${baseClass}`;
      case "sidebar":
        return baseClass.includes("h-") ? `w-full ${baseClass}` : `w-full h-32 ${baseClass}`;
      case "bottom":
        return `w-full h-16 ${baseClass}`;
      default:
        return `w-full ${baseClass}`;
    }
  };

  // Show placeholder if no ad available
  if (!currentAd) {
    return (
      <Card className={`${getBannerClass()} border-dashed border-2 border-muted`}>
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
              <p className="text-muted-foreground">{currentAd.detailed_info}</p>
            </div>
            
            {currentAd.banner_image && (
              <div className="border-t pt-6">
                <div 
                  className="w-full h-[60px] bg-cover bg-center rounded cursor-pointer overflow-hidden"
                  style={{ 
                    backgroundImage: `url(${currentAd.banner_image})`,
                    width: '468px',
                    height: '60px',
                    maxWidth: '100%',
                    margin: '0 auto'
                  }}
                  onClick={() => handleBannerClick(currentAd.banner_url)}
                />
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Advertisement - 468x60 Banner
                </p>
              </div>
            )}
            
            <div className="flex gap-2 pt-4 border-t">
              <Button 
                onClick={() => {
                  closeDetailPopup();
                  if (currentAd.target_url && currentAd.target_url !== "#") {
                    window.open(currentAd.target_url, "_blank");
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
      className={`${getBannerClass()} cursor-pointer hover:shadow-md transition-shadow overflow-hidden`}
      onClick={() => handleAdClick(currentAd)}
    >
      <div className={`h-full flex ${position === 'sidebar' && className?.includes('h-') ? 'flex-col' : 'flex-row'} items-center justify-between p-4 bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/20`}>
        <div className="flex-1">
          <h4 className="font-semibold text-sm">{currentAd.title}</h4>
          {position !== "bottom" && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {currentAd.content}
            </p>
          )}
        </div>
        
        <div className={`text-xs text-primary font-medium ${position === 'sidebar' && className?.includes('h-') ? 'mt-4' : 'ml-4'}`}>
          {currentAd.show_popup ? "Click for Details →" : "Learn More →"}
        </div>
      </div>
    </Card>
  );
};

export default AdBanner;