import { ActiveZoneEnter } from './models';

export const DEFAULT_ACTIVE_ZONE = 50;

export enum Stick {
    None = 0,
    Top = 1,
    Right = 2,
    Bottom = 3,
    Left = 4,
}

export const EMPTY_INTERSECTION: ActiveZoneEnter = {
    intersection: 0,
    still: 0,
    moving: 0,
    stickAt: Stick.None,
};

export const WM_ENTERSIZEMOVE = 0x0231;
export const WM_MOVING = 0x0216;
export const WM_WINDOWPOSCHANGING = 0x0046;
export const WM_WINDOWPOSCHANGED = 0x0047;
export const WM_MOVE = 0x0003;
export const WM_EXITSIZEMOVE = 0x0232;
export const WM_SIZING = 0x0214;
export const WM_SIZE = 0x0005;

/**
 * To monitor move:
 *
 * WM_ENTERSIZEMOVE
 * WM_MOVING
 * WM_MOVE
 * WM_EXITSIZEMOVE
 *
 * To monitor resize:
 *
 * WM_ENTERSIZEMOVE
 * WM_SIZING
 * WM_SIZE
 * WM_EXITSIZEMOVE
 */
