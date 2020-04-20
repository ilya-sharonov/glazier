const { app, BrowserWindow } = require('electron');
const Glazier = require('../Glazier');

let glazier = null;

const windowOptions = {
    width: 600,
    height: 400,
    frame: false,
    webPreferences: {
        nodeIntegration: true,
    },
};

(async function () {
    await app.whenReady();

    glazier = new Glazier();
    glazier.createWindow(windowOptions);
    glazier.createWindow(windowOptions);
    glazier.createWindow(windowOptions);

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
})();
