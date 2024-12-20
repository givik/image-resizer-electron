const path = require('path');
const os = require('os');
const fs = require('fs');
const sharp = require('sharp');
const resizeImg = require('resize-img');
const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');

let isDev = process.env.NODE_ENV !== 'production';
const isMac = process.platform === 'darwin';
isDev = false;

let mainWindow;

// Create the main window
function createMainWindow() {
  mainWindow = new BrowserWindow({
    title: 'Image Resizer',
    width: isDev ? 1000 : 500,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Open devtools if in dev env
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.loadFile(path.join(__dirname, './renderer/index.html'));
}

// Create about window
function createAboutWindow() {
  const aboutWindow = new BrowserWindow({
    title: 'About Image Resizer',
    width: 300,
    height: 300,
  });

  aboutWindow.loadFile(path.join(__dirname, './renderer/about.html'));
}

// Menu template
const menu = [
  ...(isMac
    ? [
        {
          label: app.name,
          submenu: [
            {
              label: 'About',
              click: createAboutWindow,
            },
          ],
        },
      ]
    : []),
  {
    role: 'fileMenu',
  },
  ...(!isMac
    ? [
        {
          label: 'Help',
          submenu: [
            {
              label: 'About',
              click: createAboutWindow,
            },
          ],
        },
      ]
    : []),
];

// App is ready
app.whenReady().then(() => {
  createMainWindow();

  process.env.NODE_ENV = 'production';

  // Implement menu
  const mainMenu = Menu.buildFromTemplate(menu);
  Menu.setApplicationMenu(mainMenu);

  // Remove mainWindow from memory on close
  mainWindow.on('closed', () => (mainWindow = null));

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// Respond to ipcRenderer resize
ipcMain.on('image:resize', (e, options) => {
  options.dest = path.join(os.homedir(), 'results');
  resizeImage(options);
});

const cropImage = (imgPath, dimensions) => {
  // Create filename
  const filename = path.basename(imgPath); // ex: image.png
  const outputImgPath = `/Users/givikokuchukhidze/Desktop/${dimensions.width}x${dimensions.height} ${filename}`;

  let aspectRatio = dimensions.width / dimensions.height;

  sharp(imgPath)
    .metadata()
    .then(({ width, height }) => {
      // Calculate the crop dimensions
      let cropWidth = width;
      let cropHeight = Math.round(width / aspectRatio);

      if (cropHeight > height) {
        // If the calculated height is larger than the image, adjust
        cropHeight = height;
        cropWidth = Math.round(height * aspectRatio);
      }

      // Calculate the crop position (centered)
      const left = Math.round((width - cropWidth) / 2);
      const top = Math.round((height - cropHeight) / 2);

      // Perform the crop
      return sharp(imgPath)
        .extract({ left, top, width: cropWidth, height: cropHeight })
        .resize(dimensions.width * 96, dimensions.height * 96)
        .toFile(outputImgPath);
    })
    .then(() => console.log('Image cropped successfully!'))
    .catch((err) => console.error('Error:', err));
};

// Resize the image
async function resizeImage({ imgPath, width, height, dest }) {
  try {
    const dimensions = [
      { width: 24, height: 36 },
      { width: 18, height: 24 },
      { width: 16, height: 20 },
      { width: 11, height: 14 },
      { width: 5, height: 7 },
    ];

    for (let i = 0; i < dimensions.length; i++) {
      cropImage(imgPath, dimensions[i]);
    }

    // Create dest folder if not exists
    // if (!fs.existsSync(dest)) {
    //   fs.mkdirSync(dest);
    // }

    // Write file to dest
    // fs.writeFileSync(path.join(dest, filename), newPath);

    // Send success to render
    // mainWindow.webContents.send('image:done');

    // Open dest folder
    // shell.openPath(dest);
  } catch (error) {
    console.log(error);
  }
}

app.on('window-all-closed', () => {
  // if (!isMac)
  app.quit();
});
