import { Stick } from './constants';

export type GlazierWindowId = number;

export interface WindowMoveEvent extends Electron.Rectangle {
    windowId: GlazierWindowId;
}

export interface GlazierWindowParam {
    id: GlazierWindowId;
    position: Electron.Rectangle;
}

export interface ActiveZoneExit {
    still: GlazierWindowId;
    moving: GlazierWindowId;
    stickAt: Stick;
}

export interface ActiveZoneEnter extends ActiveZoneExit {
    intersection: number;
}
