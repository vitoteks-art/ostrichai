import { BookingLayout } from "@/components/BookingLayout";
import { useBooking } from "@/contexts/BookingContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Calendar, Plus, Edit, Trash2, Copy } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { MeetingType } from "@/types/booking";

export default function BookingMeetingTypes() {
  const { meetingTypes, addMeetingType, updateMeetingType, deleteMeetingType } = useBooking();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMeetingType, setEditingMeetingType] = useState<MeetingType | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    duration: 30,
    description: "",
    location: "",
    color: "#0069FF",
    active: true,
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      duration: 30,
      description: "",
      location: "",
      color: "#0069FF",
      active: true,
    });
    setEditingMeetingType(null);
  };

  const handleAdd = () => {
    if (!formData.name || !formData.description) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const newMeetingType: MeetingType = {
      id: Date.now().toString(),
      ...formData,
    };

    addMeetingType(newMeetingType);
    toast({
      title: "Meeting Type Added",
      description: `${formData.name} has been created successfully.`,
    });
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEdit = (meetingType: MeetingType) => {
    setEditingMeetingType(meetingType);
    setFormData({
      name: meetingType.name,
      duration: meetingType.duration,
      description: meetingType.description,
      location: meetingType.location,
      color: meetingType.color,
      active: meetingType.active,
    });
  };

  const handleUpdate = () => {
    if (!editingMeetingType) return;

    if (!formData.name || !formData.description) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    updateMeetingType(editingMeetingType.id, formData);
    toast({
      title: "Meeting Type Updated",
      description: `${formData.name} has been updated successfully.`,
    });
    resetForm();
  };

  const handleDelete = (id: string, name: string) => {
    deleteMeetingType(id);
    toast({
      title: "Meeting Type Deleted",
      description: `${name} has been removed.`,
    });
  };

  const handleToggleActive = (id: string, active: boolean) => {
    updateMeetingType(id, { active });
    toast({
      title: active ? "Meeting Type Activated" : "Meeting Type Deactivated",
      description: active
        ? "This meeting type is now available for booking."
        : "This meeting type is no longer available for booking.",
    });
  };

  const handleCopyLink = async (meetingType: MeetingType) => {
    const link = `${window.location.origin}/book?type=${meetingType.id}`;
    try {
      await navigator.clipboard.writeText(link);
      toast({
        title: "Link Copied!",
        description: `Direct link for "${meetingType.name}" has been copied to your clipboard.`,
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy the link. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <BookingLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Meeting Types</h1>
            <p className="text-muted-foreground mt-2">
              Create and manage different types of meetings
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Meeting Type
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Create Meeting Type</DialogTitle>
                <DialogDescription>
                  Add a new meeting type that clients can book.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Meeting Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="e.g., 30-min Consultation"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => handleInputChange("duration", parseInt(e.target.value))}
                    min="5"
                    step="5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Describe what this meeting is about"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="e.g., Google Meet, Zoom, Phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => handleInputChange("color", e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => handleInputChange("active", checked)}
                  />
                  <Label htmlFor="active">Active (available for booking)</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAdd}>Create Meeting Type</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {meetingTypes.map((mt) => (
            <Card key={mt.id} className="relative">
              <div
                className="absolute top-0 left-0 right-0 h-2 rounded-t-lg"
                style={{ backgroundColor: mt.color }}
              />
              <CardHeader className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center space-x-2">
                      <span>{mt.name}</span>
                      {mt.active ? (
                        <Badge className="bg-green-500">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-2">{mt.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-medium">{mt.duration} minutes</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium">{mt.location}</span>
                  </div>
                  <div className="flex items-center space-x-2 pt-4">
                    <Switch
                      checked={mt.active}
                      onCheckedChange={(checked) => handleToggleActive(mt.id, checked)}
                    />
                    <span className="text-sm text-muted-foreground">
                      {mt.active ? "Available for booking" : "Not available"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyLink(mt)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </Button>
                    <Dialog
                      open={editingMeetingType?.id === mt.id}
                      onOpenChange={(open) => {
                        if (!open) resetForm();
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(mt)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[525px]">
                        <DialogHeader>
                          <DialogTitle>Edit Meeting Type</DialogTitle>
                          <DialogDescription>
                            Update the details of this meeting type.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-name">Meeting Name *</Label>
                            <Input
                              id="edit-name"
                              value={formData.name}
                              onChange={(e) => handleInputChange("name", e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-duration">Duration (minutes) *</Label>
                            <Input
                              id="edit-duration"
                              type="number"
                              value={formData.duration}
                              onChange={(e) =>
                                handleInputChange("duration", parseInt(e.target.value))
                              }
                              min="5"
                              step="5"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-description">Description *</Label>
                            <Textarea
                              id="edit-description"
                              value={formData.description}
                              onChange={(e) => handleInputChange("description", e.target.value)}
                              rows={3}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-location">Location *</Label>
                            <Input
                              id="edit-location"
                              value={formData.location}
                              onChange={(e) => handleInputChange("location", e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-color">Color</Label>
                            <Input
                              id="edit-color"
                              type="color"
                              value={formData.color}
                              onChange={(e) => handleInputChange("color", e.target.value)}
                              className="h-10"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="edit-active"
                              checked={formData.active}
                              onCheckedChange={(checked) => handleInputChange("active", checked)}
                            />
                            <Label htmlFor="edit-active">Active (available for booking)</Label>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={resetForm}>
                            Cancel
                          </Button>
                          <Button onClick={handleUpdate}>Update Meeting Type</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Meeting Type?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{mt.name}"? This action cannot be
                            undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(mt.id, mt.name)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {meetingTypes.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No meeting types created yet</p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Meeting Type
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </BookingLayout>
  );
}
