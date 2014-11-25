/**
 * RoomController
 *
 * @description :: Server-side logic for managing rooms
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var actionUtil = requires('>/node_modules/sails/lib/hooks/blueprints/actionUtil');
var uuid = require('node-uuid');
var googl = require('goo.gl');
var PubNub = requires('>/api/utilities/PubNub');
var Krypto = requires('>/api/utilities/Krypto');

var RoomController = {

  create: function (request, response) {
    var params = actionUtil.parseValues(request);
    var room = {name: params.name};

    if (!params) {
      return response.send(400, new FlipsError('Error creating Room', 'Missing parameters.'));
    }

    if (!params.parentid) {
      return response.send(400, new FlipsError('Error creating Room', 'No admin found for room.'));
    }

    if (!params.name) {
      return response.send(400, new FlipsError('Error creating Room', 'No name found for room.'));
    }

    var admin = params.parentid;

    User.findOne(admin).exec(function (err, adminUser) {
      if (err) {
        return response.send(400, new FlipsError('Error retrieving user from database', err));
      }
      if (!adminUser) {
        return response.send(404, new FlipsError('User not found'));
      }

      createUsersForUnknownParticipants(params, function (err, createdUsers) {
        var allUsers = [admin];

        if (params.users) {
           allUsers = allUsers.concat(params.users);
        }
        if (createdUsers) {
          allUsers = allUsers.concat(createdUsers);
        }

        room.admin = admin;
        room.pubnubId = uuid();


        (function (roomAdmin, phoneNumbersToInvite, participants) {

          logger.debug('participants');
          logger.debug(participants);

          Room.create(room)
            .exec(function (error, newRoom) {
              if (error) {
                return response.send(500, new FlipsError('Server error creating Room', error.details));
              }

              if (!newRoom) {
                return response.send(400, new FlipsError('Request error creating Room', 'Room returned empty'));
              }

              Room.findOne(newRoom.id)
                .exec(function (error, room) {
                  if (error) {
                    return response.send(500, new FlipsError('Error retrieving the room after created.', error.details));
                  }

                  if (!room) {
                    return response.send(404, new FlipsError('Error retrieving the room after created.', 'Room id = ' + params.id));
                  }
                  if (phoneNumbersToInvite) {
                    var invitedNumberList = Array.prototype.slice.call(phoneNumbersToInvite);
                    for (var i = 0; i < invitedNumberList.length; i++) {
                      sendInvitationBySMS(phoneNumbersToInvite[i], roomAdmin, function (err, toNumber) {
                      });
                    }
                  }
                  assignUsersToRoom(participants, room, function (err, populatedRoom) {
                    subscribeUsersToRoom(populatedRoom);
                    populatedRoom = removeUnwantedPropertiesFromUsers(populatedRoom);
                    return response.send(201, populatedRoom);
                  })
                });
            }
          );
        })(adminUser, params.phoneNumbers, allUsers);
      });

    });
  },

  findOne: function (request, response) {
    var roomId = request.params.id;

    if (!roomId) {
      return response.send(400, new FlipsError('Request error', 'No ID was found for the request.'));
    }

    Room.findOne(roomId)
      .exec(function (error, room) {
        if (error) {
          return response.send(500, new FlipsError('Server error', err.details));
        }

        if (!room) {
          return response.send(404, new FlipsError('Resource not found', 'id = ' + roomId));
        }
        getParticipantsForRoom(room.id, function(participants) {
          room.participants = participants;
          return response.send(200, room);
        });
      }
    )
  },

  update: function (request, response) {
    var roomId = request.params.id;
    var whereClause = {id: roomId};
    var updateColumns = request.body;

    Room.update(whereClause, updateColumns, function (error, affectedRooms) {
      if (error) {
        return response.send(500, new FlipsError('Error updating room.', err.details));
      }

      if (!affectedRooms || affectedRooms.length < 1) {
        return response.send(400, new FlipsError('Error updating room.', 'Room not found with id=' + roomId));
      }

      Room.findOne(affectedRooms[0].id)
        .exec(function (error, room) {
          if (error) {
            return response.send(500, new FlipsError('Server error', err.details));
          }

          if (!room) {
            return response.send(404, new FlipsError('Resource not found', 'id = ' + affectedRooms[0].id));
          }
          getParticipantsForRoom(room.id, function(participants) {
            room.participants = participants;
            return response.send(200, room);
          });
        });
    });
  },

  updateParticipants: function (request, response) {
    var newParticipantsParam = request.param('participants');

    if (!newParticipantsParam) {
      return response.send(400, new FlipsError('Request error', 'Must include the new participant list, separated by comma.'));
    }

    var participants = newParticipantsParam.split(',');
    participants.push(request.user.id);

    var roomId = request.params.id;
    var whereClause = {id: roomId};
    Room.update(whereClause, {participants: participants}, function (err, affectedRooms) {
      if (err) {
        return response.send(500, new FlipsError('Error updating room.', err.details));
      }

      if (!affectedRooms || affectedRooms.length < 1) {
        return response.send(400, new FlipsError('Error updating room.', 'No rows were affected.'));
      }

      Room.findOne(affectedRooms[0].id)
        .exec(function (error, room) {
          if (error) {
            return response.send(500, new FlipsError('Server error', err.details));
          }

          if (!room) {
            return response.send(404, new FlipsError('Resource not found', 'id = ' + roomId));
          }
          getParticipantsForRoom(room.id, function(participants) {
            room.participants = participants;
            return response.send(200, room);
          });
        }
      );
    });
  }
};

var createUsersForUnknownParticipants = function (params, callback) {
  var phoneNumbers = params.phoneNumbers;
  if (!phoneNumbers) {
    return callback(null, null);
  }
  ;
  async.concat(phoneNumbers,
    function (phoneNumber, callback) {
      //TODO check if phone number exists
      var user = {};
      var anythingTemporary = uuid();
      user.username = anythingTemporary;
      user.firstName = anythingTemporary;
      user.lastName = anythingTemporary;
      user.birthday = "01/01/1970";
      user.phoneNumber = phoneNumber;
      user.isTemporary = true;
      User.create(user).exec(function (err, createdUser) {
        if (err) {
          return callback(null);
        }
        if (createdUser) {
          return callback(null, createdUser.id);
        }
      })
    },
    function (err, createdUsers) {
      return callback(err, createdUsers);
    }
  )
};

var sendInvitationBySMS = function (toNumber, fromUser, callback) {
  var msg = "You've been Flipped by {{firstname}} {{lastname}}! Download Flips within 30 days to view your message.  {{url}}";
  msg = msg.replace("{{firstname}}", Krypto.decrypt(fromUser.firstName));
  msg = msg.replace("{{lastname}}", Krypto.decrypt(fromUser.lastName));
  msg = msg.replace("{{url}}", process.env.APP_STORE_URL);
  twilioService.sendSms(toNumber, msg, function (err, message) {
    if (err) {
      logger.error('Error sending SMS', err);
    }
    return callback(err, toNumber);
  });
};

var subscribeUsersToRoom = function (room) {
  for (var i = 0; i < room.participants.length; i++) {
    var participant = room.participants[i];
    var message = {type: 1, content: removeUnwantedPropertiesFromUsers(room)};
    if (participant.id != room.admin) {
      (function (aParticipant, aRoom, aMessage) {
        PubNub.publish({
          channel: aParticipant.pubnubId,
          message: aMessage,
          callback: function (e) {
            logger.info('User %s subscribed to room %s on channel %s', aParticipant.id, aRoom.id, aRoom.pubnubId)
          },
          error: function (e) {
            logger.error('Error when trying to subscribe user %s to room %s on channel %s. Details: %s', aParticipant.id, aRoom.id, aRoom.pubnubId, e)
          }
        });
      })(participant, room, message);
    }
  }
};

var assignUsersToRoom = function (users, room, callback) {
  logger.debug(JSON.stringify(room));
  async.each(users,
    function (user, cb) {
      logger.debug('user: ' + user);
      Participant.create({user: user, room: room.id}).exec(function (err, participant) {
        cb(err);
      });
    },
    function(err) {
      if (err) {
        callback(err)
      } else {
        User.find({id: users}).exec(function(err, participants) {
          if (err) {
            callback(err);
          } else {
            Krypto.decryptUsers(participants, function(err, decryptedParticipants) {
              if (err) {
                callback(err);
              } else {
                room.participants = decryptedParticipants;
                callback(null, room);
              }
            });
          }
        })
      }
    });
};

var getParticipantsForRoom = function (roomId, callback) {
  Participant.find({room: roomId}).exec(function(err, participants) {
    if (err) {
      callback([]);
    } else {
      callback(participants);
    }
  });
};

var removeUnwantedPropertiesFromUsers = function (aRoom) {
  var users = aRoom.participants;
  for (var i = 0; i < users.length; i++) {
    //delete users[i].pubnubId;
    delete users[i].flips;
    delete users[i].devices;
  }
  aRoom.participants = users;
  return aRoom;
};

module.exports = RoomController;