# 🖼️ Rasm-Video Generator Telegram Boti

Bu loyiha foydalanuvchi yuborgan ikkita rasm asosida turli animatsiya va effektlar bilan qisqa video (MP4 yoki GIF) yaratib beruvchi Telegram botidir.

## 🌟 Asosiy Funksiyalar

*   **Ikki Rasm Asosida Video:** Foydalanuvchidan ketma-ket ikkita rasm qabul qilinadi.
*   **Orqa Fonni O'chirish (Background Removal):** `rembg` kutubxonasi yordamida rasmlarning orqa foni avtomatik ravishda o'chiriladi.
*   **Animatsiya va VFX:** `moviepy` yordamida quyidagi video stillari qo'llaniladi:
    *   **Slide & Fade:** Silliq o'tish va rasmning siljishi.
    *   **Zoom Pulse:** Rasmlarning kattalashib-kichrayishi effekti.
    *   **Rotate Cube:** Rasmlarning aylanma kubga o'xshash o'tishi (simulyatsiya).
*   **Chiqish Formatlari:** MP4 (standart) va GIF formatida video yaratish imkoniyati.
*   **O'lchamlar:** Barcha videolar standart **1080x1080** (kvadrat) o'lchamda va **3 soniya** davomiylikda yaratiladi.

## 🛠️ Texnologiyalar

*   **Bot Framework:** `aiogram` (Asinxron Telegram bot freymvorki)
*   **Video Ishlovi:** `moviepy` (Video tahrirlash va yaratish)
*   **Rasm Ishlovi:** `Pillow` (Rasm manipulyatsiyasi)
*   **Orqa Fonni O'chirish:** `rembg` (Yuqori sifatli orqa fonni o'chirish)
*   **Konfiguratsiya:** `python-dotenv`

## ⚙️ O'rnatish va Ishga Tushirish

### 1. Loyihani Kloni Qilish

```bash
git clone https://github.com/Unkown-Demon/Logo-creator.git
cd Logo-creator
```

### 2. Kutubxonalarni O'rnatish

Barcha kerakli Python kutubxonalarini o'rnating:

```bash
pip install -r requirements.txt
```

### 3. Konfiguratsiya

Bot tokenini o'rnatish uchun ikki xil usuldan foydalanishingiz mumkin:

#### A. `.env` Fayli Orqali (Tavsiya etiladi)

Loyihaning asosiy papkasida (`Logo-creator/`) `.env` nomli fayl yarating va unga bot tokeningizni kiriting:

**.env**
```
BOT_TOKEN="SIZNING_TELEGRAM_BOT_TOKENINGIZ"
```

#### B. `bot.py` Faylida O'zgartirish

Agar `.env` fayli topilmasa, bot avtomatik ravishda `bot.py` ichidagi o'zgaruvchidan foydalanadi.

**`bot.py` (15-qator atrofida)**
```python
# USER MUST REPLACE THIS WITH THEIR ACTUAL BOT TOKEN
BOT_TOKEN = "YOUR_TELEGRAM_BOT_TOKEN_HERE" 
```
`"YOUR_TELEGRAM_BOT_TOKEN_HERE"` qismini o'zingizning tokeningizga almashtiring.

### 4. Botni Ishga Tushirish

```bash
python3 bot.py
```

## 🚀 Botdan Foydalanish

1.  Botga `/start` buyrug'ini yuboring.
2.  `/create` buyrug'ini yuborib, video yaratish jarayonini boshlang.
3.  Bot so'raganidek, **birinchi** va **ikkinchi** rasmlarni yuboring.
4.  Taklif qilingan tugmalar orqali video **stilini** tanlang.
5.  Bot videoni yaratib, sizga MP4 yoki GIF formatida yuboradi.

## ⚠️ Muhim Eslatma

*   Video yaratish jarayoni server resurslariga talabchan bo'lishi mumkin.
*   `rembg` kutubxonasi orqa fonni o'chirish uchun birinchi marta ishga tushirilganda modelni yuklab olishi mumkin.
*   **Telegram Bot Tokeningizni** hech kimga bermang va uni GitHub'ga joylamang. `.env` fayli `.gitignore` orqali e'tiborga olinadi.
