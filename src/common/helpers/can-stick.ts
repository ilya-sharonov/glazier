import { DEFAULT_ACTIVE_ZONE, Stick } from '../constants';

function canStickLeft(moving: Electron.Rectangle, still: Electron.Rectangle): boolean {
    const movingRightX = moving.x + moving.width;
    const stillActiveZoneStartX = still.x - DEFAULT_ACTIVE_ZONE;
    const stillActiveZoneEndX = still.x + DEFAULT_ACTIVE_ZONE;
    const movingBottomY = moving.y + moving.height;
    const stillBottomY = still.y + still.height;
    return (
        movingRightX >= stillActiveZoneStartX &&
        movingRightX <= stillActiveZoneEndX &&
        ((moving.y >= still.y && moving.y <= stillBottomY) ||
            (movingBottomY >= still.y && movingBottomY <= stillBottomY) ||
            (moving.y < still.y && movingBottomY > stillBottomY))
    );
}

function canStickRight(moving: Electron.Rectangle, still: Electron.Rectangle): boolean {
    const stillActiveZoneStartX = still.x + still.width - DEFAULT_ACTIVE_ZONE;
    const stillActiveZoneEndX = still.x + still.width + DEFAULT_ACTIVE_ZONE;
    const movingBottomY = moving.y + moving.height;
    const stillBottomY = still.y + still.height;
    return (
        moving.x >= stillActiveZoneStartX &&
        moving.x <= stillActiveZoneEndX &&
        ((moving.y >= still.y && moving.y <= stillBottomY) ||
            (movingBottomY >= still.y && movingBottomY <= stillBottomY) ||
            (moving.y < still.y && movingBottomY > stillBottomY))
    );
}

function canStickTop(moving: Electron.Rectangle, still: Electron.Rectangle): boolean {
    const movingBottomY = moving.y + moving.height;
    const stillActiveZoneStartY = still.y - DEFAULT_ACTIVE_ZONE;
    const stillActiveZoneEndY = still.y + DEFAULT_ACTIVE_ZONE;
    const movingRightX = moving.x + moving.width;
    const stillRightX = still.x + still.width;
    return (
        movingBottomY >= stillActiveZoneStartY &&
        movingBottomY <= stillActiveZoneEndY &&
        ((moving.x >= still.x && moving.x <= stillRightX) ||
            (movingRightX >= still.x && movingRightX <= stillRightX) ||
            (moving.x < still.x && movingRightX > stillRightX))
    );
}

function canStickBottom(moving: Electron.Rectangle, still: Electron.Rectangle): boolean {
    const stillActiveZoneStartY = still.y + still.height - DEFAULT_ACTIVE_ZONE;
    const stillActiveZoneEndY = still.y + still.height + DEFAULT_ACTIVE_ZONE;
    const movingRightX = moving.x + moving.width;
    const stillRightX = still.x + still.width;
    return (
        moving.y >= stillActiveZoneStartY &&
        moving.y <= stillActiveZoneEndY &&
        ((moving.x >= still.x && moving.x <= stillRightX) ||
            (movingRightX >= still.x && movingRightX <= stillRightX) ||
            (moving.x < still.x && movingRightX > stillRightX))
    );
}

export function canStick(moving: Electron.Rectangle, still: Electron.Rectangle): Stick {
    switch (true) {
        case canStickLeft(moving, still): {
            return Stick.Left;
        }
        case canStickRight(moving, still): {
            return Stick.Right;
        }
        case canStickTop(moving, still): {
            return Stick.Top;
        }
        case canStickBottom(moving, still): {
            return Stick.Bottom;
        }
        default: {
            return Stick.None;
        }
    }
}
