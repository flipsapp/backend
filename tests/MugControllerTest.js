var request = require('superagent'),
  assert = require('assert'),
  bootstrap = require('./bootstrap')();

describe('MugController', function () {

  var user1 = request.agent();
  var userId;

  before(function (done) {
    this.timeout(5000);
    var aUser = {
      username: 'devtest@arctouch.com',
      password: 'password',
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
        assert.equal(createdUser.password, 'password');
        assert.equal(createdUser.firstName, 'Dev');
        assert.equal(createdUser.lastName, 'Test');
        assert.equal(createdUser.birthday.substring(0, 10), '1968-12-02');

        user1.post('http://localhost:1337/signin')
          .send({username: createdUser.username, password: createdUser.password})
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            var createdUser = res.body;
            assert.equal(res.status, 200);
            done();
          });
      });
  });

  it('should create a mug', function (done) {
    var aMug = {
      word: "I",
      background_url: "url1",
      sound_url: "url2",
      is_private: true
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
        assert.equal(mug.isPrivate, aMug.is_private, 'Mug privacy is set to ' + mug.isPrivate + ' and should be set to ' + aMug.is_private);
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
      is_private: true,
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
          is_private: false,
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
              is_private: false,
              category: "test"
            };
            user1.post('http://localhost:1337/user/' + userId + '/mugs')
              .send(aMug)
              .end(function (err, res) {
                if (err) {
                  throw err;
                }
                console.log(res.body);
                aMug = {
                  word: "stock mug 3",
                  is_private: false,
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
                        console.log(mugs);
                        assert.equal(res.status, 200, 'Response status is ' + res.status + ' and should be 200');
                        assert.equal(mugs.length, 2, 'There are ' + mugs.length + ' mugs and there should be 2');
                        done();
                      });
                  });
              });
          });
      });
  })

});