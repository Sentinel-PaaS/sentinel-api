const fs = require('fs');

function readAuthToken() {
  const buffer = fs.readFileSync(__dirname + '/../../token.txt', 'utf-8'); //token file is created dynamically on init command 
  const token = buffer.toString();
  return token
}

module.exports = {
  validateAuthToken(req, res, next) {
    let token = readAuthToken();
    let tokenSent = req.headers['authorization'].split(' ')[1] //Removes 'Bearer' string from header
    if (token === tokenSent) {
      next()
    } else {
      res.status(401).send('User not authorized to issue commands')
    }
  }
}