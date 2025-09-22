-- Create ads table for banner management
CREATE TABLE public.ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  detailed_info TEXT,
  position TEXT NOT NULL CHECK (position IN ('top', 'sidebar', 'bottom', 'popup')),
  target_url TEXT,
  banner_image TEXT,
  banner_url TEXT,
  show_popup BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  clicks_count INTEGER DEFAULT 0,
  impressions_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

-- Create policies for ads - only authenticated users can manage ads
CREATE POLICY "Anyone can view active ads" 
ON public.ads 
FOR SELECT 
USING (is_active = true AND (start_date IS NULL OR start_date <= now()) AND (end_date IS NULL OR end_date >= now()));

CREATE POLICY "Authenticated users can manage ads" 
ON public.ads 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_ads_updated_at
BEFORE UPDATE ON public.ads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample ads data
INSERT INTO public.ads (title, content, detailed_info, position, target_url, banner_image, banner_url, show_popup, is_active) VALUES
('RevEmpire ChatBox', 'Connect with players worldwide! 14 multiplayer games and real-time chat - all free!', 'Experience the ultimate gaming community with RevEmpire ChatBox! Join thousands of players in real-time multiplayer action. Our platform features 14 different games including strategy games like Chess and Checkers, puzzle games like Memory and Number Puzzle, action games like Battleship, and party games like Would Rather and Trivia. Chat with players from around the world while you play!', 'top', 'https://revempire.com', 'https://via.placeholder.com/468x60/2563eb/ffffff?text=Join+RevEmpire+Now', 'https://revempire.com/register', true, true),

('New Game Alert!', 'Try our latest multiplayer puzzle games - Challenge your friends now!', 'Discover our newest additions to the game collection! Challenge your mind with advanced puzzle mechanics, compete in real-time with friends, and climb the global leaderboards. New games are added monthly with enhanced graphics and innovative gameplay features.', 'sidebar', 'https://revempire.com/games', 'https://via.placeholder.com/468x60/16a34a/ffffff?text=Play+New+Games', 'https://revempire.com/games/new', true, true),

('Join the Tournament', 'Weekly tournaments starting soon. Win prizes and climb the leaderboard!', 'Participate in our weekly tournaments and compete for amazing prizes! Each week features different game categories with cash prizes, premium memberships, and exclusive titles. Tournament brackets are organized by skill level, ensuring fair competition for all players.', 'bottom', 'https://revempire.com/tournaments', 'https://via.placeholder.com/468x60/dc2626/ffffff?text=Tournament+Registration', 'https://revempire.com/tournaments/register', true, true),

('Play More Games!', 'Discover 14 amazing multiplayer games - Strategy, Action, Puzzle & more!', 'Explore our complete game library featuring 14 unique multiplayer experiences! From classic strategy games to modern puzzle challenges, there is something for every player. All games support real-time multiplayer, chat integration, and achievement systems.', 'popup', 'https://revempire.com/games', 'https://via.placeholder.com/468x60/7c3aed/ffffff?text=Explore+All+Games', 'https://revempire.com/games/all', true, true);