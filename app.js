var express = require('express');
var session = require('cookie-session');
var bodyParser = require('body-parser');

var auth = require('./auth');
var activity = require('./activity');

var app = express();
app.set('views', __dirname + '/templates');
app.set('view engine', 'ejs');

app.use(session({
  secret: 'CZjyH7KS7c1fktK2fp8S'
}));

app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

module.exports = app;

/**
 * Login route
 */
app.route('/login')
  .get(function(req, res) {
    res.render('login.ejs');
  })
  .post(auth.login);

/**
 * Activities route
 */
app.get('/activities', activity.list)
app.get('/download/:activity', activity.download)

app.listen(9001, 'localhost');