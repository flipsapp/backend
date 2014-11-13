var request = require('superagent');
var assert = require('assert');
var BASE_URL = 'http://localhost:1337';

var flipsUser;

describe('Device Controller', function () {
  var user1 = request.agent();
  var userId;

  var aUser = {
    username: 'devtest@arctouch.com',
    password: 'Password1',
    firstName: 'Dev',
    lastName: 'Test',
    birthday: '1968-12-02',
    phoneNumber: '+554898010707'
  };

  before(function(done) {
    var flipBoysUser = {
      username: 'flipboys@flips.com',
      password: 'Password1',
      firstName: 'Dev',
      lastName: 'Test',
      birthday: '1968-12-02'
    };
    User.create(flipBoysUser).exec(function (err, user) {
      flipsUser = user;
      user1.post(BASE_URL + '/signup')
        .send(aUser)
        .end(function (err, res) {
          if (err) {
            throw err;
          }

          userId = res.body.id;

          user1.post(BASE_URL + '/signin')
            .send({ username: aUser.username, password: aUser.password})
            .end(function (err, res) {
              if (err) {
                throw err;
              }

              done();
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
        done();
      });
  });

  describe('Including device with correct params', function() {
    it('Should create a device related to user', function (done) {

      var aDevice = {
        platform: 'ios',
        uuid: '0f744707bebcf74f9b7c25d48e3358945f6aa01da5ddb387462c7eaf61bbad78'
      };

      user1.post(BASE_URL + '/user/'+userId+"/devices")
        .send(aDevice)
        .end(function (err, res) {
          if (err) {
            throw err;
          }

          var device = res.body;

          assert.equal(res.status, 201);
          assert.equal(device.user.id, userId);
          assert.notEqual(device.id, null);
          assert.equal(device.platform, aDevice.platform);
          assert.equal(device.phoneNumber, aDevice.phoneNumber);

          done();
        });
    });
  });

  describe('Including device in another user', function() {
    it('Should return a forbidden error', function (done) {

      var aDevice = {
        platform: 'ios',
        uuid: 'ABCDEF-GHIJKL'
      };

      user1.post(BASE_URL + '/user/'+(userId+1)+"/devices")
        .send(aDevice)
        .end(function (err, res) {
          if (err) {
            throw err;
          }

          assert.equal(res.status, 403);

          done();
        });
    });
  });

  describe('Including device with incorrect params', function() {
    it('Should receive a missing platform message', function (done) {

      var aDevice = {
        uuid: 'ABCDEF-GHIJKL'
      };

      user1.post(BASE_URL + '/user/'+userId+"/devices")
        .send(aDevice)
        .end(function (err, res) {
          if (err) {
            throw err;
          }
          assert.equal(res.status, 400);
          assert.equal(res.body.error, 'Missing parameter [Device platform].');

          done();
        });
    });

//    it('Should receive a missing phone number message', function (done) {
//
//      var aDevice = {
//        platform: 'ios',
//        uuid: 'ABCDEF-GHIJKL'
//      };
//
//      user1.post(BASE_URL + '/user/'+userId+"/devices")
//        .send(aDevice)
//        .end(function (err, res) {
//          if (err) {
//            throw err;
//          }
//          assert.equal(res.status, 400);
//          assert.equal(res.body.error, 'Missing parameter [Device phone number].');
//
//          done();
//        });
//    });
  })
});