#!/usr/bin/env python3
"""
=============================================================================
MACRO DECK 7 INCH - LOCAL WEB APP SERVER
=============================================================================
Deskripsi : Web server lokal berbasis Python standar (Zero-Install / Anti-SmartScreen)
            yang menjalankan konsol Macro Deck 1024x600 di browser (Chrome / Edge).
Akses     : http://localhost:5000
Keunggulan: 100% AMAN di Laptop Kantor, tanpa file .exe, tanpa diblokir Windows Defender!
=============================================================================
"""

import sys
import os
import json
import time
import subprocess
import webbrowser
import configparser
from datetime import datetime
from pathlib import Path
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Port lokal
PORT = 5000
BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "web_client"
DECK_CONFIG_FILE = BASE_DIR / "deck_config.json"

# Optional libraries
try:
    import psutil
except ImportError:
    psutil = None

try:
    import requests
except ImportError:
    requests = None

# Audio volume (pycaw for Windows)
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
except Exception:
    volume_control = None

# Keyboard hotkeys
try:
    import keyboard
except ImportError:
    keyboard = None

# State lokal
DECK_STATE = {
    "mic_muted": True,
    "camera_on": True,
    "is_live": False,
    "is_recording": False,
    "recording_start": 0
}

def load_deck_config():
    if not DECK_CONFIG_FILE.exists():
        return {
            "settings": {
                "title": "Macro Deck 7 Inch",
                "city": "Jakarta",
                "country": "Indonesia",
                "stream_url": "https://www.youtube.com/embed/5qap5aO4i9A?autoplay=1",
                "chat_url": "https://www.youtube.com/live_chat?is_popout=1"
            },
            "sidebar": [
                {"id": "default", "label": "Default", "icon": "🏠"},
                {"id": "streaming", "label": "Stream", "icon": "📡"},
                {"id": "editing", "label": "Editing", "icon": "✂️"},
                {"id": "gaming", "label": "Gaming", "icon": "🎮"}
            ],
            "pages": {}
        }
    try:
        with open(DECK_CONFIG_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}

def save_deck_config(data):
    try:
        with open(DECK_CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving config: {e}")
        return False

# =============================================================================
# HTTP REQUEST HANDLER (REST API + STATIC FILES)
# =============================================================================
class MacroDeckWebHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(STATIC_DIR), **kwargs)

    def end_headers(self):
        # CORS & No-Cache
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # API: System Stats (CPU, RAM, Temp, State)
        if path == "/api/stats":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()

            cpu_pct = 0
            ram_pct = 0
            if psutil:
                try:
                    cpu_pct = psutil.cpu_percent(interval=None)
                    ram_pct = psutil.virtual_memory().percent
                except Exception:
                    pass

            vol_level = 70
            if volume_control:
                try:
                    vol_level = int(volume_control.GetMasterVolumeLevelScalar() * 100)
                except Exception:
                    pass

            response_data = {
                "cpu_percent": cpu_pct,
                "ram_percent": ram_pct,
                "volume": vol_level,
                "state": DECK_STATE,
                "time": datetime.now().strftime("%H:%M:%S")
            }
            self.wfile.write(json.dumps(response_data).encode("utf-8"))
            return

        # API: Deck Config
        elif path == "/api/config":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            cfg = load_deck_config()
            self.wfile.write(json.dumps(cfg).encode("utf-8"))
            return

        # API: Prayer Schedule (Jakarta / config city)
        elif path == "/api/prayer":
            query = parse_qs(parsed.query)
            city = query.get("city", ["Jakarta"])[0]

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()

            fallback = {
                "Subuh": "04:15", "Dzuhur": "11:45",
                "Ashar": "14:55", "Maghrib": "17:58", "Isya": "19:10",
                "source": "fallback"
            }

            if requests:
                try:
                    url = f"https://api.aladhan.com/v1/timingsByCity?city={city}&country=Indonesia&method=11"
                    r = requests.get(url, timeout=3)
                    if r.status_code == 200:
                        t = r.json().get("data", {}).get("timings", {})
                        fallback = {
                            "Subuh": t.get("Fajr", "04:15"),
                            "Dzuhur": t.get("Dhuhr", "11:45"),
                            "Ashar": t.get("Asr", "14:55"),
                            "Maghrib": t.get("Maghrib", "17:58"),
                            "Isya": t.get("Isha", "19:10"),
                            "source": "api"
                        }
                except Exception:
                    pass

            self.wfile.write(json.dumps(fallback).encode("utf-8"))
            return

        # Static files
        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        content_length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(content_length).decode("utf-8")
        body = {}
        if post_data:
            try:
                body = json.loads(post_data)
            except Exception:
                pass

        # API: Trigger Deck Action
        if path == "/api/action":
            btn_type = body.get("type", "hotkey")
            action = body.get("action", "")
            label = body.get("label", "Action")

            print(f"[ACTION TRIGGERED] {label} | Type: {btn_type} | Action: {action}")
            result_msg = f"Executed {label}"

            # 1. Internal Actions
            if btn_type == "internal":
                if action == "mute_mic":
                    DECK_STATE["mic_muted"] = not DECK_STATE["mic_muted"]
                    result_msg = "Mic Muted" if DECK_STATE["mic_muted"] else "Mic Active"
                elif action == "camera_toggle":
                    DECK_STATE["camera_on"] = not DECK_STATE["camera_on"]
                    result_msg = "Camera ON" if DECK_STATE["camera_on"] else "Camera OFF"
                elif action == "golive_toggle":
                    DECK_STATE["is_live"] = not DECK_STATE["is_live"]
                    result_msg = "Broadcast LIVE!" if DECK_STATE["is_live"] else "Stream Offline"
                elif action == "record_toggle":
                    DECK_STATE["is_recording"] = not DECK_STATE["is_recording"]
                    result_msg = "Recording Started" if DECK_STATE["is_recording"] else "Recording Saved"
                elif action == "volume_up":
                    self.adjust_volume(5)
                    result_msg = "Volume +5%"
                elif action == "volume_down":
                    self.adjust_volume(-5)
                    result_msg = "Volume -5%"

            # 2. Hotkey Action
            elif btn_type == "hotkey":
                try:
                    if keyboard:
                        keyboard.send(action)
                        result_msg = f"Hotkey sent: {action}"
                    elif sys.platform == "win32":
                        # Native Windows PowerShell sendkeys fallback
                        ps_cmd = f'$wshell = New-Object -ComObject wscript.shell; $wshell.SendKeys("{action}")'
                        subprocess.Popen(["powershell", "-Command", ps_cmd])
                        result_msg = f"Key simulated: {action}"
                except Exception as e:
                    result_msg = f"Hotkey error: {e}"

            # 3. App Shortcut
            elif btn_type == "shortcut":
                try:
                    if sys.platform == "win32":
                        os.startfile(action)
                    else:
                        subprocess.Popen([action], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                    result_msg = f"Launched: {action}"
                except Exception as e:
                    # Fallback ke browser jika URI
                    try:
                        webbrowser.open(action)
                        result_msg = f"Opened via URI: {action}"
                    except Exception:
                        result_msg = f"Failed to launch: {e}"

            # 4. Hyperlink
            elif btn_type == "hyperlink":
                try:
                    webbrowser.open(action)
                    result_msg = f"Opened link: {action}"
                except Exception as e:
                    result_msg = f"Error opening link: {e}"

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "message": result_msg, "state": DECK_STATE}).encode("utf-8"))
            return

        # API: Save Deck Config
        elif path == "/api/config":
            success = save_deck_config(body)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"success": success}).encode("utf-8"))
            return

        self.send_response(404)
        self.end_headers()

    def adjust_volume(self, delta):
        try:
            if volume_control:
                curr = volume_control.GetMasterVolumeLevelScalar()
                nxt = max(0.0, min(1.0, curr + (delta / 100.0)))
                volume_control.SetMasterVolumeLevelScalar(nxt, None)
            elif sys.platform == "win32":
                # Fallback via NirCmd / PowerShell
                step = 655.35 * delta
                cmd = f"(new-object -com wscript.shell).SendKeys([char]17{4 if delta < 0 else 5})"
                subprocess.Popen(["powershell", "-Command", cmd])
        except Exception as e:
            print(f"Volume error: {e}")

# =============================================================================
# MAIN SERVER RUNNER
# =============================================================================
def main():
    print("=" * 60)
    print("  MACRO DECK 7 INCH - LOCAL WEB SERVER")
    print("=" * 60)
    print(f"-> Melayani di: http://localhost:{PORT}")
    print(f"-> Folder client: {STATIC_DIR}")
    print("-> Tekan Ctrl+C untuk menghentikan server.")
    print("=" * 60)

    # Pastikan folder client ada
    STATIC_DIR.mkdir(parents=True, exist_ok=True)

    server = HTTPServer(("0.0.0.0", PORT), MacroDeckWebHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer dihentikan.")
        server.server_close()

if __name__ == "__main__":
    main()
