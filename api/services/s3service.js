var S3Service = {

  upload: function(file, upload_bucket, callback) {
    file.upload({
      adapter: require('skipper-s3'),
      bucket: upload_bucket,
      key: 'AKIAILGTT2X6FTUAFI6Q',
      secret: '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'
    }, callback);
  },

  PICTURES_BUCKET: 'mugchat-pictures',
  BACKGROUND_BUCKET: 'mugchat-background',
  SOUND_BUCKET: 'mugchat-sound'

};

module.exports = S3Service;