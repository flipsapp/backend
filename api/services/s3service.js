var S3Service = {

  upload: function(file, callback) {
    file.upload({
      adapter: require('skipper-s3'),
      bucket: 'mugchat-pictures',
      key: 'AKIAILGTT2X6FTUAFI6Q',
      secret: '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'
    }, callback);
  }
};

module.exports = S3Service;