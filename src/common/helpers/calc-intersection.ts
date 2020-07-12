import { Stick } from '../constants';

type Coordinate = 'x' | 'y';
type Dimension = 'width' | 'height';

function calcIntersection(
    moving: Electron.Rectangle,
    still: Electron.Rectangle,
    coord: Coordinate,
    dim: Dimension,
): number {
    const movingOpposite = moving[coord] + moving[dim];
    const stillOpposite = still[coord] + still[dim];
    switch (true) {
        case movingOpposite > stillOpposite && moving[coord] < still[coord]: {
            return still[dim];
        }
        case movingOpposite <= stillOpposite && moving[coord] >= still[coord]: {
            return moving[dim];
        }
        case moving[coord] < still[coord] && movingOpposite <= stillOpposite: {
            return movingOpposite - still[coord];
        }
        case moving[coord] >= still[coord] && movingOpposite > stillOpposite: {
            return stillOpposite - moving[coord];
        }
    }
    return 0;
}

function calcLeftRightIntersection(moving: Electron.Rectangle, still: Electron.Rectangle): number {
    return calcIntersection(moving, still, 'y', 'height');
}

function calcTopBottomIntersection(moving: Electron.Rectangle, still: Electron.Rectangle): number {
    return calcIntersection(moving, still, 'x', 'width');
}

export function getIntersection(stickAt: Stick, moving: Electron.Rectangle, still: Electron.Rectangle): number {
    switch (stickAt) {
        case Stick.Left:
        case Stick.Right: {
            return calcLeftRightIntersection(moving, still);
        }
        case Stick.Top:
        case Stick.Bottom: {
            return calcTopBottomIntersection(moving, still);
        }
        default: {
            return 0;
        }
    }
}
