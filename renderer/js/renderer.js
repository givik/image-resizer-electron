const form = document.querySelector('#img-form');
const img = document.querySelector('#img');
const outputPath = document.querySelector('#output-path');
const filename = document.querySelector('#filename');

function loadImage(e) {
  const file = e.target.files[0];

  if (!isFileImage(file)) {
    alertError('Please select an image');
    return;
  }

  // Get original dimensions
  const image = new Image();
  image.src = URL.createObjectURL(file);

  filename.innerText = file.name;
  outputPath.innerText = path.join(os.homedir(), '/Desktop');

  sendImage();
}

// Send image data to main
function sendImage(e) {
  // e.preventDefault();

  const imgPath = webUtils.getPathForFile(img.files[0]);

  if (!img.files[0]) {
    alertError('Please upload an image');
    return;
  }

  // Send to main using ipcRenderer
  ipcRenderer.send('image:resize', {
    imgPath,
  });
}

// Catch the image:done event
ipcRenderer.on('image:done', () => {
  alertSuccess(`Image resized and cropped`);
});

// Make sure files is image
function isFileImage(file) {
  const acceptedImageTypes = ['image/gif', 'image/png', 'image/jpeg'];

  return file && acceptedImageTypes.includes(file['type']);
}

function alertError(message) {
  Toastify.toast({
    text: message,
    duration: 5000,
    close: false,
    style: {
      background: 'red',
      color: 'white',
      textAlign: 'center',
    },
  });
}

function alertSuccess(message) {
  Toastify.toast({
    text: message,
    duration: 5000,
    close: false,
    style: {
      background: 'green',
      color: 'white',
      textAlign: 'center',
    },
  });
}

img.addEventListener('change', loadImage);
