var request = require('superagent'),
  assert = require('assert');

describe('MugController', function () {

  var user1 = request.agent();
  var user2 = request.agent();
  var userId, user2Id;

  before(function (done) {
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
        assert.equal(res.status, 201);
        assert.equal(createdUser.username, 'devtest@arctouch.com');
        assert.equal(createdUser.password, 'Password1');
        assert.equal(createdUser.firstName, 'Dev');
        assert.equal(createdUser.lastName, 'Test');
        assert.equal(createdUser.birthday.substring(0, 10), '1968-12-02');

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
                assert.equal(res.status, 201);
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

  it('should create a mug', function (done) {
    var aMug = {
      word: "I",
      background_url: "url1",
      sound_url: "url2",
      is_private: "true"
    };
    user1.post('http://localhost:1337/user/' + userId + '/mugs')
      .send(aMug)
      .end(function (err, res) {
        if (err) {
          throw err;
        }
        var mug = res.body;
        assert.equal(res.status, 201, 'Response status is ' + res.status + ' and should be 201');
        assert.equal(mug.word, aMug.word, 'Mug word is ' + mug.word + ' and should be ' + aMug.word);
        assert.equal(mug.backgroundURL, aMug.background_url, 'Mug background URL is ' + mug.backgroundURL + ' and should be ' + aMug.background_url);
        assert.equal(mug.soundURL, aMug.sound_url, 'Mug sound URL is ' + mug.soundURL + ' and should be ' + aMug.sound_url);
        assert.equal(mug.isPrivate, true, 'Mug privacy is set to ' + mug.isPrivate + ' and should be set to ' + true);
        done();
      });
  });

  it('should create a private mug by default', function (done) {
    var aMug = {
      word: "I"
    };
    user1.post('http://localhost:1337/user/' + userId + '/mugs')
      .send(aMug)
      .end(function (err, res) {
        if (err) {
          throw err;
        }
        var mug = res.body;
        assert.equal(res.status, 201, 'Response status is ' + res.status + ' and should be 201');
        assert.equal(mug.isPrivate, true, 'Mug should be private');
        done();
      });
  });

  it('should not create a mug without a word', function (done) {
    var aMug = {
      sound_url: 'someurl'
    };
    user1.post('http://localhost:1337/user/' + userId + '/mugs')
      .send(aMug)
      .end(function (err, res) {
        if (err) {
          throw err;
        }
        var data = res.body;
        assert.equal(res.status, 400, 'Response status is ' + res.status + ' and should be 400');
        assert.equal(data.error, 'Error trying to create mug', 'Error message is ' + data.error + ' and should be "Error trying to create mug"');
        done();
      });
  });

  it('should retrieve stock mugs', function (done) {
    var aMug = {
      word: "non stock mug",
      is_private: "true",
      category: "test"
    };
    user1.post('http://localhost:1337/user/' + userId + '/mugs')
      .send(aMug)
      .end(function (err, res) {
        if (err) {
          throw err;
        }
        aMug = {
          word: "stock mug 1",
          is_private: "false",
          category: "test"
        };
        user1.post('http://localhost:1337/user/' + userId + '/mugs')
          .send(aMug)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            aMug = {
              word: "stock mug 2",
              is_private: "false",
              category: "test"
            };
            user1.post('http://localhost:1337/user/' + userId + '/mugs')
              .send(aMug)
              .end(function (err, res) {
                if (err) {
                  throw err;
                }
                aMug = {
                  word: "stock mug 3",
                  is_private: "false",
                  category: "anothercategory"
                };
                user1.post('http://localhost:1337/user/' + userId + '/mugs')
                  .send(aMug)
                  .end(function (err, res) {
                    if (err) {
                      throw err;
                    }
                    user1.get('http://localhost:1337/mugs/stock')
                      .end(function (err, res) {
                        if (err) {
                          throw err;
                        }
                        mugs = res.body;
                        assert.equal(res.status, 200, 'Response status is ' + res.status + ' and should be 200');
                        assert.equal(mugs.length, 3, 'There are ' + mugs.length + ' total stock mugs mugs and there should be 3');

                        user1.get('http://localhost:1337/mugs/stock?category=test')
                          .end(function (err, res) {
                            if (err) {
                              throw err;
                            }
                            mugs = res.body;
                            assert.equal(res.status, 200, 'Response status is ' + res.status + ' and should be 200');
                            assert.equal(mugs.length, 2, 'There are ' + mugs.length + ' stock mugs in category "test" and there should be 2');

                            done();
                          });
                      });
                  });
              });
          });
      });
  });

  it('should retrieve all my mugs and only my mugs', function (done) {
    var aMug = {
      word: 'a mug by user 2'
    };
    user2.post('http://localhost:1337/user/' + user2Id + '/mugs')
      .send(aMug)
      .end(function (err, res) {
        if (err) {
          throw err;
        }
        assert.equal(res.status, 201, 'Response status is ' + res.status + ' and should be 201');
        user1.get('http://localhost:1337/user/' + userId + '/mugs')
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            var mugs = res.body;
            assert.equal(res.status, 200, 'Response status is ' + res.status + ' and should be 200');
            assert.equal(mugs.length, 6, 'There are ' + mugs.length + ' mugs that belong to me and there should be 6');
            done();
          });
      });
  });

  it('should retrieve my mugs by word', function (done) {
    user1.get('http://localhost:1337/user/' + userId + '/mugs?word=i')
      .end(function (err, res) {
        if (err) {
          throw err;
        }
        var mugs = res.body;
        assert.equal(res.status, 200, 'Response status is ' + res.status + ' and should be 200');
        assert.equal(mugs.length, 2, 'There are ' + mugs.length + ' mugs with word "I" and there should be 2');
        done();
      });
  });

  it('should not let a user create a mug on behalf of another user', function (done) {
    var aMug = {
      word: 'a mug by user 2'
    };
    user2.post('http://localhost:1337/user/' + userId + '/mugs')
      .send(aMug)
      .end(function (err, res) {
        if (err) {
          throw err;
        }
        assert.equal(res.status, 403, 'Response status is ' + res.status + ' and should be 403');
        done();
      });
  });

  it('should let me retrieve a mug by id that belongs to me', function (done) {
    var aMug = {
      word: 'a mug by user 2'
    };
    user2.post('http://localhost:1337/user/' + user2Id + '/mugs')
      .send(aMug)
      .end(function (err, res) {
        if (err) {
          throw err;
        }
        var mug = res.body;
        assert.equal(res.status, 201, 'Response status is ' + res.status + ' and should be 201');
        user2.get('http://localhost:1337/user/' + user2Id + '/mugs/' + mug.id)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            var addedMug = res.body;
            assert.equal(res.status, 200, 'Response status is ' + res.status + ' and should be 200');
            assert.equal(addedMug.id, mug.id, 'Mug id is ' + addedMug.id + ' and should be ' + mug.id);
            done();
          })
      });
  });

  it('should not let me retrieve a mug by id that does not belong to me', function (done) {
    user2.get('http://localhost:1337/user/' + user2Id + '/mugs/1')
      .end(function (err, res) {
        if (err) {
          throw err;
        }
        var addedMug = res.body;
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

  it('should return an error when no finpm installe is attached when uploading a background file', function (done) {
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
    user1.put('http://localhost:1337/user/' + userId + '/mugs/1/background')
      .attach('background', './tests/fixtures/me.jpg')
      .end(function (err, res) {
        if (err) {
          throw err;
        }
        var mug = res.body;
        var fileExtension = mug.backgroundURL.split('.').slice(-1)[0].toLowerCase();
        assert.equal(res.status, 200, 'Response status is ' + res.status + ' and should be 200');
        assert.equal(fileExtension, 'jpg', 'File extension is ' + fileExtension + ' and should be "jpg"');
        done();
      })
  });

  it('should update a sound file', function (done) {
    user1.put('http://localhost:1337/user/' + userId + '/mugs/1/sound')
      .attach('sound', './tests/fixtures/arctouch.wav')
      .end(function (err, res) {
        if (err) {
          throw err;
        }
        var mug = res.body;
        var fileExtension = mug.soundURL.split('.').slice(-1)[0].toLowerCase();
        assert.equal(res.status, 200, 'Response status is ' + res.status + ' and should be 200');
        assert.equal(fileExtension, 'wav', 'File extension is ' + fileExtension + ' and should be "wav"');
        done();
      })
  });

});