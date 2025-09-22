import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Plus,
  Edit,
  Trash2,
  Eye,
  Save,
  BarChart3
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Ad {
  id: string;
  title: string;
  content: string;
  detailed_info?: string | null;
  position: string;
  target_url?: string | null;
  banner_image?: string | null;
  banner_url?: string | null;
  show_popup?: boolean;
  is_active: boolean;
  priority?: number;
  start_date?: string | null;
  end_date?: string | null;
  clicks_count: number;
  impressions_count: number;
  created_at: string;
}

const AdsManagement = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const [newAd, setNewAd] = useState({
    title: "",
    content: "",
    detailed_info: "",
    position: "top",
    target_url: "",
    banner_image: "",
    banner_url: "",
    show_popup: false,
    priority: 1,
    start_date: "",
    end_date: ""
  });

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching ads:', error);
        toast({
          title: "Error",
          description: "Failed to load ads",
          variant: "destructive"
        });
        return;
      }

      setAds(data || []);
    } catch (error) {
      console.error('Error in fetchAds:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAd = async () => {
    if (!newAd.title || !newAd.content) {
      toast({
        title: "Missing fields",
        description: "Please fill in title and content",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('ads')
        .insert([{
          title: newAd.title,
          content: newAd.content,
          detailed_info: newAd.detailed_info || null,
          ad_type: 'banner',
          position: newAd.position,
          target_url: newAd.target_url || null,
          banner_image: newAd.banner_image || null,
          banner_url: newAd.banner_url || null,
          show_popup: newAd.show_popup,
          priority: newAd.priority,
          start_date: newAd.start_date ? new Date(newAd.start_date).toISOString() : null,
          end_date: newAd.end_date ? new Date(newAd.end_date).toISOString() : null,
          is_active: true,
          created_by: (await supabase.auth.getUser()).data.user?.id || '00000000-0000-0000-0000-000000000000'
        }]);

      if (error) {
        console.error('Error creating ad:', error);
        toast({
          title: "Error",
          description: "Failed to create ad",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Ad created successfully",
        description: "Your ad is now active",
      });

      // Reset form and refresh
      setNewAd({
        title: "",
        content: "",
        detailed_info: "",
        position: "top",
        target_url: "",
        banner_image: "",
        banner_url: "",
        show_popup: false,
        priority: 1,
        start_date: "",
        end_date: ""
      });
      setShowCreateDialog(false);
      fetchAds();
    } catch (error) {
      console.error('Error in handleCreateAd:', error);
    }
  };

  const handleEditAd = async () => {
    if (!editingAd || !editingAd.title || !editingAd.content) {
      toast({
        title: "Missing fields",
        description: "Please fill in title and content",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('ads')
        .update({
          title: editingAd.title,
          content: editingAd.content,
          detailed_info: editingAd.detailed_info,
          ad_type: 'banner',
          position: editingAd.position,
          target_url: editingAd.target_url,
          banner_image: editingAd.banner_image,
          banner_url: editingAd.banner_url,
          show_popup: editingAd.show_popup,
          priority: editingAd.priority,
          start_date: editingAd.start_date ? new Date(editingAd.start_date).toISOString() : null,
          end_date: editingAd.end_date ? new Date(editingAd.end_date).toISOString() : null
        })
        .eq('id', editingAd.id);

      if (error) {
        console.error('Error updating ad:', error);
        toast({
          title: "Error",
          description: "Failed to update ad",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Ad updated successfully",
        description: "Changes saved",
      });

      setEditingAd(null);
      fetchAds();
    } catch (error) {
      console.error('Error in handleEditAd:', error);
    }
  };

  const toggleAdStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('ads')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) {
        console.error('Error toggling ad status:', error);
        toast({
          title: "Error",
          description: "Failed to update ad status",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Ad status updated",
        description: `Ad ${!currentStatus ? 'activated' : 'deactivated'}`,
      });

      fetchAds();
    } catch (error) {
      console.error('Error in toggleAdStatus:', error);
    }
  };

  const deleteAd = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ads')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting ad:', error);
        toast({
          title: "Error",
          description: "Failed to delete ad",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Ad deleted",
        description: "Ad removed successfully",
      });

      fetchAds();
    } catch (error) {
      console.error('Error in deleteAd:', error);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return <div className="text-center py-6">Loading ads...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Ads Management</h2>
          <p className="text-muted-foreground">Create, edit, and manage your advertisements</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Ad
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Ad</DialogTitle>
              <DialogDescription>Configure and deploy a new advertisement</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
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
                  placeholder="Enter ad content"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="targetUrl">Target URL (Optional)</Label>
                <Input
                  id="targetUrl"
                  value={newAd.target_url}
                  onChange={(e) => setNewAd(prev => ({ ...prev, target_url: e.target.value }))}
                  placeholder="https://example.com"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="showPopup"
                  checked={newAd.show_popup}
                  onCheckedChange={(checked) => setNewAd(prev => ({ ...prev, show_popup: checked }))}
                />
                <Label htmlFor="showPopup">Show detailed popup on click</Label>
              </div>

              {newAd.show_popup && (
                <>
                  <div>
                    <Label htmlFor="detailedInfo">Detailed Information</Label>
                    <Textarea
                      id="detailedInfo"
                      value={newAd.detailed_info}
                      onChange={(e) => setNewAd(prev => ({ ...prev, detailed_info: e.target.value }))}
                      placeholder="Enter detailed information for the popup..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bannerImage">Banner Image URL (468x60)</Label>
                      <Input
                        id="bannerImage"
                        value={newAd.banner_image}
                        onChange={(e) => setNewAd(prev => ({ ...prev, banner_image: e.target.value }))}
                        placeholder="https://example.com/banner.jpg"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bannerUrl">Banner Click URL</Label>
                      <Input
                        id="bannerUrl"
                        value={newAd.banner_url}
                        onChange={(e) => setNewAd(prev => ({ ...prev, banner_url: e.target.value }))}
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={newAd.priority}
                    onChange={(e) => setNewAd(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
                    placeholder="1"
                    min="1"
                  />
                </div>
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={newAd.start_date}
                    onChange={(e) => setNewAd(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={newAd.end_date}
                    onChange={(e) => setNewAd(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateAd}>
                <Save className="h-4 w-4 mr-2" />
                Create Ad
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Ads List */}
      <div className="grid gap-4">
        {ads.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground mb-4">No ads created yet</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Ad
              </Button>
            </CardContent>
          </Card>
        ) : (
          ads.map((ad) => (
            <Card key={ad.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{ad.title}</h3>
                      <Badge variant={ad.is_active ? "default" : "secondary"}>
                        {ad.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline">{ad.position}</Badge>
                      {ad.show_popup && (
                        <Badge variant="outline">Popup Enabled</Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4">
                      {ad.content}
                    </p>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Clicks:</span> {ad.clicks_count}
                      </div>
                      <div>
                        <span className="font-medium">Impressions:</span> {ad.impressions_count}
                      </div>
                      <div>
                        <span className="font-medium">Start Date:</span> {formatDate(ad.start_date)}
                      </div>
                      <div>
                        <span className="font-medium">End Date:</span> {formatDate(ad.end_date)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Switch
                      checked={ad.is_active}
                      onCheckedChange={() => toggleAdStatus(ad.id, ad.is_active)}
                    />
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingAd(ad)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Ad</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{ad.title}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteAd(ad.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingAd} onOpenChange={() => setEditingAd(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Ad</DialogTitle>
            <DialogDescription>Update advertisement details</DialogDescription>
          </DialogHeader>
          
          {editingAd && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-title">Ad Title</Label>
                  <Input
                    id="edit-title"
                    value={editingAd.title}
                    onChange={(e) => setEditingAd(prev => prev ? { ...prev, title: e.target.value } : null)}
                    placeholder="Enter ad title"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-position">Position</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={editingAd.position}
                    onChange={(e) => setEditingAd(prev => prev ? { ...prev, position: e.target.value } : null)}
                  >
                    <option value="top">Top Banner</option>
                    <option value="sidebar">Sidebar</option>
                    <option value="bottom">Bottom Banner</option>
                    <option value="popup">Popup</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="edit-content">Ad Content</Label>
                <Textarea
                  id="edit-content"
                  value={editingAd.content}
                  onChange={(e) => setEditingAd(prev => prev ? { ...prev, content: e.target.value } : null)}
                  placeholder="Enter ad content"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="edit-targetUrl">Target URL</Label>
                <Input
                  id="edit-targetUrl"
                  value={editingAd.target_url || ""}
                  onChange={(e) => setEditingAd(prev => prev ? { ...prev, target_url: e.target.value } : null)}
                  placeholder="https://example.com"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-showPopup"
                  checked={editingAd.show_popup || false}
                  onCheckedChange={(checked) => setEditingAd(prev => prev ? { ...prev, show_popup: checked } : null)}
                />
                <Label htmlFor="edit-showPopup">Show detailed popup on click</Label>
              </div>

              {editingAd.show_popup && (
                <>
                  <div>
                    <Label htmlFor="edit-detailedInfo">Detailed Information</Label>
                    <Textarea
                      id="edit-detailedInfo"
                      value={editingAd.detailed_info || ""}
                      onChange={(e) => setEditingAd(prev => prev ? { ...prev, detailed_info: e.target.value } : null)}
                      placeholder="Enter detailed information for the popup..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-bannerImage">Banner Image URL (468x60)</Label>
                      <Input
                        id="edit-bannerImage"
                        value={editingAd.banner_image || ""}
                        onChange={(e) => setEditingAd(prev => prev ? { ...prev, banner_image: e.target.value } : null)}
                        placeholder="https://example.com/banner.jpg"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-bannerUrl">Banner Click URL</Label>
                      <Input
                        id="edit-bannerUrl"
                        value={editingAd.banner_url || ""}
                        onChange={(e) => setEditingAd(prev => prev ? { ...prev, banner_url: e.target.value } : null)}
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAd(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditAd}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdsManagement;