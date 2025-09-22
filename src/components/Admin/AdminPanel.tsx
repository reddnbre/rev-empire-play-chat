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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Ad</CardTitle>
                <CardDescription>Configure and deploy new advertisements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Ad Title</Label>
                    <Input
                      id="title"
                      value={newAd.title}
                      onChange={(e) => setNewAd(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter ad title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="position">Position</Label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={newAd.position}
                      onChange={(e) => setNewAd(prev => ({ ...prev, position: e.target.value }))}
                    >
                      <option value="top">Top Banner</option>
                      <option value="sidebar">Sidebar</option>
                      <option value="bottom">Bottom Banner</option>
                      <option value="popup">Popup</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="content">Ad Content</Label>
                  <Textarea
                    id="content"
                    value={newAd.content}
                    onChange={(e) => setNewAd(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Enter ad content or HTML"
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="targetUrl">Target URL (Optional)</Label>
                  <Input
                    id="targetUrl"
                    value={newAd.targetUrl}
                    onChange={(e) => setNewAd(prev => ({ ...prev, targetUrl: e.target.value }))}
                    placeholder="https://example.com"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="showPopup"
                    checked={newAd.showPopup}
                    onCheckedChange={(checked) => setNewAd(prev => ({ ...prev, showPopup: checked }))}
                  />
                  <Label htmlFor="showPopup">Show detailed popup on click</Label>
                </div>

                {newAd.showPopup && (
                  <>
                    <div>
                      <Label htmlFor="detailedInfo">Detailed Information</Label>
                      <Textarea
                        id="detailedInfo"
                        value={newAd.detailedInfo}
                        onChange={(e) => setNewAd(prev => ({ ...prev, detailedInfo: e.target.value }))}
                        placeholder="Enter detailed information that will appear in the popup..."
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="bannerImage">Banner Image URL (468x60)</Label>
                        <Input
                          id="bannerImage"
                          value={newAd.bannerImage}
                          onChange={(e) => setNewAd(prev => ({ ...prev, bannerImage: e.target.value }))}
                          placeholder="https://example.com/banner.jpg"
                        />
                      </div>
                      <div>
                        <Label htmlFor="bannerUrl">Banner Click URL</Label>
                        <Input
                          id="bannerUrl"
                          value={newAd.bannerUrl}
                          onChange={(e) => setNewAd(prev => ({ ...prev, bannerUrl: e.target.value }))}
                          placeholder="https://example.com"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="datetime-local"
                      value={newAd.startDate}
                      onChange={(e) => setNewAd(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date (Optional)</Label>
                    <Input
                      id="endDate"
                      type="datetime-local"
                      value={newAd.endDate}
                      onChange={(e) => setNewAd(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>

                <Button onClick={handleCreateAd} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Ad
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ad Networks Configuration</CardTitle>
                <CardDescription>Manage your advertising networks and publisher codes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {adNetworks.map(network => (
                    <div key={network.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{network.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Revenue: ${network.revenue} • {network.domain}
                          </p>
                        </div>
                        <Switch
                          checked={network.enabled}
                          onCheckedChange={() => toggleAdNetwork(network.id)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Label className="text-xs">Publisher ID / Ad Code</Label>
                          <Input
                            placeholder="Enter your publisher ID or ad code"
                            value={network.publisherId}
                            onChange={(e) => updateNetworkCode(network.id, e.target.value)}
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Add New Ad Network</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="Network Name"
                      value={newNetwork.name}
                      onChange={(e) => setNewNetwork(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <Input
                      placeholder="Domain (e.g. google.com)"
                      value={newNetwork.domain}
                      onChange={(e) => setNewNetwork(prev => ({ ...prev, domain: e.target.value }))}
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder="Publisher ID"
                        value={newNetwork.publisherId}
                        onChange={(e) => setNewNetwork(prev => ({ ...prev, publisherId: e.target.value }))}
                      />
                      <Button onClick={addAdNetwork} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">Ads.txt File</h4>
                      <p className="text-sm text-muted-foreground">
                        Accessible at: <code>/ads.txt</code>
                      </p>
                    </div>
                    <Dialog open={showAdsTxtEditor} onOpenChange={setShowAdsTxtEditor}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Ads.txt
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Edit Ads.txt File</DialogTitle>
                          <DialogDescription>
                            Configure your ads.txt file for ad network verification
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Textarea
                            value={adsTxtContent}
                            onChange={(e) => setAdsTxtContent(e.target.value)}
                            className="min-h-[300px] font-mono text-sm"
                            placeholder="# ads.txt content..."
                          />
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowAdsTxtEditor(false)}>
                            Cancel
                          </Button>
                          <Button onClick={saveAdsTxt}>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage registered users and their permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">User management features coming soon...</p>
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
              <CardDescription>Configure games and monitor activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Game analytics and management coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;