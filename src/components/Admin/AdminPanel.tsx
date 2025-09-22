import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Settings, 
  BarChart3, 
  Users, 
  MessageSquare, 
  DollarSign, 
  Shield,
  Plus,
  Edit,
  Trash2,
  Eye,
  Save
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import AdsManagement from "./AdsManagement";

const AdminPanel = () => {
  const [analytics, setAnalytics] = useState({
    totalUsers: 247,
    activeUsers: 89,
    totalGames: 1456,
    totalMessages: 8934,
    revenue: 342.50
  });

  const [adNetworks, setAdNetworks] = useState([
    { id: 1, name: "Google AdSense", enabled: true, revenue: 156.30, publisherId: "pub-0000000000000000", domain: "google.com" },
    { id: 2, name: "Monetag", enabled: true, revenue: 89.40, publisherId: "1234567890", domain: "monetag.com" },
    { id: 3, name: "Media.net", enabled: false, revenue: 67.20, publisherId: "1234567890", domain: "media.net" },
    { id: 4, name: "Asterra", enabled: true, revenue: 29.60, publisherId: "1234567890", domain: "asterra.io" }
  ]);

  const [newNetwork, setNewNetwork] = useState({
    name: "",
    domain: "",
    publisherId: ""
  });

  const [adsTxtContent, setAdsTxtContent] = useState("");
  const [showAdsTxtEditor, setShowAdsTxtEditor] = useState(false);

  const [newAd, setNewAd] = useState({
    title: "",
    content: "",
    targetUrl: "",
    position: "top",
    startDate: "",
    endDate: "",
    detailedInfo: "",
    showPopup: false,
    bannerImage: "",
    bannerUrl: ""
  });

  const handleCreateAd = () => {
    if (!newAd.title || !newAd.content) {
      toast({
        title: "Missing fields",
        description: "Please fill in title and content",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Ad created successfully",
      description: "Your ad is now active",
    });

    // Reset form
    setNewAd({
      title: "",
      content: "",
      targetUrl: "",
      position: "top",
      startDate: "",
      endDate: "",
      detailedInfo: "",
      showPopup: false,
      bannerImage: "",
      bannerUrl: ""
    });
  };

  const toggleAdNetwork = (id: number) => {
    setAdNetworks(prev => prev.map(network => 
      network.id === id 
        ? { ...network, enabled: !network.enabled }
        : network
    ));
    toast({
      title: "Ad network updated",
      description: "Settings saved successfully",
    });
  };

  const addAdNetwork = () => {
    if (!newNetwork.name || !newNetwork.domain || !newNetwork.publisherId) {
      toast({
        title: "Missing fields",
        description: "Please fill in all network details",
        variant: "destructive"
      });
      return;
    }

    const network = {
      id: Date.now(),
      name: newNetwork.name,
      domain: newNetwork.domain,
      publisherId: newNetwork.publisherId,
      enabled: true,
      revenue: 0
    };

    setAdNetworks(prev => [...prev, network]);
    setNewNetwork({ name: "", domain: "", publisherId: "" });
    
    toast({
      title: "Ad network added",
      description: "New ad network configured successfully",
    });
  };

  const updateNetworkCode = (id: number, publisherId: string) => {
    setAdNetworks(prev => prev.map(network => 
      network.id === id 
        ? { ...network, publisherId }
        : network
    ));
  };

  const loadAdsTxt = async () => {
    try {
      const response = await fetch('/ads.txt');
      const content = await response.text();
      setAdsTxtContent(content);
    } catch (error) {
      setAdsTxtContent("# RevEmpire ChatBox - Ads.txt File\n# Add your ad network configurations here");
    }
  };

  const saveAdsTxt = () => {
    // In a real app, this would make an API call to save the file
    toast({
      title: "Ads.txt updated",
      description: "Your ads.txt file has been saved successfully",
    });
    setShowAdsTxtEditor(false);
  };

  useEffect(() => {
    loadAdsTxt();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <Badge variant="secondary">RevEmpire ChatBox</Badge>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="ads">Ad Manager</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="chat">Chat Settings</TabsTrigger>
          <TabsTrigger value="games">Games</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalUsers}</div>
                <p className="text-xs text-muted-foreground">+12% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Now</CardTitle>
                <Users className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.activeUsers}</div>
                <p className="text-xs text-muted-foreground">Currently online</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Games Played</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalGames}</div>
                <p className="text-xs text-muted-foreground">+28% from last week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Messages</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalMessages}</div>
                <p className="text-xs text-muted-foreground">+15% from yesterday</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${analytics.revenue}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ad Networks Performance</CardTitle>
              <CardDescription>Revenue breakdown by ad network</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {adNetworks.map(network => (
                  <div key={network.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={network.enabled ? "default" : "secondary"}>
                        {network.enabled ? "Active" : "Inactive"}
                      </Badge>
                      <span className="font-medium">{network.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">${network.revenue}</div>
                      <div className="text-sm text-muted-foreground">This month</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ads" className="space-y-6">
          <AdsManagement />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage registered users, permissions, and activity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">What is User Management?</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• <strong>View registered users:</strong> See all users who have signed up</li>
                  <li>• <strong>Monitor activity:</strong> Track user engagement and chat activity</li>
                  <li>• <strong>Manage permissions:</strong> Set admin roles and moderation rights</li>
                  <li>• <strong>Handle reports:</strong> Review and act on user reports</li>
                  <li>• <strong>Ban/unban users:</strong> Manage problematic users</li>
                  <li>• <strong>View analytics:</strong> User growth, retention, and engagement metrics</li>
                </ul>
              </div>
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Advanced user management features coming soon...</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Will include user profiles, activity logs, moderation tools, and more
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Chat Settings</CardTitle>
              <CardDescription>Configure chat behavior and moderation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Message Settings</h4>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="autoDelete">8-hour auto-delete</Label>
                    <Switch id="autoDelete" checked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="profanityFilter">Profanity filter</Label>
                    <Switch id="profanityFilter" checked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="linkSharing">Allow link sharing</Label>
                    <Switch id="linkSharing" checked />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Features</h4>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="voiceChat">Voice chat (Ready)</Label>
                    <Switch id="voiceChat" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="fileSharing">File sharing (Ready)</Label>
                    <Switch id="fileSharing" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="emojiReactions">Emoji reactions</Label>
                    <Switch id="emojiReactions" checked />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="games" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Game Management</CardTitle>
              <CardDescription>Configure games, monitor activity, and analyze gaming trends</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">What is Game Management?</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• <strong>Game Analytics:</strong> Track which games are most popular</li>
                  <li>• <strong>Performance Metrics:</strong> Monitor game completion rates and engagement</li>
                  <li>• <strong>Enable/Disable Games:</strong> Control which games are available to users</li>
                  <li>• <strong>Game Settings:</strong> Configure difficulty levels and game parameters</li>
                  <li>• <strong>Leaderboards:</strong> View top players and game statistics</li>
                  <li>• <strong>Custom Games:</strong> Add new games or modify existing ones</li>
                  <li>• <strong>Tournament Mode:</strong> Organize competitive gaming events</li>
                </ul>
              </div>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Game analytics and advanced management coming soon...</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Will include detailed stats, custom tournaments, and game monetization tools
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;