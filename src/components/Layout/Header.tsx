import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Crown, Settings, LogOut, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface HeaderProps {
  currentUser: any;
  onShowAdmin: () => void;
  isAdmin?: boolean;
}

const Header = ({ currentUser, onShowAdmin, isAdmin = false }: HeaderProps) => {
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out successfully",
        description: "Come back soon!",
      });
    } catch (error) {
      toast({
        title: "Sign out failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const getInitials = (email: string) => {
    return email ? email.slice(0, 2).toUpperCase() : "U";
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Crown className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              RevEmpire
            </h1>
          </div>
          <Badge variant="secondary" className="hidden sm:inline-flex">
            ChatBox & Gaming Hub
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-muted-foreground hidden sm:inline">
              Online
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {getInitials(currentUser?.email || "")}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium text-sm">
                    {currentUser?.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="w-[200px] truncate text-xs text-muted-foreground">
                    {currentUser?.email}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              
              {isAdmin && (
                <>
                  <DropdownMenuItem onClick={onShowAdmin}>
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Admin Panel</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;