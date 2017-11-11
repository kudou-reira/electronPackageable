import path from 'path';
import url from 'url';
import {app, crashReporter, BrowserWindow, Menu, ipcMain, shell } from 'electron';
const ffmpeg = require('fluent-ffmpeg');
const _ = require('lodash');

const isDevelopment = (process.env.NODE_ENV === 'development');

let mainWindow = null;
let forceQuit = false;

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const extensions = [
    'REACT_DEVELOPER_TOOLS',
    'REDUX_DEVTOOLS'
  ];
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  for (const name of extensions) {
    try {
      await installer.default(installer[name], forceDownload);
    } catch (e) {
      console.log(`Error installing ${name} extension: ${e.message}`);
    }
  }
};

crashReporter.start({
  productName: 'YourName',
  companyName: 'YourCompany',
  submitURL: 'https://your-domain.com/url-to-submit',
  uploadToServer: false
});

app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', async () => {
  if (isDevelopment) {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({ 
    width: 1000, 
    height: 800,
    minWidth: 640,
    minHeight: 480,
    show: false 
  });

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  // show window once on first load
  mainWindow.webContents.once('did-finish-load', () => {
    mainWindow.show();
  });

  mainWindow.webContents.on('did-finish-load', () => {
    // Handle window logic properly on macOS:
    // 1. App should not terminate if window has been closed
    // 2. Click on icon in dock should re-open the window
    // 3. ⌘+Q should close the window and quit the app
    if (process.platform === 'darwin') {
      mainWindow.on('close', function (e) {
        if (!forceQuit) {
          e.preventDefault();
          mainWindow.hide();
        }
      });

      app.on('activate', () => {
        mainWindow.show();
      });
      
      app.on('before-quit', () => {
        forceQuit = true;
      });
    } else {
      mainWindow.on('closed', () => {
        mainWindow = null;
      });
    }
  });

  if (isDevelopment) {
    // auto-open dev tools
    mainWindow.webContents.openDevTools();

    // add inspect element on right click menu
    mainWindow.webContents.on('context-menu', (e, props) => {
      Menu.buildFromTemplate([{
        label: 'Inspect element',
        click() {
          mainWindow.inspectElement(props.x, props.y);
        }
      }]).popup(mainWindow);
    });
  }
});

ipcMain.on('videos:added', (event, videos) => {
  // console.log(videos);

  // const promise = new Promise((resolve, reject) => {
  //  ffmpeg.ffprobe(videos[0].path, (err, metadata) => {
  //    // console.log(metadata);
  //    resolve(metadata);
  //  });
  // });

  // promise.then((metadata) => {
  //  console.log(metadata);
  // });

  // return an array of promises
  const promises = _.map(videos, (video) =>  {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(video.path, (err, metadata) => {
        video.duration = metadata.format.duration;
        video.format = 'avi';
        resolve(video);
      });
    });
  });

  Promise.all(promises)
    .then((results) => {
      // console.log(results);
      // results is an array of information
      mainWindow.webContents.send('metadata:complete', results);
    });
});

ipcMain.on('conversion:start', (event, videos) => {
  _.each(videos, (video) => {
    console.log("this is conversion start");

    const outputDirectory = video.path.split(video.name)[0];
    const outputName = video.name.split('.')[0];
    const outputPath = `${outputDirectory}${outputName}.${video.format}`;

    console.log(outputPath);

    ffmpeg(video.path)
      .output(outputPath)
      .on('progress', (event) => {
        // console.log(event);
        mainWindow.webContents.send('conversion:progress', { 
          video: video, 
          timemark: event.timemark 
        });
      })
      .on('end', () => {
        console.log('Video conversion done');
        mainWindow.webContents.send('conversion:end', 
          { 
            video: video,
            outputPath: outputPath
          }
        );
      })
      .run();
  });
});

ipcMain.on('folder:open', (event, outputPath) => {
  shell.showItemInFolder(outputPath);
});
