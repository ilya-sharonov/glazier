const { ipcMain, BrowserWindow, BrowserView } = require('electron');
const uuid = require('uuid');
const { Subject, throwError, EMPTY, ReplaySubject } = require('rxjs');
const {
    filter,
    sample,
    tap,
    switchMap,
    distinctUntilChanged,
    scan,
    first,
    map,
    takeUntil,
    catchError,
} = require('rxjs/operators');

class Glazier {
    constructor() {
        this.windows = new Map();
        this.createPlaceholder();
        this.mouseUpObservable = new Subject();
        this.enterActiveZoneObservable = new Subject();
        this.enterActiveZoneReplay = new ReplaySubject(1);
        this.exitActiveZoneObservable = new Subject();
        this.windowMoveObservable = new Subject();
        this.subscription = null;
        this.init();
    }

    stickLeft({ still, moving }) {
        const stillWindow = this.windows.get(still);
        const movingWindow = this.windows.get(moving);
        const stillBounds = stillWindow.getBounds();
        const movingBounds = movingWindow.getBounds();
        movingBounds.x = stillBounds.x - movingBounds.width;
        movingBounds.y = stillBounds.y;
        movingWindow.setBounds(movingBounds);
    }

    stickWindows(stickData) {
        this.unsubscribe();
        const { stickAt } = stickData;
        switch (stickAt) {
            case 'StickLeft': {
                this.stickLeft(stickData);
                break;
            }
        }
        this.hidePlaceholder();
        setTimeout(() => {
            this.setupPipes();
        }, 100);
    }

    showPlaceholder({ still, moving, stickAt, intersection }) {
        console.log('show called');
        const stillWindow = this.windows.get(still);
        const bounds = stillWindow.getBounds();
        if (stickAt === 'StickLeft') {
            bounds.x = bounds.x - 50;
            bounds.width += 50;
            this.placeholder.setBounds(bounds);
            this.placeholder.setOpacity(0.5);
            this.placeholder.show();
            stillWindow.moveAbove(this.placeholder.getMediaSourceId());
        }
    }

    hidePlaceholder() {
        console.log('hide called');
        this.placeholder.setOpacity(0.0);
        this.placeholder.hide();
    }

    unsubscribe() {
        if (this.subscription) {
            this.subscription.unsubscribe();
            this.subscription = null;
        }
    }

    setupPipes() {
        this.subscription = this.enterActiveZoneObservable
            .pipe(
                scan(
                    (acc, value) => {
                        if (acc.still === value.still) {
                            return value;
                        } else {
                            return acc.intersection >= value.intersection ? acc : value;
                        }
                    },
                    { intersection: 0 },
                ),
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
                                filter((elem) => elem.windowId !== moving),
                                switchMap(() => throwError(new Error())),
                            ),
                        ),
                        tap(() => console.log('Passed takeUntil')),
                        sample(this.mouseUpObservable.pipe(first((win) => win.windowId === moving))),
                        tap(() => console.log('passed sample')),
                        map(() => stickData),
                    );
                }),
            )
            .subscribe({
                error: () => {
                    this.hidePlaceholder();
                    this.setupPipes();
                },
                next: (stickData) => {
                    this.stickWindows(stickData);
                },
                complete: () => {
                    this.hidePlaceholder();
                    this.setupPipes();
                },
            });
    }

    init() {
        ipcMain.on('entered-active-zone', (event, stickData) => {
            this.enterActiveZoneObservable.next(stickData);
            this.enterActiveZoneReplay.next(stickData);
        });
        ipcMain.on('exited-active-zone', (event, data) => {
            this.exitActiveZoneObservable.next(data);
        });
        ipcMain.on('mouse-up', (event, data) => {
            this.mouseUpObservable.next(data);
        });
        this.setupPipes();
    }

    createPlaceholder() {
        this.placeholder = new BrowserWindow({
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
        this.placeholder.hide();
    }

    async createWindow(options) {
        try {
            const windowId = uuid.v4();
            const window = new BrowserWindow(options);
            window.loadFile('app/index.html');
            let view = new BrowserView();
            window.setBrowserView(view);
            view.setBounds({ x: 0, y: 20, width: 600, height: 380 });
            view.setAutoResize({ width: true, height: true, horizontal: true, vertical: true });
            // window.webContents.openDevTools();
            await window.webContents.executeJavaScript(
                `window.GLAZIER_WINDOW={id:'${windowId}', position: ${JSON.stringify(window.getBounds())}};`,
            );
            this.windows.set(windowId, window);
            window.on('closed', () => {
                this.windows.delete(windowId);
            });
            window.on('move', () => {
                const event = { ...window.getBounds(), windowId };
                this.windowMoveObservable.next(event);
                [...this.windows.values()].forEach((storedWindow) => {
                    storedWindow.webContents.send('position-changed', event);
                });
            });
        } catch (e) {
            console.log(e);
        }
    }
}

module.exports = Glazier;
