const express = require('express');
// const path = require('path');
const fileUpload = require('express-fileupload')

const apiRouter = require('./routes/api');
const app = express();

app.use(express.json());
app.use(fileUpload())
app.use(express.urlencoded({ extended: false }));
// app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', apiRouter);

app.get('/', function (req, res) {
  res.send('hello world');
});

app.use((err, req, res, next) => {
  console.log(err);
  if (res.headerSent) {
    return next(err);
  }
  res.status(err.code || 500);
  res.json({ error: err.message || "An unknown error occured" });
});

app.listen(3000);

module.exports = app;