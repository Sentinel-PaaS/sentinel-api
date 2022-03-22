const express = require('express');
// const path = require('path');

const apiRouter = require('./routes/api');
const app = express();

app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
// app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', apiRouter);

app.get('/', function (req, res) {
  res.send('hello world');
});

app.listen(3000);

module.exports = app;