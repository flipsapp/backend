var request = require('superagent');
var assert = require('assert');
var bootstrap = require('./bootstrap')();
var BASE_URL = 'http://localhost:1337';
var moment = require('moment');
var Krypto = requires('>/api/utilities/Krypto');

var flipsUser;

describe('AuthController - Using correct params', function () {

  var user1 = request.agent();
  var userId;

  before(function (done) {
    User.destroy({}).exec(function(err) {});
    var flipBoysUser = {
      username: 'flipboys@flipsapp.com',
      password: 'Password1',
      firstName: 'Dev',
      lastName: 'Test',
      birthday: '1968-12-02'
    };
    User.create(flipBoysUser).exec(function (err, user) {
      flipsUser = user;
      done()
    });
  });

  after(function (done) {
    User.destroy({}).exec(function(err) {});
    done();
  });

  it('Should create a user', function (done) {

    this.timeout(5000);

    var aUser = {
      username: 'policytest@arctouch.com',
      password: 'Password1',
      firstName: 'Dev',
      lastName: 'Test',
      birthday: '1968-12-02'
    };

    user1.post(BASE_URL + '/signup')
      .send(aUser)
      .end(function (err, res) {
        if (err) {
          throw err;
        }

        var createdUser = res.body;
        userId = createdUser.id;
        assert.equal(res.status, 200);
        assert.equal(createdUser.username, 'policytest@arctouch.com');
        assert.equal(createdUser.password, 'Password1');
        assert.equal(createdUser.firstName, 'Dev');
        assert.equal(createdUser.lastName, 'Test');
        assert.equal(createdUser.birthday.substring(0, 10), '1968-12-02');

        done();
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
});

describe('AuthController - Signing up with wrong requests', function () {

  var user1 = request.agent();
  var userId;

  it('Requesting with missing password, should receive an error message', function (done) {
    var aUser = {
      username: 'wrongrequests@arctouch.com',
      firstName: 'Dev',
      lastName: 'Test',
      birthday: '1968-12-02'
    };
    user1.post(BASE_URL + '/signup')
      .send(aUser)
      .end(function (err, res) {
        if (err) {
          throw err;
        }

        var createdUser = res.body;

        userId = createdUser.id;
        assert.equal(res.status, 400);
        assert.equal(res.body.error, "Error signing up user");

        done();
      });
  });

  it('Requesting with missing username, should receive an error message', function (done) {

    var aUser = {
      password: 'Password1',
      firstName: 'Dev',
      lastName: 'Test',
      birthday: '1968-12-02'
    };
    user1.post(BASE_URL + '/signup')
      .send(aUser)
      .end(function (err, res) {
        if (err) {
          throw err;
        }

        var createdUser = res.body;

        userId = createdUser.id;
        assert.equal(res.status, 400);
        assert.equal(res.body.error, "Error signing up user");

        done();
      });
  });

  it('Requesting with user 12 years old, should receive an error message', function (done) {

    this.timeout(5000);

    var aUser = {
      username: 'tooyoung@arctouch.com',
      password: 'Password1',
      firstName: 'Dev',
      lastName: 'Test',
      birthday: moment().subtract(12, 'years').format('YYYY-MM-DD')
    };

    user1.post(BASE_URL + '/signup')
      .send(aUser)
      .end(function (err, res) {
        if (err) {
          throw err;
        }

        var createdUser = res.body;

        userId = createdUser.id;
        assert.equal(res.status, 400);
        assert.equal(res.body.error, "Error signing up user");
        assert.equal(res.body.details, "You must have at least 13 years old.");

        done();
      });
  });

  it('Requesting with user with 13 years + 1 day, should receive an error message', function (done) {

    this.timeout(5000);

    var aUser = {
      username: 'tomorrowismybirthday@arctouch.com',
      password: 'Password1',
      firstName: 'Dev',
      lastName: 'Test',
      birthday: moment().subtract(13, 'years').add(1, 'days').format('YYYY-MM-DD')
    };

    user1.post(BASE_URL + '/signup')
      .send(aUser)
      .end(function (err, res) {
        if (err) {
          throw err;
        }

        assert.equal(res.status, 400);
        assert.equal(res.body.error, "Error signing up user");
        assert.equal(res.body.details, "You must have at least 13 years old.");

        done();
      });
  });

  it('Requesting a password without uppercase letter, should receive an error message', function (done) {
    var aUser = {
      username: 'devtest@arctouch.com',
      password: 'password1',
      firstName: 'Dev',
      lastName: 'Test',
      birthday: '1970-12-02'
    };
    user1.post(BASE_URL + '/signup')
      .send(aUser)
      .end(function (err, res) {
        if (err) {
          throw err;
        }

        var body = res.body;
        assert.equal(res.status, 400);
        assert.equal(body.error, 'Error signing up user');
        assert.equal(body.details, 'Password must have at least eight characters, one uppercase letter and one lowercase letter and one number.');

        done();
      });
  });

  it('Requesting a password without lowercase letter, should receive an error message', function (done) {
    var aUser = {
      username: 'devtest@arctouch.com',
      password: 'PASSWORD1',
      firstName: 'Dev',
      lastName: 'Test',
      birthday: '1970-12-02'
    };
    user1.post(BASE_URL + '/signup')
      .send(aUser)
      .end(function (err, res) {
        if (err) {
          throw err;
        }

        var body = res.body;

        assert.equal(body.error, 'Error signing up user');
        assert.equal(body.details, 'Password must have at least eight characters, one uppercase letter and one lowercase letter and one number.');
        assert.equal(res.status, 400);

        done();
      });
  });

  it('Requesting a password without a number, should receive an error message', function (done) {
    var aUser = {
      username: 'devtest@arctouch.com',
      password: 'PasswordA',
      firstName: 'Dev',
      lastName: 'Test',
      birthday: '1970-12-02'
    };
    user1.post(BASE_URL + '/signup')
      .send(aUser)
      .end(function (err, res) {
        if (err) {
          throw err;
        }

        var body = res.body;

        assert.equal(body.error, 'Error signing up user');
        assert.equal(body.details, 'Password must have at least eight characters, one uppercase letter and one lowercase letter and one number.');
        assert.equal(res.status, 400);


        done();
      });
  });

  it('Requesting a password less than eight characters, should receive an error message', function (done) {
    var aUser = {
      username: 'devtest@arctouch.com',
      password: 'PaS1',
      firstName: 'Dev',
      lastName: 'Test',
      birthday: '1970-12-02'
    };
    user1.post(BASE_URL + '/signup')
      .send(aUser)
      .end(function (err, res) {
        if (err) {
          throw err;
        }

        var body = res.body;

        assert.equal(body.error, 'Error signing up user');
        assert.equal(body.details, 'Password must have at least eight characters, one uppercase letter and one lowercase letter and one number.');
        assert.equal(res.status, 400);


        done();
      });
  });
});

describe('AuthController - Sign in', function () {

  var user1 = request.agent();
  var userId;
  var aUser = {
    username: 'devtest@arctouch.com',
    password: 'Password1',
    firstName: 'Dev',
    lastName: 'Test',
    birthday: '1968-12-02'
  };

  before(function (done) {
    User.destroy({}).exec(function(err) {});
    var flipBoysUser = {
      username: 'flipboys@flipsapp.com',
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

          var createdUser = res.body;
          userId = createdUser.id;
          User.findOne(userId).exec(function(err, thisUser) {
            thisUser.isTemporary = false;
            thisUser.save();
          });
          done();
        });

    });


  });

  after(function (done) {

    User.destroy({}).exec(function(err) {});

    user1.del(BASE_URL + '/user/' + userId)
      .end(function (err, res) {
        if (err) {
          throw err;
        }

        done();
      });
  });

  it('Using correct credentials, should receive a user information', function (done) {
    var credentials = {
      username: 'devtest@arctouch.com',
      password: 'Password1'
    };

    user1.post(BASE_URL + '/signin')
      .send(credentials)
      .end(function (err, res) {
        if (err) {
          throw err;
        }

        var user = res.body;

        assert.notEqual(user.id, null);
        assert.equal(user.username, aUser.username);
        assert.equal(user.password, aUser.password);
        assert.equal(user.firstName, aUser.firstName);
        assert.equal(user.lastName, aUser.lastName);
        done();
      });
  });

  it('Using wrong credentials, should receive an error message', function (done) {
    var credentials = {
      username: 'devtest2@arctouch.com',
      password: 'Password1'
    };

    user1.post(BASE_URL + '/signin')
      .send(credentials)
      .end(function (err, res) {
        if (err) {
          throw err;
        }

        assert.equal(res.status, 404);
        assert.equal(res.body.error, "Username or password not found");

        done();
      });
  });

  it('Without send username, should receive an error message', function (done) {
    var credentials = {
      password: 'Password1'
    };

    user1.post(BASE_URL + '/signin')
      .send(credentials)
      .end(function (err, res) {
        if (err) {
          throw err;
        }

        assert.equal(res.status, 400);
        assert.equal(res.body.error, "Username and password are required");

        done();
      });
  });

  it('Without send password, should receive an error message', function (done) {
    var credentials = {
      username: 'devtest2@arctouch.com'
    };

    user1.post(BASE_URL + '/signin')
      .send(credentials)
      .end(function (err, res) {
        if (err) {
          throw err;
        }

        assert.equal(res.status, 400);
        assert.equal(res.body.error, "Username and password are required");

        done();
      });
  });
});

describe('AuthController - Policy test', function () {

  var user1 = request.agent();
  var user2 = request.agent();
  var user1Id;
  var user2Id;

  var aUser = {
    username: 'devtest@arctouch.com',
    password: 'Password1',
    firstName: 'Dev',
    lastName: 'Test',
    birthday: '1968-12-02'
  };

  var bUser = {
    username: 'devtest2@arctouch.com',
    password: 'Password2',
    firstName: 'Dev2',
    lastName: 'Test2',
    birthday: '1968-12-02'
  };

  before(function (done) {

    this.timeout(5000);

    var flipBoysUser = {
      username: 'flipboys@flipsapp.com',
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

          user1Id = res.body.id;
          User.findOne(user1Id).exec(function(err, thisUser) {
            thisUser.isTemporary = false;
            thisUser.save();
            user1.post(BASE_URL + '/signin')
              .send({ username: aUser.username, password: aUser.password})
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

                    user2Id = res.body.id;
                    User.findOne(user2Id).exec(function(err, thisUser) {
                      thisUser.isTemporary = false;
                      thisUser.save();
                      user2.post(BASE_URL + '/signin')
                        .send({ username: bUser.username, password: bUser.password})
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
        });
    });
  });

  after(function (done) {

    user1.del(BASE_URL + '/user/' + user1Id)
      .end(function (err, res) {
        if (err) {
          throw err;
        }

        user2.del(BASE_URL + '/user/' + user2Id)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            flipsUser.destroy();
            done();
          });
      });
  });

  it('Should access his own resource', function (done) {

    user1.get(BASE_URL + '/user/' + user1Id)
      .end(function (err, res) {
        if (err) {
          throw err;
        }

        var user = res.body;

        assert.equal(res.status, 200);
        assert.notEqual(user.id, null);
        assert.equal(user.username, aUser.username);
        assert.equal(user.password, aUser.password);
        assert.equal(user.firstName, aUser.firstName);
        assert.equal(user.lastName, aUser.lastName);
        done();
      });
  });

  it('Should deny accessing other resource', function (done) {

    user1.get(BASE_URL + '/user/' + user2Id)
      .end(function (err, res) {
        if (err) {
          throw err;
        }

        assert.equal(res.status, 403);
        done();
      });
  });
});