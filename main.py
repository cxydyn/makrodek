#!/usr/bin/env python3
"""
=============================================================================
MACRO DECK 7 INCH - PORTABLE TOUCH CONSOLE
=============================================================================
Deskripsi : Aplikasi Macro Deck Touch-Friendly khusus monitor 7 inci (1024x600).
Fitur     :
  - Tampilan Frameless 1024x600 dengan tema Dark Futuristik
  - Header Info: Status koneksi, Jam digital & Jadwal Sholat real-time (API + Fallback)
  - Sidebar Kategori: Default, Streaming, Editing, Gaming
  - Grid Kontrol Cepat: Mute Mic, Camera Toggle, CPU Usage/Temp (psutil), Volume Control (+/-)
  - Pintasan Aplikasi: OBS Studio, Spotify, Discord, Chrome
  - Kontrol Live: Go Live, Start Recording, Chat Overlay
  - Sisi Kanan: YouTube Live Stream Player (QWebEngineView) + Pop-out Chat
  - Konfigurasi via file eksternal config.ini (tanpa perlu compile ulang)
  - Fitur Logging terintegrasi ke macro_deck.log
=============================================================================
"""

import sys
import os
import time
import json
import logging
import subprocess
import configparser
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
logger.info("Memulai inisialisasi Macro Deck 7 Inch...")

# Cek & Import Library Eksternal
try:
    import psutil
except ImportError:
    psutil = None
    logger.warning("Library 'psutil' tidak ditemukan. Metrik CPU akan dinonaktifkan atau menggunakan estimasi.")

try:
    import requests
except ImportError:
    requests = None
    logger.warning("Library 'requests' tidak ditemukan. Menggunakan jadwal sholat offline fallback.")

# Audio volume control (pycaw for Windows, amixer for Linux)
try:
    if sys.platform == "win32":
        from ctypes import cast, POINTER
        from comtypes import CLSCTX_ALL
        from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume
        devices = AudioUtilities.GetSpeakers()
        interface = devices.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
        volume_control = cast(interface, POINTER(IAudioEndpointVolume))
        logger.info("Pycaw berhasil diinisialisasi untuk kontrol volume Windows.")
    else:
        volume_control = None
except Exception as e:
    volume_control = None
    logger.warning(f"pycaw tidak aktif/gagal ({e}). Menggunakan fallback media keys.")

# PyQt6 Imports
from PyQt6.QtCore import Qt, QTimer, QThread, pyqtSignal, QUrl, QSize, QPoint
from PyQt6.QtGui import QIcon, QFont, QColor, QCursor, QAction
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QGridLayout, QLabel, QPushButton, QFrame, QStackedWidget,
    QSizePolicy, QMessageBox
)

# Coba import QtWebEngineWidgets untuk YouTube Live
HAS_WEBENGINE = False
try:
    from PyQt6.QtWebEngineWidgets import QWebEngineView
    from PyQt6.QtWebEngineCore import QWebEngineSettings
    HAS_WEBENGINE = True
    logger.info("QtWebEngineWidgets berhasil dimuat.")
except Exception as e:
    HAS_WEBENGINE = False
    logger.warning(f"QtWebEngineWidgets tidak tersedia: {e}. Menggunakan web player fallback.")


# =============================================================================
# MANAJER KONFIGURASI (config.ini)
# =============================================================================
CONFIG_FILE = Path(__file__).resolve().parent / "config.ini"

DEFAULT_CONFIG = {
    "General": {
        "title": "Macro Deck",
        "city": "Jakarta",
        "country": "Indonesia",
        "frameless": "true",
        "always_on_top": "false",
        "fullscreen": "false",
        "cpu_interval_ms": "2000"
    },
    "YouTube": {
        "stream_url": "https://www.youtube.com/embed/live_stream?channel=UC4R8DWoMoI7CAwX8_bqQ5yA",
        "direct_url": "https://www.youtube.com",
        "chat_url": "https://www.youtube.com/live_chat?is_popout=1"
    },
    "Paths": {
        "obs": "obs64.exe",
        "spotify": "spotify.exe",
        "discord": "discord.exe",
        "chrome": "chrome.exe"
    },
    "Shortcuts": {
        "mute_mic": "ctrl+shift+m",
        "camera_toggle": "ctrl+shift+c",
        "go_live": "f9",
        "start_recording": "f10"
    }
}

def load_or_create_config():
    config = configparser.ConfigParser()
    if not CONFIG_FILE.exists():
        logger.info("File config.ini tidak ditemukan. Membuat config.ini default...")
        for section, values in DEFAULT_CONFIG.items():
            config[section] = values
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            config.write(f)
    else:
        config.read(CONFIG_FILE, encoding="utf-8")
        logger.info("File config.ini berhasil dimuat.")
    return config

config = load_or_create_config()


# =============================================================================
# WORKER THREAD: JADWAL SHOLAT (API Aladhan + Cache Fallback)
# =============================================================================
class PrayerScheduleWorker(QThread):
    schedule_ready = pyqtSignal(dict)

    def __init__(self, city="Jakarta", country="Indonesia"):
        super().__init__()
        self.city = city
        self.country = country

    def run(self):
        # Fallback offline bawaan
        fallback_data = {
            "Subuh": "04:15",
            "Dzuhur": "11:45",
            "Ashar": "14:55",
            "Maghrib": "17:58",
            "Isya": "19:10"
        }

        if not requests:
            logger.info("Menggunakan fallback jadwal sholat (requests tidak ada).")
            self.schedule_ready.emit(fallback_data)
            return

        try:
            url = f"https://api.aladhan.com/v1/timingsByCity?city={self.city}&country={self.country}&method=11"
            res = requests.get(url, timeout=5)
            if res.status_code == 200:
                data = res.json()
                timings = data.get("data", {}).get("timings", {})
                result = {
                    "Subuh": timings.get("Fajr", "04:15"),
                    "Dzuhur": timings.get("Dhuhr", "11:45"),
                    "Ashar": timings.get("Asr", "14:55"),
                    "Maghrib": timings.get("Maghrib", "17:58"),
                    "Isya": timings.get("Isha", "19:10")
                }
                logger.info(f"Berhasil mengambil jadwal sholat dari API untuk {self.city}: {result}")
                self.schedule_ready.emit(result)
                return
        except Exception as err:
            logger.warning(f"Gagal mengambil jadwal sholat dari API: {err}. Menggunakan fallback.")

        self.schedule_ready.emit(fallback_data)


# =============================================================================
# GAYA STYLESHEET (QSS) TEMA DARK FUTURISTIK
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

/* Tombol Sidebar */
QPushButton.SidebarBtn {
    background-color: transparent;
    color: #94a3b8;
    border: none;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 600;
    padding: 8px 4px;
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

/* Tombol Kartu Grid */
QPushButton.DeckBtn {
    background-color: #151926;
    color: #f1f5f9;
    border: 1px solid #242c42;
    border-radius: 12px;
    font-weight: 600;
    font-size: 13px;
    padding: 10px;
    text-align: center;
}
QPushButton.DeckBtn:hover {
    background-color: #1b2133;
    border-color: #38bdf8;
}
QPushButton.DeckBtn:pressed {
    background-color: #0d111a;
    border-color: #0284c7;
}

/* Tombol Merah (Mute, Go Live, Stop) */
QPushButton.DeckBtnRed {
    background-color: rgba(239, 68, 68, 0.12);
    border: 1px solid #ef4444;
    color: #fca5a5;
    border-radius: 12px;
    font-weight: 600;
    font-size: 13px;
    padding: 10px;
}
QPushButton.DeckBtnRed:hover {
    background-color: rgba(239, 68, 68, 0.25);
    border-color: #f87171;
}

/* Tombol Hijau (Camera Active, Connected, Spotify) */
QPushButton.DeckBtnGreen {
    background-color: rgba(34, 197, 94, 0.12);
    border: 1px solid #22c55e;
    color: #86efac;
    border-radius: 12px;
    font-weight: 600;
    font-size: 13px;
    padding: 10px;
}
QPushButton.DeckBtnGreen:hover {
    background-color: rgba(34, 197, 94, 0.25);
    border-color: #4ade80;
}

/* Tombol Oranye (CPU Stat) */
QPushButton.DeckBtnOrange {
    background-color: rgba(249, 115, 22, 0.12);
    border: 1px solid #f97316;
    color: #fdba74;
    border-radius: 12px;
    font-weight: 600;
    font-size: 13px;
    padding: 10px;
}
QPushButton.DeckBtnOrange:hover {
    background-color: rgba(249, 115, 22, 0.22);
}

/* YouTube Panel */
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
    padding: 8px 12px;
}
QPushButton.ActionBtn:hover {
    background-color: #334155;
    border-color: #38bdf8;
}
"""


# =============================================================================
# JENDELA UTAMA MACRO DECK (1024x600)
# =============================================================================
class MacroDeckWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Macro Deck 7 Inch")
        
        # Kunci ukuran window tepat pada 1024 x 600
        self.setFixedSize(1024, 600)
        
        # State variables
        self.is_mic_muted = True
        self.is_camera_on = True
        self.is_live = False
        self.is_recording = False
        self.drag_position = QPoint()

        # Frameless window configuration
        is_frameless = config.getboolean("General", "frameless", fallback=True)
        if is_frameless:
            self.setWindowFlags(Qt.WindowType.FramelessWindowHint | Qt.WindowType.Window)
        
        if config.getboolean("General", "always_on_top", fallback=False):
            self.setWindowFlags(self.windowFlags() | Qt.WindowType.WindowStaysOnTopHint)

        # Terapkan Stylesheet
        self.setStyleSheet(DARK_STYLE)

        # Inisialisasi UI
        self.init_ui()
        
        # Inisialisasi Jadwal Sholat
        self.fetch_prayer_schedule()

        # Inisialisasi Timer CPU & Jam
        self.setup_timers()

        logger.info("UI Macro Deck 7 Inch siap ditampilkan.")

    def init_ui(self):
        # Central widget utama
        central_widget = QWidget(self)
        self.setCentralWidget(central_widget)
        main_layout = QVBoxLayout(central_widget)
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.setSpacing(0)

        # 1. HEADER BAR
        header = self.create_header()
        main_layout.addWidget(header)

        # 2. BODY CONTENT (Sidebar + Central Grid + YouTube Side)
        body = QWidget()
        body_layout = QHBoxLayout(body)
        body_layout.setContentsMargins(8, 8, 8, 8)
        body_layout.setSpacing(8)

        # Sisi Kiri: Sidebar
        sidebar = self.create_sidebar()
        body_layout.addWidget(sidebar)

        # Sisi Tengah: Stacked Grid Kategori
        self.category_stack = QStackedWidget()
        self.category_stack.addWidget(self.create_default_grid())    # Index 0
        self.category_stack.addWidget(self.create_streaming_grid())  # Index 1
        self.category_stack.addWidget(self.create_editing_grid())    # Index 2
        self.category_stack.addWidget(self.create_gaming_grid())     # Index 3
        body_layout.addWidget(self.category_stack, stretch=6)

        # Sisi Kanan: Panel YouTube Live
        youtube_panel = self.create_youtube_panel()
        body_layout.addWidget(youtube_panel, stretch=4)

        main_layout.addWidget(body)

    # -------------------------------------------------------------------------
    # HEADER BAR (Judul, Indikator, Jadwal Sholat, Jam & Window Controls)
    # -------------------------------------------------------------------------
    def create_header(self):
        header = QFrame()
        header.setObjectName("HeaderBar")
        header.setFixedHeight(48)
        layout = QHBoxLayout(header)
        layout.setContentsMargins(16, 0, 16, 0)
        layout.setSpacing(12)

        # Logo / Title
        title_label = QLabel("Macro Deck")
        title_label.setStyleSheet("font-size: 16px; font-weight: 800; color: #f8fafc; letter-spacing: 0.5px;")
        layout.addWidget(title_label)

        # Status Koneksi
        self.status_label = QLabel("● Connected")
        self.status_label.setStyleSheet("font-size: 12px; font-weight: 600; color: #4ade80;")
        layout.addWidget(self.status_label)

        layout.addStretch(1)

        # Jadwal Sholat Container
        self.prayer_label = QLabel("JADWAL SHOLAT: Memuat data...")
        self.prayer_label.setStyleSheet("""
            font-size: 11px;
            font-weight: 600;
            color: #94a3b8;
            background-color: #171b26;
            padding: 4px 10px;
            border-radius: 6px;
            border: 1px solid #242c40;
        """)
        layout.addWidget(self.prayer_label)

        layout.addSpacing(10)

        # Jam Digital
        self.clock_label = QLabel("00:00:00")
        self.clock_label.setStyleSheet("font-size: 13px; font-weight: 700; color: #38bdf8;")
        layout.addWidget(self.clock_label)

        # Tombol Window Control (Minimize, Close)
        btn_min = QPushButton("─")
        btn_min.setFixedSize(28, 28)
        btn_min.setStyleSheet("background: transparent; color: #94a3b8; border: none; font-weight: bold;")
        btn_min.clicked.connect(self.showMinimized)
        layout.addWidget(btn_min)

        btn_close = QPushButton("✕")
        btn_close.setFixedSize(28, 28)
        btn_close.setStyleSheet("background: transparent; color: #ef4444; border: none; font-weight: bold;")
        btn_close.clicked.connect(self.close)
        layout.addWidget(btn_close)

        return header

    # -------------------------------------------------------------------------
    # SIDEBAR KATEGORI (Default, Streaming, Editing, Gaming)
    # -------------------------------------------------------------------------
    def create_sidebar(self):
        sidebar = QFrame()
        sidebar.setObjectName("Sidebar")
        sidebar.setFixedWidth(78)
        layout = QVBoxLayout(sidebar)
        layout.setContentsMargins(6, 10, 6, 10)
        layout.setSpacing(8)

        categories = [
            ("🏠\nDefault", 0),
            ("📡\nStream", 1),
            ("✂️\nEdit", 2),
            ("🎮\nGaming", 3)
        ]

        self.sidebar_buttons = []
        for text, index in categories:
            btn = QPushButton(text)
            btn.setProperty("class", "SidebarBtn")
            btn.setFixedHeight(56)
            btn.setCursor(QCursor(Qt.CursorShape.PointingHandCursor))
            btn.clicked.connect(lambda checked, idx=index: self.change_category(idx))
            if index == 0:
                btn.setProperty("active", "true")
            self.sidebar_buttons.append(btn)
            layout.addWidget(btn)

        layout.addStretch(1)

        # Settings Icon / Refresh
        btn_reload = QPushButton("⚙️\nConfig")
        btn_reload.setProperty("class", "SidebarBtn")
        btn_reload.setFixedHeight(50)
        btn_reload.clicked.connect(self.open_config_file)
        layout.addWidget(btn_reload)

        return sidebar

    def change_category(self, index):
        self.category_stack.setCurrentIndex(index)
        for i, btn in enumerate(self.sidebar_buttons):
            btn.setProperty("active", "true" if i == index else "false")
            btn.style().unpolish(btn)
            btn.style().polish(btn)
        logger.info(f"Berpindah ke kategori index: {index}")

    # -------------------------------------------------------------------------
    # GRID KATEGORI 1: DEFAULT (Tampilan Utama yang diminta)
    # -------------------------------------------------------------------------
    def create_default_grid(self):
        grid_widget = QWidget()
        layout = QGridLayout(grid_widget)
        layout.setContentsMargins(4, 4, 4, 4)
        layout.setSpacing(8)

        # ROW 0: Mute Mic, Camera Toggle, CPU Status
        self.btn_mic = QPushButton("🎙️\n\nMute Mic")
        self.btn_mic.setProperty("class", "DeckBtnRed")
        self.btn_mic.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
        self.btn_mic.clicked.connect(self.toggle_mic)
        layout.addWidget(self.btn_mic, 0, 0)

        self.btn_cam = QPushButton("📹\n\nCamera Toggle")
        self.btn_cam.setProperty("class", "DeckBtnGreen")
        self.btn_cam.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
        self.btn_cam.clicked.connect(self.toggle_camera)
        layout.addWidget(self.btn_cam, 0, 1)

        self.btn_cpu = QPushButton("⚡\n\nCPU Usage: --%")
        self.btn_cpu.setProperty("class", "DeckBtnOrange")
        self.btn_cpu.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
        layout.addWidget(self.btn_cpu, 0, 2)

        # ROW 1: OBS Studio, Spotify, Discord
        self.btn_obs = QPushButton("🎦\n\nOBS Studio")
        self.btn_obs.setProperty("class", "DeckBtn")
        self.btn_obs.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
        self.btn_obs.clicked.connect(lambda: self.launch_app("obs", "obs64.exe"))
        layout.addWidget(self.btn_obs, 1, 0)

        self.btn_spotify = QPushButton("🎵\n\nSpotify")
        self.btn_spotify.setProperty("class", "DeckBtnGreen")
        self.btn_spotify.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
        self.btn_spotify.clicked.connect(lambda: self.launch_app("spotify", "spotify.exe", uri="spotify:"))
        layout.addWidget(self.btn_spotify, 1, 1)

        self.btn_discord = QPushButton("💬\n\nDiscord")
        self.btn_discord.setProperty("class", "DeckBtn")
        self.btn_discord.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
        self.btn_discord.clicked.connect(lambda: self.launch_app("discord", "discord.exe", uri="discord://"))
        layout.addWidget(self.btn_discord, 1, 2)

        # ROW 2: Go Live, Start Recording, Volume Control (+ & -)
        self.btn_golive = QPushButton("🔴\n\nGo Live")
        self.btn_golive.setProperty("class", "DeckBtnRed")
        self.btn_golive.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
        self.btn_golive.clicked.connect(self.toggle_golive)
        layout.addWidget(self.btn_golive, 2, 0)

        self.btn_rec = QPushButton("⏺️\n\nStart Recording")
        self.btn_rec.setProperty("class", "DeckBtn")
        self.btn_rec.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
        self.btn_rec.clicked.connect(self.toggle_recording)
        layout.addWidget(self.btn_rec, 2, 1)

        # Volume Container (Split horizontal + dan -)
        vol_widget = QWidget()
        vol_layout = QHBoxLayout(vol_widget)
        vol_layout.setContentsMargins(0, 0, 0, 0)
        vol_layout.setSpacing(6)

        self.btn_vol_up = QPushButton("🔊\nVol +")
        self.btn_vol_up.setProperty("class", "DeckBtn")
        self.btn_vol_up.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
        self.btn_vol_up.clicked.connect(lambda: self.change_volume(step=5))
        vol_layout.addWidget(self.btn_vol_up)

        self.btn_vol_down = QPushButton("🔉\nVol -")
        self.btn_vol_down.setProperty("class", "DeckBtn")
        self.btn_vol_down.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
        self.btn_vol_down.clicked.connect(lambda: self.change_volume(step=-5))
        vol_layout.addWidget(self.btn_vol_down)

        layout.addWidget(vol_widget, 2, 2)

        return grid_widget

    # -------------------------------------------------------------------------
    # GRID KATEGORI 2: STREAMING
    # -------------------------------------------------------------------------
    def create_streaming_grid(self):
        w = QWidget()
        layout = QGridLayout(w)
        layout.setContentsMargins(4, 4, 4, 4)
        layout.setSpacing(8)

        buttons = [
            ("🎬 Scene 1: Cam", "Scene Cam Aktif"),
            ("🖥️ Scene 2: Screen", "Scene Screen Aktif"),
            ("☕ Scene 3: BRB", "Scene Be Right Back Aktif"),
            ("🛑 Mute Stream", "Audio Stream Dimatikan"),
            ("💬 Chat Overlay", "Overlay Chat Ditampilkan"),
            ("🎉 Sound Effect 1", "Sound Played: Cheering"),
            ("💥 Sound Effect 2", "Sound Played: Airhorn"),
            ("⚡ Replay Last 30s", "Replay Buffer Saved"),
            ("📊 Stream Stats", "Menampilkan Bitrate/FPS")
        ]

        for i, (text, action_msg) in enumerate(buttons):
            r, c = divmod(i, 3)
            btn = QPushButton(f"{text}")
            btn.setProperty("class", "DeckBtn")
            btn.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
            btn.clicked.connect(lambda _, msg=action_msg: self.show_toast(msg))
            layout.addWidget(btn, r, c)

        return w

    # -------------------------------------------------------------------------
    # GRID KATEGORI 3: EDITING (Premiere / Photoshop / Resolve)
    # -------------------------------------------------------------------------
    def create_editing_grid(self):
        w = QWidget()
        layout = QGridLayout(w)
        layout.setContentsMargins(4, 4, 4, 4)
        layout.setSpacing(8)

        buttons = [
            ("✂️ Split / Razor (C)", "ctrl+k"),
            ("⏪ Ripple Delete", "shift+del"),
            ("🎯 Ripple Edit (B)", "b"),
            ("📌 Add Marker (M)", "m"),
            ("⚡ Render In to Out", "enter"),
            ("🎨 Color Grade", "Lumetri Panel"),
            ("🔊 Audio Normalization", "-3dB Peak"),
            ("💾 Quick Save", "ctrl+s"),
            ("📤 Export (Ctrl+M)", "ctrl+m")
        ]

        for i, (text, hotkey) in enumerate(buttons):
            r, c = divmod(i, 3)
            btn = QPushButton(f"{text}")
            btn.setProperty("class", "DeckBtn")
            btn.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
            btn.clicked.connect(lambda _, h=hotkey: self.show_toast(f"Hotkey/Action: {h}"))
            layout.addWidget(btn, r, c)

        return w

    # -------------------------------------------------------------------------
    # GRID KATEGORI 4: GAMING
    # -------------------------------------------------------------------------
    def create_gaming_grid(self):
        w = QWidget()
        layout = QGridLayout(w)
        layout.setContentsMargins(4, 4, 4, 4)
        layout.setSpacing(8)

        buttons = [
            ("🎮 Game Bar", "win+g"),
            ("📸 Screenshot", "win+prtscn"),
            ("🎙️ Discord Deafen", "ctrl+shift+d"),
            ("🌐 Google Chrome", "chrome"),
            ("🎧 EQ Bass Boost", "EQ Set to FPS Mode"),
            ("🚀 Game Booster", "RAM Cleaned"),
            ("⏱️ Speedrun Timer", "Timer Toggled"),
            ("🔇 Mute Game Audio", "Game Volume Muted"),
            ("⚙️ Performance Monitor", "Afterburner Toggled")
        ]

        for i, (text, act) in enumerate(buttons):
            r, c = divmod(i, 3)
            btn = QPushButton(f"{text}")
            btn.setProperty("class", "DeckBtn")
            btn.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
            btn.clicked.connect(lambda _, a=act: self.show_toast(f"Gaming Action: {a}"))
            layout.addWidget(btn, r, c)

        return w

    # -------------------------------------------------------------------------
    # PANEL SISI KANAN: YOUTUBE LIVE WIDGET
    # -------------------------------------------------------------------------
    def create_youtube_panel(self):
        card = QFrame()
        card.setObjectName("YouTubeCard")
        layout = QVBoxLayout(card)
        layout.setContentsMargins(8, 8, 8, 8)
        layout.setSpacing(6)

        # Tombol Atas: PLAY YOUTUBE LIVE
        self.btn_yt_play_top = QPushButton("▶ PLAY YOUTUBE LIVE")
        self.btn_yt_play_top.setProperty("class", "ActionBtn")
        self.btn_yt_play_top.setFixedHeight(34)
        self.btn_yt_play_top.clicked.connect(self.load_youtube_stream)
        layout.addWidget(self.btn_yt_play_top)

        # Widget Pemutar Video
        self.yt_stream_url = config.get(
            "YouTube", "stream_url",
            fallback="https://www.youtube.com/embed/live_stream?channel=UC4R8DWoMoI7CAwX8_bqQ5yA"
        )

        if HAS_WEBENGINE:
            self.web_view = QWebEngineView()
            self.web_view.settings().setAttribute(QWebEngineSettings.WebAttribute.PlaybackRequiresUserGesture, False)
            self.web_view.settings().setAttribute(QWebEngineSettings.WebAttribute.JavascriptEnabled, True)
            self.web_view.setUrl(QUrl(self.yt_stream_url))
            layout.addWidget(self.web_view, stretch=1)
        else:
            # Fallback jika QWebEngineView tidak didukung pada environment ini
            self.web_view = None
            fallback_label = QLabel(
                "📺 YouTube Live Viewer\n\n(QWebEngineView fallback mode)\nKlik tombol di bawah untuk membuka di browser"
            )
            fallback_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
            fallback_label.setStyleSheet("""
                background-color: #0b0d14;
                color: #94a3b8;
                border-radius: 8px;
                border: 1px dashed #334155;
                font-size: 11px;
                padding: 12px;
            """)
            layout.addWidget(fallback_label, stretch=1)

        # Baris Bawah: Play YouTube & Chat Pop-out
        bottom_bar = QHBoxLayout()
        bottom_bar.setSpacing(6)

        btn_yt_reload = QPushButton("▶ Play YouTube")
        btn_yt_reload.setProperty("class", "ActionBtn")
        btn_yt_reload.clicked.connect(self.load_youtube_stream)
        bottom_bar.addWidget(btn_yt_reload)

        btn_chat_pop = QPushButton("💬 Chat Pop-out")
        btn_chat_pop.setProperty("class", "ActionBtn")
        btn_chat_pop.clicked.connect(self.open_chat_popout)
        bottom_bar.addWidget(btn_chat_pop)

        layout.addLayout(bottom_bar)

        return card

    # -------------------------------------------------------------------------
    # AKSI DAN EVENT HANDLER
    # -------------------------------------------------------------------------
    def toggle_mic(self):
        self.is_mic_muted = not self.is_mic_muted
        if self.is_mic_muted:
            self.btn_mic.setText("🎙️\n\nMic Muted")
            self.btn_mic.setProperty("class", "DeckBtnRed")
            logger.info("Microphone di-mute.")
        else:
            self.btn_mic.setText("🎙️\n\nMic Active")
            self.btn_mic.setProperty("class", "DeckBtnGreen")
            logger.info("Microphone aktif.")
        self.btn_mic.style().unpolish(self.btn_mic)
        self.btn_mic.style().polish(self.btn_mic)

    def toggle_camera(self):
        self.is_camera_on = not self.is_camera_on
        if self.is_camera_on:
            self.btn_cam.setText("📹\n\nCamera ON")
            self.btn_cam.setProperty("class", "DeckBtnGreen")
            logger.info("Kamera aktif.")
        else:
            self.btn_cam.setText("📷\n\nCamera OFF")
            self.btn_cam.setProperty("class", "DeckBtnRed")
            logger.info("Kamera mati.")
        self.btn_cam.style().unpolish(self.btn_cam)
        self.btn_cam.style().polish(self.btn_cam)

    def toggle_golive(self):
        self.is_live = not self.is_live
        if self.is_live:
            self.btn_golive.setText("🔴\n\nLIVE ACTIVE")
            self.btn_golive.setStyleSheet("background-color: #ef4444; color: white; font-weight: bold;")
            logger.info("Status streaming: ON AIR!")
        else:
            self.btn_golive.setText("🔴\n\nGo Live")
            self.btn_golive.setStyleSheet("")
            self.btn_golive.setProperty("class", "DeckBtnRed")
            logger.info("Status streaming: OFF.")
        self.btn_golive.style().unpolish(self.btn_golive)
        self.btn_golive.style().polish(self.btn_golive)

    def toggle_recording(self):
        self.is_recording = not self.is_recording
        if self.is_recording:
            self.btn_rec.setText("⏺️\n\nRecording...")
            self.btn_rec.setProperty("class", "DeckBtnRed")
            logger.info("Perekaman video dimulai.")
        else:
            self.btn_rec.setText("⏺️\n\nStart Recording")
            self.btn_rec.setProperty("class", "DeckBtn")
            logger.info("Perekaman video dihentikan.")
        self.btn_rec.style().unpolish(self.btn_rec)
        self.btn_rec.style().polish(self.btn_rec)

    def change_volume(self, step=5):
        try:
            if volume_control:
                current_vol = volume_control.GetMasterVolumeLevelScalar()
                new_vol = max(0.0, min(1.0, current_vol + (step / 100.0)))
                volume_control.SetMasterVolumeLevelScalar(new_vol, None)
                logger.info(f"Volume diubah ke {int(new_vol * 100)}%")
                self.show_toast(f"Volume: {int(new_vol * 100)}%")
            else:
                logger.info(f"Simulasi penyesuaian volume: {step}%")
                self.show_toast(f"Volume Step: {step:+d}%")
        except Exception as e:
            logger.error(f"Gagal mengatur volume: {e}")

    def launch_app(self, key, default_exe, uri=None):
        logger.info(f"Mencoba membuka aplikasi: {key} ({default_exe})")
        app_path = config.get("Paths", key, fallback=default_exe)
        
        # Coba buka via URI protocol dahulu jika ada (misal spotify:, discord://)
        if uri:
            try:
                webbrowser.open(uri)
                logger.info(f"Berhasil membuka via URI: {uri}")
                return
            except Exception:
                pass

        # Coba jalankan file eksekusi
        try:
            if sys.platform == "win32":
                os.startfile(app_path)
            else:
                subprocess.Popen([app_path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            logger.info(f"Aplikasi {key} berhasil diluncurkan.")
        except Exception as err:
            logger.warning(f"Gagal membuka langsung: {err}. Mencoba via browser / fallback...")
            try:
                # Fallback ke web version jika desktop app tidak terinstall
                web_fallbacks = {
                    "spotify": "https://open.spotify.com",
                    "discord": "https://discord.com/app",
                    "obs": "https://obsproject.com",
                    "chrome": "https://google.com"
                }
                if key in web_fallbacks:
                    webbrowser.open(web_fallbacks[key])
            except Exception as e:
                logger.error(f"Gagal fallback: {e}")

    def load_youtube_stream(self):
        url = config.get("YouTube", "stream_url", fallback=self.yt_stream_url)
        logger.info(f"Memuat YouTube Live stream: {url}")
        if self.web_view:
            self.web_view.setUrl(QUrl(url))
        else:
            webbrowser.open(url)

    def open_chat_popout(self):
        chat_url = config.get("YouTube", "chat_url", fallback="https://www.youtube.com/live_chat?is_popout=1")
        logger.info(f"Membuka chat pop-out di browser: {chat_url}")
        webbrowser.open(chat_url)

    def open_config_file(self):
        try:
            if sys.platform == "win32":
                os.startfile(str(CONFIG_FILE))
            else:
                subprocess.Popen(["xdg-open", str(CONFIG_FILE)])
        except Exception as e:
            logger.error(f"Gagal membuka config.ini: {e}")
            self.show_toast(f"Config path: {CONFIG_FILE}")

    def show_toast(self, message):
        logger.info(f"Action triggered: {message}")
        self.status_label.setText(f"● {message[:24]}")
        QTimer.singleShot(3000, lambda: self.status_label.setText("● Connected"))

    # -------------------------------------------------------------------------
    # JADWAL SHOLAT WORKER
    # -------------------------------------------------------------------------
    def fetch_prayer_schedule(self):
        city = config.get("General", "city", fallback="Jakarta")
        country = config.get("General", "country", fallback="Indonesia")
        self.prayer_worker = PrayerScheduleWorker(city, country)
        self.prayer_worker.schedule_ready.connect(self.update_prayer_ui)
        self.prayer_worker.start()

    def update_prayer_ui(self, schedule):
        text = (
            f"JADWAL SHOLAT ({config.get('General', 'city', fallback='Jakarta')}) | "
            f"Subuh {schedule.get('Subuh')} | "
            f"Dzuhur {schedule.get('Dzuhur')} | "
            f"Ashar {schedule.get('Ashar')} | "
            f"Maghrib {schedule.get('Maghrib')} | "
            f"Isya {schedule.get('Isya')}"
        )
        self.prayer_label.setText(text)

    # -------------------------------------------------------------------------
    # TIMER REAL-TIME (JAM & CPU USAGE)
    # -------------------------------------------------------------------------
    def setup_timers(self):
        # 1. Timer Jam Digital (Tiap 1 detik)
        self.clock_timer = QTimer(self)
        self.clock_timer.timeout.connect(self.update_clock)
        self.clock_timer.start(1000)
        self.update_clock()

        # 2. Timer CPU Usage (Tiap 2 detik)
        interval = config.getint("General", "cpu_interval_ms", fallback=2000)
        self.cpu_timer = QTimer(self)
        self.cpu_timer.timeout.connect(self.update_cpu)
        self.cpu_timer.start(interval)
        self.update_cpu()

    def update_clock(self):
        now_str = datetime.now().strftime("%H:%M:%S")
        self.clock_label.setText(now_str)

    def update_cpu(self):
        if psutil:
            try:
                cpu_percent = psutil.cpu_percent(interval=None)
                # Dapatkan suhu jika didukung oleh sensor OS
                temp_str = ""
                try:
                    temps = psutil.sensors_temperatures()
                    if temps:
                        for name, entries in temps.items():
                            if entries:
                                temp_str = f" {int(entries[0].current)}°C"
                                break
                except Exception:
                    pass
                self.btn_cpu.setText(f"⚡{temp_str}\n\nCPU: {cpu_percent:.0f}%")
            except Exception as e:
                self.btn_cpu.setText("⚡\n\nCPU: N/A")
        else:
            self.btn_cpu.setText("⚡\n\nCPU: Active")

    # -------------------------------------------------------------------------
    # DRAG & MOVE SUPPORT UNTUK FRAMELESS WINDOW
    # -------------------------------------------------------------------------
    def mousePressEvent(self, event):
        if event.button() == Qt.MouseButton.LeftButton:
            self.drag_position = event.globalPosition().toPoint() - self.frameGeometry().topLeft()
            event.accept()

    def mouseMoveEvent(self, event):
        if event.buttons() == Qt.MouseButton.LeftButton and not self.drag_position.isNull():
            self.move(event.globalPosition().toPoint() - self.drag_position)
            event.accept()

    def keyPressEvent(self, event):
        # Tombol F11 untuk beralih fullscreen / windowed 1024x600
        if event.key() == Qt.Key.Key_F11:
            if self.isFullScreen():
                self.showNormal()
                self.setFixedSize(1024, 600)
            else:
                self.showFullScreen()
        elif event.key() == Qt.Key.Key_Escape:
            self.close()
        super().keyPressEvent(event)


# =============================================================================
# ENTRY POINT
# =============================================================================
def main():
    logger.info("Memulai aplikasi Macro Deck...")
    # Mengaktifkan High-DPI scaling
    os.environ["QT_AUTO_SCREEN_SCALE_FACTOR"] = "1"
    
    app = QApplication(sys.argv)
    app.setApplicationName("Macro Deck 7 Inch")
    
    window = MacroDeckWindow()
    window.show()
    
    sys.exit(app.exec())

if __name__ == "__main__":
    main()
