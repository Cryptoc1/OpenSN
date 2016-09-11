var express = require('express'),
    bodyParser = require('body-parser'),
    handlebars = require('express-handlebars'),
    cookies = require('cookie-parser'),
    crypto = require('crypto'),
    Error = require('./lib/errors.js')

db = require('./lib/database.js')

var app = express()

// Comment/Uncomment this line for given deployment target
require('dotenv').config()
var client = process.env.CLIENT_ID

app.use(express.static('public'))

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))

app.engine('.hbs', handlebars({
    defaultLayout: 'default',
    extname: 'hbs'
}))
app.set('view engine', '.hbs')

app.use(cookies(crypto.randomBytes(32).toString('hex')))

app.use(function(req, res, next) {
    req.fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl
    next()
})

/*
    @TODO:
    + Do all the shit for access tokens
    + Write the user functions
    + Making make SUPER nested if statements for each query parameter for better user feedback
*/


/* core/central system functions */

app.get('/', function(req, res) {
    console.log("cookies: ", req.cookies)
    if (req.cookies.session && req.cookies.user) {
        db.verifyAccessToken(req.cookies.session, client, req.cookies.user, function(err, verified, token) {
            if (err) {

            } else if (verified) {
                // NOTE: The user is verified, so display their feed
                res.render('feed')
            } else {
                res.redirect('/login')
            }
        })
    } else {
        res.render('index')
    }
})


app.get('/signup', function(req, res) {
    res.render('signup')
})

app.post('/signup', function(req, res) {
    if (req.body.username && req.body.password && req.body.email && req.body.fullname) {
        db.checkIfUserExists(req.body.username, function(err, exists) {
            if (err) {
                res.status(err.code).json(err)
            } else {
                if (exists) {
                    // @TODO: user exists!
                } else {
                    var user = {
                        username: req.body.username,
                        password: req.body.password,
                        fullname: req.body.fullname,
                        email: req.body.email
                    }
                    db.createUser(user, function(err, success) {
                        if (err) {
                            res.status(err.code).json(err)
                        } else if (success) {
                            res.render('registered', {
                                product: "account"
                            })
                        } else {
                            res.status(500).json(Error(500))
                        }
                    })
                }
            }
        })
    } else {
        res.status(400).json(Error(400))
    }
})

app.get('/login', function(req, res) {
    res.set('Referrer', req.fullUrl)
    res.render('login')
})

app.post('/login', function(req, res) {
    if (req.get('Referrer') == req.fullUrl) {
        if (req.body.username && req.body.password) {
            db.verifyUser(req.body.username, req.body.password, function(err, verified, userID) {
                if (err) {
                    res.status(err.code).json(err)
                } else if (verified) {
                    db.createAccessToken(client, userID, function(err, succes, token) {
                        console.log(token)
                        res.cookie('session', token.access_token)
                        res.cookie('user', token.user_id)
                        res.redirect('/')
                    })
                } else {
                    res.status(401).json(Error(401))
                }
            })
        } else {
            req.status(400).json(Error(400, {
                message: "Missing username or password"
            }))
        }
    } else {
        res.status(401).json(Error(401))
    }
})

app.get('/clients', function(req, res) {
    if (req.cookies.session && req.cookies.user) {
        db.verifyAccessToken(req.cookies.session, client, req.cookies.user, function(err, verified, token) {
            if (err) {
                res.redirect('/login')
            } else if (verified) {
                db.getUserClients(token.user_id, function(err, clients) {
                    if (err) {
                        res.status(err.code).render('clients', {
                            error: err
                        })
                    } else {
                        res.render('clients', {
                            clients: clients
                        })
                    }
                })
            } else {
                res.redirect('/login')
            }
        })
    } else {
        res.redirect('/login')
    }
})

app.get('/clients/register', function(req, res) {
    if (req.cookies.session && req.cookies.user) {
        db.verifyAccessToken(req.cookies.session, client, req.cookies.user, function(err, verified, token) {
            if (err) {
                res.status(err.code).render('register', {
                    error: err
                })
            } else if (verified) {
                res.render('register')
            } else {
                res.redirect('/login')
            }
        })
    } else {
        res.redirect('/login')
    }
})

app.post('/clients/register', function(req, res) {
    if (req.get('Referrer') == req.fullUrl) {
        if (req.body.client_name && req.body.owner_username && req.body.owner_email) {
            db.verifyAccessToken(req.cookies.session, client, req.cookies.user, function(err, verified, token) {
                if (err) {
                    res.status(err.code).render('register', {
                        error: err
                    })
                } else if (verified) {
                    var client = {
                        owner: {
                            name: (req.body.owner_name) ? req.body.owner_name : null,
                            email: req.body.email,
                            username: req.body.username
                        },
                        name: req.body.client_name
                    }
                    db.createClient(client, function(err, success) {
                        if (err) {
                            res.status(err.code).render('register', {
                                error: err
                            })
                        } else if (success) {
                            res.redirect('/clients')
                        } else {
                            res.status(500).render('register', {
                                error: Error(500)
                            })
                        }
                    })
                } else {
                    res.redirect('/login')
                }
            })
        } else {
            req.status(400).render('register', {
                error: Error(400)
            })
        }
    } else {
        res.status(401).render('register', {
            error: Error(401)
        })
    }
})


/* Authorization endpoints */

app.get('/api/v1/auth', function(req, res) {
    if (req.query.client_id) {
        res.set('Referrer', req.fullUrl)
        db.verifyClientId(req.query.client_id, function(err, verified) {
            if (err) {
                res.status(err.code).json(err)
            } else if (verified) {
                res.render('auth')
            } else {
                res.status(401).json(Error(401))
            }
        })
    } else {
        res.status(400).json(Error(400, {
            message: "Missing required client_id"
        }))
    }
})

app.post('/api/v1/auth', function(req, res) {
    if (req.body.username && req.body.password && (req.query.client_id || req.body.client_id) && (req.get('Referrer') == (req.fullUrl))) {
        db.verifyClientId(req.query.client_id || req.body.client_id, function(err, verified) {
            if (err) {
                res.status(err.code).json(err)
            } else if (verified) {
                db.verifyUser(req.body.username, req.body.password, function(err, verified, userID) {
                    if (err) {
                        res.status(err.code).json(err)
                    } else if (verified) {
                        // @TODO: create access_token, enter it in database, redirect to client (with access_token)
                        db.createAccessToken((req.query.client_id || req.body.client_id), userID, function(err, success, token) {
                            if (err) {
                                res.status(err.code).json(err)
                            } else if (success) {
                                res.json(token)
                            } else {
                                res.status(500).json(Error(500))
                            }
                        })
                    } else {
                        res.status(401).json(Error(401, {
                            message: "Invalid username or password"
                        }))
                    }
                })
            } else {
                res.status(401).json(Error(401, {
                    message: "Invalid client_id"
                }))
            }
        })
    } else {
        res.status(400).json(Error(400))
    }
})


/* Status functions */

app.post('/api/v1/status/create', function(req, res) {
    if (req.body.status && req.body.user_id && req.body.access_token && req.body.client_id) {
        db.verifyAccessToken(req.body.access_token, req.body.client_id, req.body.user_id, function(err, verified) {
            if (err) {
                res.status(err.code).json(err)
            } else if (verified) {
                db.createStatus(req.body.user_id, req.body.status, function(err, statusID) {
                    if (err) {
                        res.status(522).json(Error(522))
                    } else {
                        res.json({
                            success: true,
                            transform: "status-create",
                            entity: statusID
                        })
                    }
                })
            } else {
                res.status(401).json(Error(401, {
                    message: "Invalid access_token"
                }))
            }
        })
    } else {
        res.status(400).json(Error(400))
    }
})

app.get('/api/v1/status/:status_id', function(req, res) {

    if (req.params.status_id) {
        db.getStatus(req.params.status_id, function(err, status) {
            if (err) {
                res.status(err.code).json(err)
            } else {
                res.json(status)
            }
        })
    } else {
        res.status(400).json(Error(400))
    }
})

app.post('/api/v1/status/:status_id/link', function(req, res) {
    if (req.params.status_id && req.body.user_id && req.body.access_token && req.body.client_id) {
        db.verifyAccessToken(req.body.access_token, req.body.client_id, function(err, verified) {
            if (err) {
                res.status(err.code).json(err)
            } else if (verified) {
                db.createStatusLink(req.params.status_id, req.body.user_id, function(err, success) {
                    if (err) {
                        res.status(522).json(Error(522))
                    } else {
                        res.json({
                            success: true,
                            transform: "status-link"
                        })
                    }
                })
            } else {
                res.status(401).json(Error(401))
            }
        })
    } else {
        res.status(400).json(Error(400))
    }
})

app.delete('/api/v1/status/:status_id/delete', function(req, res) {
    if (req.params.status_id && req.body.access_token && req.body.client_id) {
        db.deleteStatus(req.params.status_id, function(err, success) {
            if (err) {
                res.status(err.code).json(err)
            } else {
                res.json({
                    success: true,
                    transform: "status-delete"
                })
            }
        })
    } else {
        res.status(400).json(Error(400))
    }
})

app.put('/api/v1/status/:status_id/edit', function(req, res) {
    if (req.params.status_id && req.body.status && req.body.access_token && req.body.client_id) {
        db.verifyAccessToken(req.body.access_token, req.body.client_id, function(err, verified) {
            if (err) {
                res.status(err.code).json(err.code)
            } else if (verifed) {
                db.editStatus(req.params.status_id, req.body.status, function(err, success) {
                    if (err) {
                        res.status(522).json(Error(522))
                    } else {
                        res.json({
                            success: true,
                            transform: "status-edit"
                        })
                    }
                })
            } else {
                res.status(401).json(Error(401))
            }
        })
    } else {
        res.status(400).json(Error(400))
    }
})


/* User functions */

app.post('/api/v1/user/create', function(req, res) {

})

app.get('/api/v1/user/:user_id', function(req, res) {

})

app.post('/api/v1/user/:user_id/link', function(req, res) {

})

app.delete('/api/v1/user/:user_id/delete', function(req, res) {

})

app.put('/api/v1/user/:user_id/edit', function(req, res) {

})

app.all('*', function(req, res) {
    res.status(403).json(Error(403))
})

var server = app.listen(process.env.PORT || 5000, function() {
    console.log("Service running at http://0.0.0.0:%d", server.address().port)
})
