var request = require('superagent');
var assert = require('assert');
var BASE_URL = 'http://localhost:1337';
var jwt = require('jwt-simple');

describe('Room Controller', function () {
  var user1 = request.agent();
  var user2 = request.agent();
  var userId;
  var bUserId;

  var aUser = {
    username: 'auser@arctouch.com',
    password: 'Password1',
    firstName: 'Dev',
    lastName: 'Test',
    birthday: '1968-12-02'
  };

  var bUser = {
    username: 'buser@arctouch.com',
    password: 'Password1',
    firstName: 'Dev',
    lastName: 'Test',
    birthday: '1968-12-02'
  };

  before(function (done) {

    this.timeout(5000);

    user1.post(BASE_URL + '/signup')
      .send(aUser)
      .end(function (err, res) {
        if (err) {
          throw err;
        }

        userId = res.body.id;

        user1.post(BASE_URL + '/signin/')
          .send({ username: aUser.username, password: aUser.password })
          .end(function (err, res) {

            if (err) {
              throw err;
            }

            user2.post(BASE_URL + '/signup')
              .send(bUser)
              .end(function (err, res) {
                if (err) {
                  throw err;
                }

                bUserId = res.body.id;

                user2.post(BASE_URL + '/signin/')
                  .send({ username: bUser.username, password: bUser.password })
                  .end(function (err, res) {

                    if (err) {
                      throw err;
                    }

                    done();
                  });
              });
          });
      });
  });

  after(function (done) {

    user1.del(BASE_URL + '/user/' + userId)
      .end(function (err, res) {
        if (err) {
          throw err;
        }

        user2.del(BASE_URL + '/user/' + bUserId)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
          });

          done();
      });
  });

  describe('Creating a room', function () {

    it('When using correct fields, must return the room with just the user participating', function (done) {
      var roomId;

      user1.post(BASE_URL + '/user/' + userId + "/rooms")
        .send({ name: "Room 1" })
        .end(function (err, res) {
          if (err) {
            throw err;
          }

          var room = res.body;

          assert.equal(res.status, 201);
          assert.equal(room.admin, userId);
          assert.equal(room.participants.length, 1);
          assert.equal(room.participants[0].id, userId);
          assert.notEqual(room.pubnubId, null);
          assert.notEqual(room.id, null);

          roomId = room.id;

          user1.del(BASE_URL + '/user/' + userId + 'rooms/' + roomId)
            .end(function (err, res) {
              if (err) {
                throw err;
              }

              done();

            });
        });
    });

    it('When missing room name, must return an error', function (done) {
      user1.post(BASE_URL + '/user/' + userId + "/rooms")
        .send({ })
        .end(function (err, res) {
          if (err) {
            throw err;
          }

          var error = res.body;

          assert.equal(res.status, 400);
          assert.equal(error.error, 'Error creating Room');
          assert.equal(error.details, 'No name found for room.');

          done();
        });
    });

    it('When creating a room for another user, must return an error', function (done) {
      user1.post(BASE_URL + '/user/' + (userId+1) + "/rooms")
        .send({ name: "Room 1" })
        .end(function (err, res) {
          if (err) {
            throw err;
          }

          var error = res.body;

          assert.equal(res.status, 403);
          assert.equal(error.error, 'You can not access this resource.');

          done();
        });
    });

    describe('Updating a room', function () {

      var roomId;

      before(function(done) {
        user1.post(BASE_URL + '/user/' + userId + "/rooms")
          .send({ name: "Room 2" })
          .end(function (err, res) {
            if (err) {
              throw err;
            }

            var room = res.body;
            roomId = room.id;
            done();
          });
      });

      after(function (done) {

        user1.del(BASE_URL + '/user/' + userId + "rooms/" + roomId)
          .end(function (err, res) {
            if (err) {
             throw err;
            }

            done();

          });
      });

      it('Changing the room name, must return the updated room', function (done) {

        user1.put(BASE_URL + '/user/' + userId + '/rooms/' + roomId)
          .send({ name: "Room 2 - Updated" })
          .end(function (err, res) {
            if (err) {
              throw err;
            }

            var room = res.body;

            assert.equal(res.status, 200);
            assert.equal(room.admin, userId);
            assert.equal(room.participants.length, 1);
            assert.equal(room.name, "Room 2 - Updated");
            assert.notEqual(room.id, null);

            done();
          });
      });

      it('Changing the amount of participants, must return the new array', function (done) {

        user1.put(BASE_URL + '/user/' + userId + '/rooms/' + roomId + "/participants")
          .send({ participants: '' + bUserId })
          .end(function (err, res) {
            if (err) {
              throw err;
            }

            var room = res.body;

            assert.equal(res.status, 200);
            assert.equal(room.admin, userId);
            //TODO
            //assert.equal(room.participants.length, 2);
            //assert.equal(room.participants[1].id, bUserId);
            assert.equal(room.name, "Room 2 - Updated");
            assert.notEqual(room.id, null);

            done();
          });
      });
    });
  });
});