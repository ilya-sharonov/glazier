import { ipcRenderer } from 'electron';
import { Subject } from 'rxjs';
import { filter, tap, map, pairwise } from 'rxjs/operators';
import { GlazierWindowParam, WindowMoveEvent } from '../common/models';
import { Stick } from '../common/constants';
import { canStick } from '../common/helpers/can-stick';
import { getIntersection } from '../common/helpers/calc-intersection';

declare const GLAZIER_WINDOW: GlazierWindowParam;

const subject = new Subject<WindowMoveEvent>();
let position: Electron.Rectangle = { x: 0, y: 0, width: 0, height: 0 };
let groupId = '';

document.addEventListener('DOMContentLoaded', () => {
    position = GLAZIER_WINDOW.position;
});

ipcRenderer.on('position-changed', (_, payload) => {
    if (payload.windowId === GLAZIER_WINDOW.id) {
        position = payload;
        return;
    } else {
        position = position || GLAZIER_WINDOW.position;
    }
    subject.next(payload);
});

ipcRenderer.on('group-created', (_, payload) => {
    groupId = payload;
});

subject
    .pipe(
        map((moving) => ({ moving, stickAt: canStick(moving, position) })),
        pairwise(),
        tap(([{ stickAt: previous, moving }, { stickAt: current }]) => {
            if (previous !== Stick.None && current === Stick.None) {
                ipcRenderer.send('exited-active-zone', {
                    still: GLAZIER_WINDOW.id,
                    moving: moving.windowId,
                    stickAt: previous,
                });
            }
        }),
        filter(([, { stickAt }]) => stickAt !== Stick.None),
        map(([, { moving, stickAt }]) => ({
            moving,
            stickAt,
            intersection: getIntersection(stickAt, moving, position),
        })),
    )
    .subscribe({
        next: ({ moving, stickAt, intersection }) => {
            ipcRenderer.send('entered-active-zone', {
                still: GLAZIER_WINDOW.id,
                moving: moving.windowId,
                stickAt,
                intersection,
            });
        },
    });
