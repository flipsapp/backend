/**
 * FlipController
 *
 * @description :: Server-side logic for managing Flips
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var Krypto = requires('>/api/utilities/Krypto');

var FlipController = {

  create: function (request, response) {
    var values = {
      word: request.body.word
    };
    if (request.body.background_url) {
      values.backgroundURL = request.body.background_url
    }
    if (request.body.sound_url) {
      values.soundURL = request.body.sound_url
    }
    if (request.params.user_id) {
      values.owner = request.params.user_id
    }
    if (request.body.is_private) {
      values.isPrivate = (request.body.is_private == "1" || request.body.is_private)
    }
    if (request.body.category) {
      values.category = request.body.category
    }
    User.findOne(values.owner).exec(function (err, user) {
      if (user && Krypto.decrypt(user.username) == process.env.STOCKFLIPS_USERNAME) {
        values.isPrivate = false;
      }
      Flip.create(values).exec(function (err, flip) {
        if (err || !flip) {
          return response.send(400, new FlipsError('Error trying to create flip', err));
        }
        return response.send(201, flip);
      });
    });
  },

  uploadBackground: function (request, response) {
    if (!request.file('background') || request.file('background')._files.length < 1) {
      return response.send(400, new FlipsError('No background file to upload'));
    }
    s3service.upload(request.file('background'), s3service.BACKGROUND_BUCKET, function (err, uploadedFiles) {
      if (err) {
        var errmsg = new FlipsError('Error trying to upload background file to S3', err);
        logger.error(errmsg);
        return response.send(500, errmsg);
      }
      if (!uploadedFiles || uploadedFiles.length < 1) {
        return response.send(400, new FlipsError('Error trying to upload background file to S3', err));
      }
      return response.send(201, {background_url: s3service.S3_URL + s3service.BACKGROUND_BUCKET + '/' + uploadedFiles[0].fd});
    });
  },

  uploadSound: function (request, response) {
    if (!request.file('sound') || request.file('sound')._files.length < 1) {
      return response.send(400, new FlipsError('No sound file to upload'));
    }
    s3service.upload(request.file('sound'), s3service.SOUND_BUCKET, function (err, uploadedFiles) {
      if (err) {
        var errmsg = new FlipsError('Error trying to upload audio file to S3', err);
        logger.error(errmsg);
        return response.send(500, errmsg);
      }
      if (!uploadedFiles || uploadedFiles.length < 1) {
        return response.send(400, new FlipsError('Error trying to upload audio file to S3', err));
      }
      return response.send(201, {sound_url: s3service.S3_URL + s3service.SOUND_BUCKET + '/' + uploadedFiles[0].fd});
    });
  },

  uploadThumbnail: function (request, response) {
    if (!request.file('thumbnail') || request.file('thumbnail')._files.length < 1) {
      return response.send(400, new FlipsError('No thumbnail file to upload'));
    }
    s3service.upload(request.file('thumbnail'), s3service.THUMBNAILS_BUCKET, function (err, uploadedFiles) {
      if (err) {
        var errmsg = new FlipsError('Error trying to upload thumbnail file to S3', err);
        logger.error(errmsg);
        return response.send(500, errmsg);
      }
      if (!uploadedFiles || uploadedFiles.length < 1) {
        return response.send(400, new FlipsError('Error trying to upload thumbnail file to S3', err));
      }
      return response.send(201, {thumbnail_url: s3service.S3_URL + s3service.THUMBNAILS_BUCKET + '/' + uploadedFiles[0].fd});
    });
  },

  updateBackground: function (request, response) {
    if (!request.file('background') || request.file('background')._files.length < 1) {
      return response.send(400, new FlipsError('No background file to upload'));
    }
    s3service.upload(request.file('background'), s3service.BACKGROUND_BUCKET, function (err, uploadedFiles) {
      if (err) {
        var errmsg = new FlipsError('Error trying to upload background file to S3', err);
        logger.error(errmsg);
        return response.send(500, errmsg);
      }
      if (!uploadedFiles || uploadedFiles.length < 1) {
        return response.send(400, new FlipsError('Error trying to upload background file to S3', err));
      }
      Flip.findOne(request.params.flip_id).populate('owner').exec(function (err, flip) {
        if (err) {
          var errmsg = new FlipsError('Error trying to retrieve flip', err);
          logger.error(errmsg);
          return response.send(500, errmsg);
        }
        if (!flip) {
          return response.send(404, new FlipsError('Flip not found'));
        }
        if (flip.owner && flip.owner.id != request.params.user_id) {
          return response.send(403, new FlipsError('This flip does not belong to this user'));
        }
        flip.backgroundURL = s3service.S3_URL + s3service.BACKGROUND_BUCKET + '/' + uploadedFiles[0].fd;
        flip.save(function (err) {
          if (err) {
            var errmsg = new FlipsError('Error trying to save flip', err);
            logger.error(errmsg);
            return response.send(500, errmsg);
          }
          printToConsole = true;
          return response.send(200, flip);
        });
      })
    });
  },

  updateSound: function (request, response) {
    if (!request.file('sound') || request.file('sound')._files.length < 1) {
      return response.send(400, new FlipsError('No sound file to upload'));
    }
    s3service.upload(request.file('sound'), s3service.SOUND_BUCKET, function (err, uploadedFiles) {
      if (err) {
        var errmsg = new FlipsError('Error trying to upload audio file to S3', err);
        logger.error(errmsg);
        return response.send(500, errmsg);
      }
      if (!uploadedFiles || uploadedFiles.length < 1) {
        return response.send(400, new FlipsError('Error trying to upload audio file to S3', err));
      }
      Flip.findOne(request.params.flip_id).populate('owner').exec(function (err, flip) {
        if (err) {
          var errmsg = new FlipsError('Error trying to retrieve flip', err);
          logger.error(errmsg);
          return response.send(500, errmsg);
        }
        if (!flip) {
          return response.send(404, new FlipsError('Flip not found'));
        }
        if (flip.owner && flip.owner.id != request.params.user_id) {

          return response.send(403, new FlipsError('This flip does not belong to this user'));
        }
        flip.soundURL = s3service.S3_URL + s3service.SOUND_BUCKET + '/' + uploadedFiles[0].fd;
        flip.save(function (err) {
          if (err) {
            var errmsg = new FlipsError('Error trying to save flip', err);
            logger.error(errmsg);
            return response.send(500, errmsg);
          }
          return response.send(200, flip);
        });
      })
    });
  },

  updateThumbnail: function (request, response) {
    if (!request.file('thumbnail') || request.file('thumbnail')._files.length < 1) {
      return response.send(400, new FlipsError('No thumbnail file to upload'));
    }
    s3service.upload(request.file('thumbnail'), s3service.THUMBNAILS_BUCKET, function (err, uploadedFiles) {
      if (err) {
        var errmsg = new FlipsError('Error trying to upload thumbnail file to S3', err);
        logger.error(errmsg);
        return response.send(500, errmsg);
      }
      if (!uploadedFiles || uploadedFiles.length < 1) {
        return response.send(400, new FlipsError('Error trying to upload thumbnail file to S3', err));
      }
      Flip.findOne(request.params.flip_id).populate('owner').exec(function (err, flip) {
        if (err) {
          var errmsg = new FlipsError('Error trying to retrieve flip', err);
          logger.error(errmsg);
          return response.send(500, errmsg);
        }
        if (!flip) {
          return response.send(404, new FlipsError('Flip not found'));
        }
        if (flip.owner && flip.owner.id != request.params.user_id) {

          return response.send(403, new FlipsError('This flip does not belong to this user'));
        }
        flip.thumbnailURL = s3service.S3_URL + s3service.THUMBNAILS_BUCKET + '/' + uploadedFiles[0].fd;
        flip.save(function (err) {
          if (err) {
            var errmsg = new FlipsError('Error trying to save flip', err);
            logger.error(errmsg);
            return response.send(500, errmsg);
          }
          return response.send(200, flip);
        });
      })
    });
  },

  myFlips: function (request, response) {
    var whereClause = {
      owner: request.params.user_id
    };
    if (request.param('word')) {
      whereClause.word = request.param('word');
    }
    Flip.find(whereClause).exec(function (err, flips) {
      if (err) {
        var errmsg = new FlipsError('Error trying to retrieve flips', err);
        logger.error(errmsg);
        return response.send(500, errmsg);
      }
      if (!flips) {
        return response.send(404, new FlipsError('Flips not found'));
      }
      return response.send(200, flips);
    })
  },

  flipById: function (request, response) {
    Flip.findOne({id: request.params.flip_id, owner: request.params.user_id}).exec(function (err, flip) {
      if (err) {
        var errmsg = new FlipsError('Error trying to retrieve flips', err);
        logger.error(errmsg);
        return response.send(500, errmsg);
      }
      if (!flip) {
        return response.send(404, new FlipsError('Flip not found'));
      }
      return response.send(200, flip);
    })
  },

  stockFlips: function (request, response) {
    var whereClause = {
      isPrivate: false
    };

    if (request.param('owner')) {
      whereClause.owner = request.param('owner');
    }

    if (request.param('category')) {
      whereClause.category = request.param('category');
    }

    if (request.param('word')) {
      whereClause.word = request.param('word');
    }

    Flip.find(whereClause).exec(function (err, flips) {
      if (err) {
        var errmsg = new FlipsError('Error trying to retrieve flips', err);
        logger.error(errmsg);
        return response.send(500, errmsg);
      }
      if (!flips) {
        return response.send(404, new FlipsError('Flips not found'));
      }
      return response.send(200, flips);
    })
  }

};

module.exports = FlipController;