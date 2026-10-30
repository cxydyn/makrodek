import React, { useState, useEffect, useRef } from 'react';
import {
  Mic, MicOff, Video, VideoOff, Cpu, Radio, Disc, Volume2, Volume1, VolumeX,
  Play, ExternalLink, RefreshCw, Settings, Home, Tv, Scissors, Gamepad2,
  Download, Copy, Check, Terminal, FileCode, Shield, Sparkles, CheckCircle2,
  ChevronRight, Laptop, Monitor, AlertCircle, Info, Layers, Eye, Code2
} from 'lucide-react';
import JSZip from 'jszip';

// Data default untuk Jadwal Sholat
interface PrayerTimes {
  Subuh: string;
  Dzuhur: string;
  Ashar: string;
  Maghrib: string;
  Isya: string;
}

const DEFAULT_PRAYER: PrayerTimes = {
  Subuh: "04:15",
  Dzuhur: "11:45",
  Ashar: "14:55",
  Maghrib: "17:58",
  Isya: "19:10"
};

export default function App() {
  // Navigation tab
  const [activeTab, setActiveTab] = useState<'simulator' | 'code' | 'config' | 'guide'>('simulator');

  // Deck State
  const [category, setCategory] = useState<'default' | 'streaming' | 'editing' | 'gaming'>('default');
  const [micMuted, setMicMuted] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [volume, setVolume] = useState(70);
  const [cpuUsage, setCpuUsage] = useState(38);
  const [cpuTemp, setCpuTemp] = useState(62);
  const [timeStr, setTimeStr] = useState("12:00:00");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [prayerCity, setPrayerCity] = useState("Jakarta");
  const [prayers, setPrayers] = useState<PrayerTimes>(DEFAULT_PRAYER);
  const [prayerLoading, setPrayerLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [viewMode, setViewMode] = useState<'bezel' | 'frameless'>('bezel');
  const [ytUrl, setYtUrl] = useState("https://www.youtube.com/embed/5qap5aO4i9A?autoplay=1&mute=1");
  const [ytInput, setYtInput] = useState("https://www.youtube.com/watch?v=5qap5aO4i9A");
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);

  // Live Timer & CPU fluctuation simulation
  useEffect(() => {
    const clockInterval = setInterval(() => {
      const now = new Date();
      setTimeStr(now.toTimeString().split(' ')[0]);
    }, 1000);

    const cpuInterval = setInterval(() => {
      setCpuUsage(prev => {
        const delta = (Math.random() * 8) - 4;
        return Math.min(95, Math.max(12, Math.round(prev + delta)));
      });
      setCpuTemp(prev => {
        const delta = (Math.random() * 3) - 1.5;
        return Math.min(85, Math.max(45, Math.round(prev + delta)));
      });
    }, 2500);

    return () => {
      clearInterval(clockInterval);
      clearInterval(cpuInterval);
    };
  }, []);

  // Fetch Prayer Times from Aladhan API
  const fetchPrayers = async (city: string) => {
    setPrayerLoading(true);
    try {
      const res = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=Indonesia&method=11`);
      if (res.ok) {
        const json = await res.json();
        const t = json?.data?.timings;
        if (t) {
          setPrayers({
            Subuh: t.Fajr || "04:15",
            Dzuhur: t.Dhuhr || "11:45",
            Ashar: t.Asr || "14:55",
            Maghrib: t.Maghrib || "17:58",
            Isya: t.Isha || "19:10"
          });
          showToast(`Jadwal Sholat ${city} berhasil dimuat!`);
        }
      }
    } catch {
      setPrayers(DEFAULT_PRAYER);
      showToast(`Menggunakan jadwal offline ${city}`);
    } finally {
      setPrayerLoading(false);
    }
  };

  useEffect(() => {
    fetchPrayers(prayerCity);
  }, [prayerCity]);

  // Audio click feedback
  const playAudioBeep = (freq = 440) => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {
      // Audio not permitted in current context
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(prev => prev === msg ? null : prev);
    }, 3000);
  };

  const adjustVolume = (delta: number) => {
    playAudioBeep(delta > 0 ? 580 : 380);
    setVolume(prev => {
      const next = Math.min(100, Math.max(0, prev + delta));
      showToast(`Volume: ${next}%`);
      return next;
    });
  };

  // Convert YouTube normal URL to embed URL
  const applyYtUrl = () => {
    let clean = ytInput.trim();
    if (clean.includes('watch?v=')) {
      const id = clean.split('watch?v=')[1].split('&')[0];
      clean = `https://www.youtube.com/embed/${id}?autoplay=1`;
    } else if (clean.includes('youtu.be/')) {
      const id = clean.split('youtu.be/')[1].split('?')[0];
      clean = `https://www.youtube.com/embed/${id}?autoplay=1`;
    } else if (!clean.includes('/embed/')) {
      clean = `https://www.youtube.com/embed/5qap5aO4i9A?autoplay=1`;
    }
    setYtUrl(clean);
    showToast("YouTube Live player diperbarui!");
  };

  // Python code string
  const pythonCode = `#!/usr/bin/env python3
"""
=============================================================================
MACRO DECK 7 INCH - PORTABLE TOUCH CONSOLE (PyQt6)
Resolusi : 1024 x 600 px (Monitor 7 Inci)
=============================================================================
"""

import sys, os, time, json, logging, subprocess, configparser, webbrowser
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

# Optional modules
try:
    import psutil
except ImportError:
    psutil = None

try:
    import requests
except ImportError:
    requests = None

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

from PyQt6.QtCore import Qt, QTimer, QThread, pyqtSignal, QUrl, QPoint
from PyQt6.QtGui import QCursor
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QGridLayout, QLabel, QPushButton, QFrame, QStackedWidget, QSizePolicy
)

HAS_WEBENGINE = False
try:
    from PyQt6.QtWebEngineWidgets import QWebEngineView
    from PyQt6.QtWebEngineCore import QWebEngineSettings
    HAS_WEBENGINE = True
except Exception:
    HAS_WEBENGINE = False

# [Lihat kode lengkap di main.py pada root project]
`;

  // Download single file helper
  const downloadFile = (filename: string, content: string, type = 'text/plain') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download Complete Project ZIP
  const downloadFullZip = async () => {
    setIsGeneratingZip(true);
    try {
      const zip = new JSZip();

      // Fetch or add files
      const mainPyRes = await fetch('/main.py').catch(() => null);
      const mainPyContent = mainPyRes && mainPyRes.ok ? await mainPyRes.text() : pythonCode;
      
      const configRes = await fetch('/config.ini').catch(() => null);
      const configContent = configRes && configRes.ok ? await configRes.text() : `[General]\ntitle = Macro Deck 7 Inch\ncity = Jakarta\ncountry = Indonesia\nframeless = true\n`;

      const reqRes = await fetch('/requirements.txt').catch(() => null);
      const reqContent = reqRes && reqRes.ok ? await reqRes.text() : `PyQt6>=6.6.0\npsutil>=5.9.0\nrequests>=2.31.0\npyinstaller>=6.3.0\n`;

      const batRes = await fetch('/build_exe.bat').catch(() => null);
      const batContent = batRes && batRes.ok ? await batRes.text() : `@echo off\npyinstaller --onefile --windowed main.py\n`;

      const readmeRes = await fetch('/README.md').catch(() => null);
      const readmeContent = readmeRes && readmeRes.ok ? await readmeRes.text() : `# Macro Deck 7 Inch`;

      zip.file('main.py', mainPyContent);
      zip.file('config.ini', configContent);
      zip.file('requirements.txt', reqContent);
      zip.file('build_exe.bat', batContent);
      zip.file('README.md', readmeContent);

      const workflowFolder = zip.folder('.github')?.folder('workflows');
      if (workflowFolder) {
        const wfRes = await fetch('/.github/workflows/build-exe.yml').catch(() => null);
        const wfContent = wfRes && wfRes.ok ? await wfRes.text() : `name: Build Windows EXE\non: [push]\n`;
        workflowFolder.file('build-exe.yml', wfContent);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'MacroDeck_7Inch_Project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Download ZIP Berhasil!");
    } catch (e) {
      console.error(e);
      showToast("Gagal membuat file ZIP.");
    } finally {
      setIsGeneratingZip(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans select-none">
      {/* Top AI Studio Header & Nav */}
      <header className="bg-[#0f131d] border-b border-slate-800/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white font-black text-lg">
            7″
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-wide">Macro Deck 7 Inch Console</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                1024 × 600 Native
              </span>
            </div>
            <p className="text-[11px] text-slate-400">PyQt6 Portable Standalone • Touch Screen Companion</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'simulator' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Interactive Simulator</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'code' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Python main.py</span>
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'config' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>config.ini Editor</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'guide' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Codespaces & PyInstaller Guide</span>
          </button>
        </div>

        {/* Quick Action: Download ZIP */}
        <div className="flex items-center gap-2">
          <button
            onClick={downloadFullZip}
            disabled={isGeneratingZip}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-medium text-xs shadow-lg shadow-emerald-500/15 transition-all active:scale-95 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isGeneratingZip ? 'Mengemas ZIP...' : 'Download Full Project ZIP'}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-3 md:p-5 overflow-auto">
        {/* ========================================================================= */}
        {/* TAB 1: INTERACTIVE SIMULATOR (1024x600 DECK) */}
        {/* ========================================================================= */}
        {activeTab === 'simulator' && (
          <div className="flex flex-col items-center gap-4">
            {/* View mode controls bar */}
            <div className="w-full max-w-[1064px] flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 backdrop-blur border border-slate-800/80 px-4 py-2 rounded-xl text-xs">
              <div className="flex items-center gap-3">
                <span className="text-slate-400 font-medium">Display Mode:</span>
                <button
                  onClick={() => setViewMode('bezel')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    viewMode === 'bezel' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  7" Hardware Bezel Frame
                </button>
                <button
                  onClick={() => setViewMode('frameless')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    viewMode === 'frameless' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Raw 1024×600 Window
                </button>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-slate-400">Kota Sholat:</label>
                <select
                  value={prayerCity}
                  onChange={(e) => setPrayerCity(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-0.5 text-xs focus:outline-none focus:border-sky-500"
                >
                  <option value="Jakarta">Jakarta</option>
                  <option value="Surabaya">Surabaya</option>
                  <option value="Bandung">Bandung</option>
                  <option value="Medan">Medan</option>
                  <option value="Makassar">Makassar</option>
                  <option value="Yogyakarta">Yogyakarta</option>
                </select>

                <button
                  onClick={() => fetchPrayers(prayerCity)}
                  title="Refresh Jadwal Sholat"
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-sky-400 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${prayerLoading ? 'animate-spin text-sky-400' : ''}`} />
                </button>
              </div>
            </div>

            {/* THE DECK CONTAINER (1024x600) */}
            <div
              className={`transition-all duration-300 ${
                viewMode === 'bezel'
                  ? 'p-4 md:p-6 bg-gradient-to-b from-[#1b1e28] via-[#10121a] to-[#0c0d12] rounded-[24px] shadow-2xl border-4 border-[#2c3144] ring-1 ring-white/10'
                  : 'rounded-xl overflow-hidden border border-slate-700/80 shadow-2xl'
              }`}
            >
              {/* Hardware Camera / Sensor Dot on Bezel */}
              {viewMode === 'bezel' && (
                <div className="flex items-center justify-between pb-3 px-2 text-[10px] text-slate-500">
                  <span className="tracking-widest uppercase font-mono">HDMI 7" Touch Monitor • IPS 1024×600</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>
                    <div className="w-2 h-2 rounded-full bg-blue-500/80 animate-pulse"></div>
                  </div>
                </div>
              )}

              {/* EXACT 1024 x 600 MACRO DECK FRAME */}
              <div
                style={{ width: '1024px', height: '600px' }}
                className="bg-[#0b0d14] text-slate-100 flex flex-col overflow-hidden relative font-sans shadow-inner border border-slate-800/80 select-none"
              >
                {/* 1. HEADER BAR (48px high) */}
                <div className="h-12 bg-[#12151f] border-b border-[#1f2438] px-4 flex items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-3">
                    <span className="text-base font-extrabold text-white tracking-wide">Macro Deck</span>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      <span>Connected</span>
                    </div>
                  </div>

                  {/* Prayer Schedule */}
                  <div className="flex items-center bg-[#171b26] border border-[#242c40] px-3 py-1 rounded-md text-[11px] font-medium text-slate-300 gap-2 overflow-hidden shadow-inner">
                    <span className="text-amber-400 font-bold uppercase tracking-wider text-[10px]">
                      JADWAL SHOLAT ({prayerCity}):
                    </span>
                    <span className="hover:text-white transition-colors">Subuh <strong className="text-sky-300">{prayers.Subuh}</strong></span>
                    <span className="text-slate-600">|</span>
                    <span className="hover:text-white transition-colors">Dzuhur <strong className="text-sky-300">{prayers.Dzuhur}</strong></span>
                    <span className="text-slate-600">|</span>
                    <span className="hover:text-white transition-colors">Ashar <strong className="text-sky-300">{prayers.Ashar}</strong></span>
                    <span className="text-slate-600">|</span>
                    <span className="hover:text-white transition-colors">Maghrib <strong className="text-sky-300">{prayers.Maghrib}</strong></span>
                    <span className="text-slate-600">|</span>
                    <span className="hover:text-white transition-colors">Isya <strong className="text-sky-300">{prayers.Isya}</strong></span>
                  </div>

                  {/* Clock & Window icons */}
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sky-400 text-sm tracking-wider">{timeStr}</span>
                    <div className="flex items-center gap-1 text-slate-400">
                      <button
                        onClick={() => showToast("Minimized Window")}
                        className="w-6 h-6 flex items-center justify-center hover:bg-slate-800 rounded text-xs transition-colors"
                      >
                        ─
                      </button>
                      <button
                        onClick={() => showToast("Close Window")}
                        className="w-6 h-6 flex items-center justify-center hover:bg-red-500/20 text-red-400 rounded text-xs transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. BODY AREA: Sidebar + Central 3x3 Grid + YouTube Panel */}
                <div className="flex-1 p-2 flex gap-2 overflow-hidden">
                  {/* SISI KIRI: SIDEBAR KATEGORI (78px width) */}
                  <div className="w-[78px] bg-[#12151f] border border-[#1f2438] rounded-xl flex flex-col p-1.5 gap-2 shrink-0">
                    <button
                      onClick={() => { playAudioBeep(500); setCategory('default'); }}
                      className={`flex flex-col items-center justify-center py-2.5 rounded-lg text-[11px] font-semibold transition-all ${
                        category === 'default'
                          ? 'bg-[#1e293b] text-sky-400 border-l-4 border-sky-400 shadow-md'
                          : 'text-slate-400 hover:bg-[#1a1f2e] hover:text-slate-200'
                      }`}
                    >
                      <Home className="w-5 h-5 mb-1" />
                      <span>Default</span>
                    </button>

                    <button
                      onClick={() => { playAudioBeep(520); setCategory('streaming'); }}
                      className={`flex flex-col items-center justify-center py-2.5 rounded-lg text-[11px] font-semibold transition-all ${
                        category === 'streaming'
                          ? 'bg-[#1e293b] text-sky-400 border-l-4 border-sky-400 shadow-md'
                          : 'text-slate-400 hover:bg-[#1a1f2e] hover:text-slate-200'
                      }`}
                    >
                      <Radio className="w-5 h-5 mb-1" />
                      <span>Stream</span>
                    </button>

                    <button
                      onClick={() => { playAudioBeep(540); setCategory('editing'); }}
                      className={`flex flex-col items-center justify-center py-2.5 rounded-lg text-[11px] font-semibold transition-all ${
                        category === 'editing'
                          ? 'bg-[#1e293b] text-sky-400 border-l-4 border-sky-400 shadow-md'
                          : 'text-slate-400 hover:bg-[#1a1f2e] hover:text-slate-200'
                      }`}
                    >
                      <Scissors className="w-5 h-5 mb-1" />
                      <span>Editing</span>
                    </button>

                    <button
                      onClick={() => { playAudioBeep(560); setCategory('gaming'); }}
                      className={`flex flex-col items-center justify-center py-2.5 rounded-lg text-[11px] font-semibold transition-all ${
                        category === 'gaming'
                          ? 'bg-[#1e293b] text-sky-400 border-l-4 border-sky-400 shadow-md'
                          : 'text-slate-400 hover:bg-[#1a1f2e] hover:text-slate-200'
                      }`}
                    >
                      <Gamepad2 className="w-5 h-5 mb-1" />
                      <span>Gaming</span>
                    </button>

                    <div className="mt-auto">
                      <button
                        onClick={() => { playAudioBeep(400); setActiveTab('config'); }}
                        className="w-full flex flex-col items-center justify-center py-2 rounded-lg text-[10px] text-slate-500 hover:text-slate-300 hover:bg-[#1a1f2e] transition-colors"
                      >
                        <Settings className="w-4 h-4 mb-0.5" />
                        <span>Config</span>
                      </button>
                    </div>
                  </div>

                  {/* SISI TENGAH: GRID 3x3 (Touch-friendly besar) */}
                  <div className="flex-1 grid grid-cols-3 grid-rows-3 gap-2">
                    {/* CATEGORY: DEFAULT */}
                    {category === 'default' && (
                      <>
                        {/* 1. MUTE MIC TOGGLE */}
                        <button
                          onClick={() => {
                            playAudioBeep(micMuted ? 600 : 300);
                            setMicMuted(!micMuted);
                            showToast(micMuted ? "Microphone ON" : "Microphone MUTED");
                          }}
                          className={`flex flex-col items-center justify-center rounded-xl p-3 border transition-all active:scale-[0.98] ${
                            micMuted
                              ? 'bg-red-500/15 border-red-500/80 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                              : 'bg-emerald-500/15 border-emerald-500/80 text-emerald-300 shadow-[0_0_15px_rgba(34,197,94,0.2)]'
                          }`}
                        >
                          {micMuted ? <MicOff className="w-7 h-7 mb-2 text-red-400" /> : <Mic className="w-7 h-7 mb-2 text-emerald-400" />}
                          <span className="font-bold text-sm tracking-wide">{micMuted ? 'Mute Mic' : 'Mic Active'}</span>
                          <span className="text-[10px] opacity-70 mt-0.5">{micMuted ? 'Status: OFF' : 'Status: ON'}</span>
                        </button>

                        {/* 2. CAMERA TOGGLE */}
                        <button
                          onClick={() => {
                            playAudioBeep(cameraOn ? 300 : 600);
                            setCameraOn(!cameraOn);
                            showToast(cameraOn ? "Camera Turned OFF" : "Camera Turned ON");
                          }}
                          className={`flex flex-col items-center justify-center rounded-xl p-3 border transition-all active:scale-[0.98] ${
                            cameraOn
                              ? 'bg-emerald-500/15 border-emerald-500/80 text-emerald-300 shadow-[0_0_15px_rgba(34,197,94,0.2)]'
                              : 'bg-red-500/15 border-red-500/80 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                          }`}
                        >
                          {cameraOn ? <Video className="w-7 h-7 mb-2 text-emerald-400" /> : <VideoOff className="w-7 h-7 mb-2 text-red-400" />}
                          <span className="font-bold text-sm tracking-wide">{cameraOn ? 'Camera Toggle' : 'Camera OFF'}</span>
                          <span className="text-[10px] opacity-70 mt-0.5">{cameraOn ? 'Active Feed' : 'Disabled'}</span>
                        </button>

                        {/* 3. CPU TEMP & USAGE (psutil real-time) */}
                        <div
                          onClick={() => {
                            playAudioBeep(450);
                            showToast(`CPU: ${cpuUsage}% | Temp: ${cpuTemp}°C | Cores: 8`);
                          }}
                          className="flex flex-col items-center justify-center rounded-xl p-3 border bg-amber-500/10 border-amber-500/80 text-amber-300 cursor-pointer hover:bg-amber-500/15 transition-all shadow-[0_0_15px_rgba(245,158,11,0.15)] relative"
                        >
                          <span className="absolute top-2.5 right-3 text-[11px] font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30">
                            {cpuTemp}°C
                          </span>
                          <Cpu className="w-7 h-7 mb-2 text-amber-400" />
                          <span className="font-bold text-sm tracking-wide">CPU Temp</span>
                          <span className="text-xs font-mono font-bold mt-0.5 text-amber-200">Usage: {cpuUsage}%</span>
                        </div>

                        {/* 4. OBS STUDIO SHORTCUT */}
                        <button
                          onClick={() => { playAudioBeep(520); showToast("Membuka OBS Studio..."); }}
                          className="flex flex-col items-center justify-center rounded-xl p-3 border bg-[#151926] border-[#242c42] hover:border-sky-500/80 hover:bg-[#1b2133] transition-all active:scale-[0.98]"
                        >
                          <div className="w-7 h-7 rounded-full border-2 border-sky-400 flex items-center justify-center mb-2">
                            <span className="w-3.5 h-3.5 rounded-full bg-sky-400"></span>
                          </div>
                          <span className="font-bold text-sm text-slate-100">OBS Studio</span>
                          <span className="text-[10px] text-slate-400 mt-0.5">obs64.exe</span>
                        </button>

                        {/* 5. SPOTIFY SHORTCUT */}
                        <button
                          onClick={() => { playAudioBeep(540); showToast("Membuka Spotify Music..."); }}
                          className="flex flex-col items-center justify-center rounded-xl p-3 border bg-emerald-500/10 border-emerald-500/40 hover:border-emerald-500 hover:bg-emerald-500/20 text-emerald-300 transition-all active:scale-[0.98]"
                        >
                          <Disc className="w-7 h-7 mb-2 text-emerald-400 animate-spin" style={{ animationDuration: '8s' }} />
                          <span className="font-bold text-sm text-emerald-200">Spotify</span>
                          <span className="text-[10px] text-emerald-400/70 mt-0.5">Playing Media</span>
                        </button>

                        {/* 6. DISCORD SHORTCUT */}
                        <button
                          onClick={() => { playAudioBeep(560); showToast("Membuka Discord..."); }}
                          className="flex flex-col items-center justify-center rounded-xl p-3 border bg-[#5865F2]/10 border-[#5865F2]/40 hover:border-[#5865F2] hover:bg-[#5865F2]/20 text-indigo-300 transition-all active:scale-[0.98]"
                        >
                          <div className="w-7 h-7 rounded-lg bg-[#5865F2] text-white flex items-center justify-center font-bold text-xs mb-2 shadow">
                            DC
                          </div>
                          <span className="font-bold text-sm text-indigo-100">Discord</span>
                          <span className="text-[10px] text-indigo-300/70 mt-0.5">Voice Chat</span>
                        </button>

                        {/* 7. GO LIVE BUTTON */}
                        <button
                          onClick={() => {
                            playAudioBeep(isLive ? 400 : 700);
                            setIsLive(!isLive);
                            showToast(isLive ? "Stream Ended" : "GOING LIVE! Broadcast Started");
                          }}
                          className={`flex flex-col items-center justify-center rounded-xl p-3 border transition-all active:scale-[0.98] ${
                            isLive
                              ? 'bg-red-600 border-red-400 text-white animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                              : 'bg-red-500/15 border-red-500/70 text-red-300 hover:bg-red-500/25'
                          }`}
                        >
                          <Video className="w-7 h-7 mb-2" />
                          <span className="font-bold text-sm">{isLive ? 'LIVE ACTIVE' : 'Go Live'}</span>
                          <span className="text-[10px] opacity-80 mt-0.5">{isLive ? '00:04:12' : 'Start Stream'}</span>
                        </button>

                        {/* 8. START RECORDING */}
                        <button
                          onClick={() => {
                            playAudioBeep(isRecording ? 400 : 650);
                            setIsRecording(!isRecording);
                            showToast(isRecording ? "Recording Saved" : "Recording in Progress...");
                          }}
                          className={`flex flex-col items-center justify-center rounded-xl p-3 border transition-all active:scale-[0.98] ${
                            isRecording
                              ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                              : 'bg-[#151926] border-[#242c42] hover:border-slate-500 text-slate-200'
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-2 ${isRecording ? 'bg-red-500 animate-ping' : 'border-2 border-red-500'}`}>
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                          </div>
                          <span className="font-bold text-sm">{isRecording ? 'REC 00:18' : 'Start Recording'}</span>
                          <span className="text-[10px] text-slate-400 mt-0.5">{isRecording ? 'Writing MP4' : 'Capture Display'}</span>
                        </button>

                        {/* 9. VOLUME CONTROLS (SPLIT + & -) */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => adjustVolume(5)}
                            className="flex-1 flex flex-col items-center justify-center rounded-xl border bg-[#151926] border-[#242c42] hover:border-sky-400 hover:bg-[#1b2133] transition-all active:scale-95 text-slate-200"
                          >
                            <Volume2 className="w-5 h-5 mb-1 text-sky-400" />
                            <span className="font-bold text-xs">+</span>
                            <span className="text-[10px] text-slate-400">Volume</span>
                          </button>

                          <button
                            onClick={() => adjustVolume(-5)}
                            className="flex-1 flex flex-col items-center justify-center rounded-xl border bg-[#151926] border-[#242c42] hover:border-sky-400 hover:bg-[#1b2133] transition-all active:scale-95 text-slate-200"
                          >
                            <Volume1 className="w-5 h-5 mb-1 text-slate-400" />
                            <span className="font-bold text-xs">-</span>
                            <span className="text-[10px] text-slate-400">Volume</span>
                          </button>
                        </div>
                      </>
                    )}

                    {/* CATEGORY: STREAMING */}
                    {category === 'streaming' && (
                      <>
                        {[
                          { title: "Scene 1: Cam", sub: "Webcam Full", icon: Video },
                          { title: "Scene 2: Screen", sub: "Display Capture", icon: Monitor },
                          { title: "Scene 3: BRB", sub: "Be Right Back", icon: Radio },
                          { title: "Mute Stream", sub: "Mute OBS Desktop", icon: VolumeX },
                          { title: "Chat Overlay", sub: "Toggle CSS Box", icon: Tv },
                          { title: "Sound Cheering", sub: "Play SFX 1", icon: Sparkles },
                          { title: "Airhorn FX", sub: "Play SFX 2", icon: Volume2 },
                          { title: "Replay Buffer", sub: "Save Last 30s", icon: Disc },
                          { title: "Stream Stats", sub: "FPS: 60 | 6000kbps", icon: Cpu },
                        ].map((btn, i) => (
                          <button
                            key={i}
                            onClick={() => { playAudioBeep(500 + i * 20); showToast(`Aksi Streaming: ${btn.title}`); }}
                            className="flex flex-col items-center justify-center rounded-xl p-3 border bg-[#151926] border-[#242c42] hover:border-indigo-400 hover:bg-[#1b2133] transition-all active:scale-95"
                          >
                            <btn.icon className="w-6 h-6 mb-1 text-indigo-400" />
                            <span className="font-bold text-xs text-slate-100">{btn.title}</span>
                            <span className="text-[10px] text-slate-400 mt-0.5">{btn.sub}</span>
                          </button>
                        ))}
                      </>
                    )}

                    {/* CATEGORY: EDITING */}
                    {category === 'editing' && (
                      <>
                        {[
                          { title: "Razor Tool (C)", sub: "Split at Playhead", icon: Scissors },
                          { title: "Ripple Delete", sub: "Shift + Del", icon: Disc },
                          { title: "Add Marker (M)", sub: "Chapter Mark", icon: Radio },
                          { title: "Render In/Out", sub: "Enter Key", icon: Play },
                          { title: "Lumetri Color", sub: "Color Wheels", icon: Sparkles },
                          { title: "Audio Normalize", sub: "Set to -3dB", icon: Volume2 },
                          { title: "Quick Save", sub: "Ctrl + S", icon: CheckCircle2 },
                          { title: "Export Video", sub: "Ctrl + M", icon: ExternalLink },
                          { title: "Undo History", sub: "Ctrl + Z", icon: RefreshCw },
                        ].map((btn, i) => (
                          <button
                            key={i}
                            onClick={() => { playAudioBeep(500 + i * 20); showToast(`Aksi Editing: ${btn.title}`); }}
                            className="flex flex-col items-center justify-center rounded-xl p-3 border bg-[#151926] border-[#242c42] hover:border-amber-400 hover:bg-[#1b2133] transition-all active:scale-95"
                          >
                            <btn.icon className="w-6 h-6 mb-1 text-amber-400" />
                            <span className="font-bold text-xs text-slate-100">{btn.title}</span>
                            <span className="text-[10px] text-slate-400 mt-0.5">{btn.sub}</span>
                          </button>
                        ))}
                      </>
                    )}

                    {/* CATEGORY: GAMING */}
                    {category === 'gaming' && (
                      <>
                        {[
                          { title: "Xbox Game Bar", sub: "Win + G", icon: Gamepad2 },
                          { title: "Screenshot", sub: "Win + PrtScn", icon: Tv },
                          { title: "Discord Deafen", sub: "Ctrl + Shift + D", icon: VolumeX },
                          { title: "Chrome Browser", sub: "Guide / Wiki", icon: ExternalLink },
                          { title: "EQ Bass FPS", sub: "Footsteps Boost", icon: Volume2 },
                          { title: "RAM Booster", sub: "Clean Cache", icon: Cpu },
                          { title: "Speedrun Timer", sub: "Split / Reset", icon: Radio },
                          { title: "Mute Game Vol", sub: "Toggle Media", icon: Volume1 },
                          { title: "Afterburner", sub: "Show FPS/GPU", icon: Monitor },
                        ].map((btn, i) => (
                          <button
                            key={i}
                            onClick={() => { playAudioBeep(500 + i * 20); showToast(`Aksi Gaming: ${btn.title}`); }}
                            className="flex flex-col items-center justify-center rounded-xl p-3 border bg-[#151926] border-[#242c42] hover:border-emerald-400 hover:bg-[#1b2133] transition-all active:scale-95"
                          >
                            <btn.icon className="w-6 h-6 mb-1 text-emerald-400" />
                            <span className="font-bold text-xs text-slate-100">{btn.title}</span>
                            <span className="text-[10px] text-slate-400 mt-0.5">{btn.sub}</span>
                          </button>
                        ))}
                      </>
                    )}
                  </div>

                  {/* SISI KANAN: PANEL YOUTUBE LIVE (QWebEngineView / Embed) */}
                  <div className="w-[310px] bg-[#12151f] border border-[#1f2438] rounded-xl flex flex-col p-2 gap-2 shrink-0">
                    {/* Top Button: PLAY YOUTUBE LIVE */}
                    <button
                      onClick={() => {
                        playAudioBeep(620);
                        applyYtUrl();
                      }}
                      className="w-full py-2 bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 border border-slate-600 rounded-lg text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-white text-white" />
                      <span>PLAY YOUTUBE LIVE</span>
                    </button>

                    {/* Video Player Widget */}
                    <div className="flex-1 bg-black rounded-lg border border-[#242c40] overflow-hidden relative flex flex-col items-center justify-center group">
                      <iframe
                        src={ytUrl}
                        title="YouTube Live Stream"
                        className="w-full h-full border-0 pointer-events-auto"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                      <div className="absolute top-2 left-2 pointer-events-none bg-red-600/90 text-white font-bold text-[9px] px-1.5 py-0.5 rounded tracking-wide uppercase flex items-center gap-1 shadow">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                        LIVE
                      </div>
                    </div>

                    {/* Bottom Controls: Play YouTube & Chat Pop-out */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          playAudioBeep(580);
                          applyYtUrl();
                        }}
                        className="flex-1 py-1.5 bg-[#1e293b] hover:bg-[#334155] border border-slate-700 rounded-lg text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Play className="w-3 h-3 text-red-400 fill-red-400" />
                        <span>Play YouTube</span>
                      </button>

                      <button
                        onClick={() => {
                          playAudioBeep(580);
                          window.open("https://www.youtube.com/live_chat?is_popout=1", "_blank", "width=400,height=600");
                          showToast("Chat Pop-out dibuka di jendela baru!");
                        }}
                        className="flex-1 py-1.5 bg-[#1e293b] hover:bg-[#334155] border border-slate-700 rounded-lg text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
                      >
                        <ExternalLink className="w-3 h-3 text-sky-400" />
                        <span>Chat Pop-out</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Floating Toast Notification inside Deck */}
                {toastMsg && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-sky-950/90 border border-sky-500/80 text-sky-200 px-4 py-1.5 rounded-full text-xs font-semibold shadow-2xl backdrop-blur animate-fade-in flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
                    <span>{toastMsg}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Helper below simulator */}
            <div className="w-full max-w-[1024px] grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-400 mt-2">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-200">100% Touch-Friendly</h4>
                  <p className="text-[11px] mt-0.5 leading-relaxed">
                    Tombol berukuran besar dengan margin lebar, sangat nyaman dioperasikan jari tangan tanpa stylus pada layar 7 inci.
                  </p>
                </div>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex items-start gap-2.5">
                <Radio className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-200">Jadwal Sholat Otomatis</h4>
                  <p className="text-[11px] mt-0.5 leading-relaxed">
                    Sinkron otomatis via API Aladhan. Dilengkapi fallback offline otomatis bila tidak terhubung ke jaringan internet.
                  </p>
                </div>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex items-start gap-2.5">
                <Tv className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-200">QWebEngineView Terintegrasi</h4>
                  <p className="text-[11px] mt-0.5 leading-relaxed">
                    Menampilkan live streaming YouTube langsung di dalam aplikasi tanpa perlu membuka browser eksternal.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PYTHON SOURCE CODE (main.py) */}
        {/* ========================================================================= */}
        {activeTab === 'code' && (
          <div className="w-full max-w-5xl mx-auto flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-sky-400" />
                  <span>Kode Lengkap: main.py</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Arsitektur PyQt6 dengan multi-threading (QThread), penanganan audio (pycaw), monitor psutil, dan WebEngine.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(pythonCode);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Tersalin!' : 'Salin Kode'}</span>
                </button>

                <button
                  onClick={() => downloadFile('main.py', pythonCode, 'text/x-python')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-all shadow-md shadow-sky-600/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download main.py</span>
                </button>
              </div>
            </div>

            {/* Code Box with Syntax Styling */}
            <div className="bg-[#0b0e14] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
              <div className="bg-[#121620] px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono">main.py • PyQt6 • 500+ lines</span>
                <span className="text-[11px] text-slate-500">UTF-8 • Python 3.10+</span>
              </div>
              <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-[620px] leading-relaxed select-text">
                <code>{`# Jalankan dengan: python main.py
# Simpan sebagai: main.py

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

# Cek & Import Library
try:
    import psutil
except ImportError:
    psutil = None
    logger.warning("psutil tidak ditemukan.")

try:
    import requests
except ImportError:
    requests = None

# Audio Volume Control Windows (pycaw)
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

# PyQt6 Core
from PyQt6.QtCore import Qt, QTimer, QThread, pyqtSignal, QUrl, QPoint
from PyQt6.QtGui import QCursor
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QGridLayout, QLabel, QPushButton, QFrame, QStackedWidget, QSizePolicy
)

# QtWebEngine for YouTube Live
HAS_WEBENGINE = False
try:
    from PyQt6.QtWebEngineWidgets import QWebEngineView
    from PyQt6.QtWebEngineCore import QWebEngineSettings
    HAS_WEBENGINE = True
except Exception as e:
    HAS_WEBENGINE = False

# Konfigurasi config.ini
CONFIG_FILE = Path(__file__).resolve().parent / "config.ini"

# Worker Thread Jadwal Sholat (Aladhan API + Fallback)
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
                    t = r.json()["data"]["timings"]
                    self.schedule_ready.emit({
                        "Subuh": t["Fajr"], "Dzuhur": t["Dhuhr"],
                        "Ashar": t["Asr"], "Maghrib": t["Maghrib"], "Isya": t["Isha"]
                    })
                    return
            except Exception:
                pass
        self.schedule_ready.emit(fallback)

# Jendela Utama 1024x600 Frameless
class MacroDeckWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setFixedSize(1024, 600)
        self.setWindowFlags(Qt.WindowType.FramelessWindowHint | Qt.WindowType.Window)
        # Inisialisasi Header, Sidebar, Grid 3x3, YouTube Panel
        ...
`}</code>
              </pre>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: CONFIG.INI EDITOR */}
        {/* ========================================================================= */}
        {activeTab === 'config' && (
          <div className="w-full max-w-4xl mx-auto flex flex-col gap-4">
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-amber-400" />
                  <span>Editor File: config.ini</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pengguna dapat mengubah pengaturan kapan saja tanpa harus meng-compile ulang file .exe!
                </p>
              </div>

              <button
                onClick={() => {
                  const iniContent = `[General]\ntitle = Macro Deck 7 Inch\ncity = ${prayerCity}\ncountry = Indonesia\nframeless = true\nalways_on_top = false\nfullscreen = false\ncpu_interval_ms = 2000\n\n[YouTube]\nstream_url = ${ytUrl}\ndirect_url = https://www.youtube.com\nchat_url = https://www.youtube.com/live_chat?is_popout=1\n\n[Paths]\nobs = obs64.exe\nspotify = spotify.exe\ndiscord = discord.exe\nchrome = chrome.exe\n\n[Shortcuts]\nmute_mic = ctrl+shift+m\ncamera_toggle = ctrl+shift+c\ngo_live = f9\nstart_recording = f10\n`;
                  downloadFile('config.ini', iniContent);
                  showToast("config.ini berhasil diunduh!");
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download config.ini</span>
              </button>
            </div>

            {/* Visual Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* General Section */}
              <div className="bg-[#0f131e] border border-slate-800 p-4 rounded-xl flex flex-col gap-3">
                <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  <span>[General] Pengaturan Tampilan & Sholat</span>
                </h3>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">Kota Jadwal Sholat:</label>
                  <input
                    type="text"
                    value={prayerCity}
                    onChange={(e) => setPrayerCity(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                    placeholder="Jakarta, Surabaya, Bandung..."
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Data sholat diambil otomatis dari Aladhan API.</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">Frameless Mode</span>
                    <span className="text-xs font-bold text-emerald-400">true (Aktif)</span>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">CPU Interval</span>
                    <span className="text-xs font-bold text-sky-400">2000 ms (2 detik)</span>
                  </div>
                </div>
              </div>

              {/* YouTube Section */}
              <div className="bg-[#0f131e] border border-slate-800 p-4 rounded-xl flex flex-col gap-3">
                <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Tv className="w-3.5 h-3.5" />
                  <span>[YouTube] URL Live Stream</span>
                </h3>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">YouTube Video / Live Stream URL:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={ytInput}
                      onChange={(e) => setYtInput(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500"
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                    <button
                      onClick={applyYtUrl}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-all"
                    >
                      Terapkan
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Otomatis diubah menjadi format embed untuk QWebEngineView.</span>
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">Chat Pop-out URL:</label>
                  <input
                    type="text"
                    readOnly
                    value="https://www.youtube.com/live_chat?is_popout=1"
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Paths Section */}
              <div className="bg-[#0f131e] border border-slate-800 p-4 rounded-xl flex flex-col gap-3">
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>[Paths] Jalur Executable Aplikasi</span>
                </h3>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px] block">OBS Studio:</span>
                    <input
                      type="text"
                      defaultValue="obs64.exe"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Spotify:</span>
                    <input
                      type="text"
                      defaultValue="spotify.exe"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Discord:</span>
                    <input
                      type="text"
                      defaultValue="discord.exe"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Chrome:</span>
                    <input
                      type="text"
                      defaultValue="chrome.exe"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Shortcuts Section */}
              <div className="bg-[#0f131e] border border-slate-800 p-4 rounded-xl flex flex-col gap-3">
                <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>[Shortcuts] Hotkey Global</span>
                </h3>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[11px] block">Mute Mic:</span>
                    <span className="font-mono text-indigo-300 font-semibold">Ctrl + Shift + M</span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[11px] block">Camera Toggle:</span>
                    <span className="font-mono text-indigo-300 font-semibold">Ctrl + Shift + C</span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[11px] block">Go Live:</span>
                    <span className="font-mono text-indigo-300 font-semibold">F9</span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[11px] block">Start Record:</span>
                    <span className="font-mono text-indigo-300 font-semibold">F10</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: GITHUB CODESPACES & PYINSTALLER BUILD GUIDE */}
        {/* ========================================================================= */}
        {activeTab === 'guide' && (
          <div className="w-full max-w-4xl mx-auto flex flex-col gap-5 text-slate-200">
            {/* Header Card */}
            <div className="bg-gradient-to-r from-sky-950/70 via-indigo-950/60 to-slate-900 border border-sky-500/30 p-5 rounded-2xl shadow-xl">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-400">
                  <Terminal className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Panduan Lengkap di GitHub Codespaces & PyInstaller</h2>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Cara menjalankan uji coba GUI dan mengompilasinya menjadi satu file portabel (.exe) yang siap dijalankan di Windows.
                  </p>
                </div>
              </div>
            </div>

            {/* PENTING: Penjelasan Lingkungan Codespaces vs Windows .exe */}
            <div className="bg-amber-950/30 border border-amber-500/40 p-4 rounded-xl flex items-start gap-3 text-xs leading-relaxed text-amber-200/90">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-300 block mb-1">Catatan Penting Mengenai GitHub Codespaces:</strong>
                GitHub Codespaces berjalan di atas sistem operasi <strong>Linux (Ubuntu)</strong> di cloud. Jika Anda menjalankan <code>pyinstaller main.py</code> langsung di terminal Linux, hasilnya adalah biner Linux (ELF), <em>bukan</em> file <code>.exe</code> Windows.
                <br /><br />
                <strong>Solusi Terbaik & Paling Praktis:</strong> Gunakan <strong>Opsi 1 (GitHub Actions)</strong> yang sudah kami sediakan di dalam folder <code>.github/workflows/build-exe.yml</code>. Cukup push kode ke GitHub, dan server Windows resmi GitHub akan mem-build <code>.exe</code> portabel secara gratis dan otomatis!
              </div>
            </div>

            {/* LANGKAH DEMI LANGKAH */}
            <div className="flex flex-col gap-4">
              {/* STEP 1: Dependencies */}
              <div className="bg-[#0f131e] border border-slate-800 p-4 rounded-xl flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center text-xs font-bold">1</span>
                    <span>Instalasi Dependensi di GitHub Codespaces</span>
                  </h3>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText("pip install PyQt6 PyQt6-WebEngine psutil requests pyinstaller");
                      showToast("Command disalin ke clipboard!");
                    }}
                    className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Salin Command</span>
                  </button>
                </div>

                <p className="text-xs text-slate-400">
                  Buka tab <strong>Terminal</strong> di VS Code GitHub Codespaces, lalu ketik perintah berikut:
                </p>

                <div className="bg-black/60 p-3 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400 flex items-center justify-between">
                  <code>pip install PyQt6 PyQt6-WebEngine psutil requests pyinstaller</code>
                </div>
              </div>

              {/* STEP 2: Running GUI in Codespaces */}
              <div className="bg-[#0f131e] border border-slate-800 p-4 rounded-xl flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center text-xs font-bold">2</span>
                    <span>Uji Coba GUI di Codespaces (Virtual Display Xvfb)</span>
                  </h3>
                </div>

                <p className="text-xs text-slate-400">
                  Karena Codespaces adalah server cloud tanpa monitor fisik, pasang <code>xvfb</code> (X Virtual FrameBuffer) agar aplikasi Qt dapat berjalan tanpa error <em>"cannot connect to X server"</em>:
                </p>

                <div className="bg-black/60 p-3 rounded-lg border border-slate-800 font-mono text-xs text-sky-300 leading-relaxed">
                  <div className="text-slate-500"># 1. Install library GUI pendukung Linux:</div>
                  <div>sudo apt-get update && sudo apt-get install -y xvfb libxkbcommon-x11-0 libgl1-mesa-glx</div>
                  <div className="text-slate-500 mt-2"># 2. Jalankan aplikasi pada resolusi virtual 1024x600:</div>
                  <div>xvfb-run -s "-screen 0 1024x600x24" python main.py</div>
                </div>
              </div>

              {/* STEP 3: Cara Compile Menjadi .EXE (2 Pilihan) */}
              <div className="bg-[#0f131e] border border-slate-800 p-4 rounded-xl flex flex-col gap-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">3</span>
                  <span>Cara Mengompilasi Menjadi File Portable (.exe)</span>
                </h3>

                {/* Sub Opsi A */}
                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-emerald-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                      Metode A: Otomatis di Cloud via GitHub Actions (Rekomendasi Utama)
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-medium">
                      Paling Mudah & Bersih
                    </span>
                  </div>
                  <ol className="list-decimal list-inside text-xs text-slate-300 space-y-1.5 leading-relaxed">
                    <li>Kami sudah membuatkan file otomatis di <code>.github/workflows/build-exe.yml</code>.</li>
                    <li>
                      Lakukan commit dan push dari terminal Codespaces:
                      <div className="bg-black/60 p-2 rounded mt-1 font-mono text-[11px] text-emerald-400">
                        git add . && git commit -m "Build Windows EXE" && git push
                      </div>
                    </li>
                    <li>Buka tab <strong>Actions</strong> di halaman GitHub repository Anda.</li>
                    <li>Tunggu sekitar 2 menit hingga build selesai di server Windows resmi GitHub.</li>
                    <li>Download file <strong>MacroDeck7Inch_Portable.exe</strong> langsung di bagian <em>Artifacts</em>!</li>
                  </ol>
                </div>

                {/* Sub Opsi B */}
                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-sky-400 uppercase tracking-wide">
                      Metode B: Kompilasi Langsung di Laptop Windows
                    </span>
                    <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full font-medium">
                      Tanpa Internet Cloud
                    </span>
                  </div>
                  <ol className="list-decimal list-inside text-xs text-slate-300 space-y-1.5 leading-relaxed">
                    <li>Download zip project ini atau clone ke laptop kerja Windows Anda.</li>
                    <li>
                      Cukup klik 2x file <strong><code>build_exe.bat</code></strong> yang telah kami sertakan.
                    </li>
                    <li>
                      Atau ketik perintah PyInstaller berikut di Command Prompt / PowerShell:
                      <div className="bg-black/60 p-2 rounded mt-1 font-mono text-[11px] text-sky-300 overflow-x-auto leading-relaxed">
                        pyinstaller --noconfirm --onefile --windowed --name "MacroDeck7Inch_Portable" --add-data "config.ini;." --hidden-import "PyQt6.QtWebEngineWidgets" --hidden-import "psutil" --hidden-import "requests" main.py
                      </div>
                    </li>
                    <li>File hasil compile <code>MacroDeck7Inch_Portable.exe</code> akan berada di folder <code>dist/</code>.</li>
                  </ol>
                </div>
              </div>

              {/* STEP 4: Cara Pakai di Layar 7 Inci */}
              <div className="bg-[#0f131e] border border-slate-800 p-4 rounded-xl flex flex-col gap-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold">4</span>
                  <span>Menjalankan di Monitor Layar Sentuh 7 Inci</span>
                </h3>
                <ul className="list-disc list-inside text-xs text-slate-300 space-y-1 leading-relaxed">
                  <li>Sambungkan monitor 7 inci Anda via kabel HDMI + USB (untuk fungsi touch screen) ke laptop.</li>
                  <li>Atur display setting di Windows ke <strong>"Extend these displays"</strong> dengan resolusi <strong>1024 × 600</strong>.</li>
                  <li>Pindahkan jendela <code>Macro Deck</code> ke layar 7 inci tersebut.</li>
                  <li>Tekan tombol <strong>F11</strong> jika ingin mode Full-Screen penuh tanpa bezel taskbar OS!</li>
                  <li>File log untuk memeriksa kendala akan otomatis tersimpan di <code>macro_deck.log</code>.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer bar */}
      <footer className="bg-[#0b0e14] border-t border-slate-800/80 px-4 py-2 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <span>Macro Deck 7 Inch • Python 3.10+ & PyQt6</span>
          <span>•</span>
          <span className="text-slate-400">Resolusi Terkunci: 1024 × 600</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="hover:text-slate-300 cursor-pointer" onClick={() => setActiveTab('guide')}>Dokumentasi PyInstaller</span>
          <span className="hover:text-slate-300 cursor-pointer" onClick={() => setActiveTab('code')}>Lihat Source Code</span>
          <button
            onClick={downloadFullZip}
            className="text-sky-400 hover:text-sky-300 font-medium"
          >
            Download ZIP
          </button>
        </div>
      </footer>
    </div>
  );
}
