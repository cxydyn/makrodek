import React, { useState, useEffect } from 'react';
import {
  Mic, MicOff, Video, VideoOff, Cpu, Radio, Disc, Volume2, Volume1, VolumeX,
  Play, ExternalLink, RefreshCw, Settings, Home, Tv, Scissors, Gamepad2,
  Download, Copy, Check, Terminal, FileCode, Shield, Sparkles, CheckCircle2,
  Layers, Info, GitBranch, Github, Edit3, Plus, Trash2, ArrowUpRight,
  Sliders, Palette, Link, Keyboard, PlayCircle, FolderOpen, AlertCircle
} from 'lucide-react';
import JSZip from 'jszip';

// Struktur Tombol & Deck
interface DeckButton {
  id: string;
  label: string;
  sublabel: string;
  icon: string;
  type: 'shortcut' | 'hotkey' | 'hyperlink' | 'internal';
  action: string;
  color: 'default' | 'red' | 'green' | 'orange' | 'blue' | 'purple';
}

interface SidebarItem {
  id: string;
  label: string;
  icon: string;
}

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

const DEFAULT_SIDEBAR: SidebarItem[] = [
  { id: 'default', label: 'Default', icon: '🏠' },
  { id: 'streaming', label: 'Stream', icon: '📡' },
  { id: 'editing', label: 'Editing', icon: '✂️' },
  { id: 'gaming', label: 'Gaming', icon: '🎮' }
];

const DEFAULT_PAGES: Record<string, DeckButton[]> = {
  default: [
    { id: 'b1', label: 'Mute Mic', sublabel: 'Status: OFF', icon: '🎙️', type: 'internal', action: 'mute_mic', color: 'red' },
    { id: 'b2', label: 'Camera Toggle', sublabel: 'Active Feed', icon: '📹', type: 'internal', action: 'camera_toggle', color: 'green' },
    { id: 'b3', label: 'CPU Temp', sublabel: 'Usage: --%', icon: '⚡', type: 'internal', action: 'cpu_stat', color: 'orange' },
    { id: 'b4', label: 'OBS Studio', sublabel: 'obs64.exe', icon: '🎦', type: 'shortcut', action: 'obs64.exe', color: 'default' },
    { id: 'b5', label: 'Spotify', sublabel: 'Music Player', icon: '🎵', type: 'shortcut', action: 'spotify.exe', color: 'green' },
    { id: 'b6', label: 'Discord', sublabel: 'Voice Chat', icon: '💬', type: 'shortcut', action: 'discord.exe', color: 'default' },
    { id: 'b7', label: 'Go Live', sublabel: 'Start Stream', icon: '🔴', type: 'internal', action: 'golive_toggle', color: 'red' },
    { id: 'b8', label: 'Start Recording', sublabel: 'Capture Display', icon: '⏺️', type: 'internal', action: 'record_toggle', color: 'default' },
    { id: 'b9', label: 'Volume Controls', sublabel: '+ / -', icon: '🔊', type: 'internal', action: 'volume_split', color: 'default' }
  ],
  streaming: [
    { id: 'st1', label: 'Scene Cam', sublabel: 'Webcam Full', icon: '📹', type: 'hotkey', action: 'ctrl+f1', color: 'default' },
    { id: 'st2', label: 'Scene Screen', sublabel: 'Display Capture', icon: '🖥️', type: 'hotkey', action: 'ctrl+f2', color: 'default' },
    { id: 'st3', label: 'Scene BRB', sublabel: 'Be Right Back', icon: '☕', type: 'hotkey', action: 'ctrl+f3', color: 'default' },
    { id: 'st4', label: 'Mute Stream', sublabel: 'Mixer Master', icon: '🔇', type: 'hotkey', action: 'ctrl+shift+m', color: 'red' },
    { id: 'st5', label: 'Chat Overlay', sublabel: 'Toggle Box', icon: '💬', type: 'hotkey', action: 'ctrl+f5', color: 'default' },
    { id: 'st6', label: 'Cheering SFX', sublabel: 'Soundboard 1', icon: '🎉', type: 'hotkey', action: 'ctrl+num1', color: 'purple' },
    { id: 'st7', label: 'Airhorn SFX', sublabel: 'Soundboard 2', icon: '💥', type: 'hotkey', action: 'ctrl+num2', color: 'orange' },
    { id: 'st8', label: 'Save Replay', sublabel: 'Last 30s Buffer', icon: '⚡', type: 'hotkey', action: 'f12', color: 'blue' },
    { id: 'st9', label: 'Twitch Studio', sublabel: 'Creator Hub', icon: '🌐', type: 'hyperlink', action: 'https://dashboard.twitch.tv', color: 'purple' }
  ],
  editing: [
    { id: 'ed1', label: 'Razor Tool', sublabel: 'Split Track (C)', icon: '✂️', type: 'hotkey', action: 'c', color: 'default' },
    { id: 'ed2', label: 'Ripple Delete', sublabel: 'Shift + Del', icon: '⏪', type: 'hotkey', action: 'shift+delete', color: 'red' },
    { id: 'ed3', label: 'Add Marker', sublabel: 'Marker (M)', icon: '📌', type: 'hotkey', action: 'm', color: 'default' },
    { id: 'ed4', label: 'Render In/Out', sublabel: 'Enter Key', icon: '⚡', type: 'hotkey', action: 'enter', color: 'orange' },
    { id: 'ed5', label: 'Color Grade', sublabel: 'Lumetri Panel', icon: '🎨', type: 'hotkey', action: 'shift+7', color: 'blue' },
    { id: 'ed6', label: 'Quick Save', sublabel: 'Ctrl + S', icon: '💾', type: 'hotkey', action: 'ctrl+s', color: 'green' },
    { id: 'ed7', label: 'Export Video', sublabel: 'Ctrl + M', icon: '📤', type: 'hotkey', action: 'ctrl+m', color: 'purple' },
    { id: 'ed8', label: 'Undo Action', sublabel: 'Ctrl + Z', icon: '↩️', type: 'hotkey', action: 'ctrl+z', color: 'default' },
    { id: 'ed9', label: 'Audio Library', sublabel: 'Epidemic Sound', icon: '🌐', type: 'hyperlink', action: 'https://www.epidemicsound.com', color: 'blue' }
  ],
  gaming: [
    { id: 'gm1', label: 'Xbox Game Bar', sublabel: 'Win + G', icon: '🎮', type: 'hotkey', action: 'win+g', color: 'green' },
    { id: 'gm2', label: 'Screenshot', sublabel: 'Win + PrtScn', icon: '📸', type: 'hotkey', action: 'win+printscreen', color: 'default' },
    { id: 'gm3', label: 'Discord Deafen', sublabel: 'Mute Voice', icon: '🔇', type: 'hotkey', action: 'ctrl+shift+d', color: 'red' },
    { id: 'gm4', label: 'Steam Client', sublabel: 'Launcher', icon: '🚀', type: 'shortcut', action: 'steam.exe', color: 'blue' },
    { id: 'gm5', label: 'Chrome Wiki', sublabel: 'Game Guide', icon: '🌐', type: 'hyperlink', action: 'https://www.google.com', color: 'default' },
    { id: 'gm6', label: 'FPS Monitor', sublabel: 'RTSS Overlay', icon: '📊', type: 'hotkey', action: 'f11', color: 'orange' },
    { id: 'gm7', label: 'Speedrun Timer', sublabel: 'LiveSplit', icon: '⏱️', type: 'hotkey', action: 'num1', color: 'purple' },
    { id: 'gm8', label: 'Pause Music', sublabel: 'Play / Pause', icon: '⏹️', type: 'hotkey', action: 'playpause', color: 'default' },
    { id: 'gm9', label: 'Game Wiki', sublabel: 'Fandom Guides', icon: '🌐', type: 'hyperlink', action: 'https://fandom.com', color: 'blue' }
  ]
};

const COLOR_CLASSES: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  default: { bg: 'bg-[#151926]', border: 'border-[#242c42]', text: 'text-slate-100', glow: 'hover:border-sky-400' },
  red: { bg: 'bg-red-500/15', border: 'border-red-500/80', text: 'text-red-200', glow: 'shadow-[0_0_15px_rgba(239,68,68,0.2)]' },
  green: { bg: 'bg-emerald-500/15', border: 'border-emerald-500/80', text: 'text-emerald-200', glow: 'shadow-[0_0_15px_rgba(34,197,94,0.2)]' },
  orange: { bg: 'bg-amber-500/15', border: 'border-amber-500/80', text: 'text-amber-200', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.2)]' },
  blue: { bg: 'bg-sky-500/15', border: 'border-sky-500/80', text: 'text-sky-200', glow: 'shadow-[0_0_15px_rgba(56,189,248,0.2)]' },
  purple: { bg: 'bg-purple-500/15', border: 'border-purple-500/80', text: 'text-purple-200', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.2)]' }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'builder' | 'github' | 'code' | 'guide'>('simulator');

  // Deck Customization State
  const [sidebarItems, setSidebarItems] = useState<SidebarItem[]>(DEFAULT_SIDEBAR);
  const [activeCategoryId, setActiveCategoryId] = useState<string>('default');
  const [pages, setPages] = useState<Record<string, DeckButton[]>>(DEFAULT_PAGES);

  // Active Button Edit Modal
  const [editingBtn, setEditingBtn] = useState<{ pageId: string; index: number; data: DeckButton } | null>(null);

  // Deck Runtime Status
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
  const [viewMode, setViewMode] = useState<'bezel' | 'frameless'>('bezel');
  const [ytUrl, setYtUrl] = useState("https://www.youtube.com/embed/5qap5aO4i9A?autoplay=1&mute=1");
  const [ytInput, setYtInput] = useState("https://www.youtube.com/watch?v=5qap5aO4i9A");
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);

  // GitHub Push Assistant State
  const [repoUrlInput, setRepoUrlInput] = useState("");
  const [copiedGitCmd, setCopiedGitCmd] = useState(false);

  // Clock & CPU simulation
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

  // Fetch Prayers
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
    } finally {
      setPrayerLoading(false);
    }
  };

  useEffect(() => {
    fetchPrayers(prayerCity);
  }, [prayerCity]);

  // Audio feedback
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
      // Audio not permitted
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

  const handleButtonClick = (btn: DeckButton, index: number) => {
    playAudioBeep(480 + index * 20);

    if (btn.type === 'internal') {
      if (btn.action === 'mute_mic') {
        setMicMuted(!micMuted);
        showToast(micMuted ? "Mic ON" : "Mic MUTED");
      } else if (btn.action === 'camera_toggle') {
        setCameraOn(!cameraOn);
        showToast(cameraOn ? "Camera OFF" : "Camera ON");
      } else if (btn.action === 'golive_toggle') {
        setIsLive(!isLive);
        showToast(isLive ? "Stream Ended" : "BROADCAST ACTIVE!");
      } else if (btn.action === 'record_toggle') {
        setIsRecording(!isRecording);
        showToast(isRecording ? "Recording Saved" : "Recording in progress...");
      } else if (btn.action === 'cpu_stat') {
        showToast(`CPU: ${cpuUsage}% | Temp: ${cpuTemp}°C`);
      }
    } else if (btn.type === 'hyperlink') {
      showToast(`Membuka: ${btn.label} (${btn.action})`);
      window.open(btn.action, '_blank');
    } else if (btn.type === 'shortcut') {
      showToast(`[Shortcut App] Menjalankan: ${btn.action}`);
    } else if (btn.type === 'hotkey') {
      showToast(`[Hotkey Sent]: ${btn.action.toUpperCase()}`);
    }
  };

  // Button Edit Save
  const saveEditedButton = (updated: DeckButton) => {
    if (!editingBtn) return;
    const currentList = [...(pages[editingBtn.pageId] || [])];
    currentList[editingBtn.index] = updated;
    setPages({
      ...pages,
      [editingBtn.pageId]: currentList
    });
    setEditingBtn(null);
    showToast(`Tombol "${updated.label}" berhasil diperbarui!`);
  };

  // Add New Category in Sidebar
  const addCategory = () => {
    const newId = `cat_${Date.now()}`;
    const newCat: SidebarItem = {
      id: newId,
      label: `Tab Baru`,
      icon: `⭐`
    };
    setSidebarItems([...sidebarItems, newCat]);
    setPages({
      ...pages,
      [newId]: Array(9).fill(null).map((_, i) => ({
        id: `btn_${newId}_${i}`,
        label: `Tombol ${i + 1}`,
        sublabel: `Hotkey/Web`,
        icon: `⚡`,
        type: `hotkey`,
        action: `ctrl+${i + 1}`,
        color: `default`
      }))
    });
    setActiveCategoryId(newId);
    showToast("Kategori baru berhasil ditambahkan!");
  };

  // Delete Category
  const removeCategory = (id: string) => {
    if (sidebarItems.length <= 1) {
      showToast("Minimal harus ada 1 kategori!");
      return;
    }
    const filtered = sidebarItems.filter(item => item.id !== id);
    setSidebarItems(filtered);
    if (activeCategoryId === id) {
      setActiveCategoryId(filtered[0].id);
    }
    showToast("Kategori dihapus.");
  };

  // Download Single File
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

  // Export deck_config.json
  const exportDeckConfigJson = () => {
    const configData = {
      settings: {
        title: "Macro Deck 7 Inch",
        city: prayerCity,
        country: "Indonesia",
        frameless: true,
        always_on_top: false,
        fullscreen: false,
        cpu_interval_ms: 2000,
        stream_url: ytUrl,
        chat_url: "https://www.youtube.com/live_chat?is_popout=1"
      },
      sidebar: sidebarItems,
      pages: pages
    };
    return JSON.stringify(configData, null, 2);
  };

  // Download Full ZIP
  const downloadFullZip = async () => {
    setIsGeneratingZip(true);
    try {
      const zip = new JSZip();

      // Fetch or inject files
      const mainPyRes = await fetch('/main.py').catch(() => null);
      const mainPyContent = mainPyRes && mainPyRes.ok ? await mainPyRes.text() : "";

      const reqRes = await fetch('/requirements.txt').catch(() => null);
      const reqContent = reqRes && reqRes.ok ? await reqRes.text() : "";

      const batRes = await fetch('/build_exe.bat').catch(() => null);
      const batContent = batRes && batRes.ok ? await batRes.text() : "";

      const readmeRes = await fetch('/README.md').catch(() => null);
      const readmeContent = readmeRes && readmeRes.ok ? await readmeRes.text() : "";

      zip.file('main.py', mainPyContent);
      zip.file('deck_config.json', exportDeckConfigJson());
      zip.file('requirements.txt', reqContent);
      zip.file('build_exe.bat', batContent);
      zip.file('README.md', readmeContent);

      const workflowFolder = zip.folder('.github')?.folder('workflows');
      if (workflowFolder) {
        const wfRes = await fetch('/.github/workflows/build-exe.yml').catch(() => null);
        const wfContent = wfRes && wfRes.ok ? await wfRes.text() : "";
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
    } catch {
      showToast("Gagal mengemas file ZIP.");
    } finally {
      setIsGeneratingZip(false);
    }
  };

  const currentButtons = pages[activeCategoryId] || [];

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
            <p className="text-[11px] text-slate-400">PyQt6 Standalone • Hotkeys • Shortcuts • Hyperlinks • Custom Sidebar</p>
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
            onClick={() => setActiveTab('builder')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'builder' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Button &amp; Sidebar Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('github')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'github' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-400 hover:text-white'
            }`}
          >
            <Github className="w-3.5 h-3.5" />
            <span>Push ke GitHub</span>
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
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'guide' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Codespaces &amp; Build Guide</span>
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={downloadFullZip}
            disabled={isGeneratingZip}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-medium text-xs shadow-lg shadow-emerald-500/15 transition-all active:scale-95 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isGeneratingZip ? 'Mengemas...' : 'Download Full ZIP'}</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col p-3 md:p-5 overflow-auto">
        {/* ========================================================================= */}
        {/* TAB 1: 7-INCH LIVE SIMULATOR */}
        {/* ========================================================================= */}
        {activeTab === 'simulator' && (
          <div className="flex flex-col items-center gap-4">
            {/* View Mode Bar */}
            <div className="w-full max-w-[1064px] flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 backdrop-blur border border-slate-800/80 px-4 py-2 rounded-xl text-xs">
              <div className="flex items-center gap-3">
                <span className="text-slate-400 font-medium">Display Frame:</span>
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
                <button
                  onClick={() => setActiveTab('builder')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30 font-medium transition-colors"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Kustomisasi Tombol &amp; Sidebar</span>
                </button>

                <div className="h-4 w-px bg-slate-700"></div>

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
                  title="Refresh Sholat"
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
              {viewMode === 'bezel' && (
                <div className="flex items-center justify-between pb-3 px-2 text-[10px] text-slate-500">
                  <span className="tracking-widest uppercase font-mono">HDMI 7" Touch Monitor • IPS 1024×600 • Full Custom Engine</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>
                    <div className="w-2 h-2 rounded-full bg-blue-500/80 animate-pulse"></div>
                  </div>
                </div>
              )}

              {/* 1024 x 600 DISPLAY */}
              <div
                style={{ width: '1024px', height: '600px' }}
                className="bg-[#0b0d14] text-slate-100 flex flex-col overflow-hidden relative font-sans shadow-inner border border-slate-800/80 select-none"
              >
                {/* 1. HEADER (46px) */}
                <div className="h-[46px] bg-[#12151f] border-b border-[#1f2438] px-4 flex items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-3">
                    <span className="text-[15px] font-extrabold text-white tracking-wide">Macro Deck</span>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      <span>Connected</span>
                    </div>
                  </div>

                  {/* Prayer Schedule */}
                  <div className="flex items-center bg-[#171b26] border border-[#242c40] px-3 py-1 rounded-md text-[11px] font-medium text-slate-300 gap-2 shadow-inner">
                    <span className="text-amber-400 font-bold uppercase tracking-wider text-[10px]">
                      JADWAL SHOLAT ({prayerCity}):
                    </span>
                    <span>Subuh <strong className="text-sky-300">{prayers.Subuh}</strong></span>
                    <span className="text-slate-600">|</span>
                    <span>Dzuhur <strong className="text-sky-300">{prayers.Dzuhur}</strong></span>
                    <span className="text-slate-600">|</span>
                    <span>Ashar <strong className="text-sky-300">{prayers.Ashar}</strong></span>
                    <span className="text-slate-600">|</span>
                    <span>Maghrib <strong className="text-sky-300">{prayers.Maghrib}</strong></span>
                    <span className="text-slate-600">|</span>
                    <span>Isya <strong className="text-sky-300">{prayers.Isya}</strong></span>
                  </div>

                  {/* Clock & Controls */}
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sky-400 text-sm">{timeStr}</span>
                    <div className="flex items-center gap-1 text-slate-400">
                      <button className="w-6 h-6 flex items-center justify-center hover:bg-slate-800 rounded text-xs transition-colors">─</button>
                      <button className="w-6 h-6 flex items-center justify-center hover:bg-red-500/20 text-red-400 rounded text-xs transition-colors">✕</button>
                    </div>
                  </div>
                </div>

                {/* 2. BODY (Sidebar + Central Grid + YouTube) */}
                <div className="flex-1 p-2 flex gap-2 overflow-hidden">
                  {/* DYNAMIC SIDEBAR (76px) */}
                  <div className="w-[76px] bg-[#12151f] border border-[#1f2438] rounded-xl flex flex-col p-1.5 gap-2 shrink-0 overflow-y-auto">
                    {sidebarItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => { playAudioBeep(500); setActiveCategoryId(item.id); }}
                        className={`flex flex-col items-center justify-center py-2.5 rounded-lg text-[11px] font-semibold transition-all relative group ${
                          activeCategoryId === item.id
                            ? 'bg-[#1e293b] text-sky-400 border-l-4 border-sky-400 shadow-md'
                            : 'text-slate-400 hover:bg-[#1a1f2e] hover:text-slate-200'
                        }`}
                      >
                        <span className="text-lg mb-0.5">{item.icon}</span>
                        <span className="truncate w-full text-center px-1">{item.label}</span>
                      </button>
                    ))}

                    <div className="mt-auto flex flex-col gap-1 pt-2 border-t border-slate-800/80">
                      <button
                        onClick={() => setActiveTab('builder')}
                        title="Edit Kategori & Tombol"
                        className="w-full flex flex-col items-center justify-center py-2 rounded-lg text-[10px] text-sky-400 hover:bg-[#1a1f2e] transition-colors"
                      >
                        <Settings className="w-4 h-4 mb-0.5" />
                        <span>Edit Deck</span>
                      </button>
                    </div>
                  </div>

                  {/* CENTRAL DYNAMIC 3x3 GRID */}
                  <div className="flex-1 grid grid-cols-3 grid-rows-3 gap-2">
                    {currentButtons.map((btn, idx) => {
                      // Khusus volume_split
                      if (btn.type === 'internal' && btn.action === 'volume_split') {
                        return (
                          <div key={btn.id || idx} className="flex gap-2">
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
                        );
                      }

                      const colorConf = COLOR_CLASSES[btn.color] || COLOR_CLASSES.default;
                      const isInternalMic = btn.action === 'mute_mic';
                      const isInternalCam = btn.action === 'camera_toggle';
                      const isInternalLive = btn.action === 'golive_toggle';
                      const isInternalRec = btn.action === 'record_toggle';
                      const isCpu = btn.action === 'cpu_stat';

                      return (
                        <button
                          key={btn.id || idx}
                          onClick={() => handleButtonClick(btn, idx)}
                          className={`flex flex-col items-center justify-center rounded-xl p-3 border transition-all active:scale-[0.98] relative group ${colorConf.bg} ${colorConf.border} ${colorConf.text} ${colorConf.glow}`}
                        >
                          {/* Quick Edit Pencil Overlay */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingBtn({ pageId: activeCategoryId, index: idx, data: { ...btn } });
                            }}
                            title="Edit Tombol Ini"
                            className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-1 rounded-md bg-black/60 hover:bg-sky-600 text-white transition-all"
                          >
                            <Edit3 className="w-3 h-3" />
                          </div>

                          {/* CPU Temp indicator */}
                          {isCpu && (
                            <span className="absolute top-2 right-2 text-[10px] font-bold text-amber-400 bg-amber-950/60 px-1 py-0.5 rounded border border-amber-500/30">
                              {cpuTemp}°C
                            </span>
                          )}

                          <span className="text-2xl mb-1">{btn.icon}</span>
                          <span className="font-bold text-xs tracking-wide text-center truncate max-w-full px-1">
                            {isInternalMic ? (micMuted ? 'Mute Mic' : 'Mic Active') :
                             isInternalCam ? (cameraOn ? 'Camera ON' : 'Camera OFF') :
                             isInternalLive ? (isLive ? 'LIVE ACTIVE' : 'Go Live') :
                             isInternalRec ? (isRecording ? 'Recording...' : 'Start Record') :
                             btn.label}
                          </span>
                          <span className="text-[10px] opacity-70 mt-0.5 text-center truncate max-w-full px-1">
                            {isCpu ? `Usage: ${cpuUsage}%` : btn.sublabel}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* SISI KANAN: YOUTUBE LIVE */}
                  <div className="w-[310px] bg-[#12151f] border border-[#1f2438] rounded-xl flex flex-col p-2 gap-2 shrink-0">
                    <button
                      onClick={() => {
                        playAudioBeep(620);
                        showToast("Memuat stream YouTube...");
                      }}
                      className="w-full py-2 bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 border border-slate-600 rounded-lg text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-white text-white" />
                      <span>PLAY YOUTUBE LIVE</span>
                    </button>

                    <div className="flex-1 bg-black rounded-lg border border-[#242c40] overflow-hidden relative flex flex-col items-center justify-center">
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

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          playAudioBeep(580);
                          showToast("Play YouTube dipicu");
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
                          showToast("Chat Pop-out terbuka!");
                        }}
                        className="flex-1 py-1.5 bg-[#1e293b] hover:bg-[#334155] border border-slate-700 rounded-lg text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
                      >
                        <ExternalLink className="w-3 h-3 text-sky-400" />
                        <span>Chat Pop-out</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Floating Notification */}
                {toastMsg && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-sky-950/90 border border-sky-500/80 text-sky-200 px-4 py-1.5 rounded-full text-xs font-semibold shadow-2xl backdrop-blur animate-fade-in flex items-center gap-2 z-50">
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
                    <span>{toastMsg}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: BUTTON & SIDEBAR STUDIO (Kustomisasi Bebas) */}
        {/* ========================================================================= */}
        {activeTab === 'builder' && (
          <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
            <div className="bg-gradient-to-r from-sky-950/70 via-slate-900 to-indigo-950/50 border border-sky-500/30 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-sky-400" />
                  <span>Button &amp; Sidebar Deck Studio</span>
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Atur fungsi tombol: <strong>Hotkey</strong>, <strong>Shortcut Aplikasi</strong>, <strong>Web Hyperlink</strong>, atau <strong>Internal</strong>. Ganti ikon/emoji dan tambah kategori sidebar sesuka Anda!
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const jsonStr = exportDeckConfigJson();
                    downloadFile('deck_config.json', jsonStr, 'application/json');
                    showToast("deck_config.json berhasil diunduh!");
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download deck_config.json</span>
                </button>
              </div>
            </div>

            {/* Sidebar Categories Manager */}
            <div className="bg-[#0f131e] border border-slate-800 p-4 rounded-xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  <span>Manajemen Kategori Sidebar (Menu Kiri)</span>
                </h3>

                <button
                  onClick={addCategory}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30 text-xs font-medium transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Kategori Baru</span>
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {sidebarItems.map((cat, idx) => (
                  <div
                    key={cat.id}
                    className={`p-3 rounded-xl border flex flex-col gap-2 transition-all ${
                      activeCategoryId === cat.id ? 'bg-sky-950/40 border-sky-500/80 shadow-md' : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{cat.icon}</span>
                      {sidebarItems.length > 1 && (
                        <button
                          onClick={() => removeCategory(cat.id)}
                          title="Hapus Kategori"
                          className="p-1 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={cat.icon}
                        onChange={(e) => {
                          const updated = [...sidebarItems];
                          updated[idx].icon = e.target.value;
                          setSidebarItems(updated);
                        }}
                        className="w-10 text-center bg-slate-800 border border-slate-700 rounded py-1 text-xs text-white"
                        title="Ubah Emoji Ikon"
                      />
                      <input
                        type="text"
                        value={cat.label}
                        onChange={(e) => {
                          const updated = [...sidebarItems];
                          updated[idx].label = e.target.value;
                          setSidebarItems(updated);
                        }}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                        placeholder="Nama Kategori"
                      />
                    </div>

                    <button
                      onClick={() => setActiveCategoryId(cat.id)}
                      className={`w-full py-1 rounded text-[11px] font-medium transition-colors ${
                        activeCategoryId === cat.id ? 'bg-sky-500 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {activeCategoryId === cat.id ? 'Sedang Dipilih' : 'Pilih & Edit Tombol'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Current Category Buttons List */}
            <div className="bg-[#0f131e] border border-slate-800 p-4 rounded-xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-4 h-4" />
                    <span>Daftar 9 Tombol pada Kategori: "{sidebarItems.find(s => s.id === activeCategoryId)?.label}"</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Klik tombol apa saja untuk mengubah fungsi (Shortcut / Hotkey / Hyperlink), teks, ikon, dan warnanya.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {currentButtons.map((btn, idx) => (
                  <div
                    key={btn.id || idx}
                    onClick={() => setEditingBtn({ pageId: activeCategoryId, index: idx, data: { ...btn } })}
                    className="p-3 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 hover:border-sky-400 rounded-xl cursor-pointer transition-all flex items-start gap-3 group relative"
                  >
                    <span className="text-2xl mt-0.5">{btn.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white truncate">{btn.label}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold border ${
                          btn.type === 'hotkey' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' :
                          btn.type === 'shortcut' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                          btn.type === 'hyperlink' ? 'bg-sky-500/20 text-sky-300 border-sky-500/30' :
                          'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}>
                          {btn.type}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 truncate block mt-0.5">{btn.sublabel || '-'}</span>
                      <span className="text-[10px] font-mono text-slate-500 truncate block mt-1">Aksi: {btn.action}</span>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 p-1 text-sky-400 transition-opacity">
                      <Edit3 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: PUSH KE GITHUB ASSISTANT */}
        {/* ========================================================================= */}
        {activeTab === 'github' && (
          <div className="w-full max-w-4xl mx-auto flex flex-col gap-5 text-slate-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/60 border border-emerald-500/40 p-5 rounded-2xl shadow-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                  <Github className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Panduan Push ke Akun GitHub Anda</h2>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Git lokal di workspace ini sudah diinisialisasi dan di-commit. Ikuti panduan di bawah untuk menghubungkan ke repositori GitHub Anda.
                  </p>
                </div>
              </div>
            </div>

            {/* Kenapa perlu langkah ini */}
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-start gap-3 text-xs leading-relaxed text-slate-300">
              <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-1">Apakah bisa langsung dipush otomatis dari sini?</strong>
                Untuk alasan keamanan akun GitHub, AI Studio tidak memiliki dan tidak menyimpan Personal Access Token (PAT) atau password akun GitHub pribadi Anda. 
                Namun, <strong>semua file sudah di-commit di git lokal</strong> (`main` branch). Anda cukup menghubungkan URL repository GitHub Anda dengan langkah 1-menit berikut!
              </div>
            </div>

            {/* Generator Command Push */}
            <div className="bg-[#0f131e] border border-slate-800 p-5 rounded-xl flex flex-col gap-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Langkah 1: Masukkan URL Repository GitHub Anda</span>
              </h3>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400">
                  Buat repository baru di <a href="https://github.com/new" target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">github.com/new</a> (misal: <code>macro-deck-7inch</code>), lalu paste URL-nya di sini:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={repoUrlInput}
                    onChange={(e) => setRepoUrlInput(e.target.value)}
                    placeholder="https://github.com/username-anda/macro-deck-7inch.git"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Generated Commands */}
              <div className="flex flex-col gap-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                    Langkah 2: Salin &amp; Jalankan Perintah di Terminal
                  </span>
                  <button
                    onClick={() => {
                      const url = repoUrlInput.trim() || "https://github.com/USERNAME/macro-deck-7inch.git";
                      const cmd = `git remote add origin ${url}\ngit branch -M main\ngit push -u origin main`;
                      navigator.clipboard.writeText(cmd);
                      setCopiedGitCmd(true);
                      setTimeout(() => setCopiedGitCmd(false), 2000);
                      showToast("Command push disalin ke clipboard!");
                    }}
                    className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold transition-all"
                  >
                    {copiedGitCmd ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedGitCmd ? 'Tersalin!' : 'Salin Semua Command'}</span>
                  </button>
                </div>

                <div className="bg-black/70 p-3.5 rounded-lg border border-slate-800 font-mono text-xs text-emerald-300 leading-relaxed overflow-x-auto">
                  <div className="text-slate-500"># Hubungkan ke remote GitHub Anda:</div>
                  <div>git remote add origin {repoUrlInput.trim() || 'https://github.com/USERNAME/macro-deck-7inch.git'}</div>
                  <div className="text-slate-500 mt-2"># Pastikan branch utama adalah main:</div>
                  <div>git branch -M main</div>
                  <div className="text-slate-500 mt-2"># Push seluruh kode ke GitHub:</div>
                  <div>git push -u origin main</div>
                </div>
              </div>
            </div>

            {/* Alternatif GitHub Codespaces */}
            <div className="bg-[#0f131e] border border-slate-800 p-5 rounded-xl flex flex-col gap-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-sky-400" />
                <span>Opsi Praktis: Buka via GitHub Codespaces</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Jika Anda mengembangkan di dalam <strong>GitHub Codespaces</strong>, Codespaces sudah secara otomatis terotentikasi dengan akun GitHub Anda!
                Anda cukup:
              </p>
              <ol className="list-decimal list-inside text-xs text-slate-400 space-y-1.5">
                <li>Buka panel <strong>Source Control</strong> (Ctrl + Shift + G) di sidebar kiri VS Code Codespaces.</li>
                <li>Klik tombol <strong>Publish Branch / Push</strong>.</li>
                <li>Pilih <em>Publish to GitHub private/public repository</em>. Selesai!</li>
              </ol>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: PYTHON SOURCE CODE */}
        {/* ========================================================================= */}
        {activeTab === 'code' && (
          <div className="w-full max-w-5xl mx-auto flex flex-col gap-4">
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-sky-400" />
                  <span>Kode Lengkap main.py (PyQt6)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Mendukung Hotkey, Shortcut, Hyperlink, Sidebar dinamis, psutil, pycaw, dan QWebEngineView.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    const res = await fetch('/main.py').catch(() => null);
                    const txt = res && res.ok ? await res.text() : "";
                    navigator.clipboard.writeText(txt);
                    showToast("Kode main.py berhasil disalin!");
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Kode</span>
                </button>
              </div>
            </div>

            <div className="bg-[#0b0e14] border border-slate-800 rounded-xl overflow-hidden shadow-2xl p-4 font-mono text-xs text-slate-300 max-h-[600px] overflow-auto leading-relaxed">
              <pre><code>{`# Kode main.py membaca konfigurasi secara dinamis dari deck_config.json:
# - type == 'hotkey'    -> Mengirim kombinasi tombol (ctrl+shift+m, f9, alt+tab, dll)
# - type == 'shortcut'  -> Membuka aplikasi executable (obs64.exe, discord.exe, dll)
# - type == 'hyperlink' -> Membuka link web di browser default (webbrowser.open)
# - type == 'internal'  -> Mute Mic, Camera Toggle, CPU Stat, Split Volume, Go Live
# - sidebar items       -> Ditampilkan dinamis sesuai urutan dan icon yang Anda atur!

import sys, os, time, json, logging, subprocess, webbrowser
from pathlib import Path
from PyQt6.QtCore import Qt, QTimer, QThread, pyqtSignal, QUrl, QPoint
from PyQt6.QtGui import QCursor
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QGridLayout, QLabel, QPushButton, QFrame, QStackedWidget, QSizePolicy
)

# ... [File main.py lengkap tersimpan di root directory project] ...`}</code></pre>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: CODESPACES & BUILD GUIDE */}
        {/* ========================================================================= */}
        {activeTab === 'guide' && (
          <div className="w-full max-w-4xl mx-auto flex flex-col gap-4 text-slate-200 text-xs">
            <div className="bg-gradient-to-r from-sky-950/70 to-slate-900 border border-sky-500/30 p-4 rounded-xl flex items-center gap-3">
              <Terminal className="w-6 h-6 text-sky-400 shrink-0" />
              <div>
                <h3 className="font-bold text-white text-sm">Panduan Menjalankan &amp; Mem-build di Codespaces</h3>
                <p className="text-slate-400 mt-0.5">Langkah cepat uji coba dan pembuatan executable portable (.exe).</p>
              </div>
            </div>

            <div className="bg-[#0f131e] border border-slate-800 p-4 rounded-xl flex flex-col gap-2">
              <h4 className="font-bold text-white text-sm">1. Install Library</h4>
              <div className="bg-black/60 p-2.5 rounded border border-slate-800 font-mono text-emerald-400">
                pip install -r requirements.txt
              </div>
            </div>

            <div className="bg-[#0f131e] border border-slate-800 p-4 rounded-xl flex flex-col gap-2">
              <h4 className="font-bold text-white text-sm">2. Test Running GUI di Codespaces (Xvfb)</h4>
              <div className="bg-black/60 p-2.5 rounded border border-slate-800 font-mono text-sky-300 leading-relaxed">
                sudo apt-get update && sudo apt-get install -y xvfb libxkbcommon-x11-0 libgl1-mesa-glx<br />
                xvfb-run -s "-screen 0 1024x600x24" python main.py
              </div>
            </div>

            <div className="bg-[#0f131e] border border-slate-800 p-4 rounded-xl flex flex-col gap-2">
              <h4 className="font-bold text-white text-sm">3. Build Standalone Portable .EXE dengan PyInstaller</h4>
              <p className="text-slate-400">Gunakan perintah PyInstaller ini (sudah menyertakan `deck_config.json`):</p>
              <div className="bg-black/60 p-2.5 rounded border border-slate-800 font-mono text-amber-300 leading-relaxed overflow-x-auto">
                pyinstaller --noconfirm --onefile --windowed --name "MacroDeck7Inch_Portable" --add-data "deck_config.json;." --add-data "config.ini;." --hidden-import "PyQt6.QtWebEngineWidgets" --hidden-import "psutil" --hidden-import "requests" --hidden-import "keyboard" main.py
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL: EDIT TOMBOL (Shortcut, Hotkey, Hyperlink, Icon, Color) */}
      {/* ========================================================================= */}
      {editingBtn && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121622] border border-slate-700 w-full max-w-md rounded-2xl p-5 shadow-2xl flex flex-col gap-4 text-xs animate-scale-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-sky-400" />
                <span>Kustomisasi Tombol #{editingBtn.index + 1}</span>
              </h3>
              <button
                onClick={() => setEditingBtn(null)}
                className="w-6 h-6 flex items-center justify-center hover:bg-slate-800 rounded text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Input Form */}
            <div className="flex flex-col gap-3">
              {/* Type Selector */}
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Tipe Aksi Tombol:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingBtn({ ...editingBtn, data: { ...editingBtn.data, type: 'hotkey' } })}
                    className={`py-1.5 px-2 rounded-lg border text-left flex items-center gap-2 transition-all ${
                      editingBtn.data.type === 'hotkey' ? 'bg-indigo-600/30 border-indigo-400 text-indigo-200' : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Keyboard className="w-4 h-4" />
                    <div>
                      <span className="block font-bold text-[11px]">Hotkey</span>
                      <span className="text-[9px] opacity-75">Ctrl+C, F9, Win+G</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingBtn({ ...editingBtn, data: { ...editingBtn.data, type: 'shortcut' } })}
                    className={`py-1.5 px-2 rounded-lg border text-left flex items-center gap-2 transition-all ${
                      editingBtn.data.type === 'shortcut' ? 'bg-emerald-600/30 border-emerald-400 text-emerald-200' : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <PlayCircle className="w-4 h-4" />
                    <div>
                      <span className="block font-bold text-[11px]">App Shortcut</span>
                      <span className="text-[9px] opacity-75">obs.exe, spotify</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingBtn({ ...editingBtn, data: { ...editingBtn.data, type: 'hyperlink' } })}
                    className={`py-1.5 px-2 rounded-lg border text-left flex items-center gap-2 transition-all ${
                      editingBtn.data.type === 'hyperlink' ? 'bg-sky-600/30 border-sky-400 text-sky-200' : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Link className="w-4 h-4" />
                    <div>
                      <span className="block font-bold text-[11px]">Web Hyperlink</span>
                      <span className="text-[9px] opacity-75">Buka URL Browser</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingBtn({ ...editingBtn, data: { ...editingBtn.data, type: 'internal' } })}
                    className={`py-1.5 px-2 rounded-lg border text-left flex items-center gap-2 transition-all ${
                      editingBtn.data.type === 'internal' ? 'bg-amber-600/30 border-amber-400 text-amber-200' : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Cpu className="w-4 h-4" />
                    <div>
                      <span className="block font-bold text-[11px]">Internal Deck</span>
                      <span className="text-[9px] opacity-75">Mic, Cam, CPU, Vol</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Icon / Emoji & Label */}
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-1">
                  <label className="text-slate-300 block mb-1 font-semibold">Ikon/Emoji:</label>
                  <input
                    type="text"
                    value={editingBtn.data.icon}
                    onChange={(e) => setEditingBtn({ ...editingBtn, data: { ...editingBtn.data, icon: e.target.value } })}
                    className="w-full text-center bg-slate-900 border border-slate-700 rounded-lg py-2 text-xl text-white"
                  />
                </div>
                <div className="col-span-3">
                  <label className="text-slate-300 block mb-1 font-semibold">Judul Tombol (Label):</label>
                  <input
                    type="text"
                    value={editingBtn.data.label}
                    onChange={(e) => setEditingBtn({ ...editingBtn, data: { ...editingBtn.data, label: e.target.value } })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    placeholder="Contoh: OBS Studio"
                  />
                </div>
              </div>

              {/* Sublabel */}
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Subjudul / Deskripsi Singkat:</label>
                <input
                  type="text"
                  value={editingBtn.data.sublabel}
                  onChange={(e) => setEditingBtn({ ...editingBtn, data: { ...editingBtn.data, sublabel: e.target.value } })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  placeholder="Contoh: Stream Recording"
                />
              </div>

              {/* Action Value */}
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  {editingBtn.data.type === 'hotkey' ? 'Kombinasi Tombol (Hotkey):' :
                   editingBtn.data.type === 'shortcut' ? 'Path / Nama File Executable:' :
                   editingBtn.data.type === 'hyperlink' ? 'URL Web Lengkap:' :
                   'Perintah Internal:'}
                </label>
                {editingBtn.data.type === 'internal' ? (
                  <select
                    value={editingBtn.data.action}
                    onChange={(e) => setEditingBtn({ ...editingBtn, data: { ...editingBtn.data, action: e.target.value } })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="mute_mic">Mute Microphone (Toggle)</option>
                    <option value="camera_toggle">Camera Feed (Toggle)</option>
                    <option value="cpu_stat">CPU &amp; Temp Monitor</option>
                    <option value="golive_toggle">Go Live Broadcast</option>
                    <option value="record_toggle">Start Recording</option>
                    <option value="volume_split">Volume Split (+ / -)</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={editingBtn.data.action}
                    onChange={(e) => setEditingBtn({ ...editingBtn, data: { ...editingBtn.data, action: e.target.value } })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                    placeholder={
                      editingBtn.data.type === 'hotkey' ? 'ctrl+shift+m, f9, alt+tab...' :
                      editingBtn.data.type === 'shortcut' ? 'obs64.exe, C:\\Program Files\\...' :
                      'https://youtube.com...'
                    }
                  />
                )}
              </div>

              {/* Color Selector */}
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Warna Tombol:</label>
                <div className="flex gap-2">
                  {(['default', 'red', 'green', 'orange', 'blue', 'purple'] as const).map((clr) => (
                    <button
                      key={clr}
                      type="button"
                      onClick={() => setEditingBtn({ ...editingBtn, data: { ...editingBtn.data, color: clr } })}
                      className={`flex-1 py-1.5 rounded-lg border text-[10px] capitalize font-bold transition-all ${
                        editingBtn.data.color === clr ? 'ring-2 ring-white scale-105' : 'opacity-70 hover:opacity-100'
                      } ${COLOR_CLASSES[clr].bg} ${COLOR_CLASSES[clr].border} ${COLOR_CLASSES[clr].text}`}
                    >
                      {clr}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingBtn(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => saveEditedButton(editingBtn.data)}
                className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-md shadow-sky-600/30"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
