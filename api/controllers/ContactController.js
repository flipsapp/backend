/**
 * ContactController
 *
 * @description :: Server-side logic for managing contacts
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var actionUtil = requires('>/node_modules/sails/lib/hooks/blueprints/actionUtil');

module.exports = {

  uploadContacts: function (request, response) {
    var userId = request.params.parentid;
    var contacts = actionUtil.parseValues(request).contacts;

    if (!userId) {
      return response.send(400, new MugError('Missing user id'));
    }

    if (!contacts) {
      return response.send(400, new MugError('Error trying to parse request body'));
    }

    response.send(200, {});

    for (var i = 0; i < contacts.length; i++) {
      var phoneNumbers = contacts[i].phoneNumbers;

      (function (contactPhoneNumbers) {
        Contact.create({
          owner: userId,
          firstName: contacts[i].firstName,
          lastName: contacts[i].lastName})
          .exec(function (err, contact) {
            if (err || !contact) {
              logger.error('Error creating contact for user %s', userId);
            } else {
              for (var j = 0; j < contactPhoneNumbers.length; j++) {
                ContactPhoneNumber.create({
                  contact: contact.id,
                  phoneType: contactPhoneNumbers[j].phoneType,
                  phoneNumber: contactPhoneNumbers[j].phoneNumber})
                  .exec(function (err, contactPhoneNumber) {
                    if (err || !contactPhoneNumber) {
                      logger.error('Error creating phone numbers for contact %s.', userId);
                    }
                  })
              }
            }
          })
      })(phoneNumbers)
    }
  }

};

