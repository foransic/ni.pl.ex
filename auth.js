var request = require('request');

exports.login = function(req, res) {
  username = req.body.username;
  password = req.body.password;

  request.post(
    'https://developer.nike.com/services/login', 
    {form:{username:username, password:password}}, 
    function(error, response, body) {
      if (error) {
        // something wrong happen, go back to login with default error message
        res.render('login.ejs', {error: 'DEFAULT'});
      } else {
        switch(response.statusCode) {
          case 200: // OK, get the token & put it in session, then go to activities list
            jsonData = JSON.parse(body);
            token = jsonData.access_token;
            req.session.token = token;
            
            res.redirect('activities');
            break;
          case 401: // auth failed, something wrong with credentials, go back to login with credential error message
            res.render('login.ejs', {error: 'CREDENTIAL'});
            break;
          default: // something wrong happens, go back to login with default error message
            res.render('login.ejs', {error: 'DEFAULT'});
            break;
        }
      }
  });

}