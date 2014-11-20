var request = require('superagent');
var assert = require('assert');
var BASE_URL = 'http://localhost:1337';

describe('User Controller', function () {
  var user1 = request.agent();
  var userId;
  var aUser = {
    username: 'usercontroller@arctouch.com',
    password: 'Password1',
    firstName: 'Dev',
    lastName: 'Test',
    birthday: '1968-12-02',
    phoneNumber: '+1234567890'
  };

  before(function (done) {
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

            done();
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

  describe('Uploading a file', function () {

    it('Uploading correctly, should receive the user with photoURL', function (done) {

      this.timeout(5000);

      user1.post(BASE_URL + '/user/' + userId + "/photo")
        .attach('photo', './tests/fixtures/me.jpg')
        .end(function (err, res) {
          if (err) {
            throw err;
          }

          var user = res.body;

          assert.equal(res.status, 200);
          assert.equal(user.id, userId);
          assert.notEqual(user.photoUrl, null);

          done();
        });
    });

    it('Uploading to another account, must receive an error message', function (done) {
      user1.post(BASE_URL + '/user/' + (userId + 1 ) + "/photo")
        .attach('photo', './tests/fixtures/me.jpg')
        .end(function (err, res) {
          if (err) {
            throw err;
          }

          assert.equal(res.status, 403);
          assert.equal(res.body.error, 'You can not access this resource.');

          done();
        });
    });

    it('Uploading without a picture, must receive an error message', function (done) {
      user1.post(BASE_URL + '/user/' + userId + "/photo")
        .end(function (err, res) {
          if (err) {
            throw err;
          }

          assert.equal(res.status, 400);
          assert.equal(res.body.error, 'Missing parameter: [User Photo]');

          done();
        });
    });
  });

  describe('Calling forgot password', function () {
    var userDevice;

    before(function (done) {
      var device = {
        platform: 'ios',
        uuid: '0f744707bebcf74f9b7c25d48e3358945f6aa01da5ddb387462c7eaf61bbad78'
      };

      user1.post(BASE_URL + '/user/' + userId + "/devices")
        .send(device)
        .end(function (err, res) {

          if (err) {
            throw err;
          }

          userDevice = res.body;

          done();
        });
    });

    after(function (done) {
      user1.del(BASE_URL + '/device/' + userDevice.id)
        .end(function (err, res) {

          if (err) {
            throw err;
          }

          done();
        });
    });

    it('Missing phone number parameters, must return an error message', function (done) {
      var forgotParam = {
        email: "device@arctouch.com"
      };
      user1.post(BASE_URL + '/user/forgot')
        .send(forgotParam)
        .end(function (err, res) {
          if (err) {
            throw err;
          }

          assert.equal(res.status, 400);
          assert.equal(res.body.error, 'Error requesting to reset password.');
          assert.equal(res.body.details, 'Phone Number is empty.');

          done();
        });
    });

    it('Sending information that does not exists, must return Http Not Found (404)', function (done) {
      var forgotParam = {
        phone_number: "+123456789",
        email: "device@arctouch.com"
      };

      user1.post(BASE_URL + '/user/forgot')
        .send(forgotParam)
        .end(function (err, res) {
          if (err) {
            throw err;
          }

          assert.equal(res.status, 404);
          assert.equal(res.body.error, 'User not found.');

          done();
        });
    });

    //it('Sending correct params, must return Http OK (200)', function (done) {
    //
    //  var forgotParam = {
    //    phone_number: "+1234567890",
    //    email: "usercontroller@arctouch.com"
    //  };
    //
    //  user1.post(BASE_URL + '/user/forgot')
    //    .send(forgotParam)
    //    .end(function (err, res) {
    //      if (err) {
    //        throw err;
    //      }
    //
    //      assert.equal(res.status, 200, JSON.stringify(res.body));
    //
    //      done();
    //    });
    //});
  });

  describe('Calling verify verification code after forgot password', function () {
    var userDevice;
    var secondDevice;

    var device = {
      platform: 'ios',
      uuid: '0f744707bebcf74f9b7c25d48e3358945f6aa01da5ddb387462c7eaf61bbad78'
    };

    var otherdevice = {
      platform: 'ios',
      uuid: '0f744707bebcf74f9b7c25d48e3358945f6aa01da5ddb387462c7eaf61bbad79'
    };

    before(function (done) {
      user1.post(BASE_URL + '/user/' + userId + "/devices")
        .send(device)
        .end(function (err, res) {

          if (err) {
            throw err;
          }

          userDevice = res.body;

          user1.post(BASE_URL + '/user/' + userId + "/devices")
            .send(otherdevice)
            .end(function (err, res) {

              if (err) {
                throw err;
              }

              secondDevice = res.body;

              done();
            });
        });
    });

    after(function (done) {
      user1.del(BASE_URL + '/device/' + userDevice.id)
        .end(function (err, res) {
          if (err) {
            throw err;
          }

          user1.del(BASE_URL + '/device/' + secondDevice.id)
            .end(function (err, res) {
              if (err) {
                throw err;
              }
              done();
            });
        });
    });

//    it('Using the right verification code, must update isVerified and receive the user', function (done) {
//      var verifyBody = {
//        phone_number: userDevice.phoneNumber,
//        verification_code: userDevice.verificationCode
//      };
//
//      assert.equal(false, userDevice.isVerified);
//      assert.equal(0, userDevice.retryCount);
//
//      user1.post(BASE_URL + '/user/verify')
//        .send(verifyBody)
//        .end(function(err, response) {
//
//          if (err) {
//            throw err;
//          }
//
//          var device = response.body;
//
//          assert.equal(true, device.isVerified);
//          assert.equal(0, device.retryCount);
//
//          done();
//        });
//    });

    //it('Using a wrong verification code, must receive an error', function (done) {
    //  var verifyBody = {
    //    phone_number: aUser.phoneNumber,
    //    verification_code: (userDevice.verificationCode - 1)
    //  };
    //
    //  assert.equal(false, userDevice.isVerified);
    //  assert.equal(0, userDevice.retryCount);
    //
    //  user1.post(BASE_URL + '/user/verify')
    //    .send(verifyBody)
    //    .end(function(err, response) {
    //
    //      if (err) {
    //        throw err;
    //      }
    //
    //      assert.equal(response.status, 400);
    //      assert.equal(response.body.error, 'Wrong validation code');
    //
    //      done();
    //    });
    //});

//    it('After three attempts using a wrong verification code, must receive a new code', function (done) {
//      var verifyBody = {
//        phone_number: secondDevice.phoneNumber,
//        verification_code: (secondDevice.verificationCode - 1)
//      };
//
//      assert.equal(false, secondDevice.isVerified);
//      assert.equal(0, secondDevice.retryCount);
//
//      user1.post(BASE_URL + '/user/verify')
//        .send(verifyBody)
//        .end(function(err, response) {
//
//          if (err) {
//            throw err;
//          }
//
//          assert.equal(response.status, 400);
//          assert.equal(response.body.error, 'Wrong validation code.');
//
//          user1.get(BASE_URL + '/user/' + userId + '/devices/' + secondDevice.id)
//            .end(function(err, response) {
//              if (err) {
//                throw err;
//              }
//
//              var device = response.body;
//              assert.equal(device.id, secondDevice.id);
//              assert.equal(device.retryCount, 1);
//              assert.equal(device.isVerified, false);
//
//              user1.post(BASE_URL + '/user/verify')
//                .send(verifyBody)
//                .end(function(err, response) {
//
//                  if (err) {
//                    throw err;
//                  }
//
//                  assert.equal(response.status, 400);
//                  assert.equal(response.body.error, 'Wrong validation code.');
//
//                  user1.get(BASE_URL + '/user/' + userId + '/devices/' + secondDevice.id)
//                    .end(function(err, response) {
//
//                      if (err) {
//                        throw err;
//                      }
//
//                      var device = response.body;
//                      assert.equal(device.id, secondDevice.id);
//                      assert.equal(device.retryCount, 2);
//                      assert.equal(device.isVerified, false);
//
//                      user1.post(BASE_URL + '/user/verify')
//                        .send(verifyBody)
//                        .end(function(err, response) {
//
//                          if (err) {
//                            throw err;
//                          }
//
//                          assert.equal(response.status, 400);
//                          assert.equal(response.body.error, 'Wrong validation code.');
//
//                          user1.get(BASE_URL + '/user/' + userId + '/devices/' + secondDevice.id)
//                            .end(function (err, response) {
//
//                              if (err) {
//                                throw err;
//                              }
//
//                              var device = response.body;
//                              assert.equal(device.id, secondDevice.id);
//                              assert.equal(device.retryCount, 0);
//                              assert.equal(device.isVerified, false);
//                              assert.notEqual(device.verificationCode, secondDevice.verificationCode);
//                              done();
//
//                            });
//                        });
//                    });
//                });
//            });
//        });
//    });
  });
});