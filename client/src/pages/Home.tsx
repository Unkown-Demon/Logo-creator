import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Wand2, Download, Film, Sparkles, Settings } from "lucide-react";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { useState } from "react";
import { Streamdown } from 'streamdown';
import VideoEditor from "@/pages/VideoEditor";
import ProjectManager from "@/pages/ProjectManager";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("editor");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Navigation */}
        <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Film className="w-8 h-8 text-purple-500" />
              <span className="text-xl font-bold text-white">{APP_TITLE}</span>
            </div>
            <Button onClick={() => window.location.href = getLoginUrl()} className="bg-purple-600 hover:bg-purple-700">
              Kirish
            </Button>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold text-white mb-6">
                Video va GIF Tahrirlashni Oson Qiling
              </h1>
              <p className="text-xl text-slate-300 mb-8">
                Fonni olib tashlash, animatsiya, effektlar va boshqa ko'plab imkoniyatlar bilan professional videolar yarating.
              </p>
              <Button 
                onClick={() => window.location.href = getLoginUrl()}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg"
              >
                Boshla
              </Button>
            </div>
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg p-8 border border-purple-500/30">
              <div className="aspect-video bg-slate-800 rounded-lg flex items-center justify-center">
                <Film className="w-24 h-24 text-purple-400 opacity-50" />
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-slate-800/50 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-white text-center mb-12">Asosiy Xususiyatlar</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader>
                  <Wand2 className="w-8 h-8 text-purple-500 mb-2" />
                  <CardTitle className="text-white">Fonni Olib Tashlash</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300">AI yordamida video va rasmlardan fonni avtomatik olib tashlash</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-700">
                <CardHeader>
                  <Sparkles className="w-8 h-8 text-purple-500 mb-2" />
                  <CardTitle className="text-white">Effektlar va Animatsiyalar</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300">Blur, grayscale, rotation, zoom va boshqa effektlarni qo'shish</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-700">
                <CardHeader>
                  <Download className="w-8 h-8 text-purple-500 mb-2" />
                  <CardTitle className="text-white">Turli Formatlar</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300">MP4, GIF, WebM va boshqa formatlarda HD sifatida eksport qilish</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated view
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Film className="w-8 h-8 text-purple-500" />
            <span className="text-xl font-bold text-white">{APP_TITLE}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-300">{user?.name || user?.email}</span>
            <Button 
              onClick={logout}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Chiqish
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800 border border-slate-700">
            <TabsTrigger value="editor" className="data-[state=active]:bg-purple-600">
              <Film className="w-4 h-4 mr-2" />
              Video Tahrirlash
            </TabsTrigger>
            <TabsTrigger value="projects" className="data-[state=active]:bg-purple-600">
              <Settings className="w-4 h-4 mr-2" />
              Loyihalar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="mt-8">
            <VideoEditor />
          </TabsContent>

          <TabsContent value="projects" className="mt-8">
            <ProjectManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
