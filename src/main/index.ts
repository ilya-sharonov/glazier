import { app } from 'electron';
import { Glazier } from '../common/Glazier';

const windowOptions = {
    width: 600,
    height: 400,
    frame: false,
    webPreferences: {
        nodeIntegration: true,
    },
};

(async function (): Promise<void> {
    await app.whenReady();

    const glazier = new Glazier();
    await glazier.createWindow(windowOptions);
    await glazier.createWindow(windowOptions);

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });
})();
