/**
 * RoomController
 *
 * @description :: Server-side logic for managing rooms
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var actionUtil = requires('>/node_modules/sails/lib/hooks/blueprints/actionUtil');
var jwt = require('jwt-simple');

var RoomController = {

  create: function(request, response) {
    var room = actionUtil.parseValues(request);

    if (!room) {
      return response.send(400, new MugError('Error creating Room', 'Missing parameters.'));
    }

    var admin = room.parentid;

    if (!admin) {
      return response.send(400, new MugError('Error creating Room', 'No admin found for room.'));
    }

    if (!room.name) {
      return response.send(400, new MugError('Error creating Room', 'No name found for room.'));
    }

    room.admin = admin;
    room.pubnubId = jwt.encode({ name: room.name, admin: admin, timestamp: new Date() }, process.env.JWT_SECRET);

    var participants = room.participants;

    if (!participants || participants.length < 1) {
      participants = [request.user.id];
    } else {
      participants += "," + request.user.id;
    }

    room.participants = participants;

    Room.create(room)
      .exec(function(error, newRoom) {
        if (error) {
          return response.send(500, new MugError('Server error creating Room', error.details));
        }

        if (!newRoom) {
          return response.send(400, new MugError('Request error creating Room', 'Room returned empty'));
        }

        Room.findOne(newRoom.id)
          .populate('participants')
          .exec(function(error, populatedRoom) {
            if (error) {
              return response.send(500, new MugError('Error retrieving the room after created.', error.details));
            }

            if (!populatedRoom) {
              return response.send(404, new MugError('Error retrieving the room after created.', 'Room id = ' + room.id));
            }

            return response.send(201, populatedRoom);
          });
        }
    );
  },

  findOne: function(request, response) {
    var roomId = request.params.id;

    if (!roomId) {
      return response.send(400, new MugError('Request error', 'No ID was found for the request.'));
    }

    Room.findOne(roomId)
      .populate('participants')
      .exec(function(error, room) {
        if (error) {
          return response.send(500, new MugError('Server error', err.details));
        }

        if (!room) {
          return response.send(404, new MugError('Resource not found', 'id = ' + roomId));
        }

        return response.send(200, room);
      }
    )
  },

  update: function(request, response) {
    var roomId = request.params.id;
    var whereClause = { id: roomId };
    var updateColumns = request.body;

    Room.update(whereClause, updateColumns, function(error, affectedRooms) {
      if (error) {
        return response.send(500, new MugError('Error updating room.', err.details));
      }

      if (!affectedRooms || affectedRooms.length < 1) {
        return response.send(400, new MugError('Error updating room.', 'Room not found with id=' + roomId));
      }

      Room.findOne(affectedRooms[0].id)
        .populate('participants')
        .exec(function(error, room) {
          if (error) {
            return response.send(500, new MugError('Server error', err.details));
          }

          if (!room) {
            return response.send(404, new MugError('Resource not found', 'id = ' + affectedRooms[0].id));
          }

          return response.send(200, room);
        });
    });
  },

  updateParticipants: function(request, response) {
    var newParticipantsParam = request.param('participants');

    if (!newParticipantsParam) {
      return response.send(400, new MugError('Request error', 'Must include the new participant list, separated by comma.'));
    }

    var participants = newParticipantsParam.split(',');
    participants.push(request.user.id);

    var roomId = request.params.id;
    var whereClause = { id: roomId };
    Room.update(whereClause, { participants: participants }, function(err, affectedRooms) {
      if (err) {
        return response.send(500, new MugError('Error updating room.', err.details));
      }

      if (!affectedRooms || affectedRooms.length < 1) {
        return response.send(400, new MugError('Error updating room.', 'No rows were affected.'));
      }

      Room.findOne(affectedRooms[0].id)
        .populate('participants')
        .exec(function(error, room) {
          if (error) {
            return response.send(500, new MugError('Server error', err.details));
          }

          if (!room) {
            return response.send(404, new MugError('Resource not found', 'id = ' + roomId));
          }

          return response.send(200, room);
        }
      );
    });
  }
};

module.exports = RoomController;

