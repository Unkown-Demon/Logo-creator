import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Download, Plus, FolderOpen } from "lucide-react";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
}

export default function ProjectManager() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      toast.error("Loyiha nomini kiriting");
      return;
    }

    setIsCreating(true);
    try {
      // API call here
      const newProject: Project = {
        id: `project-${Date.now()}`,
        name: newProjectName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setProjects([...projects, newProject]);
      setNewProjectName("");
      toast.success("Loyiha muvaffaqiyatli yaratildi!");
    } catch (error) {
      toast.error("Xato: Loyihani yaratishda muammo");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProject = (id: string) => {
    if (confirm("Siz bu loyihani o'chirishni xohlaysizmi?")) {
      setProjects(projects.filter((p) => p.id !== id));
      toast.success("Loyiha o'chirildi");
    }
  };

  const handleDownloadProject = (id: string) => {
    toast.success("Loyiha yuklanmoqda...");
    // API call here
  };

  return (
    <div className="space-y-8">
      {/* Create New Project */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Yangi Loyiha Yaratish
          </CardTitle>
          <CardDescription>Yangi video tahrirlash loyihasi yaratish</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="text-white mb-2 block">Loyiha Nomi</Label>
              <Input
                type="text"
                placeholder="Masalan: Mening Videom"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
              />
            </div>
            <Button
              onClick={handleCreateProject}
              disabled={isCreating || !newProjectName.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isCreating ? "Yaratilmoqda..." : "Loyiha Yaratish"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Projects List */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            Mening Loyihalarim
          </CardTitle>
          <CardDescription>
            {projects.length === 0
              ? "Hali loyiha yaratilmagan"
              : `Jami ${projects.length} ta loyiha`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Hali loyiha yaratilmagan</p>
              <p className="text-slate-500 text-sm">Yuqorida "Yangi Loyiha Yaratish" tugmasini bosing</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-slate-700 rounded-lg p-4 border border-slate-600 hover:border-purple-500 transition"
                >
                  <div className="aspect-video bg-slate-600 rounded mb-4 flex items-center justify-center">
                    {project.thumbnail ? (
                      <img
                        src={project.thumbnail}
                        alt={project.name}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <FolderOpen className="w-8 h-8 text-slate-500" />
                    )}
                  </div>
                  <h3 className="text-white font-medium mb-2">{project.name}</h3>
                  <p className="text-slate-400 text-sm mb-4">
                    {new Date(project.createdAt).toLocaleDateString("uz-UZ")}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleDownloadProject(project.id)}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-600"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Yuklash
                    </Button>
                    <Button
                      onClick={() => handleDeleteProject(project.id)}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-red-600 text-red-400 hover:bg-red-950"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      O'chirish
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
