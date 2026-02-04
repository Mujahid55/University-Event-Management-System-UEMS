import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileText, Plus, Edit, Trash2, Copy } from "lucide-react";

export default function Templates() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [expectedAttendees, setExpectedAttendees] = useState("");
  const [riskNotes, setRiskNotes] = useState("");

  useEffect(() => {
    if (profile?.role !== "officer" && profile?.role !== "sponsor") {
      navigate("/dashboard");
      return;
    }
    loadTemplates();
  }, [profile, navigate]);

  const loadTemplates = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("event_templates")
      .select("*")
      .eq("club_id", profile?.club_id)
      .order("name");
    
    if (data) setTemplates(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const templateData = {
      name: name.trim(),
      title: title.trim(),
      description: description.trim(),
      category: category.trim() || null,
      expected_attendees: parseInt(expectedAttendees),
      risk_notes: riskNotes.trim() || null,
      club_id: profile?.club_id,
      created_by: profile?.id,
    };

    if (editingTemplate) {
      const { error } = await supabase
        .from("event_templates")
        .update(templateData)
        .eq("id", editingTemplate.id);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Template updated!" });
        resetForm();
        setDialogOpen(false);
        loadTemplates();
      }
    } else {
      const { error } = await supabase
        .from("event_templates")
        .insert(templateData);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Template created!" });
        resetForm();
        setDialogOpen(false);
        loadTemplates();
      }
    }
  };

  const handleEdit = (template: any) => {
    setEditingTemplate(template);
    setName(template.name);
    setTitle(template.title);
    setDescription(template.description);
    setCategory(template.category || "");
    setExpectedAttendees(template.expected_attendees.toString());
    setRiskNotes(template.risk_notes || "");
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template?")) return;

    const { error } = await supabase
      .from("event_templates")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Template deleted!" });
      loadTemplates();
    }
  };

  const handleUseTemplate = (template: any) => {
    navigate("/events/new", { state: { template } });
  };

  const resetForm = () => {
    setEditingTemplate(null);
    setName("");
    setTitle("");
    setDescription("");
    setCategory("");
    setExpectedAttendees("");
    setRiskNotes("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Event Templates</h1>
              <p className="text-muted-foreground">Save time with reusable event templates</p>
            </div>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingTemplate ? "Edit Template" : "Create Template"}</DialogTitle>
                <DialogDescription>
                  {editingTemplate ? "Update template details" : "Save event details as a template"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Weekly Meeting, Workshop, etc."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="Workshop, Meeting, Social"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="attendees">Expected Attendees *</Label>
                    <Input
                      id="attendees"
                      type="number"
                      min="1"
                      value={expectedAttendees}
                      onChange={(e) => setExpectedAttendees(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="risk">Risk Notes</Label>
                  <Textarea
                    id="risk"
                    value={riskNotes}
                    onChange={(e) => setRiskNotes(e.target.value)}
                    rows={2}
                    placeholder="Any safety or risk considerations"
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingTemplate ? "Update Template" : "Create Template"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Templates</CardTitle>
            <CardDescription>{templates.length} templates saved</CardDescription>
          </CardHeader>
          <CardContent>
            {templates.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Attendees</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>{template.title}</TableCell>
                      <TableCell>{template.category || "-"}</TableCell>
                      <TableCell>{template.expected_attendees}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleUseTemplate(template)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(template)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(template.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No templates yet. Create your first template to save time on recurring events!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
