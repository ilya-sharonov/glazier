import { ipcMain, BrowserWindow, globalShortcut, BrowserWindowConstructorOptions } from 'electron';
import * as uuid from 'uuid';
import { Subject, throwError, ReplaySubject, Subscription } from 'rxjs';
import { filter, sample, tap, switchMap, distinctUntilChanged, scan, first, map, takeUntil } from 'rxjs/operators';
import { ActiveZoneEnter, ActiveZoneExit } from './models';
import { EMPTY_INTERSECTION, DEFAULT_ACTIVE_ZONE, Stick } from './constants';

export class Glazier {
    private windows: Map<string, BrowserWindow>;
    private enterActiveZoneObservable: Subject<ActiveZoneEnter>;
    private enterActiveZoneReplay: ReplaySubject<ActiveZoneEnter>;
    private exitActiveZoneObservable: Subject<ActiveZoneExit>;
    private dockCommandObservable: Subject<unknown>;
    private subscription: Subscription | null;
    private placeholder: BrowserWindow;
    private groups: Map<string, Set<string>>;
    private registry: Map<string, string>;

    constructor() {
        this.windows = new Map();
        this.groups = new Map();
        this.registry = new Map();
        this.placeholder = this.createPlaceholder();
        this.enterActiveZoneObservable = new Subject();
        this.enterActiveZoneReplay = new ReplaySubject(1);
        this.exitActiveZoneObservable = new Subject();
        this.dockCommandObservable = new Subject();
        this.subscription = null;
        this.init();
    }

    stickWindows(stickData: ActiveZoneEnter): void {
        const { still, moving, stickAt } = stickData;
        const stillWindow = this.windows.get(still);
        const movingWindow = this.windows.get(moving);
        if (!stillWindow || !movingWindow) {
            console.log('Window not found ', stillWindow, movingWindow);
            return;
        }
        this.unsubscribe();
        const stillBounds = stillWindow.getBounds();
        const movingBounds = movingWindow.getBounds();
        switch (stickAt) {
            case Stick.Left: {
                movingBounds.x = stillBounds.x - movingBounds.width;
                movingBounds.y = stillBounds.y;
                break;
            }
            case Stick.Right: {
                movingBounds.x = stillBounds.x + stillBounds.width;
                movingBounds.y = stillBounds.y;
                break;
            }
            case Stick.Top: {
                movingBounds.y = stillBounds.y - movingBounds.height;
                movingBounds.x = stillBounds.x;
                break;
            }
            case Stick.Bottom: {
                movingBounds.y = stillBounds.y + stillBounds.height;
                movingBounds.x = stillBounds.x;
                break;
            }
        }
        movingWindow.setBounds(movingBounds);
        const groupId = uuid.v4();
        this.groups.set(groupId, new Set([still, moving]));
        this.registry.set(still, groupId);
        this.registry.set(moving, groupId);
        this.hidePlaceholder();
        this.setupPipes();
    }

    getPlaceholderBounds(stickAt: Stick, stillBounds: Electron.Rectangle): Electron.Rectangle {
        const bounds = { ...stillBounds };
        switch (stickAt) {
            case Stick.Left: {
                bounds.x -= DEFAULT_ACTIVE_ZONE;
                bounds.width += DEFAULT_ACTIVE_ZONE;
                break;
            }
            case Stick.Right: {
                bounds.width += DEFAULT_ACTIVE_ZONE;
                break;
            }
            case Stick.Top: {
                bounds.y -= DEFAULT_ACTIVE_ZONE;
                bounds.height += DEFAULT_ACTIVE_ZONE;
                break;
            }
            case Stick.Bottom: {
                bounds.height += DEFAULT_ACTIVE_ZONE;
                break;
            }
            default: {
                break;
            }
        }
        return bounds;
    }

    showPlaceholder({ still, moving, stickAt }: ActiveZoneEnter): void {
        const stillWindow = this.windows.get(still);
        const movingWindow = this.windows.get(moving);
        if (!stillWindow || !movingWindow) {
            console.log('Window not found ', stillWindow, movingWindow);
            return;
        }
        const stillBounds = stillWindow.getBounds();
        const bounds = this.getPlaceholderBounds(stickAt, stillBounds);
        this.placeholder.setBounds(bounds);
        this.placeholder.setOpacity(0.5);
        this.placeholder.show();
        stillWindow.moveAbove(this.placeholder.getMediaSourceId());
        movingWindow.moveAbove(this.placeholder.getMediaSourceId());
    }

    hidePlaceholder(): void {
        this.placeholder.setOpacity(0.0);
        this.placeholder.hide();
    }

    unsubscribe(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
            this.subscription = null;
        }
    }

    setupPipes(): void {
        this.subscription = this.enterActiveZoneObservable
            .pipe(
                scan((acc, value) => {
                    if (acc.still === value.still) {
                        return value;
                    } else {
                        return acc.intersection >= value.intersection ? acc : value;
                    }
                }, EMPTY_INTERSECTION),
                tap(() => console.log('passed scan')),
                distinctUntilChanged((v1, v2) => v1.still === v2.still && v1.moving === v2.moving),
                tap((stickData) => console.log('passed distinct', stickData)),
                tap((stickData) => {
                    this.showPlaceholder(stickData);
                }),
                switchMap((stickData) => {
                    const { moving } = stickData;
                    return this.enterActiveZoneReplay.pipe(
                        filter((data) => data.moving === moving),
                        tap(() => console.log('Passed moving filter')),
                        takeUntil(
                            this.exitActiveZoneObservable.pipe(
                                filter((elem) => elem.moving === moving),
                                switchMap(() => throwError(new Error())),
                            ),
                        ),
                        tap(() => console.log('Passed takeUntil')),
                        sample(this.dockCommandObservable.pipe(first())),
                        tap(() => console.log('passed sample')),
                        map(() => stickData),
                    );
                }),
            )
            .subscribe({
                error: () => {
                    console.log('exited');
                    this.hidePlaceholder();
                    this.unsubscribe();
                    this.setupPipes();
                },
                next: (stickData) => {
                    console.log('stacked');
                    this.stickWindows(stickData);
                },
                complete: () => {
                    this.hidePlaceholder();
                    this.setupPipes();
                },
            });
    }

    init(): void {
        ipcMain.on('entered-active-zone', (event, stickData) => {
            // console.log('entered', stickData);
            this.enterActiveZoneObservable.next(stickData);
            this.enterActiveZoneReplay.next(stickData);
        });
        ipcMain.on('exited-active-zone', (event, data) => {
            // console.log('exited', data);
            this.exitActiveZoneObservable.next(data);
        });
        const ret = globalShortcut.register('CommandOrControl+D', () => {
            if (this.dockCommandObservable) {
                this.dockCommandObservable.next();
            }
        });
        if (!ret) {
            throw new Error('Failed to register CommandOrControl+D global key hook');
        }
        this.setupPipes();
    }

    createPlaceholder(): BrowserWindow {
        const placeholder = new BrowserWindow({
            width: 100,
            height: 100,
            frame: false,
            minimizable: false,
            maximizable: false,
            closable: false,
            focusable: false,
            backgroundColor: '#0000FF',
            opacity: 0.0,
        });
        placeholder.hide();
        return placeholder;
    }

    async createWindow(options: BrowserWindowConstructorOptions): Promise<void> {
        try {
            const windowId = uuid.v4();
            const window = new BrowserWindow(options);
            window.webContents.once('dom-ready', () => {
                window.webContents.executeJavaScript(
                    `window.GLAZIER_WINDOW={id:'${windowId}', position: ${JSON.stringify(window.getBounds())}};`,
                );
            });
            await window.loadURL('http://localhost:9000');
            /* const view = new BrowserView();
            // await view.webContents.loadURL('http://localhost:9000/titlebar.html');
            window.addBrowserView(view);
            view.setBounds({ x: 0, y: 20, width: 600, height: 380 });
            view.setAutoResize({ width: true, height: true, horizontal: true, vertical: true }); */

            this.windows.set(windowId, window);
            window.on('closed', () => {
                this.windows.delete(windowId);
            });
            window.on('will-move', (_, newBounds) => {
                const groupId = this.registry.get(windowId);
                if (groupId) {
                    console.log('will move grouped', windowId, newBounds);
                    const windowIds = this.groups.get(groupId);
                    if (windowIds) {
                        [...windowIds]
                            .filter((wid) => wid !== windowId)
                            .forEach((windId) => {
                                const frame = this.windows.get(windId);
                                if (frame) {
                                    const previousBounds = window.getBounds();
                                    const deltaX = previousBounds.x - newBounds.x;
                                    const deltaY = previousBounds.y - newBounds.y;
                                    const frameBounds = frame.getBounds();
                                    frame.setBounds({
                                        ...frameBounds,
                                        x: frameBounds.x + deltaX,
                                        y: frameBounds.y + deltaY,
                                    });
                                }
                            });
                    }
                }
            });
            window.on('move', () => {
                const event = { ...window.getBounds(), windowId };
                [...this.windows.values()].forEach((storedWindow) => {
                    storedWindow.webContents.send('position-changed', event);
                });
            });
        } catch (e) {
            console.log(e);
        }
    }
}
