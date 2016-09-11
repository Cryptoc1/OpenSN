var crypto = require('crypto'),
    passwordHash = require('password-hash')

var mongo = require('mongodb'),
    MongoClient = mongo.MongoClient,
    ObjectID = mongo.ObjectID

var Error = require('./errors.js')

// Comment/Uncomment this line for given deployment target
require('dotenv').config()

var url = process.env.MONGO_URL

var db = function() {}

function insert(type, object, callback) {
    MongoClient.connect(url, function(err, db) {
        if (err) {
            callback(Error(522), null)
        } else {
            db.collection(type).insertOne(object, function(err, result) {
                if (err) {
                    console.log(err)
                    callback(Error(522), null)
                } else {
                    callback(null, result.insertedId ? true : false, result.insertedId ? result.insertedId : null)
                }
                db.close()
            })
        }
    })
}

function find(type, query, callback) {
    MongoClient.connect(url, function(err, db) {
        if (err) {
            console.log(err)
            callback(Error(522), null)
        } else {
            db.collection(type).find(query).toArray(function(err, arr) {
                if (err) {
                    console.log(err)
                    callback(Error(522), null)
                } else {
                    callback(null, arr)
                }
                db.close()
            })
        }
    })
}


// Status functions
db.prototype.createStatus = function(userID, status, callback) {
    var obj = {
        userID: userID,
        status: status,
        created: new Date().getTime()
    }
    insert('status', obj, function(err, success) {
        if (err) {
            callback(err, null)
        } else {
            callback(null, success ? true : false)
        }
    })
}

db.prototype.getStatus = function(statusID, callback) {

}

db.prototype.createStatusLink = function(statusID, userID, callback) {

}

db.prototype.deleteStatus = function(statusID, callback) {

}

db.prototype.editStatus = function(statusID, status, callback) {

}


// User functions
db.prototype.createUser = function(user, callback) {
    user.password = passwordHash.generate(user.password)
    user.created = new Date().getTime()
    user.username = user.username.toLowerCase()
    insert('user', user, function(err, success) {
        if (err) {
            callback(err, null)
        } else {
            callback(null, success ? true : false)
        }
    })
}

db.prototype.getUser = function(userID, callback) {

}

db.prototype.createUserLink = function(userID, linkerID, callback) {

}

db.prototype.deleteUser = function(userID, callback) {

}

db.prototype.editUser = function(userID, user, callback) {

}

db.prototype.verifyUser = function(username, password, callback) {
    find('user', {
        username: username.toLowerCase()
    }, function(err, user) {
        if (err) {
            callback(err, null)
        } else {
            if (user.length > 0) {
                user = user[0]
                if (passwordHash.verify(password, user.password)) {
                    callback(null, true, user._id)
                } else {
                    callback(true, null)
                }
            } else {
                callback(true, null)
            }
        }
    })
}

db.prototype.checkIfUserExists = function(username, callback) {
    find('user', {
        username: username.toLowerCase()
    }, function(err, user) {
        if (err) {
            callback(Error(522), null)
        } else {
            callback(null, user.length > 0 ? true : false)
        }
    })
}


/* Client stuff */

db.prototype.createClient = function(client, callback) {
    client.key = crypto.randomBytes(32).toString('hex')
    insert('client', client, function(err, success, clientID) {
        if (err) {
            callback(err)
        } else {
            callback(null, success)
        }
    })
}

db.prototype.verifyClientId = function(clientID, callback) {
    find('client', {
        client_id: clientID
    }, function(err, client) {
        if (err) {
            callback(Error(522), null)
        } else {
            if (client.length > 0) {
                callback(null, true)
            } else {
                callback(null, false)
            }
        }
    })
}

db.prototype.getUserClients = function(userID, callback) {
    find('client', {
        user_id: userID
    }, function(err, clients) {
        if (err) {
            callback(Error(522))
        } else {
            callback(null, clients)
        }
    })
}


// Access Token / Auth functions
db.prototype.createAccessToken = function(clientID, userID, callback) {
    var hash = crypto.randomBytes(20).toString('hex')
    var accessToken = {
        client_id: clientID,
        user_id: userID,
        access_token: hash,
        expires: new Date().getTime() + 604800000
    }
    insert('access_token', accessToken, function(err, success, tokenID) {
        if (err) {
            callback(Error(522))
        } else {
            find('access_token', tokenID, function(err, token) {
                if (err) {
                    callback(Error(522))
                } else {
                    callback(null, success ? true : false, (token.length > 0) ? token[0] : null)
                }
            })
        }
    })
}

db.prototype.verifyAccessToken = function(accessToken, clientID, userID, callback) {
    find('access_token', {
        access_token: accessToken,
        client_id: clientID,
        user_id: userID
    }, function(err, token) {
        if (err) {
            callback(err)
        } else {
            if (token) {
                token = token[0]
                callback(null, ((new Date().getTime()) < token.expires) ? true : false, token)
            } else {
                callback(null, false)
            }
        }
    })
}

db.prototype.getAccessToken = function(accessToken, clientID, callback) {
    find('access_token', {
        access_token: accessToken,
        client_id: clientID
    }, function(err, token) {
        /*
        token == {
            access_token: "blah",
            client_id: "blahblah",
            user_id: "blahblah",
            expires: 9876543210,
            issued: 1234567890
        }
        */
        if (err) {
            callback(err, null)
        } else {
            callback(null, token)
        }
    })
}

module.exports = new db()
