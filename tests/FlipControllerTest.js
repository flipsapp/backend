var request = require('superagent'),
  assert = require('assert'),
  Krypto = requires('>/api/utilities/Krypto');
;

describe('FlipController', function () {

  var user1 = request.agent();
  var user2 = request.agent();
  var userId, user2Id;

  before(function (done) {

    this.timeout(5000);

    var aUser = {
      username: 'devtest@arctouch.com',
      password: 'Password1',
      firstName: 'Dev',
      lastName: 'Test',
      birthday: '1968-12-02'
    };
    user1.post('http://localhost:1337/signup')
      .send(aUser)
      .end(function (err, res) {
        var createdUser = res.body;
        if (err) {
          throw err;
        }
        userId = createdUser.id;
        assert.equal(res.status, 200);
        assert.equal(createdUser.username, 'devtest@arctouch.com');
        assert.equal(createdUser.password, 'Password1');
        assert.equal(createdUser.firstName, 'Dev');
        assert.equal(createdUser.lastName, 'Test');
        assert.equal(createdUser.birthday.substring(0, 10), '1968-12-02');
        User.findOne(userId).exec(function(err, thisUser) {
          thisUser.isTemporary = false;
          thisUser.save();
          user1.post('http://localhost:1337/signin')
            .send({username: createdUser.username, password: createdUser.password})
            .end(function (err, res) {
              if (err) {
                throw err;
              }
              assert.equal(res.status, 200);
              var aUser = {
                username: 'devtest1@arctouch.com',
                password: 'Password1',
                firstName: 'Dev1',
                lastName: 'Test1',
                birthday: '1968-12-02'
              };
              user2.post('http://localhost:1337/signup')
                .send(aUser)
                .end(function (err, res) {
                  var createdUser = res.body;
                  if (err) {
                    throw err;
                  }
                  user2Id = createdUser.id;
                  User.findOne(user2Id).exec(function(err, thisUser) {
                    thisUser.isTemporary = false;
                    thisUser.save();
                    assert.equal(res.status, 200);
                    assert.equal(createdUser.username, 'devtest1@arctouch.com');
                    assert.equal(createdUser.password, 'Password1');
                    assert.equal(createdUser.firstName, 'Dev1');
                    assert.equal(createdUser.lastName, 'Test1');
                    assert.equal(createdUser.birthday.substring(0, 10), '1968-12-02');

                    user2.post('http://localhost:1337/signin')
                      .send({username: createdUser.username, password: createdUser.password})
                      .end(function (err, res) {
                        if (err) {
                          throw err;
                        }
                        assert.equal(res.status, 200);
                        done();
                      });
                  });
                });
            });
        });
      });
  });

  it('should create a flip', function (done) {
    var aFlip = {
      word: "I",
      background_url: "url1",
      sound_url: "url2",
      is_private: "true"
    };
    user1.post('http://localhost:1337/user/' + userId + '/flips')
      .send(aFlip)
      .end(function (err, res) {
        if (err) {
          throw err;
        }
        var flip = res.body;
        assert.equal(res.status, 201, 'Response status is ' + res.status + ' and should be 201');
        assert.equal(flip.word, aFlip.word, 'Flip word is ' + flip.word + ' and should be ' + aFlip.word);
        assert.equal(flip.backgroundURL, aFlip.background_url, 'Flip background URL is ' + flip.backgroundURL + ' and should be ' + aFlip.background_url);
        assert.equal(flip.soundURL, aFlip.sound_url, 'Flip sound URL is ' + flip.soundURL + ' and should be ' + aFlip.sound_url);
        assert.equal(flip.isPrivate, true, 'Flip privacy is set to ' + flip.isPrivate + ' and should be set to ' + true);
        done();
      });
  });

  it('should create a private flip by default', function (done) {
    var aFlip = {
      word: "I"
    };
    user1.post('http://localhost:1337/user/' + userId + '/flips')
      .send(aFlip)
      .end(function (err, res) {
        if (err) {
          throw err;
        }
        var flip = res.body;
        assert.equal(res.status, 201, 'Response status is ' + res.status + ' and should be 201');
        assert.equal(flip.isPrivate, true, 'Flip should be private');
        done();
      });
  });

  it('should not create a flip without a word', function (done) {
    var aFlip = {
      sound_url: 'someurl'
    };
    user1.post('http://localhost:1337/user/' + userId + '/flips')
      .send(aFlip)
      .end(function (err, res) {
        if (err) {
          throw err;
        }
        var data = res.body;
        assert.equal(res.status, 400, 'Response status is ' + res.status + ' and should be 400');
        assert.equal(data.error, 'Error trying to create flip', 'Error message is ' + data.error + ' and should be "Error trying to create flip"');
        done();
      });
  });

  it('should retrieve stock flips', function (done) {
    var aFlip = {
      word: "non stock flip",
      is_private: "true",
      category: "test"
    };
    user1.post('http://localhost:1337/user/' + userId + '/flips')
      .send(aFlip)
      .end(function (err, res) {
        if (err) {
          throw err;
        }
        aFlip = {
          word: "stock flip 1",
          is_private: "false",
          category: "test"
        };
        user1.post('http://localhost:1337/user/' + userId + '/flips')
          .send(aFlip)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            aFlip = {
              word: "stock flip 2",
              is_private: "false",
              category: "test"
            };
            user1.post('http://localhost:1337/user/' + userId + '/flips')
              .send(aFlip)
              .end(function (err, res) {
                if (err) {
                  throw err;
                }
                aFlip = {
                  word: "stock flip 3",
                  is_private: "false",
                  category: "anothercategory"
                };
                user1.post('http://localhost:1337/user/' + userId + '/flips')
                  .send(aFlip)
                  .end(function (err, res) {
                    if (err) {
                      throw err;
                    }
                    user1.get('http://localhost:1337/flips/stock')
                      .end(function (err, res) {
                        if (err) {
                          throw err;
                        }
                        flips = res.body.stock_flips;
                        assert.equal(res.status, 200, 'Response status is ' + res.status + ' and should be 200');
                        assert.equal(flips.length, 3, 'There are ' + flips.length + ' total stock flips flips and there should be 3');

                        user1.get('http://localhost:1337/flips/stock?category=test')
                          .end(function (err, res) {
                            if (err) {
                              throw err;
                            }
                            flips = res.body.stock_flips;
                            assert.equal(res.status, 200, 'Response status is ' + res.status + ' and should be 200');
                            assert.equal(flips.length, 2, 'There are ' + flips.length + ' stock flips in category "test" and there should be 2');

                            done();
                          });
                      });
                  });
              });
          });
      });
  });

  it('should retrieve all my flips and only my flips', function (done) {
    var aFlip = {
      word: 'a flip by user 2'
    };
    user2.post('http://localhost:1337/user/' + user2Id + '/flips')
      .send(aFlip)
      .end(function (err, res) {
        if (err) {
          throw err;
        }
        assert.equal(res.status, 201, 'Response status is ' + res.status + ' and should be 201');
        user1.get('http://localhost:1337/user/' + userId + '/flips')
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            var flips = res.body;
            assert.equal(res.status, 200, 'Response status is ' + res.status + ' and should be 200');
            assert.equal(flips.length, 6, 'There are ' + flips.length + ' flips that belong to me and there should be 6');
            done();
          });
      });
  });

  it('should retrieve my flips by word', function (done) {
    user1.get('http://localhost:1337/user/' + userId + '/flips?word=i')
      .end(function (err, res) {
        if (err) {
          throw err;
        }
        var flips = res.body;
        assert.equal(res.status, 200, 'Response status is ' + res.status + ' and should be 200');
        assert.equal(flips.length, 2, 'There are ' + flips.length + ' flips with word "I" and there should be 2');
        done();
      });
  });

  it('should not let a user create a flip on behalf of another user', function (done) {
    var aFlip = {
      word: 'a flip by user 2'
    };
    user2.post('http://localhost:1337/user/' + userId + '/flips')
      .send(aFlip)
      .end(function (err, res) {
        if (err) {
          throw err;
        }
        assert.equal(res.status, 403, 'Response status is ' + res.status + ' and should be 403');
        done();
      });
  });

  it('should let me retrieve a flip by id that belongs to me', function (done) {
    var aFlip = {
      word: 'a flip by user 2'
    };
    user2.post('http://localhost:1337/user/' + user2Id + '/flips')
      .send(aFlip)
      .end(function (err, res) {
        if (err) {
          throw err;
        }
        var flip = res.body;
        assert.equal(res.status, 201, 'Response status is ' + res.status + ' and should be 201');
        user2.get('http://localhost:1337/user/' + user2Id + '/flips/' + flip.id)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            var addedFlip = res.body;
            assert.equal(res.status, 200, 'Response status is ' + res.status + ' and should be 200');
            assert.equal(addedFlip.id, flip.id, 'Flip id is ' + addedFlip.id + ' and should be ' + flip.id);
            done();
          })
      });
  });

  it('should not let me retrieve a flip by id that does not belong to me', function (done) {
    user2.get('http://localhost:1337/user/' + user2Id + '/flips/1')
      .end(function (err, res) {
        if (err) {
          throw err;
        }
        var addedFlip = res.body;
        assert.equal(res.status, 404, 'Response status is ' + res.status + ' and should be 404');
        done();
      })
  });

  it('should upload a background file', function (done) {
    this.timeout(5000);
    user1.post('http://localhost:1337/background')
      .attach('background', './tests/fixtures/me.jpg')
      .end(function (err, res) {
        if (err) {
          throw err;
        }
        var data = res.body;
        var fileExtension = data.background_url.split('.').slice(-1)[0].toLowerCase();
        assert.equal(res.status, 201, 'Response status is ' + res.status + ' and should be 201');
        assert.equal(fileExtension, 'jpg', 'File extension is ' + fileExtension + ' and should be "jpg"');
        done();
      })
  });

  it('should upload a sound file', function (done) {
    user1.post('http://localhost:1337/sound')
      .attach('sound', './tests/fixtures/arctouch.wav')
      .end(function (err, res) {
        if (err) {
          throw err;
        }
        var data = res.body;
        var fileExtension = data.sound_url.split('.').slice(-1)[0].toLowerCase();
        assert.equal(res.status, 201, 'Response status is ' + res.status + ' and should be 201');
        assert.equal(fileExtension, 'wav', 'File extension is ' + fileExtension + ' and should be "wav"');
        done();
      })
  });

  it('should return an error when no file is attached when uploading a sound file', function (done) {
    user1.post('http://localhost:1337/sound')
      .end(function (err, res) {
        if (err) {
          throw err;
        }
        assert.equal(res.status, 400, 'Response status is ' + res.status + ' and should be 400');
        done();
      })
  });

  it('should return an error when no file is attached when uploading a background file', function (done) {
    user1.post('http://localhost:1337/background')
      .end(function (err, res) {
        if (err) {
          throw err;
        }
        assert.equal(res.status, 400, 'Response status is ' + res.status + ' and should be 400');
        done();
      })
  });

  it('should update a background file', function (done) {
    user1.put('http://localhost:1337/user/' + userId + '/flips/1/background')
      .attach('background', './tests/fixtures/me.jpg')
      .end(function (err, res) {
        if (err) {
          throw err;
        }
        var flip = res.body;
        var fileExtension = flip.backgroundURL.split('.').slice(-1)[0].toLowerCase();
        assert.equal(res.status, 200, 'Response status is ' + res.status + ' and should be 200');
        assert.equal(fileExtension, 'jpg', 'File extension is ' + fileExtension + ' and should be "jpg"');
        done();
      })
  });

  it('should update a sound file', function (done) {
    user1.put('http://localhost:1337/user/' + userId + '/flips/1/sound')
      .attach('sound', './tests/fixtures/arctouch.wav')
      .end(function (err, res) {
        if (err) {
          throw err;
        }
        var flip = res.body;
        var fileExtension = flip.soundURL.split('.').slice(-1)[0].toLowerCase();
        assert.equal(res.status, 200, 'Response status is ' + res.status + ' and should be 200');
        assert.equal(fileExtension, 'wav', 'File extension is ' + fileExtension + ' and should be "wav"');
        done();
      })
  });

});