import React, { useState } from 'react';
import {
  Cpu,
  Wifi,
  BatteryCharging,
  CheckCircle2,
  QrCode,
  BellRing,
  VolumeX,
  RefreshCw,
  Lock,
} from 'lucide-react';
import type { HardwareBoxState, Medication, UserRole } from '../types';

interface HardwarePillboxPanelProps {
  hardware: HardwareBoxState;
  medications: Medication[];
  actorName: string;
  actorRole: UserRole;
  onSyncAction: (
    action: 'trigger_alarm' | 'physical_button_confirm' | 'scan_nfc' | 'silence_alarm' | 'ping_sync',
    compartmentNumber?: number
  ) => Promise<void>;
  onSpeakText: (text: string) => void;
}

export const HardwarePillboxPanel: React.FC<HardwarePillboxPanelProps> = ({
  hardware,
  medications,
  actorName,
  actorRole,
  onSyncAction,
  onSpeakText,
}) => {
  const [selectedSlot, setSelectedSlot] = useState<number>(hardware.activeSlotLed || 3);
  const [busy, setBusy] = useState<boolean>(false);

  // Only on-site roles (Elderly Patient or Caretaker Nurse) can physically press the pillbox button
  const canOperatePhysicalBox = actorRole === 'elderly' || actorRole === 'caretaker';

  const compartments = [1, 2, 3, 4, 5, 6].map((slotNum) => {
    const med = medications.find((m) => m.compartmentNumber === slotNum);
    const hasMissed = med?.dailySchedule.some((s) => s.status === 'missed');
    const hasPending = med?.dailySchedule.some((s) => s.status === 'pending');
    const isLedActive = hardware.activeSlotLed === slotNum;
    return {
      slotNum,
      med,
      hasMissed,
      hasPending,
      isLedActive,
    };
  });

  const handleAction = async (
    action: 'trigger_alarm' | 'physical_button_confirm' | 'scan_nfc' | 'silence_alarm' | 'ping_sync',
    slotNum?: number
  ) => {
    setBusy(true);
    try {
      await onSyncAction(action, slotNum ?? selectedSlot);
      if (action === 'trigger_alarm') {
        const targetMed = medications.find((m) => m.compartmentNumber === (slotNum ?? selectedSlot));
        if (targetMed) {
          onSpeakText(
            `Smart Pillbox Alert: Compartment ${slotNum ?? selectedSlot} LED is flashing. Please take ${targetMed.name}, ${targetMed.dosage}, and press the confirmation button.`
          );
        }
      } else if (action === 'physical_button_confirm') {
        onSpeakText(`Dhanyawad ${actorName}. Physical pillbox intake confirmed and synced to CareBridge India.`);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 text-slate-100 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-900">
            <Cpu className="h-5 w-5 text-teal-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              ESP32 Smart Medication Reminder Box · Pune Home Unit
            </h3>
            <p className="font-mono text-xs text-slate-400 tabular-nums">
              Device: {hardware.deviceId} · Firmware: {hardware.firmwareVersion} · Last Sync:{' '}
              {hardware.lastSyncAt}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-5 font-mono text-xs text-slate-300 tabular-nums">
          <span className="flex items-center gap-1.5">
            <Wifi className="h-4 w-4 text-teal-400" />
            {hardware.wifiRssiDbm} dBm
          </span>
          <span className="flex items-center gap-1.5">
            <BatteryCharging className="h-4 w-4 text-emerald-400" />
            {hardware.batteryPercent}%
          </span>
          <span className="flex items-center gap-1.5">
            <QrCode className="h-4 w-4 text-amber-400" />
            NFC: {hardware.lastScannedQrOrNfc || 'Ready'}
          </span>
        </div>
      </div>

      {/* 6 Physical Pillbox Compartments with LED Indicators */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {compartments.map(({ slotNum, med, hasMissed, hasPending, isLedActive }) => {
          const isSelected = selectedSlot === slotNum;
          return (
            <button
              key={slotNum}
              type="button"
              onClick={() => setSelectedSlot(slotNum)}
              className={`flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all ${
                isLedActive
                  ? 'border-amber-400 bg-amber-950/40 ring-2 ring-amber-400/50'
                  : isSelected
                  ? 'border-teal-400 bg-slate-900'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-400 tabular-nums">
                  SLOT #{slotNum}
                </span>
                <span
                  className={`font-mono text-[11px] font-semibold ${
                    isLedActive
                      ? 'text-amber-300'
                      : hasMissed
                      ? 'text-red-400'
                      : hasPending
                      ? 'text-teal-300'
                      : 'text-slate-500'
                  }`}
                >
                  {isLedActive
                    ? 'LED FLASHING'
                    : hasMissed
                    ? 'LED RED'
                    : hasPending
                    ? 'LED AMBER'
                    : 'LED STANDBY'}
                </span>
              </div>

              <div className="mt-3">
                {med ? (
                  <>
                    <div className="truncate text-sm font-bold text-white">{med.name}</div>
                    <div className="mt-0.5 font-mono text-xs text-slate-300">{med.dosage}</div>
                    <div className="mt-2 flex items-center justify-between border-t border-slate-800 pt-2 font-mono text-[11px] text-slate-400 tabular-nums">
                      <span>Stock: {med.stockCount}</span>
                      <span>{med.dailySchedule.map((s) => s.scheduledTime).join(', ')}</span>
                    </div>
                  </>
                ) : (
                  <div className="py-4 text-xs text-slate-500">Empty Slot</div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Physical Hardware Controls & Telemetry Bar */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900 px-4 py-3">
        {canOperatePhysicalBox ? (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => handleAction('physical_button_confirm', selectedSlot)}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Press Physical Intake Button (Slot #{selectedSlot})</span>
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => handleAction('trigger_alarm', selectedSlot)}
              className="flex items-center gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <BellRing className="h-4 w-4" />
              <span>Ring Box Buzzer (Slot #{selectedSlot})</span>
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => handleAction('scan_nfc', selectedSlot)}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <QrCode className="h-4 w-4" />
              <span>Scan Strip NFC Tag</span>
            </button>

            {(hardware.buzzerActive || hardware.activeSlotLed !== null) && (
              <button
                type="button"
                disabled={busy}
                onClick={() => handleAction('silence_alarm')}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                <VolumeX className="h-4 w-4" />
                <span>Silence Buzzer</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Lock className="h-4 w-4 text-amber-400 shrink-0" />
            <span>
              <strong>Remote Family Monitor View:</strong> Physical Pillbox intake buttons can only be pressed on-site at the Pune residence by Smt. Kamala Deshmukh or Sister Priya Nair, RN.
            </span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-slate-400">
            Buzzer: {hardware.buzzerActive ? 'ACTIVE (85dB + Voice)' : 'Muted'}
          </span>
          <button
            type="button"
            disabled={busy}
            onClick={() => handleAction('ping_sync')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 font-mono text-xs text-slate-300 hover:bg-slate-700 whitespace-nowrap shrink-0"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Sync ESP32</span>
          </button>
        </div>
      </div>
    </div>
  );
};
