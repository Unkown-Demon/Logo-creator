import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Upload, Play, Download, Wand2, Sparkles, Settings } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function VideoEditor() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Effects state
  const [effectType, setEffectType] = useState("blur");
  const [blurAmount, setBlurAmount] = useState([15]);
  const [brightness, setBrightness] = useState([1]);
  const [contrast, setContrast] = useState([1]);
  const [rotation, setRotation] = useState([0]);

  // Export settings
  const [exportFormat, setExportFormat] = useState("mp4");
  const [exportQuality, setExportQuality] = useState("high");
  const [exportWidth, setExportWidth] = useState("1920");
  const [exportHeight, setExportHeight] = useState("1080");

  // GIF settings
  const [gifFps, setGifFps] = useState("10");
  const [gifDuration, setGifDuration] = useState("5");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const preview = URL.createObjectURL(file);
      setVideoPreview(preview);
      toast.success("Video yuklandi!");
    }
  };

  const handleRemoveBackground = async () => {
    if (!selectedFile) {
      toast.error("Iltimos, video tanlang");
      return;
    }

    setIsProcessing(true);
    try {
      // Fayl S3 ga yuklash kerak bo'ladi
      toast.success("Fonni olib tashlash jarayoni boshlanmoqda...");
      // API call here
    } catch (error) {
      toast.error("Xato: Fonni olib tashlashda muammo");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyEffect = async () => {
    if (!selectedFile) {
      toast.error("Iltimos, video tanlang");
      return;
    }

    setIsProcessing(true);
    try {
      toast.success("Effekt qo'shilmoqda...");
      // API call here
    } catch (error) {
      toast.error("Xato: Effektni qo'shishda muammo");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateGIF = async () => {
    if (!selectedFile) {
      toast.error("Iltimos, video tanlang");
      return;
    }

    setIsProcessing(true);
    try {
      toast.success("GIF yaratilmoqda...");
      // API call here
    } catch (error) {
      toast.error("Xato: GIF yaratishda muammo");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = async () => {
    if (!selectedFile) {
      toast.error("Iltimos, video tanlang");
      return;
    }

    setIsProcessing(true);
    try {
      toast.success("Video eksport qilinmoqda...");
      // API call here
    } catch (error) {
      toast.error("Xato: Video eksportda muammo");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Video Upload Section */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Video Yuklash
          </CardTitle>
          <CardDescription>MP4, GIF, WebM va boshqa formatlarni qo'llab-quvvatlaydi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div 
              className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500 transition"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-2" />
              <p className="text-white font-medium">Video tanlang yoki shu yerga tashlang</p>
              <p className="text-slate-400 text-sm">MP4, GIF, WebM, AVI</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,.gif"
              onChange={handleFileSelect}
              className="hidden"
            />
            {selectedFile && (
              <div className="bg-slate-700 p-4 rounded-lg">
                <p className="text-white text-sm">
                  <span className="font-medium">Tanlangan fayl:</span> {selectedFile.name}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Video Preview */}
      {videoPreview && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Video Ko'rish</CardTitle>
          </CardHeader>
          <CardContent>
            <video
              src={videoPreview}
              controls
              className="w-full rounded-lg bg-black"
              style={{ maxHeight: "400px" }}
            />
          </CardContent>
        </Card>
      )}

      {/* Editor Tools */}
      <Tabs defaultValue="effects" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800 border border-slate-700">
          <TabsTrigger value="effects" className="data-[state=active]:bg-purple-600">
            <Sparkles className="w-4 h-4 mr-2" />
            Effektlar
          </TabsTrigger>
          <TabsTrigger value="background" className="data-[state=active]:bg-purple-600">
            <Wand2 className="w-4 h-4 mr-2" />
            Fon
          </TabsTrigger>
          <TabsTrigger value="gif" className="data-[state=active]:bg-purple-600">
            GIF
          </TabsTrigger>
          <TabsTrigger value="export" className="data-[state=active]:bg-purple-600">
            <Download className="w-4 h-4 mr-2" />
            Eksport
          </TabsTrigger>
        </TabsList>

        {/* Effects Tab */}
        <TabsContent value="effects" className="mt-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Video Effektlari</CardTitle>
              <CardDescription>Turli effektlarni qo'shish va sozlash</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-white mb-2 block">Effekt Turi</Label>
                <Select value={effectType} onValueChange={setEffectType}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="blur">Blur (Bulanish)</SelectItem>
                    <SelectItem value="grayscale">Qora-Oq</SelectItem>
                    <SelectItem value="edge">Chetlarni Aniqlash</SelectItem>
                    <SelectItem value="brightness">Yorug'lik</SelectItem>
                    <SelectItem value="rotation">Aylantiirsh</SelectItem>
                    <SelectItem value="flip">Aks Ettirish</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {effectType === "blur" && (
                <div>
                  <Label className="text-white mb-2 block">Blur Miqdori: {blurAmount[0]}</Label>
                  <Slider
                    value={blurAmount}
                    onValueChange={setBlurAmount}
                    min={1}
                    max={50}
                    step={1}
                    className="w-full"
                  />
                </div>
              )}

              {effectType === "brightness" && (
                <>
                  <div>
                    <Label className="text-white mb-2 block">Yorug'lik: {brightness[0].toFixed(2)}</Label>
                    <Slider
                      value={brightness}
                      onValueChange={setBrightness}
                      min={0.5}
                      max={2}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label className="text-white mb-2 block">Kontrast: {contrast[0].toFixed(2)}</Label>
                    <Slider
                      value={contrast}
                      onValueChange={setContrast}
                      min={0.5}
                      max={2}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                </>
              )}

              {effectType === "rotation" && (
                <div>
                  <Label className="text-white mb-2 block">Aylantiirsh Burchagi: {rotation[0]}°</Label>
                  <Slider
                    value={rotation}
                    onValueChange={setRotation}
                    min={0}
                    max={360}
                    step={1}
                    className="w-full"
                  />
                </div>
              )}

              <Button
                onClick={handleApplyEffect}
                disabled={isProcessing || !selectedFile}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isProcessing ? "Jarayonda..." : "Effektni Qo'shish"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Background Removal Tab */}
        <TabsContent value="background" className="mt-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Fonni Olib Tashlash</CardTitle>
              <CardDescription>AI yordamida video fonini avtomatik olib tashlash</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 mb-4">
                Bu jarayon video fon qismini aniq olib tashlaydi va shaffof fon qo'yadi.
              </p>
              <Button
                onClick={handleRemoveBackground}
                disabled={isProcessing || !selectedFile}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isProcessing ? "Jarayonda..." : "Fonni Olib Tashlash"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* GIF Creation Tab */}
        <TabsContent value="gif" className="mt-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">GIF Yaratish</CardTitle>
              <CardDescription>Videodan GIF animatsiya yaratish</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white mb-2 block">FPS (Frames Per Second): {gifFps}</Label>
                <Input
                  type="number"
                  value={gifFps}
                  onChange={(e) => setGifFps(e.target.value)}
                  min="5"
                  max="30"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label className="text-white mb-2 block">Davomiyligi (soniya): {gifDuration}</Label>
                <Input
                  type="number"
                  value={gifDuration}
                  onChange={(e) => setGifDuration(e.target.value)}
                  min="1"
                  max="60"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <Button
                onClick={handleCreateGIF}
                disabled={isProcessing || !selectedFile}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isProcessing ? "Jarayonda..." : "GIF Yaratish"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="mt-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Video Eksport</CardTitle>
              <CardDescription>Video faylni turli formatlarda va sifatda eksport qilish</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white mb-2 block">Format</Label>
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="mp4">MP4</SelectItem>
                    <SelectItem value="webm">WebM</SelectItem>
                    <SelectItem value="avi">AVI</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white mb-2 block">Sifat</Label>
                <Select value={exportQuality} onValueChange={setExportQuality}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="low">Kam (480p)</SelectItem>
                    <SelectItem value="medium">O'rta (720p)</SelectItem>
                    <SelectItem value="high">Yuqori (1080p)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white mb-2 block">Kenglik (px)</Label>
                  <Input
                    type="number"
                    value={exportWidth}
                    onChange={(e) => setExportWidth(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white mb-2 block">Balandlik (px)</Label>
                  <Input
                    type="number"
                    value={exportHeight}
                    onChange={(e) => setExportHeight(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              <Button
                onClick={handleExport}
                disabled={isProcessing || !selectedFile}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isProcessing ? "Jarayonda..." : "Eksport Qilish"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
