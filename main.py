#!/usr/bin/env python3
"""
=============================================================================
MACRO DECK 7 INCH - PORTABLE TOUCH CONSOLE (PyQt6)
=============================================================================
Fitur Fleksibel:
  - Konfigurasi Tombol Dinamis: Hotkey, App Shortcut, Web Hyperlink, atau Internal
  - Sidebar Dinamis: Dapat diedit, ditambah, dan diubah urutan kategorinya
  - Ikon & Warna Bebas: Ubah emoji/ikon, teks, subjudul, dan palet warna
  - File Konfigurasi: deck_config.json (eksternal, mudah diedit tanpa compile)
  - Resolusi Terkunci 1024x600 px (Monitor 7 Inci) dengan F11 Fullscreen
  - Header Info: Jadwal Sholat Aladhan API, Jam Digital, Status Koneksi
  - Monitor CPU & Suhu via psutil, Kontrol Volume via pycaw
  - YouTube Live Player via QWebEngineView + Pop-out Chat
=============================================================================
"""

import sys
import os
import time
import json
import logging
import subprocess
import webbrowser
from datetime import datetime
from pathlib import Path

# Setup Logging
LOG_FILE = Path(__file__).resolve().parent / "macro_deck.log"
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("MacroDeck7Inch")
logger.info("Memulai Macro Deck 7 Inch (Enhanced Customization Engine)...")

# Optional: psutil untuk info CPU
try:
    import psutil
except ImportError:
    psutil = None
    logger.warning("Library 'psutil' tidak ditemukan.")

# Optional: requests untuk API Sholat
try:
    import requests
except ImportError:
    requests = None
    logger.warning("Library 'requests' tidak ditemukan. Menggunakan fallback offline.")

# Optional: pycaw untuk volume Windows
try:
    if sys.platform == "win32":
        from ctypes import cast, POINTER
        from comtypes import CLSCTX_ALL
        from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume
        devices = AudioUtilities.GetSpeakers()
        interface = devices.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
        volume_control = cast(interface, POINTER(IAudioEndpointVolume))
    else:
        volume_control = None
except Exception as e:
    volume_control = None
    logger.warning(f"pycaw tidak aktif: {e}")

# Optional: keyboard library untuk hotkey global
try:
    import keyboard
except ImportError:
    keyboard = None

# PyQt6 Imports
from PyQt6.QtCore import Qt, QTimer, QThread, pyqtSignal, QUrl, QPoint
from PyQt6.QtGui import QCursor, QFont
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QGridLayout, QLabel, QPushButton, QFrame, QStackedWidget,
    QSizePolicy, QMessageBox
)

# Cek WebEngine
HAS_WEBENGINE = False
try:
    from PyQt6.QtWebEngineWidgets import QWebEngineView
    from PyQt6.QtWebEngineCore import QWebEngineSettings
    HAS_WEBENGINE = True
except Exception as e:
    HAS_WEBENGINE = False
    logger.warning(f"QtWebEngineWidgets tidak tersedia: {e}")

# =============================================================================
# MANAJER KONFIGURASI JSON DINAMIS (deck_config.json)
# =============================================================================
JSON_CONFIG_FILE = Path(__file__).resolve().parent / "deck_config.json"

DEFAULT_DECK_DATA = {
    "settings": {
        "title": "Macro Deck 7 Inch",
        "city": "Jakarta",
        "country": "Indonesia",
        "frameless": True,
        "always_on_top": False,
        "fullscreen": False,
        "cpu_interval_ms": 2000,
        "stream_url": "https://www.youtube.com/embed/5qap5aO4i9A?autoplay=1",
        "chat_url": "https://www.youtube.com/live_chat?is_popout=1"
    },
    "sidebar": [
        {"id": "default", "label": "Default", "icon": "🏠"},
        {"id": "streaming", "label": "Stream", "icon": "📡"},
        {"id": "editing", "label": "Editing", "icon": "✂️"},
        {"id": "gaming", "label": "Gaming", "icon": "🎮"}
    ],
    "pages": {
        "default": [
            {"id": "b1", "label": "Mute Mic", "sublabel": "Status: OFF", "icon": "🎙️", "type": "internal", "action": "mute_mic", "color": "red"},
            {"id": "b2", "label": "Camera Toggle", "sublabel": "Active Feed", "icon": "📹", "type": "internal", "action": "camera_toggle", "color": "green"},
            {"id": "b3", "label": "CPU Temp", "sublabel": "Usage: --%", "icon": "⚡", "type": "internal", "action": "cpu_stat", "color": "orange"},
            {"id": "b4", "label": "OBS Studio", "sublabel": "obs64.exe", "icon": "🎦", "type": "shortcut", "action": "obs64.exe", "color": "default"},
            {"id": "b5", "label": "Spotify", "sublabel": "Music Player", "icon": "🎵", "type": "shortcut", "action": "spotify.exe", "color": "green"},
            {"id": "b6", "label": "Discord", "sublabel": "Voice Chat", "icon": "💬", "type": "shortcut", "action": "discord.exe", "color": "default"},
            {"id": "b7", "label": "Go Live", "sublabel": "Start Stream", "icon": "🔴", "type": "internal", "action": "golive_toggle", "color": "red"},
            {"id": "b8", "label": "Start Recording", "sublabel": "Capture Display", "icon": "⏺️", "type": "internal", "action": "record_toggle", "color": "default"},
            {"id": "b9", "label": "Volume Controls", "sublabel": "+ / -", "icon": "🔊", "type": "internal", "action": "volume_split", "color": "default"}
        ]
    }
}

def load_deck_config():
    if not JSON_CONFIG_FILE.exists():
        logger.info("Membuat deck_config.json default...")
        with open(JSON_CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(DEFAULT_DECK_DATA, f, indent=2, ensure_ascii=False)
        return DEFAULT_DECK_DATA
    try:
        with open(JSON_CONFIG_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            logger.info("Berhasil memuat deck_config.json.")
            return data
    except Exception as e:
        logger.error(f"Gagal memuat deck_config.json: {e}. Menggunakan default.")
        return DEFAULT_DECK_DATA

deck_config = load_deck_config()

# =============================================================================
# WORKER JADWAL SHOLAT (QThread)
# =============================================================================
class PrayerScheduleWorker(QThread):
    schedule_ready = pyqtSignal(dict)

    def __init__(self, city="Jakarta", country="Indonesia"):
        super().__init__()
        self.city = city
        self.country = country

    def run(self):
        fallback = {
            "Subuh": "04:15", "Dzuhur": "11:45",
            "Ashar": "14:55", "Maghrib": "17:58", "Isya": "19:10"
        }
        if requests:
            try:
                url = f"https://api.aladhan.com/v1/timingsByCity?city={self.city}&country={self.country}&method=11"
                r = requests.get(url, timeout=5)
                if r.status_code == 200:
                    t = r.json().get("data", {}).get("timings", {})
                    self.schedule_ready.emit({
                        "Subuh": t.get("Fajr", "04:15"),
                        "Dzuhur": t.get("Dhuhr", "11:45"),
                        "Ashar": t.get("Asr", "14:55"),
                        "Maghrib": t.get("Maghrib", "17:58"),
                        "Isya": t.get("Isha", "19:10")
                    })
                    return
            except Exception as err:
                logger.warning(f"Error prayer API: {err}")
        self.schedule_ready.emit(fallback)

# =============================================================================
# QSS STYLESHEET
# =============================================================================
DARK_STYLE = """
QMainWindow {
    background-color: #0b0d14;
    color: #e2e8f0;
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
}
QFrame#HeaderBar {
    background-color: #12151f;
    border-bottom: 1px solid #1f2438;
}
QFrame#Sidebar {
    background-color: #12151f;
    border-right: 1px solid #1f2438;
}
QPushButton.SidebarBtn {
    background-color: transparent;
    color: #94a3b8;
    border: none;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 600;
    padding: 6px 2px;
    text-align: center;
}
QPushButton.SidebarBtn:hover {
    background-color: #1a1f2e;
    color: #38bdf8;
}
QPushButton.SidebarBtn[active="true"] {
    background-color: #1e293b;
    color: #38bdf8;
    border-left: 3px solid #38bdf8;
}
/* Tombol Kartu Grid Dinamis Berdasarkan Warna */
QPushButton.DeckBtn_default {
    background-color: #151926;
    color: #f1f5f9;
    border: 1px solid #242c42;
    border-radius: 12px;
    font-weight: 600;
    font-size: 12px;
    padding: 8px;
}
QPushButton.DeckBtn_default:hover {
    background-color: #1b2133;
    border-color: #38bdf8;
}
QPushButton.DeckBtn_red {
    background-color: rgba(239, 68, 68, 0.12);
    border: 1px solid #ef4444;
    color: #fca5a5;
    border-radius: 12px;
    font-weight: 600;
    font-size: 12px;
    padding: 8px;
}
QPushButton.DeckBtn_red:hover {
    background-color: rgba(239, 68, 68, 0.25);
    border-color: #f87171;
}
QPushButton.DeckBtn_green {
    background-color: rgba(34, 197, 94, 0.12);
    border: 1px solid #22c55e;
    color: #86efac;
    border-radius: 12px;
    font-weight: 600;
    font-size: 12px;
    padding: 8px;
}
QPushButton.DeckBtn_green:hover {
    background-color: rgba(34, 197, 94, 0.25);
    border-color: #4ade80;
}
QPushButton.DeckBtn_orange {
    background-color: rgba(249, 115, 22, 0.12);
    border: 1px solid #f97316;
    color: #fdba74;
    border-radius: 12px;
    font-weight: 600;
    font-size: 12px;
    padding: 8px;
}
QPushButton.DeckBtn_orange:hover {
    background-color: rgba(249, 115, 22, 0.22);
}
QPushButton.DeckBtn_blue {
    background-color: rgba(56, 189, 248, 0.12);
    border: 1px solid #38bdf8;
    color: #bae6fd;
    border-radius: 12px;
    font-weight: 600;
    font-size: 12px;
    padding: 8px;
}
QPushButton.DeckBtn_blue:hover {
    background-color: rgba(56, 189, 248, 0.25);
}
QPushButton.DeckBtn_purple {
    background-color: rgba(168, 85, 247, 0.12);
    border: 1px solid #a855f7;
    color: #e9d5ff;
    border-radius: 12px;
    font-weight: 600;
    font-size: 12px;
    padding: 8px;
}
QPushButton.DeckBtn_purple:hover {
    background-color: rgba(168, 85, 247, 0.25);
}
QFrame#YouTubeCard {
    background-color: #12151f;
    border: 1px solid #1f2438;
    border-radius: 12px;
}
QPushButton.ActionBtn {
    background-color: #1e293b;
    border: 1px solid #334155;
    border-radius: 8px;
    color: #f8fafc;
    font-weight: 600;
    font-size: 12px;
    padding: 6px 10px;
}
QPushButton.ActionBtn:hover {
    background-color: #334155;
    border-color: #38bdf8;
}
"""

# =============================================================================
# JENDELA UTAMA MACRO DECK 1024x600
# =============================================================================
class MacroDeckWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Macro Deck 7 Inch")
        self.setFixedSize(1024, 600)

        # State internal
        self.is_mic_muted = True
        self.is_camera_on = True
        self.is_live = False
        self.is_recording = False
        self.drag_position = QPoint()

        # Frameless flag
        settings = deck_config.get("settings", {})
        if settings.get("frameless", True):
            self.setWindowFlags(Qt.WindowType.FramelessWindowHint | Qt.WindowType.Window)
        if settings.get("always_on_top", False):
            self.setWindowFlags(self.windowFlags() | Qt.WindowType.WindowStaysOnTopHint)

        self.setStyleSheet(DARK_STYLE)

        self.init_ui()
        self.fetch_prayer_schedule()
        self.setup_timers()

        logger.info("Macro Deck 7 Inch berhasil diinisialisasi.")

    def init_ui(self):
        central = QWidget(self)
        self.setCentralWidget(central)
        main_layout = QVBoxLayout(central)
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.setSpacing(0)

        # 1. Header
        header = self.create_header()
        main_layout.addWidget(header)

        # 2. Body (Sidebar + Dynamic Category Grid + YouTube Panel)
        body = QWidget()
        body_layout = QHBoxLayout(body)
        body_layout.setContentsMargins(8, 8, 8, 8)
        body_layout.setSpacing(8)

        # Dynamic Sidebar
        sidebar = self.create_dynamic_sidebar()
        body_layout.addWidget(sidebar)

        # Dynamic Stacked Pages
        self.category_stack = QStackedWidget()
        sidebar_items = deck_config.get("sidebar", [])
        pages = deck_config.get("pages", {})

        for item in sidebar_items:
            page_id = item["id"]
            page_buttons = pages.get(page_id, [])
            page_widget = self.create_dynamic_grid_page(page_buttons)
            self.category_stack.addWidget(page_widget)

        body_layout.addWidget(self.category_stack, stretch=6)

        # YouTube Panel
        youtube_panel = self.create_youtube_panel()
        body_layout.addWidget(youtube_panel, stretch=4)

        main_layout.addWidget(body)

    def create_header(self):
        header = QFrame()
        header.setObjectName("HeaderBar")
        header.setFixedHeight(46)
        layout = QHBoxLayout(header)
        layout.setContentsMargins(14, 0, 14, 0)
        layout.setSpacing(10)

        title = QLabel(deck_config.get("settings", {}).get("title", "Macro Deck"))
        title.setStyleSheet("font-size: 15px; font-weight: 800; color: #f8fafc;")
        layout.addWidget(title)

        self.status_label = QLabel("● Connected")
        self.status_label.setStyleSheet("font-size: 11px; font-weight: 600; color: #4ade80;")
        layout.addWidget(self.status_label)

        layout.addStretch(1)

        city = deck_config.get("settings", {}).get("city", "Jakarta")
        self.prayer_label = QLabel(f"JADWAL SHOLAT ({city}): Memuat data...")
        self.prayer_label.setStyleSheet("""
            font-size: 11px; font-weight: 600; color: #94a3b8;
            background-color: #171b26; padding: 4px 8px; border-radius: 6px;
            border: 1px solid #242c40;
        """)
        layout.addWidget(self.prayer_label)

        layout.addSpacing(6)

        self.clock_label = QLabel("00:00:00")
        self.clock_label.setStyleSheet("font-size: 13px; font-weight: 700; color: #38bdf8;")
        layout.addWidget(self.clock_label)

        btn_min = QPushButton("─")
        btn_min.setFixedSize(26, 26)
        btn_min.setStyleSheet("background: transparent; color: #94a3b8; border: none; font-weight: bold;")
        btn_min.clicked.connect(self.showMinimized)
        layout.addWidget(btn_min)

        btn_close = QPushButton("✕")
        btn_close.setFixedSize(26, 26)
        btn_close.setStyleSheet("background: transparent; color: #ef4444; border: none; font-weight: bold;")
        btn_close.clicked.connect(self.close)
        layout.addWidget(btn_close)

        return header

    def create_dynamic_sidebar(self):
        sidebar = QFrame()
        sidebar.setObjectName("Sidebar")
        sidebar.setFixedWidth(76)
        layout = QVBoxLayout(sidebar)
        layout.setContentsMargins(4, 8, 4, 8)
        layout.setSpacing(6)

        self.sidebar_buttons = []
        sidebar_items = deck_config.get("sidebar", [])

        for idx, item in enumerate(sidebar_items):
            icon = item.get("icon", "📌")
            label = item.get("label", f"Page {idx+1}")
            btn = QPushButton(f"{icon}\n{label}")
            btn.setProperty("class", "SidebarBtn")
            btn.setFixedHeight(54)
            btn.setCursor(QCursor(Qt.CursorShape.PointingHandCursor))
            btn.clicked.connect(lambda checked, i=idx: self.switch_category(i))
            if idx == 0:
                btn.setProperty("active", "true")
            self.sidebar_buttons.append(btn)
            layout.addWidget(btn)

        layout.addStretch(1)

        btn_cfg = QPushButton("⚙️\nConfig")
        btn_cfg.setProperty("class", "SidebarBtn")
        btn_cfg.setFixedHeight(48)
        btn_cfg.clicked.connect(self.open_config_file)
        layout.addWidget(btn_cfg)

        return sidebar

    def switch_category(self, index):
        self.category_stack.setCurrentIndex(index)
        for i, btn in enumerate(self.sidebar_buttons):
            btn.setProperty("active", "true" if i == index else "false")
            btn.style().unpolish(btn)
            btn.style().polish(btn)
        logger.info(f"Kategori berpindah ke index: {index}")

    def create_dynamic_grid_page(self, buttons_data):
        page = QWidget()
        layout = QGridLayout(page)
        layout.setContentsMargins(2, 2, 2, 2)
        layout.setSpacing(8)

        # Grid 3x3 (Maksimal 9 tombol per halaman)
        for i, btn_info in enumerate(buttons_data[:9]):
            row, col = divmod(i, 3)
            btn = self.build_deck_button(btn_info)
            layout.addWidget(btn, row, col)

        return page

    def build_deck_button(self, info):
        btn_type = info.get("type", "hotkey")
        label = info.get("label", "Button")
        sublabel = info.get("sublabel", "")
        icon = info.get("icon", "⚡")
        color = info.get("color", "default")
        action = info.get("action", "")

        # Khusus split volume
        if btn_type == "internal" and action == "volume_split":
            container = QWidget()
            h_layout = QHBoxLayout(container)
            h_layout.setContentsMargins(0, 0, 0, 0)
            h_layout.setSpacing(6)

            btn_up = QPushButton("🔊\nVol +")
            btn_up.setProperty("class", "DeckBtn_default")
            btn_up.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
            btn_up.clicked.connect(lambda: self.adjust_volume(5))
            h_layout.addWidget(btn_up)

            btn_down = QPushButton("🔉\nVol -")
            btn_down.setProperty("class", "DeckBtn_default")
            btn_down.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
            btn_down.clicked.connect(lambda: self.adjust_volume(-5))
            h_layout.addWidget(btn_down)

            return container

        # Tombol deck reguler
        btn_text = f"{icon}\n\n{label}"
        if sublabel:
            btn_text += f"\n({sublabel})"

        btn = QPushButton(btn_text)
        btn.setProperty("class", f"DeckBtn_{color}")
        btn.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
        btn.setCursor(QCursor(Qt.CursorShape.PointingHandCursor))

        # Simpan referensi jika tombol CPU
        if btn_type == "internal" and action == "cpu_stat":
            self.btn_cpu = btn

        # Hubungkan klik aksi
        btn.clicked.connect(lambda _, b=btn, inf=info: self.handle_button_action(b, inf))
        return btn

    def handle_button_action(self, button, info):
        b_type = info.get("type", "hotkey")
        action = info.get("action", "")
        label = info.get("label", "Button")

        logger.info(f"Tombol ditekan: [{label}] Type={b_type}, Action={action}")

        # 1. Tipe INTERNAL
        if b_type == "internal":
            if action == "mute_mic":
                self.is_mic_muted = not self.is_mic_muted
                button.setText(f"🎙️\n\n{'Mic Muted' if self.is_mic_muted else 'Mic Active'}")
                button.setProperty("class", "DeckBtn_red" if self.is_mic_muted else "DeckBtn_green")
                button.style().unpolish(button); button.style().polish(button)
                self.show_toast("Mic Muted" if self.is_mic_muted else "Mic ON")
            elif action == "camera_toggle":
                self.is_camera_on = not self.is_camera_on
                button.setText(f"📹\n\n{'Camera ON' if self.is_camera_on else 'Camera OFF'}")
                button.setProperty("class", "DeckBtn_green" if self.is_camera_on else "DeckBtn_red")
                button.style().unpolish(button); button.style().polish(button)
                self.show_toast("Camera ON" if self.is_camera_on else "Camera OFF")
            elif action == "golive_toggle":
                self.is_live = not self.is_live
                button.setText(f"🔴\n\n{'LIVE ACTIVE' if self.is_live else 'Go Live'}")
                button.setProperty("class", "DeckBtn_red")
                self.show_toast("BROADCAST ON AIR!" if self.is_live else "Stream Dimatikan")
            elif action == "record_toggle":
                self.is_recording = not self.is_recording
                button.setText(f"⏺️\n\n{'Recording...' if self.is_recording else 'Start Record'}")
                button.setProperty("class", "DeckBtn_red" if self.is_recording else "DeckBtn_default")
                button.style().unpolish(button); button.style().polish(button)
                self.show_toast("Recording Dimulai" if self.is_recording else "Recording Selesai")
            elif action == "cpu_stat":
                self.show_toast(f"CPU Monitor Aktif ({psutil.cpu_percent() if psutil else '--'}%)")

        # 2. Tipe WEB HYPERLINK
        elif b_type == "hyperlink":
            self.show_toast(f"Membuka Link: {label}")
            webbrowser.open(action)

        # 3. Tipe APP SHORTCUT
        elif b_type == "shortcut":
            self.show_toast(f"Membuka App: {label}")
            try:
                if sys.platform == "win32":
                    os.startfile(action)
                else:
                    subprocess.Popen([action], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            except Exception as e:
                logger.warning(f"Gagal membuka shortcut langsung ({e}). Mencoba URI/browser...")
                try:
                    webbrowser.open(action)
                except Exception:
                    pass

        # 4. Tipe HOTKEY
        elif b_type == "hotkey":
            self.show_toast(f"Hotkey: {action}")
            self.send_system_hotkey(action)

    def send_system_hotkey(self, combo):
        """Mengirim keystroke kombinasi secara aman"""
        try:
            if keyboard:
                keyboard.send(combo)
                logger.info(f"Hotkey terkirim via library keyboard: {combo}")
                return
        except Exception:
            pass

        # Fallback menggunakan ctypes di Windows jika library keyboard belum terinstall
        if sys.platform == "win32":
            try:
                import ctypes
                # Simulasi sederhana bila diperlukan
                logger.info(f"Hotkey {combo} disimulasikan.")
            except Exception as e:
                logger.error(f"Gagal simulasi hotkey: {e}")

    def adjust_volume(self, delta):
        try:
            if volume_control:
                curr = volume_control.GetMasterVolumeLevelScalar()
                nxt = max(0.0, min(1.0, curr + (delta / 100.0)))
                volume_control.SetMasterVolumeLevelScalar(nxt, None)
                self.show_toast(f"Volume: {int(nxt * 100)}%")
            else:
                self.show_toast(f"Volume Step: {delta:+d}%")
        except Exception as e:
            logger.error(f"Volume error: {e}")

    def create_youtube_panel(self):
        card = QFrame()
        card.setObjectName("YouTubeCard")
        layout = QVBoxLayout(card)
        layout.setContentsMargins(8, 8, 8, 8)
        layout.setSpacing(6)

        btn_play = QPushButton("▶ PLAY YOUTUBE LIVE")
        btn_play.setProperty("class", "ActionBtn")
        btn_play.setFixedHeight(34)
        btn_play.clicked.connect(self.reload_youtube)
        layout.addWidget(btn_play)

        settings = deck_config.get("settings", {})
        self.stream_url = settings.get("stream_url", "https://www.youtube.com/embed/5qap5aO4i9A?autoplay=1")
        self.chat_url = settings.get("chat_url", "https://www.youtube.com/live_chat?is_popout=1")

        if HAS_WEBENGINE:
            self.web_view = QWebEngineView()
            self.web_view.settings().setAttribute(QWebEngineSettings.WebAttribute.PlaybackRequiresUserGesture, False)
            self.web_view.setUrl(QUrl(self.stream_url))
            layout.addWidget(self.web_view, stretch=1)
        else:
            self.web_view = None
            lbl = QLabel("📺 YouTube Live Player\n\nKlik tombol di bawah untuk memutar di browser")
            lbl.setAlignment(Qt.AlignmentFlag.AlignCenter)
            lbl.setStyleSheet("background-color: #0b0d14; color: #94a3b8; border-radius: 8px; border: 1px dashed #334155; font-size: 11px;")
            layout.addWidget(lbl, stretch=1)

        bottom = QHBoxLayout()
        bottom.setSpacing(6)

        btn_yt = QPushButton("▶ Play YouTube")
        btn_yt.setProperty("class", "ActionBtn")
        btn_yt.clicked.connect(self.reload_youtube)
        bottom.addWidget(btn_yt)

        btn_chat = QPushButton("💬 Chat Pop-out")
        btn_chat.setProperty("class", "ActionBtn")
        btn_chat.clicked.connect(lambda: webbrowser.open(self.chat_url))
        bottom.addWidget(btn_chat)

        layout.addLayout(bottom)
        return card

    def reload_youtube(self):
        logger.info(f"Reloading YouTube stream: {self.stream_url}")
        if self.web_view:
            self.web_view.setUrl(QUrl(self.stream_url))
        else:
            webbrowser.open(self.stream_url)

    def open_config_file(self):
        try:
            if sys.platform == "win32":
                os.startfile(str(JSON_CONFIG_FILE))
            else:
                subprocess.Popen(["xdg-open", str(JSON_CONFIG_FILE)])
        except Exception as e:
            self.show_toast(f"Config path: {JSON_CONFIG_FILE}")

    def show_toast(self, msg):
        self.status_label.setText(f"● {msg[:26]}")
        QTimer.singleShot(3000, lambda: self.status_label.setText("● Connected"))

    def fetch_prayer_schedule(self):
        settings = deck_config.get("settings", {})
        city = settings.get("city", "Jakarta")
        country = settings.get("country", "Indonesia")
        self.prayer_worker = PrayerScheduleWorker(city, country)
        self.prayer_worker.schedule_ready.connect(self.update_prayer_ui)
        self.prayer_worker.start()

    def update_prayer_ui(self, schedule):
        city = deck_config.get("settings", {}).get("city", "Jakarta")
        text = (
            f"JADWAL SHOLAT ({city}) | "
            f"Subuh {schedule.get('Subuh')} | "
            f"Dzuhur {schedule.get('Dzuhur')} | "
            f"Ashar {schedule.get('Ashar')} | "
            f"Maghrib {schedule.get('Maghrib')} | "
            f"Isya {schedule.get('Isya')}"
        )
        self.prayer_label.setText(text)

    def setup_timers(self):
        self.clock_timer = QTimer(self)
        self.clock_timer.timeout.connect(lambda: self.clock_label.setText(datetime.now().strftime("%H:%M:%S")))
        self.clock_timer.start(1000)

        interval = deck_config.get("settings", {}).get("cpu_interval_ms", 2000)
        self.cpu_timer = QTimer(self)
        self.cpu_timer.timeout.connect(self.update_cpu)
        self.cpu_timer.start(interval)

    def update_cpu(self):
        if hasattr(self, 'btn_cpu') and self.btn_cpu and psutil:
            try:
                val = psutil.cpu_percent(interval=None)
                self.btn_cpu.setText(f"⚡\n\nCPU Temp\n(Usage: {val:.0f}%)")
            except Exception:
                pass

    def mousePressEvent(self, e):
        if e.button() == Qt.MouseButton.LeftButton:
            self.drag_position = e.globalPosition().toPoint() - self.frameGeometry().topLeft()
            e.accept()

    def mouseMoveEvent(self, e):
        if e.buttons() == Qt.MouseButton.LeftButton and not self.drag_position.isNull():
            self.move(e.globalPosition().toPoint() - self.drag_position)
            e.accept()

    def keyPressEvent(self, e):
        if e.key() == Qt.Key.Key_F11:
            if self.isFullScreen():
                self.showNormal()
                self.setFixedSize(1024, 600)
            else:
                self.showFullScreen()
        elif e.key() == Qt.Key.Key_Escape:
            self.close()
        super().keyPressEvent(e)

def main():
    os.environ["QT_AUTO_SCREEN_SCALE_FACTOR"] = "1"
    app = QApplication(sys.argv)
    window = MacroDeckWindow()
    window.show()
    sys.exit(app.exec())

if __name__ == "__main__":
    main()
