"""
Video va GIF tahrirlash uchun Python backend API
Fonni olib tashlash, effektlar, animatsiyalar va eksport funksiyalari
"""

import os
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import imageio
from pathlib import Path
from typing import Optional, List, Dict, Tuple
import tempfile
import subprocess
from rembg import remove
import io

class VideoProcessor:
    """Video va GIF tahrirlash uchun asosiy sinf"""
    
    def __init__(self, temp_dir: str = None):
        self.temp_dir = temp_dir or tempfile.gettempdir()
        self.supported_formats = ['.mp4', '.avi', '.mov', '.mkv', '.gif', '.webm']
        
    def load_video(self, file_path: str) -> Optional[cv2.VideoCapture]:
        """Video faylini yuklash"""
        if not os.path.exists(file_path):
            return None
        
        cap = cv2.VideoCapture(file_path)
        if not cap.isOpened():
            return None
        return cap
    
    def get_video_info(self, file_path: str) -> Dict:
        """Video haqida ma'lumot olish"""
        cap = self.load_video(file_path)
        if cap is None:
            return {}
        
        info = {
            'fps': cap.get(cv2.CAP_PROP_FPS),
            'width': int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
            'height': int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)),
            'total_frames': int(cap.get(cv2.CAP_PROP_FRAME_COUNT)),
            'duration': int(cap.get(cv2.CAP_PROP_FRAME_COUNT) / cap.get(cv2.CAP_PROP_FPS))
        }
        cap.release()
        return info
    
    def remove_background(self, image_path: str, output_path: str) -> bool:
        """AI yordamida fonni olib tashlash (rembg kutubxonasi)"""
        try:
            with open(image_path, 'rb') as i:
                with open(output_path, 'wb') as o:
                    input_data = i.read()
                    output_data = remove(input_data)
                    o.write(output_data)
            return True
        except Exception as e:
            print(f"Fonni olib tashlashda xato: {e}")
            return False
    
    def remove_background_from_video(self, video_path: str, output_path: str, 
                                     sample_rate: int = 5) -> bool:
        """Video dan fonni olib tashlash (har 5-frameda)"""
        try:
            cap = self.load_video(video_path)
            if cap is None:
                return False
            
            fps = cap.get(cv2.CAP_PROP_FPS)
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
            
            frame_count = 0
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                if frame_count % sample_rate == 0:
                    # Frameni PNG ga o'tkazish
                    _, buffer = cv2.imencode('.png', frame)
                    
                    # rembg yordamida fonni olib tashlash
                    output_buffer = remove(buffer.tobytes())
                    
                    # Natijani qayta o'qish
                    nparr = np.frombuffer(output_buffer, np.uint8)
                    frame = cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)
                    
                    # RGBA dan BGR ga o'tkazish (agar kerak bo'lsa)
                    if frame.shape[2] == 4:
                        frame = cv2.cvtColor(frame, cv2.COLOR_RGBA2BGR)
                
                out.write(frame)
                frame_count += 1
            
            cap.release()
            out.release()
            return True
        except Exception as e:
            print(f"Video dan fonni olib tashlashda xato: {e}")
            return False
    
    def add_text_to_frame(self, frame: np.ndarray, text: str, position: Tuple[int, int],
                         font_size: int = 1, color: Tuple[int, int, int] = (255, 255, 255),
                         thickness: int = 2) -> np.ndarray:
        """Framega matn qo'shish"""
        font = cv2.FONT_HERSHEY_SIMPLEX
        cv2.putText(frame, text, position, font, font_size, color, thickness)
        return frame
    
    def add_shape_to_frame(self, frame: np.ndarray, shape_type: str,
                          position: Tuple[int, int], size: Tuple[int, int],
                          color: Tuple[int, int, int] = (0, 255, 0),
                          thickness: int = 2) -> np.ndarray:
        """Framega shakl qo'shish (to'rtburchak, doira, chiziq)"""
        if shape_type == 'rectangle':
            cv2.rectangle(frame, position, (position[0] + size[0], position[1] + size[1]),
                         color, thickness)
        elif shape_type == 'circle':
            cv2.circle(frame, position, size[0], color, thickness)
        elif shape_type == 'line':
            cv2.line(frame, position, (position[0] + size[0], position[1] + size[1]),
                    color, thickness)
        return frame
    
    def apply_blur_effect(self, frame: np.ndarray, kernel_size: int = 15) -> np.ndarray:
        """Blur effekti qo'shish"""
        return cv2.GaussianBlur(frame, (kernel_size, kernel_size), 0)
    
    def apply_grayscale_effect(self, frame: np.ndarray) -> np.ndarray:
        """Qora-oq effekti qo'shish"""
        return cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    
    def apply_edge_detection(self, frame: np.ndarray, threshold1: int = 100,
                            threshold2: int = 200) -> np.ndarray:
        """Chetlarni aniqlash (Canny edge detection)"""
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, threshold1, threshold2)
        return cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)
    
    def apply_brightness_contrast(self, frame: np.ndarray, brightness: float = 1.0,
                                 contrast: float = 1.0) -> np.ndarray:
        """Yorug'lik va kontrastni o'zgartirish"""
        frame = cv2.convertScaleAbs(frame, alpha=contrast, beta=brightness)
        return frame
    
    def apply_rotation(self, frame: np.ndarray, angle: float) -> np.ndarray:
        """Frameni aylantiirsh"""
        h, w = frame.shape[:2]
        center = (w // 2, h // 2)
        matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
        return cv2.warpAffine(frame, matrix, (w, h))
    
    def apply_flip(self, frame: np.ndarray, direction: str = 'horizontal') -> np.ndarray:
        """Frameni aks ettirish"""
        if direction == 'horizontal':
            return cv2.flip(frame, 1)
        elif direction == 'vertical':
            return cv2.flip(frame, 0)
        return frame
    
    def resize_frame(self, frame: np.ndarray, width: int, height: int) -> np.ndarray:
        """Frameni o'lchamini o'zgartirish"""
        return cv2.resize(frame, (width, height))
    
    def create_gif_from_video(self, video_path: str, output_path: str,
                             fps: int = 10, duration: Optional[float] = None) -> bool:
        """Videodan GIF yaratish"""
        try:
            cap = self.load_video(video_path)
            if cap is None:
                return False
            
            frames = []
            frame_count = 0
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            
            # Agar duration berilgan bo'lsa, frame sonini hisoblash
            if duration:
                video_fps = cap.get(cv2.CAP_PROP_FPS)
                total_frames = int(duration * video_fps)
            
            while frame_count < total_frames:
                ret, frame = cap.read()
                if not ret:
                    break
                
                # BGR dan RGB ga o'tkazish
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                frames.append(frame_rgb)
                frame_count += 1
            
            cap.release()
            
            # GIF yaratish
            imageio.mimsave(output_path, frames, fps=fps, loop=0)
            return True
        except Exception as e:
            print(f"GIF yaratishda xato: {e}")
            return False
    
    def export_video(self, input_path: str, output_path: str,
                    codec: str = 'mp4v', quality: str = 'high',
                    width: Optional[int] = None, height: Optional[int] = None) -> bool:
        """Videoni turli formatlarda eksport qilish"""
        try:
            cap = self.load_video(input_path)
            if cap is None:
                return False
            
            fps = cap.get(cv2.CAP_PROP_FPS)
            orig_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            orig_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            
            # O'lchamni o'zgartirish
            if width and height:
                out_width, out_height = width, height
            else:
                out_width, out_height = orig_width, orig_height
            
            # Kodek tanlash
            if output_path.endswith('.mp4'):
                fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            elif output_path.endswith('.avi'):
                fourcc = cv2.VideoWriter_fourcc(*'XVID')
            elif output_path.endswith('.webm'):
                fourcc = cv2.VideoWriter_fourcc(*'VP90')
            else:
                fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            
            out = cv2.VideoWriter(output_path, fourcc, fps, (out_width, out_height))
            
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                # O'lchamni o'zgartirish
                if (out_width, out_height) != (orig_width, orig_height):
                    frame = cv2.resize(frame, (out_width, out_height))
                
                out.write(frame)
            
            cap.release()
            out.release()
            return True
        except Exception as e:
            print(f"Video eksportda xato: {e}")
            return False
    
    def create_animation_effect(self, image_path: str, output_path: str,
                               effect_type: str = 'zoom', duration: float = 2.0,
                               fps: int = 30) -> bool:
        """Rasmdan animatsiya yaratish"""
        try:
            img = Image.open(image_path)
            frames = []
            num_frames = int(fps * duration)
            
            for i in range(num_frames):
                progress = i / num_frames
                
                if effect_type == 'zoom':
                    scale = 1.0 + (progress * 0.5)
                    new_size = (int(img.width * scale), int(img.height * scale))
                    frame = img.resize(new_size, Image.Resampling.LANCZOS)
                    # Markazga joylash
                    bg = Image.new('RGB', img.size, (255, 255, 255))
                    offset = ((img.width - frame.width) // 2, (img.height - frame.height) // 2)
                    bg.paste(frame, offset)
                    frame = bg
                
                elif effect_type == 'fade':
                    frame = img.copy()
                    frame.putalpha(int(255 * (1 - progress)))
                
                elif effect_type == 'rotate':
                    angle = progress * 360
                    frame = img.rotate(angle, expand=False, fillcolor='white')
                
                frames.append(np.array(frame))
            
            imageio.mimsave(output_path, frames, fps=fps, loop=0)
            return True
        except Exception as e:
            print(f"Animatsiya yaratishda xato: {e}")
            return False
    
    def add_watermark(self, video_path: str, watermark_path: str,
                     output_path: str, position: str = 'bottom-right',
                     opacity: float = 0.7) -> bool:
        """Videoga vatermark qo'shish"""
        try:
            cap = self.load_video(video_path)
            if cap is None:
                return False
            
            watermark = Image.open(watermark_path).convert('RGBA')
            
            fps = cap.get(cv2.CAP_PROP_FPS)
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            
            # Vatermarkni o'lchamini o'zgartirish (video o'lchamining 20%)
            wm_size = int(width * 0.2)
            watermark = watermark.resize((wm_size, wm_size), Image.Resampling.LANCZOS)
            watermark.putalpha(int(255 * opacity))
            
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
            
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                # OpenCV frame'ni PIL Image ga o'tkazish
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                frame_pil = Image.fromarray(frame_rgb)
                
                # Vatermark joylashini hisoblash
                if position == 'bottom-right':
                    pos = (width - wm_size - 10, height - wm_size - 10)
                elif position == 'bottom-left':
                    pos = (10, height - wm_size - 10)
                elif position == 'top-right':
                    pos = (width - wm_size - 10, 10)
                else:  # top-left
                    pos = (10, 10)
                
                frame_pil.paste(watermark, pos, watermark)
                
                # PIL Image'ni OpenCV frame'ga o'tkazish
                frame = cv2.cvtColor(np.array(frame_pil), cv2.COLOR_RGB2BGR)
                out.write(frame)
            
            cap.release()
            out.release()
            return True
        except Exception as e:
            print(f"Vatermark qo'shishda xato: {e}")
            return False


class GIFProcessor:
    """GIF fayllarini tahrirlash uchun sinf"""
    
    @staticmethod
    def optimize_gif(input_path: str, output_path: str, max_colors: int = 256) -> bool:
        """GIF faylini optimallashtirish"""
        try:
            gif = Image.open(input_path)
            gif = gif.convert('P', palette=Image.Palette.ADAPTIVE, colors=max_colors)
            gif.save(output_path, optimize=True, loop=0)
            return True
        except Exception as e:
            print(f"GIF optimallashtirish xatosi: {e}")
            return False
    
    @staticmethod
    def resize_gif(input_path: str, output_path: str, width: int, height: int) -> bool:
        """GIF o'lchamini o'zgartirish"""
        try:
            gif = Image.open(input_path)
            frames = []
            durations = []
            
            for frame_idx in range(gif.n_frames):
                gif.seek(frame_idx)
                frame = gif.convert('RGB')
                frame = frame.resize((width, height), Image.Resampling.LANCZOS)
                frames.append(frame)
                durations.append(gif.info.get('duration', 100))
            
            frames[0].save(output_path, save_all=True, append_images=frames[1:],
                          duration=durations, loop=0, optimize=True)
            return True
        except Exception as e:
            print(f"GIF o'lcham o'zgartirishda xato: {e}")
            return False


# Asosiy test funksiyasi
if __name__ == "__main__":
    processor = VideoProcessor()
    print("✅ Video Processor muvaffaqiyatli yuklandi!")
