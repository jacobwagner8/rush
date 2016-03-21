// Webcam picture code
Webcam.setSWFLocation("/swf/webcam.swf");

Webcam.set({
  width: 640,
  height: 480,
  dest_width: 640,
  dest_height: 480,
  crop_width: 480,
  crop_height: 480,
  fps: 60
})
Webcam.attach('#webcam');

// webcam capture/uncapture button
var captureButton = $('#capture-btn');
var frozen = false;
function capture() {
  if (frozen) {
    frozen = false;
    captureButton.text('Take Photo');
    Webcam.unfreeze();
  }
  else {
    Webcam.freeze();
    captureButton.text('Retake');
    frozen = true;
  }
}

function submit() {
  Webcam.snap(function(dataURI) {
  })
}

function getUploadParams() {
  $.get('/rushee-picture-upload/' + 'testRusheeName', {}, function(uploadParams) {
    console.log(uploadParams);
  }, 'json');
}

getUploadParams();
