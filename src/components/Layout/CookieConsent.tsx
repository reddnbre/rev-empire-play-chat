import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCookieConsent } from "@/hooks/useCookieConsent";
import { X } from "lucide-react";

interface CookieConsentProps {
  onConsentChange?: (hasConsent: boolean) => void;
}

export const CookieConsent = ({ onConsentChange }: CookieConsentProps) => {
  const { hasConsent, acceptCookies, declineCookies } = useCookieConsent();

  // Don't show if consent is already given or declined
  if (hasConsent !== null) {
    return null;
  }

  const handleAccept = () => {
    acceptCookies();
    onConsentChange?.(true);
  };

  const handleDecline = () => {
    declineCookies();
    onConsentChange?.(false);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md">
      <Card className="p-4 bg-card/95 backdrop-blur-sm border-border shadow-lg">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm">Cookie Consent</h3>
          </div>
          
          <p className="text-xs text-muted-foreground leading-relaxed">
            We use cookies to keep you logged in and enhance your experience. 
            By accepting, you allow us to store authentication data in cookies 
            to maintain your session across visits.
          </p>
          
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={handleAccept}
              className="flex-1"
            >
              Accept Cookies
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDecline}
              className="flex-1"
            >
              Decline
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Declining will use browser storage instead. You can change this later in settings.
          </p>
        </div>
      </Card>
    </div>
  );
};