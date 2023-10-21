require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns');
const bodyParser = require('body-parser');
let mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI,{ useNewUrlParser: true, useUnifiedTopology: true })

// Basic Configuration
const port = process.env.PORT || 3000;
const urlSchema = new mongoose.Schema ({
  original_url: [String],
  short_url: [Number]
})
const Url = mongoose.model('Url',urlSchema);

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.use(bodyParser.urlencoded({extended: false}));

app.post('/api/shorturl/', async (req,res,next) => {
  let urlRegex = /https:\/\/www.|http:\/\/www./g;

  dns.lookup(req.body.url.replace(urlRegex,""), (err, address, family) => {
    if (err) {
      req.isValidUrl = false;
    } else {
      req.isValidUrl = true;
    }
  })
    if (req.isValidUrl){
      req.shortUrl = await Url.countDocuments({});
      req.originalUrl = req.body.url;
      new Url({"original_url": req.originalUrl, "short_url": req.shortUrl}).save((err,data) => {
        if (err) return console.log(err);
      })
    }
  next();
},(req, res) => {
  req.isValidUrl ?
  res.json({"original_url": req.originalUrl, "short_url": req.shortUrl + 1})
  : res.json({error: "invalid url"})
});

app.get('/api/shorturl/:short', async (req, res, next) => {
  req.originalUrl = await Url.findOne({short_url: req.params.short - 1})
  console.log(req.originalUrl.original_url)
  next();
}, (req, res) => {
  res.redirect(req.originalUrl.original_url);
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
