const express = require('express'),
morgan = require('morgan'),
fs = require('fs'),
path = require('path');

const app = express();

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {flags: 'a'});


let top10movies = [
  {
    title: 'The Young and Prodigious T. S. Spivet',
    director: 'Jean-Pierre Jeunet'
  },
  {
    title: 'The Notebooks',
    director: 'Nick Cassavetes'
  },
  {
    title: 'Love Actually',
    director: 'Richard Curtis'
  }
];

// log all requests
app.use(morgan('combined', {stream: accessLogStream}));


// GET request - Welcome
app.get('/', (req, res) => {
  res.send('Welcome to MyFlix App!');
});


// GET request - Movies
app.get('/movies', (req, res) => {
  res.json(top10movies);
});

// GET request - Documentation
app.get('/documentation', (req, res) => {                  
    res.sendFile('public/documentation.html', { root: __dirname });
  });


// express static
app.use(express.static('public'));

const bodyParser = require('body-parser'),
  methodOverride = require('method-override');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(bodyParser.json());
app.use(methodOverride()); 


// error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Oooops, something went wrong!');
});

// listen for requests
app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});