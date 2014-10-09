/**
 * ContactController
 *
 * @description :: Server-side logic for managing contacts
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var actionUtil = requires('>/node_modules/sails/lib/hooks/blueprints/actionUtil');

module.exports = {

  uploadContacts: function (request, response) {
    var userId = request.params.user_id;
    var contacts = actionUtil.parseValues(request);

    if (!userId) {
      return response.send(400, new MugError('Missing user id'));
    }

    if (!contacts) {
      return response.send(400, new MugError('Error trying to parse request body'));
    }

    response.send(200, {});

    for (var i=0; i<contacts.length; i++) {
      Contact.create(contacts[i]).exec(function(err, contact) {
        if (err|| !contact) {
          logger.err('Error creating contact for user %s', userId);
        }
      })
    }
  }
	
};

