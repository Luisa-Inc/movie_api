const express = require('express'),
bodyParser = require('body-parser'),
uuid = require('uuid'),
morgan = require('morgan');
fs = require('fs'),
path = require('path');

const app = express();
const mongoose = require('mongoose');
mongoose.set('strictQuery', true);
const Models = require('./models.js');
const { check, validationResult } = require('express-validator');

const Movies = Models.Movie; //refer to the model names you defined in “models.js”
const Users = Models.User; //refer to the model names you defined in “models.js”

/*mongoose.connect('mongodb://localhost:27017/myFlixDB ', { useNewUrlParser: true, useUnifiedTopology: true });*/
mongoose.connect('mongodb+srv://myflixluisaadmin:CF2023@myflixdb.7hxqnxa.mongodb.net/myFlixDB?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const cors = require('cors');
app.use(cors());

/* rest of code goes here*/

let auth = require('./auth')(app);

//to require passport module and import passport.js file
const passport = require('passport');
require('./passport');


const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {flags: 'a'})
app.use(morgan('common', {stream: accessLogStream}));
app.use(express.static('public'));

//Welcome
app.get('/', (req, res) => {
  res.send('Welcome to MyFlix App');
});

//Add a user / CREATE
app.post('/users', 
[ 
  // minimum value of 5 characters
  check ('Username', 'Username is required').isLength({min: 5}),
  check ('Username', 'Username contains non alphanumeric character - not allowed.').isAlphanumeric(),
  // not empty
  check('Password', 'Password is required').not().isEmpty(),
  check ('Email', 'Email does not appear to be valid').isEmail()
], (req, res) => {
    // checks validation object for errors
  let errors = validationResult(req);

  if(!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array()});
  } 

  let hashedPassword = Users.hashPassword(req.body.Password); // this hash the password before storing it in the mongoDB database
  Users.findOne({ Username: req.body.Username })
  .then((user) => {
    if (user) {
      return res.status(400).send(req.body.Username + ' already exists');
    } else {
      Users
      .create({
        Username: req.body.Username,
        Password: hashedPassword,
        Email: req.body.Email,
        Birthday: req.body.Birthday
      })
      .then((user) =>{res.status(201).json(user) })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
      })
    }
  })
  .catch((error) => {
    console.error(error);
    res.status(500).send('Error: ' + error);
  });
});
  
  // Get all users / GET
  app.get('/users', passport.authenticate('jwt', { session: false }), (req, res) => {
	Users.find()
	.then((users) => {
	  res.status(200).json(users);
	})
	.catch((err) => {
	  console.error(err);
	  res.status(500).send('Error: ' + err);
	});
  });

  // Get a user by username / GET
  app.get('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
	Users.findOne({ Username: req.params.Username})
	.then((User) => {
	  res.status(200).json(User)
	})
	.catch((err) => {
	  console.error(err);
	  res.status(500).send('Error ' + err)
	})
  })

// Get all movies / GET
app.get('/movies', passport.authenticate('jwt', { session: false }), (req, res) => {
	Movies.find()
	.then((movies) => {
	  res.status(200).json(movies);
	})
	.catch((err) => {
	  console.error(err);
	  res.status(500).send('Error: ' + err);
	});
  });
  
  // Get movie by title / GET
  app.get('/movies/:title', passport.authenticate('jwt', { session: false }), (req, res) => {
	Movies.findOne({ Title: req.params.title})
	.then((movie) => {
	  res.status(200).json(movie);
	})
	.catch((err) => {
	  console.error(err);
	  res.status(500).send('Error: ' + err);
	});
  });
  
  //Get genre by name / GET
  app.get('/movies/genres/:Name', passport.authenticate('jwt', { session: false }), (req, res) => {
	Movies.findOne({ "Genre.Name": req.params.Name})
	.then((movies) => {
	  res.send(movies.Genre);
	})
	.catch((err) => {
	  console.error(err);
	  res.status(500).send('Error: ' + err);
	});
  });
  
  //Get director by name / GET
  app.get('/movies/directors/:Name', passport.authenticate('jwt', { session: false }), (req, res) => {
	Movies.findOne({"Director.Name": req.params.Name})
	.then((movies) => {
	  res.send(movies.Director);
	})
	.catch((err) => {
	  console.error(err);
	  res.status(500).send('Error: ' + err);
	});
  });

// Update a user's info, by username / UPDATE
	app.put('/users/:Username', passport.authenticate('jwt', { session: false }),
	[ 
	check ('Username', 'Username is required').isLength({min: 5}),
	check ('Username', 'Username contains non alphanumeric character - not allowed.').isAlphanumeric(),
	check('Password', 'Password is required').not().isEmpty(),
	check ('Email', 'Email does not appear to be valid').isEmail()
	], (req, res) => {

	let errors = validationResult(req);

	if(!errors.isEmpty()) {
		return res.status(422).json({ errors: errors.array()});
	} 

	let hashedPassword = Users.hashPassword(req.body.Password);
	Users.findOneAndUpdate({ Username: req.params.Username},
		{ 
		$set: {
			Username: req.body.Username,
			Password: hashedPassword,
			Email: req.body.Email,
			Birthday: req.body.Birthday
		},
		},
		{new: true }, //This line makes sure that the updated document is returned
		(err, updatedUser) => {
		if(err) {
			console.error(err);
			res.status(500).send('Error: ' + err);
		} else {
			res.json(updatedUser);
		}
		});
	});


// Add a movie to a user's list of favorites / UPDATE
app.post('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }), (req, res) => {
	Users.findOneAndUpdate({ Username: req.params.Username }, {
	   $push: { FavoriteMovies: req.params.MovieID }
	 },
	 { new: true }, // This line makes sure that the updated document is returned
	(err, updatedUser) => {
	  if (err) {
		console.error(err);
		res.status(500).send('Error: ' + err);
	  } else {
		res.json(updatedUser);
	  }
	});
  });

//Delete Movie from Favorites / DELETE
app.delete('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }), (req, res) => {
	Users.findOneAndUpdate({ Username: req.params.Username }, {
	$pull: { FavoriteMovies: req.params.MovieID }
	},
	{ new: true }, // This line makes sure that the updated document is returned
	(err, updatedUser) => {
	if (err) {
	console.error(err);
	res.status(500).send('Error: ' + err);
	} else {
	res.json(updatedUser);
	}
	});
	});

// Delete a user by username / DELETE
app.delete('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
	Users.findOneAndRemove({ Username: req.params.Username })
	  .then((user) => {
		if (!user) {
		  res.status(400).send(req.params.Username + ' was not found');
		} else {
		  res.status(200).send(req.params.Username + ' was deleted.');
		}
	  })
	  .catch((err) => {
		console.error(err);
		res.status(500).send('Error: ' + err);
	  });
  });

// GET request - Documentation
app.get('/documentation', (req, res) => {                  
    res.sendFile('public/documentation.html', { root: __dirname });
  });


// error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Oooops, something went wrong!');
});

// listen for requests
const port = process.env.PORT || 6673;
app.listen(port, '0.0.0.0',() => {
 console.log('Listening on Port ' + port);
});

