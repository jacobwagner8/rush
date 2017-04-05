// Webcam picture code
Webcam.setSWFLocation("/swf/webcam.swf");

Webcam.set({
  // width: 640,
  // height: 480,
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
  }
  setSubmitState();
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

let popup = initPopup($('#result-popup'));

function reset() {
  let rusheeName = $('#rushee-name').val();
  $('#register-form').trigger('reset');
  captureButton.text('Take Photo');
  frozen = false;
  setSubmitState();
  popup("Thanks, " + rusheeName);
}

// override submit
$('#register-form').on('submit', function(e) {
  e.preventDefault();
  var rusheeName = $('#rushee-name').val();
  var rusheeYear = $('#rushee-year').val();
  var rusheeDorm = $('#rushee-dorm').val();
  var rusheeRoom = $('#rushee-room').val();
  var rusheePhone = $('#rushee-phone').val();
  // Upload picture to s3, viewable at publicPictureUrl
  var pictureFileName = rusheeName.replace(/\s+/g, '-') + '.jpg';
  Webcam.snap(function(dataURI) {
    $.get('/rushee-picture-upload/' + pictureFileName, {}, function(uploadParams) {
      var publicPictureUrl = uploadParams.public_url;

      var formData = new FormData();
      var authparams = uploadParams.params;
      for (var param in authparams) {
        formData.append(param, authparams[param]);
      }

      // create FormData containing image data
      var blob = fileToBlob(dataURI);
      formData.append('file', blob, pictureFileName);

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
        },
        success: function() {
          $.post('/register', {
            name: rusheeName,
            year: rusheeYear,
            dorm: rusheeDorm,
            room_number: rusheeRoom,
            phone_number: rusheePhone,
            profile_picture: publicPictureUrl
          }, reset);
        }
      });
    }, 'json');
  });
});

// Disable register button until all fields are populated
function isReady() {
  var ready = true;
  required.each(function() {
    if (!$(this).val())
      ready = false;
  });
  return ready && frozen;
}

var submitButton = $('#submit-btn');
function setSubmitState() {
  if (isReady())
    submitButton.removeAttr('disabled');
  else
    submitButton.attr('disabled', 'disabled');
}

var required = $('.required');
required.on('input', setSubmitState);
setSubmitState();
