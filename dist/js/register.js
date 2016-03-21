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
});
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
    submit();
  }
}

// Converts fileURI returned from webcamjs to binary blob
// copypasta'd from webcamjs source
function fileToBlob(fileURI) {
  // extract raw base64 data from Data URI
  var raw_image_data = fileURI.replace(/^data\:image\/\w+\;base64\,/, '');

  // create a blob and decode our base64 to binary
  var blob = new Blob( [ Webcam.base64DecToArr(raw_image_data) ], {type: 'image/jpg'} );
  return blob;
}

function submit() {

  // Upload picture to s3, viewable at publicPictureUrl
  var publicPictureUrl;
  Webcam.snap(function(dataURI) {
    $.get('/rushee-picture-upload/' + 'testRusheeName' + '.jpg', {}, function(uploadParams) {
      publicPictureUrl = uploadParams.public_url;

      var formData = new FormData();
      var authparams = uploadParams.params;
      for (var param in authparams) {
        formData.append(param, authparams[param]);
      }

      // create FormData containing image data
      var blob = fileToBlob(dataURI);
      formData.append('file', blob, 'testRusheeName' + '.jpg');

      $.ajax({
        url: uploadParams.form_url, 
        type: 'POST',
        processData: false,
        contentType: false,
        cache: false,
        dataType: 'json',
        data: formData,
        error: function(jqXHR, textStatus, errorThrown) {
          console.log(textStatus + ':' + errorThrown);
        }
      });
    }, 'json');
  });
}
