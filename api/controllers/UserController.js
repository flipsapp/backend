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
    s3service.upload(photo, function(err, uploadedFiles) {
      if (err) {
        return response.serverError(err);
      }

      if (!uploadedFiles || uploadedFiles.length < 1){
        return response.badRequest({ error: 'Error uploading file' });
      }

      var uploadedFile = uploadedFiles[0];

      User.update(userId, { photoUrl: uploadedFile.extra.Location })
        .exec(function(err, updatedUser) {

          if (err) {
            return response.serverError(err);
          }

          if (!updatedUser){
            return response.badRequest({ error: 'Error updating user with photo url' });
          }

          return response.ok(updatedUser);
      });
    });
  }
};

module.exports = UserController;
