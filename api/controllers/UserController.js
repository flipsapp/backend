/**
 * UserController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var UserController = {

  uploadPhoto: function(request, response) {
    var userId = request.params.id;
    var photo = request.file('photo');
    s3service.upload(photo, s3service.PICTURES_BUCKET, function(err, uploadedFiles) {
      if (err) {
        return response.send(500, new MugError('Error uploading picture', err));  
      }

      if (!uploadedFiles || uploadedFiles.length < 1){
        return response.send(400, new MugError('Error uploading file'));
      }

      var uploadedFile = uploadedFiles[0];

      User.update(userId, { photoUrl: uploadedFile.extra.Location })
        .exec(function(err, updatedUser) {

          if (err) {
            return response.send(500, new MugError('Error updating user', err));
          }

          if (!updatedUser){
            return response.send(400, new MugError('Error updating user with photo url'));
          }

          return response.send(200, updatedUser);
      });
    });
  }
};

module.exports = UserController;
