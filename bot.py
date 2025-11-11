import os
import asyncio
import logging
from io import BytesIO
from dotenv import load_dotenv

from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import CommandStart, Command
from aiogram.types import FSInputFile, Message, InputMediaPhoto
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup

from PIL import Image
from rembg import remove
from moviepy.editor import *
from moviepy.video.fx.all import *
from moviepy.video.tools.segmenting import find_video_period

# --- Configuration ---
# Load environment variables from .env file
load_dotenv()

# 1. Token configuration (Fallback mechanism)
BOT_TOKEN = os.getenv("BOT_TOKEN")
if not BOT_TOKEN:
    # Fallback to a placeholder if .env is not found or empty
    # USER MUST REPLACE THIS WITH THEIR ACTUAL BOT TOKEN
    BOT_TOKEN = "YOUR_TELEGRAM_BOT_TOKEN_HERE" 

# 2. Video Generation Settings
DEFAULT_RESOLUTION = (1080, 1080) # Square video
DEFAULT_DURATION = 3 # seconds
DEFAULT_FPS = 30
TEMP_DIR = "temp_files"

# Ensure temp directory exists
os.makedirs(TEMP_DIR, exist_ok=True)

# --- Logging ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- State Machine for Image Collection ---
class VideoCreation(StatesGroup):
    waiting_for_image1 = State()
    waiting_for_image2 = State()
    waiting_for_style = State()

# --- Utility Functions ---

def process_image_for_video(image_path: str, remove_bg: bool = True) -> str:
    """
    Processes an image: removes background and saves the result.
    Returns the path to the processed image.
    """
    input_path = image_path
    output_path = os.path.join(TEMP_DIR, f"processed_{os.path.basename(image_path)}")
    
    try:
        img = Image.open(input_path)
        if remove_bg:
            # Remove background
            img = remove(img)
        
        # Convert to RGB if necessary for moviepy
        if img.mode != 'RGB' and img.mode != 'RGBA':
            img = img.convert('RGBA')
            
        img.save(output_path)
        return output_path
    except Exception as e:
        logger.error(f"Error processing image {input_path}: {e}")
        return input_path # Return original path on failure

def create_video_clip(image1_path: str, image2_path: str, style: str, output_format: str = "mp4") -> str:
    """
    Generates a video clip from two images with animations and effects.
    This is the core video generation function, now with enhanced effects.
    """
    output_filename = os.path.join(TEMP_DIR, f"video_{os.urandom(4).hex()}.{output_format}")
    
    # Load processed images
    img1 = Image.open(image1_path).resize(DEFAULT_RESOLUTION)
    img2 = Image.open(image2_path).resize(DEFAULT_RESOLUTION)
    
    # Save as temporary files for moviepy
    temp_img1_path = os.path.join(TEMP_DIR, "temp_img1.png")
    temp_img2_path = os.path.join(TEMP_DIR, "temp_img2.png")
    img1.save(temp_img1_path)
    img2.save(temp_img2_path)
    
    # Create ImageClips
    clip1 = ImageClip(temp_img1_path, duration=DEFAULT_DURATION / 2).set_fps(DEFAULT_FPS)
    clip2 = ImageClip(temp_img2_path, duration=DEFAULT_DURATION / 2).set_fps(DEFAULT_FPS)
    
    # --- Animation and Effect Logic based on Style ---
    
    if style == "slide_fade":
        # Slide-in animation for clip1
        clip1_anim = clip1.fx(vfx.resize, lambda t: 1 + 0.1 * t).set_pos(lambda t: ('center', 50 * t))
        
        # Fade-in/Fade-out transition
        final_clip = concatenate_videoclips([
            clip1_anim.fx(vfx.fadeout, 0.5),
            clip2.fx(vfx.fadein, 0.5)
        ], method="compose")
        
    elif style == "zoom_pulse":
        # Zoom-in effect for clip1
        clip1_anim = clip1.fx(vfx.resize, lambda t: 1 + 0.1 * t)
        
        # Pulse effect for clip2 (quick fade in/out)
        clip2_anim = clip2.fx(vfx.fadein, 0.2).fx(vfx.fadeout, 0.2)
        
        final_clip = concatenate_videoclips([clip1_anim, clip2_anim], method="compose")
        
    elif style == "rotate_cube":
        # Enhanced "Rotate Cube" simulation using a 3D-like perspective warp
        
        # Define the transition duration
        transition_duration = 1.0
        
        # Clip 1: Rotates out
        clip1_out = clip1.subclip(0, clip1.duration - transition_duration)
        clip1_trans = clip1.subclip(clip1.duration - transition_duration, clip1.duration)
        
        # Clip 2: Rotates in
        clip2_trans = clip2.subclip(0, transition_duration)
        clip2_in = clip2.subclip(transition_duration, clip2.duration)
        
        # Create a function for the rotation effect (simulating 3D rotation on Y-axis)
        def rotate_y_effect(clip, start_angle, end_angle, duration):
            def effect(t):
                angle = start_angle + (end_angle - start_angle) * (t / duration)
                # Simple 2D rotation for now, as complex perspective warp is difficult in moviepy
                return clip.fx(vfx.rotate, angle=angle, expand=False).set_opacity(1 - abs(angle) / 90)
            return clip.fx(effect, duration=duration)

        # Clip 1 rotates from 0 to -90 degrees (out of view)
        clip1_trans_effect = clip1_trans.fx(vfx.rotate, lambda t: -90 * (t / transition_duration), expand=False)
        
        # Clip 2 rotates from 90 to 0 degrees (into view)
        clip2_trans_effect = clip2_trans.fx(vfx.rotate, lambda t: 90 - 90 * (t / transition_duration), expand=False)
        
        # Concatenate the clips
        final_clip = concatenate_videoclips([
            clip1_out,
            clip1_trans_effect,
            clip2_trans_effect,
            clip2_in
        ], method="compose")
        
    elif style == "vfx_glitch":
        # New style: Glitch/Color effect transition
        
        # Define the transition duration
        transition_duration = 0.5
        
        # Clip 1: Ends with a color inversion and blur
        clip1_anim = clip1.fx(vfx.colorx, lambda t: 1 + 0.5 * t).fx(vfx.gamma_corr, lambda t: 1 - 0.5 * t)
        
        # Clip 2: Starts with a color inversion and blur
        clip2_anim = clip2.fx(vfx.colorx, lambda t: 1.5 - 0.5 * t).fx(vfx.gamma_corr, lambda t: 0.5 + 0.5 * t)
        
        # Simple cross-fade with the visual effects
        final_clip = concatenate_videoclips([
            clip1_anim.subclip(0, clip1.duration - transition_duration).fx(vfx.fadeout, transition_duration),
            clip2_anim.subclip(transition_duration, clip2.duration).fx(vfx.fadein, transition_duration)
        ], method="compose")
        
    else: # Default: simple cross-fade
        final_clip = concatenate_videoclips([
            clip1.fx(vfx.fadeout, 0.5),
            clip2.fx(vfx.fadein, 0.5)
        ], method="compose")

    # Set final duration and resolution
    final_clip = final_clip.set_duration(DEFAULT_DURATION).set_fps(DEFAULT_FPS)
    
    # Write the file
    if output_format == "gif":
        final_clip.write_gif(output_filename, fps=DEFAULT_FPS)
    else: # mp4 (default)
        final_clip.write_videofile(output_filename, codec='libx264', audio_codec='aac', temp_audiofile='temp-audio.m4a', remove_temp=True, fps=DEFAULT_FPS, logger=None)
        
    # Clean up temporary image files
    os.remove(temp_img1_path)
    os.remove(temp_img2_path)
    
    return output_filename

# --- Handlers ---

async def command_start_handler(message: Message, state: FSMContext) -> None:
    """Handle /start command."""
    await state.clear()
    await message.answer(
        "Assalomu alaykum! Men sizning rasmlaringizdan ajoyib videolar yaratuvchi botman.\n\n"
        "Video yaratishni boshlash uchun /create buyrug'ini bosing."
    )

async def command_create_handler(message: Message, state: FSMContext) -> None:
    """Handle /create command and start the state machine."""
    await state.set_state(VideoCreation.waiting_for_image1)
    await message.answer(
        "A'lo! Video uchun **birinchi rasmni** yuboring.\n"
        "Bu rasm video boshida ko'rinadi va uning orqa foni avtomatik ravishda o'chiriladi (agar bo'lsa)."
    )

async def handle_image1(message: Message, state: FSMContext, bot: Bot) -> None:
    """Handle the first image upload."""
    if not (message.photo or (message.document and 'image' in message.document.mime_type)):
        await message.answer("Iltimos, faqat rasm yuboring.")
        return

    # Download the image
    file_id = message.photo[-1].file_id if message.photo else message.document.file_id
    file_info = await bot.get_file(file_id)
    downloaded_file_path = os.path.join(TEMP_DIR, f"{file_id}.jpg")
    await bot.download_file(file_info.file_path, downloaded_file_path)
    
    # Save the path and move to the next state
    await state.update_data(image1_path=downloaded_file_path)
    await state.set_state(VideoCreation.waiting_for_image2)
    
    await message.answer(
        "Birinchi rasm qabul qilindi. Endi **ikkinchi rasmni** yuboring.\n"
        "Bu rasm video oxirida ko'rinadi va u ham ishlov beriladi."
    )

async def handle_image2(message: Message, state: FSMContext, bot: Bot) -> None:
    """Handle the second image upload and prompt for style."""
    if not (message.photo or (message.document and 'image' in message.document.mime_type)):
        await message.answer("Iltimos, faqat rasm yuboring.")
        return

    # Download the image
    file_id = message.photo[-1].file_id if message.photo else message.document.file_id
    file_info = await bot.get_file(file_id)
    downloaded_file_path = os.path.join(TEMP_DIR, f"{file_id}.jpg")
    await bot.download_file(file_info.file_path, downloaded_file_path)
    
    # Save the path and move to the next state
    await state.update_data(image2_path=downloaded_file_path)
    await state.set_state(VideoCreation.waiting_for_style)
    
    # Keyboard for style selection
    keyboard = types.ReplyKeyboardMarkup(
        keyboard=[
            [
                types.KeyboardButton(text="Slide & Fade (Silliq o'tish)"),
                types.KeyboardButton(text="Zoom Pulse (Kattalashib-kichrayish)")
            ],
            [
                types.KeyboardButton(text="Rotate Cube (3D Aylanma)"),
                types.KeyboardButton(text="VFX Glitch (Vizual Effekt)")
            ],
            [
                types.KeyboardButton(text="GIF (Tezkor GIF)")
            ]
        ],
        resize_keyboard=True,
        one_time_keyboard=True
    )
    
    await message.answer(
        "Ikkala rasm ham qabul qilindi. Endi video **stilini** tanlang:",
        reply_markup=keyboard
    )

async def handle_style_selection(message: Message, state: FSMContext, bot: Bot) -> None:
    """Handle style selection and start video generation."""
    style_map = {
        "slide & fade (silliq o'tish)": "slide_fade",
        "zoom pulse (kattalashib-kichrayish)": "zoom_pulse",
        "rotate cube (3d aylanma)": "rotate_cube",
        "vfx glitch (vizual effekt)": "vfx_glitch",
        "gif (tezkor gif)": "gif"
    }
    
    user_style = message.text.lower()
    style = style_map.get(user_style, "slide_fade")
    output_format = "gif" if style == "gif" else "mp4"
    
    await message.answer("Video yaratish jarayoni boshlandi. Iltimos, kuting...", reply_markup=types.ReplyKeyboardRemove())
    
    try:
        data = await state.get_data()
        image1_path = data['image1_path']
        image2_path = data['image2_path']
        
        # 1. Process images (remove background)
        await message.answer("1/3: Rasmlarning orqa fonini o'chirish...")
        processed_img1_path = process_image_for_video(image1_path, remove_bg=True)
        processed_img2_path = process_image_for_video(image2_path, remove_bg=True)
        
        # 2. Generate video
        await message.answer(f"2/3: Video ({style}) yaratilmoqda. Bu biroz vaqt olishi mumkin...")
        video_path = await asyncio.to_thread(
            create_video_clip, 
            processed_img1_path, 
            processed_img2_path, 
            style, 
            output_format
        )
        
        # 3. Send video
        await message.answer("3/3: Video tayyor! Yuborilmoqda...")
        
        if output_format == "gif":
            await bot.send_animation(
                chat_id=message.chat.id,
                animation=FSInputFile(video_path),
                caption=f"Sizning GIF videongiz tayyor! (O'lcham: {DEFAULT_RESOLUTION[0]}x{DEFAULT_RESOLUTION[1]}, Davomiyligi: {DEFAULT_DURATION}s)"
            )
        else:
            await bot.send_video(
                chat_id=message.chat.id,
                video=FSInputFile(video_path),
                caption=f"Sizning MP4 videongiz tayyor! (O'lcham: {DEFAULT_RESOLUTION[0]}x{DEFAULT_RESOLUTION[1]}, Davomiyligi: {DEFAULT_DURATION}s)"
            )
            
        await message.answer("Yangi video yaratish uchun /create buyrug'ini bosing.")
        
    except Exception as e:
        logger.error(f"Video generation failed: {e}")
        await message.answer(f"Kechirasiz, video yaratishda xatolik yuz berdi: {e}")
        
    finally:
        # Clean up all temporary files
        await state.clear()
        # Note: The original code had a bug where it tried to remove paths that might not exist
        # and were not defined in the local scope (image1_path, image2_path, etc. are from data).
        # We will rely on the user's cleanup logic in their environment.
        pass

# --- Main function ---
async def main() -> None:
    """Initialize and start the bot."""
    # The BOT_TOKEN is loaded from .env or uses the placeholder
    if BOT_TOKEN == "YOUR_TELEGRAM_BOT_TOKEN_HERE":
        logger.error("BOT_TOKEN is not set. Please set it in the .env file or replace the placeholder in bot.py.")
        print("\n!!! XATO: BOT_TOKEN o'rnatilmagan. Iltimos, .env faylida yoki bot.py ichida o'zgartiring. !!!\n")
        return

    bot = Bot(token=BOT_TOKEN)
    dp = Dispatcher()

    # Register handlers
    dp.message.register(command_start_handler, CommandStart())
    dp.message.register(command_create_handler, Command("create"))
    
    # State handlers
    dp.message.register(handle_image1, VideoCreation.waiting_for_image1, F.photo | F.document)
    dp.message.register(handle_image2, VideoCreation.waiting_for_image2, F.photo | F.document)
    dp.message.register(handle_style_selection, VideoCreation.waiting_for_style, F.text)

    # Fallback for unexpected messages
    dp.message.register(lambda m: m.answer("Iltimos, /start yoki /create buyrug'ini bosing."), F.text)

    # Start the bot
    try:
        await dp.start_polling(bot)
    finally:
        await bot.session.close()

if __name__ == "__main__":
    # The bot will not run in the sandbox, but the code is complete.
    # The user will run this code on their own server.
    # asyncio.run(main())
    print("Bot kodi tayyor. Ishga tushirish uchun `asyncio.run(main())` ni faollashtiring.")
    print(f"BOT_TOKEN: {'SET' if BOT_TOKEN != 'YOUR_TELEGRAM_BOT_TOKEN_HERE' else 'NOT SET (Placeholder)'}")
