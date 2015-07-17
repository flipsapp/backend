var crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    password = process.env.CRYPTO_PASSWORD;

var Krypto = {

  encrypt: function(text) {
    if (!text) return text;
    var cipher = crypto.createCipher(algorithm, password);
    var crypted = cipher.update(text, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
  },

  decrypt: function(text) {
    var decipher = crypto.createDecipher(algorithm, password);
    var decrypted = decipher.update(text, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  },

  encryptUser: function(user) {
    var encryptedUser = user;
    if (user.username) {
      encryptedUser.username = Krypto.encrypt(user.username);
    }
    if (user.firstName) {
      encryptedUser.firstName = Krypto.encrypt(user.firstName);
    }
    if (user.lastName) {
      encryptedUser.lastName = Krypto.encrypt(user.lastName);
    }
    if (user.phoneNumber) {
      encryptedUser.phoneNumber = Krypto.encrypt(user.phoneNumber);
    }
    if (user.nickname) {
      encryptedUser.nickname = Krypto.encrypt(user.nickname);
    }
    return encryptedUser;
  },

  decryptUser: function(user) {
    var decryptedUser = user;
    if (user.username) {
      decryptedUser.username = Krypto.decrypt(user.username);
    }
    if (user.firstName) {
      decryptedUser.firstName = Krypto.decrypt(user.firstName);
    }
    if (user.lastName) {
      decryptedUser.lastName = Krypto.decrypt(user.lastName);
    }
    if (user.phoneNumber) {
      decryptedUser.phoneNumber = Krypto.decrypt(user.phoneNumber);
    }
    if (user.nickname) {
      decryptedUser.nickname = Krypto.decrypt(user.nickname);
    }
    return decryptedUser;
  },

  decryptUsers: function(users, callback) {
    async.map(users,
      function(user, cb) {
        var decryptedUser = user;
        if (user.username) {
          decryptedUser.username = Krypto.decrypt(user.username);
        }
        if (user.firstName) {
          decryptedUser.firstName = Krypto.decrypt(user.firstName);
        }
        if (user.lastName) {
          decryptedUser.lastName = Krypto.decrypt(user.lastName);
        }
        if (user.phoneNumber) {
          decryptedUser.phoneNumber = Krypto.decrypt(user.phoneNumber);
        }
        if (user.nickname) {
          decryptedUser.nickname = Krypto.decrypt(user.nickname);
        }
        cb(null, decryptedUser);
      },
      callback);
  },

  decryptUsersForCreateRoom: function(users, callback) {
    async.map(users,
      function(user, cb) {
        var decryptedUser = user;
        if (user.username) {
          decryptedUser.username = Krypto.decrypt(user.username);
        }
        if (user.firstName) {
          decryptedUser.firstName = Krypto.decrypt(user.firstName);
        }
        if (user.lastName) {
          decryptedUser.lastName = Krypto.decrypt(user.lastName);
        }
        if (user.phoneNumber) {
          decryptedUser.phoneNumber = Krypto.decrypt(user.phoneNumber);
        }
        if (user.nickname) {
          decryptedUser.nickname = Krypto.decrypt(user.nickname);
        }
        delete decryptedUser.pubnubId;
        delete decryptedUser.flips;
        delete decryptedUser.devices;
        cb(null, decryptedUser);
      },
      callback);

  }

};

module.exports = Krypto;