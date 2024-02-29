var express = require('express');
const { title } = require('process');
var router = express.Router();

const app = express();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
  let fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  console.log('Server is up at: ', fullUrl);
});

module.exports = router;
