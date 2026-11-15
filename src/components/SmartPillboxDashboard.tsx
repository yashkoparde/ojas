import React, { useState } from 'react';
import {
  Cpu,
  Wifi,
  BatteryCharging,
  BellRing,
  VolumeX,
  RefreshCw,
  DoorOpen,
  DoorClosed,
  Radio,
  Activity,
  Zap,
} from 'lucide-react';
import type { HardwareBoxState, Medication, UserRole } from '../types';

interface SmartPillboxDashboardProps {
  hardware: HardwareBoxState;
  medications: Medication[];
  actorName: string;
  actorRole: UserRole;
  onSyncAction: (
    action: 'trigger_alarm' | 'physical_button_confirm' | 'scan_nfc' | 'silence_alarm' | 'ping_sync' | 'toggle_door',
    compartmentNumber?: number
  ) => Promise<void>;
  onSpeakText: (text: string) => void;
}

export const SmartPillboxDashboard: React.FC<SmartPillboxDashboardProps> = ({
  hardware,
  medications,
  actorName,
  actorRole,
  onSyncAction,
  onSpeakText,
}) => {
  const [selectedSlot, setSelectedSlot] = useState<number>(hardware.activeSlotLed || 3);
  const [busy, setBusy] = useState<boolean>(false);

  const canOperatePhysicalBox = actorRole === 'elderly' || actorRole === 'caretaker';

  const handleAction = async (
    action: 'trigger_alarm' | 'physical_button_confirm' | 'scan_nfc' | 'silence_alarm' | 'ping_sync' | 'toggle_door',
    slotNum?: number
  ) => {
    setBusy(true);
    try {
      await onSyncAction(action, slotNum);
    } finally {
      setBusy(false);
    }
  };

  const isDoorOpen = Boolean(hardware.doorOpen);
  const isConnected = Boolean(hardware.connected);
  const isBuzzerActive = Boolean(hardware.buzzerActive);
  const batteryPct = hardware.batteryPercent ?? 95;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
      {/* Header with Title and Hardware Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-700 text-white shadow-xs">
            <Cpu className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Smart Pillbox Status Dashboard
              </h2>
              <span className="rounded-full bg-teal-100 px-2.5 py-0.5 font-mono text-[11px] font-bold text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                ESP32-S3 IoT Node
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time circular telemetry indicators, magnetic reed switch sensor alerts, and physical compartment LED sync
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => handleAction('ping_sync')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${busy ? 'animate-spin' : ''}`} />
            <span>Telemetry Ping</span>
          </button>
        </div>
      </div>

      {/* ========================================================================
          CIRCULAR INDICATOR LIGHT STYLE UI TELEMETRY GAUGES
          ======================================================================== */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Connection Status with Glowing Circular Indicator Light */}
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Network Link
            </span>
            <Wifi className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-3 flex items-center gap-3.5">
            {/* Circular Indicator Light */}
            <div className="relative flex h-10 w-10 items-center justify-center">
              <div
                className={`absolute h-8 w-8 rounded-full transition-all duration-500 ${
                  isConnected
                    ? 'bg-emerald-500/20 shadow-[0_0_16px_rgba(16,185,129,0.5)] animate-pulse'
                    : 'bg-red-500/20 shadow-[0_0_16px_rgba(239,68,68,0.5)]'
                }`}
              />
              <div
                className={`h-4 w-4 rounded-full border-2 border-white dark:border-slate-900 transition-colors ${
                  isConnected ? 'bg-emerald-500' : 'bg-red-500'
                }`}
              />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {isConnected ? 'Connected Online' : 'Offline Disconnected'}
              </div>
              <div className="font-mono text-xs text-slate-500 tabular-nums">
                {hardware.wifiRssiDbm} dBm · 18ms latency
              </div>
            </div>
          </div>
        </div>

        {/* 2. Real-Time Battery Indicator with Circular Meter Style */}
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Li-Ion Battery
            </span>
            <BatteryCharging className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-3 flex items-center gap-3.5">
            {/* Circular Ring Gauge Indicator Light */}
            <div className="relative flex h-10 w-10 items-center justify-center">
              <svg className="h-10 w-10 -rotate-90 transform" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  className="stroke-slate-200 dark:stroke-slate-700"
                  strokeWidth="3.5"
                  fill="none"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  className={`transition-all duration-700 ${
                    batteryPct > 50
                      ? 'stroke-emerald-500'
                      : batteryPct > 20
                      ? 'stroke-amber-500'
                      : 'stroke-red-500'
                  }`}
                  strokeWidth="3.5"
                  strokeDasharray="88"
                  strokeDashoffset={88 - (88 * batteryPct) / 100}
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
              <div
                className={`absolute h-2.5 w-2.5 rounded-full ${
                  batteryPct > 50 ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                {batteryPct}% Operational
              </div>
              <div className="font-mono text-xs text-slate-500">
                3.7V Li-Ion · Fast Charging
              </div>
            </div>
          </div>
        </div>

        {/* 3. Sensor Alert: Door / Lid Status with Pulsing Circular Indicator Light */}
        <div
          className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-300 ${
            isDoorOpen
              ? 'border-amber-400 bg-amber-50/70 dark:border-amber-700 dark:bg-amber-950/30'
              : 'border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Lid Sensor Alert
            </span>
            {isDoorOpen ? (
              <DoorOpen className="h-4 w-4 text-amber-600 animate-bounce" />
            ) : (
              <DoorClosed className="h-4 w-4 text-slate-400" />
            )}
          </div>
          <div className="mt-3 flex items-center gap-3.5">
            {/* Circular Sensor Indicator Light */}
            <div className="relative flex h-10 w-10 items-center justify-center">
              <div
                className={`absolute h-8 w-8 rounded-full transition-all duration-300 ${
                  isDoorOpen
                    ? 'bg-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.7)] animate-ping'
                    : 'bg-emerald-500/15 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                }`}
              />
              <div
                className={`h-4 w-4 rounded-full border-2 border-white dark:border-slate-900 transition-colors ${
                  isDoorOpen ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
              />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {isDoorOpen ? 'Door Open (Alert)' : 'Door Closed (Secure)'}
              </div>
              <div className="text-xs text-slate-500">
                {isDoorOpen ? 'Magnetic reed switch open' : 'Lid closed securely'}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Sensor Alert: Buzzer / Audio Alarm Status */}
        <div
          className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-300 ${
            isBuzzerActive
              ? 'border-red-400 bg-red-50/70 dark:border-red-800 dark:bg-red-950/30'
              : 'border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Audio Alert Buzzer
            </span>
            <BellRing
              className={`h-4 w-4 ${isBuzzerActive ? 'text-red-600 animate-bounce' : 'text-slate-400'}`}
            />
          </div>
          <div className="mt-3 flex items-center gap-3.5">
            {/* Circular Buzzer Indicator Light */}
            <div className="relative flex h-10 w-10 items-center justify-center">
              <div
                className={`absolute h-8 w-8 rounded-full transition-all duration-300 ${
                  isBuzzerActive
                    ? 'bg-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.7)] animate-ping'
                    : 'bg-slate-300/20'
                }`}
              />
              <div
                className={`h-4 w-4 rounded-full border-2 border-white dark:border-slate-900 transition-colors ${
                  isBuzzerActive ? 'bg-red-600' : 'bg-slate-400'
                }`}
              />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {isBuzzerActive ? 'Buzzer Active (85dB)' : 'Buzzer Silent'}
              </div>
              <div className="text-xs text-slate-500">
                {isBuzzerActive ? 'Piezo alarm sound playing' : 'Standby mode'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================
          6-COMPARTMENT CIRCULAR LED LIGHT INDICATORS
          ======================================================================== */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-teal-700 dark:text-teal-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              6-Compartment Physical LED Status Ring
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">
            Lit compartment indicates active scheduled dose
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((num) => {
            const med = medications.find((m) => m.compartmentNumber === num);
            const isLit = hardware.activeSlotLed === num;

            return (
              <div
                key={num}
                className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all ${
                  isLit
                    ? 'border-teal-500 bg-teal-50 shadow-[0_0_14px_rgba(20,184,166,0.4)] dark:border-teal-400 dark:bg-teal-950/50'
                    : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                {/* Circular LED Indicator Light */}
                <div className="relative flex h-7 w-7 items-center justify-center">
                  <div
                    className={`absolute h-6 w-6 rounded-full transition-all ${
                      isLit
                        ? 'bg-teal-400/40 shadow-[0_0_12px_rgba(45,212,191,0.8)] animate-pulse'
                        : 'bg-transparent'
                    }`}
                  />
                  <div
                    className={`h-3 w-3 rounded-full border border-white dark:border-slate-900 ${
                      isLit ? 'bg-teal-500 shadow-sm' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  />
                </div>

                <span className="mt-1 font-mono text-xs font-bold text-slate-900 dark:text-white">
                  Slot #{num}
                </span>
                <span className="mt-0.5 truncate text-[10px] text-slate-500 max-w-full">
                  {med ? med.name : 'Unassigned'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================
          INTERACTIVE HARDWARE SIMULATOR ACTIONS
          ======================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Device: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{hardware.deviceId}</span> (Firmware: {hardware.firmwareVersion}) · Last Sync: {hardware.lastSyncAt}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle Door / Lid Simulator Button */}
          <button
            type="button"
            disabled={busy}
            onClick={() => handleAction('toggle_door')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all shadow-xs ${
              isDoorOpen
                ? 'bg-amber-600 text-white hover:bg-amber-700'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
            }`}
          >
            {isDoorOpen ? <DoorOpen className="h-4 w-4" /> : <DoorClosed className="h-4 w-4" />}
            <span>{isDoorOpen ? 'Close Pillbox Lid' : 'Simulate Lid Open Alert'}</span>
          </button>

          {/* Buzzer Alert Toggle */}
          {isBuzzerActive ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => handleAction('silence_alarm')}
              className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-red-700 shadow-xs"
            >
              <VolumeX className="h-4 w-4" />
              <span>Silence Alarm</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => handleAction('trigger_alarm', 3)}
              className="flex items-center gap-1.5 rounded-lg border border-teal-600 bg-teal-50 px-3.5 py-2 text-xs font-bold text-teal-800 hover:bg-teal-100 dark:bg-teal-950 dark:text-teal-300 shadow-xs"
            >
              <BellRing className="h-4 w-4" />
              <span>Test LED & Buzzer Alert</span>
            </button>
          )}

          {/* Physical Button Confirm for On-Site Caretaker / Elderly */}
          {canOperatePhysicalBox && (
            <button
              type="button"
              disabled={busy}
              onClick={() => handleAction('physical_button_confirm', hardware.activeSlotLed || 3)}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-800 shadow-xs active:scale-95 transition-transform"
            >
              <Radio className="h-4 w-4" />
              <span>Press Physical Box Button</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
