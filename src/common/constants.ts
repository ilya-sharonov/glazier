import { ActiveZoneEnter } from './models';

export const DEFAULT_ACTIVE_ZONE = 50;

export enum Stick {
    Left = 'StickLeft',
    Right = 'StickRight',
    Top = 'StickTop',
    Bottom = 'StickBottom',
    None = 'StickNone',
}

export const EMPTY_INTERSECTION: ActiveZoneEnter = {
    intersection: 0,
    still: '',
    moving: '',
    stickAt: Stick.None,
};
