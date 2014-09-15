/**
 * MugController
 *
 * @description :: Server-side logic for managing Mugs
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var MugController = {

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
      values.isPrivate = request.body.is_private
    }
    if (request.body.category) {
      values.category = request.body.category
    }
    Mug.create(values).exec(function (err, mug) {
      if (err || !mug) {
        return response.send(400, new MugError('Error trying to create mug', err));
      }
      return response.send(201, mug);
    });
  },

  uploadBackground: function (request, response) {
    if (!request.file('background') || request.file('background')._files.length < 1) {
      return response.send(400, new MugError('No background file to upload'));
    }
    s3service.upload(request.file('background'), s3service.BACKGROUND_BUCKET, function (err, uploadedFiles) {
      if (err) {
        var errmsg = new MugError('Error trying to upload background file to S3', err);
        logger.error(errmsg);
        return response.send(500, errmsg);
      }
      if (!uploadedFiles || uploadedFiles.length < 1) {
        return response.send(400, new MugError('Error trying to upload background file to S3', err));
      }
      return response.send(201, {background_url: uploadedFiles[0].extra.Location});
    });
  },

  uploadSound: function (request, response) {
    if (!request.file('sound') || request.file('sound')._files.length < 1) {
      return response.send(400, new MugError('No sound file to upload'));
    }
    s3service.upload(request.file('sound'), s3service.SOUND_BUCKET, function (err, uploadedFiles) {
      if (err) {
        var errmsg = new MugError('Error trying to upload audio file to S3', err);
        logger.error(errmsg);
        return response.send(500, errmsg);
      }
      if (!uploadedFiles || uploadedFiles.length < 1) {
        return response.send(400, new MugError('Error trying to upload audio file to S3', err));
      }
      return response.send(201, {sound_url: uploadedFiles[0].extra.Location});
    });
  },

  updateBackground: function (request, response) {
    if (!request.file('background') || request.file('background')._files.length < 1) {
      return response.send(400, new MugError('No background file to upload'));
    }
    s3service.upload(request.file('background'), s3service.BACKGROUND_BUCKET, function (err, uploadedFiles) {
      if (err) {
        var errmsg = new MugError('Error trying to upload background file to S3', err);
        logger.error(errmsg);
        return response.send(500, errmsg);
      }
      if (!uploadedFiles || uploadedFiles.length < 1) {
        return response.send(400, new MugError('Error trying to upload background file to S3', err));
      }
      Mug.findOne(request.params.mug_id).populate('owner').exec(function (err, mug) {
        if (err) {
          var errmsg = new MugError('Error trying to retrieve Mug', err);
          logger.error(errmsg);
          return response.send(500, errmsg);
        }
        if (!mug) {
          return response.send(404, new MugError('Mug not found'));
        }
        if (mug.owner && mug.owner.id != request.params.user_id) {
          return response.send(403, new MugError('This mug does not belong to this user'));
        }
        mug.backgroundURL = uploadedFiles[0].extra.Location;
        mug.save(function (err) {
          if (err) {
            var errmsg = new MugError('Error trying to save Mug', err);
            logger.error(errmsg);
            return response.send(500, errmsg);
          }
          return response.send(200, mug);
        });
      })
    });
  },

  updateSound: function (request, response) {
    if (!request.file('sound') || request.file('sound')._files.length < 1) {
      return response.send(400, new MugError('No sound file to upload'));
    }
    s3service.upload(request.file('sound'), s3service.SOUND_BUCKET, function (err, uploadedFiles) {
      if (err) {
        var errmsg = new MugError('Error trying to upload audio file to S3', err);
        logger.error(errmsg);
        return response.send(500, errmsg);
      }
      if (!uploadedFiles || uploadedFiles.length < 1) {
        return response.send(400, new MugError('Error trying to upload audio file to S3', err));
      }
      Mug.findOne(request.params.mug_id).populate('owner').exec(function (err, mug) {
        if (err) {
          var errmsg = new MugError('Error trying to retrieve Mug', err);
          logger.error(errmsg);
          return response.send(500, errmsg);
        }
        if (!mug) {
          return response.send(404, new MugError('Mug not found'));
        }
        if (mug.owner && mug.owner.id != request.params.user_id) {

          return response.send(403, new MugError('This mug does not belong to this user'));
        }
        mug.soundURL = uploadedFiles[0].extra.Location;
        mug.save(function (err) {
          if (err) {
            var errmsg = new MugError('Error trying to save Mug', err);
            logger.error(errmsg);
            return response.send(500, errmsg);
          }
          return response.send(200, mug);
        });
      })
    });
  },

  myMugs: function (request, response) {
    var whereClause = {
      owner: request.params.user_id
    };
    if (request.param('word')) {
      whereClause.word = request.param('word');
    }
    Mug.find(whereClause).exec(function (err, mugs) {
      if (err) {
        var errmsg = new MugError('Error trying to retrieve mugs', err);
        logger.error(errmsg);
        return response.send(500, errmsg);
      }
      if (!mugs) {
        return response.send(404, new MugError('Mugs not found'));
      }
      return response.send(200, mugs);
    })
  },

  mugById: function (request, response) {
    Mug.findOne({id: request.params.mug_id, owner: request.params.user_id}).exec(function (err, mug) {
      if (err) {
        var errmsg = new MugError('Error trying to retrieve mugs', err);
        logger.error(errmsg);
        return response.send(500, errmsg);
      }
      if (!mug) {
        return response.send(404, new MugError('Mug not found'));
      }
      return response.send(200, mug);
    })
  },

  stockMugs: function (request, response) {
    var whereClause = {
      isPrivate: false
    };
    if (request.param('owner')) {
      whereClause.owner = request.param('owner');
    }
    if (request.param('category')) {
      whereClause.category = request.param('category');
    }
    Mug.find(whereClause).exec(function (err, mugs) {
      if (err) {
        var errmsg = new MugError('Error trying to retrieve mugs', err);
        logger.error(errmsg);
        return response.send(500, errmsg);
      }
      if (!mugs) {
        return response.send(404, new MugError('Mugs not found'));
      }
      return response.send(200, mugs);
    })
  }

};

module.exports = MugController;