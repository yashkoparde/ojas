/**
 * @file pillboxController.ts
 * @module domain/hardware
 * @description IoT Smart Pillbox (ESP32-S3) Hardware State Machine & Circular Telemetry Controller.
 */

import type { HardwareBoxState, Medication } from '../../types';

export interface PillboxSlotLightState {
  slotNumber: number;
  medicationName: string;
  isLit: boolean;
  status: 'IDLE' | 'DUE' | 'DISPENSED' | 'MISSED';
}

export class PillboxHardwareController {
  /**
   * Evaluates which circular compartment LEDs must illuminate based on due schedule.
   */
  public static calculateLedRingStatus(
    hardware: HardwareBoxState,
    medications: Medication[],
    currentTime24h: string
  ): PillboxSlotLightState[] {
    const slots: PillboxSlotLightState[] = [];

    for (let slotNum = 1; slotNum <= 6; slotNum++) {
      const med = medications.find((m) => m.compartmentNumber === slotNum);
      if (!med) {
        slots.push({
          slotNumber: slotNum,
          medicationName: 'Empty Compartment',
          isLit: false,
          status: 'IDLE',
        });
        continue;
      }

      // Check if any slot is scheduled at current time or pending
      const dueSlot = med.dailySchedule.find((s) => s.scheduledTime === currentTime24h && s.status === 'pending');
      const isLit = hardware.activeSlotLed === slotNum || !!dueSlot;

      slots.push({
        slotNumber: slotNum,
        medicationName: med.name,
        isLit,
        status: dueSlot ? 'DUE' : 'IDLE',
      });
    }

    return slots;
  }

  /**
   * Applies an action to the hardware state machine (door toggle, alarm trigger, silence).
   */
  public static transitionHardwareState(
    current: HardwareBoxState,
    action: 'toggle_door' | 'trigger_alarm' | 'silence_alarm' | 'set_active_led',
    param?: number
  ): HardwareBoxState {
    const updated = structuredClone(current);

    switch (action) {
      case 'toggle_door':
        updated.doorOpen = !updated.doorOpen;
        break;
      case 'trigger_alarm':
        updated.buzzerActive = true;
        break;
      case 'silence_alarm':
        updated.buzzerActive = false;
        break;
      case 'set_active_led':
        if (param && param >= 1 && param <= 6) {
          updated.activeSlotLed = param;
        }
        break;
    }

    return updated;
  }
}
