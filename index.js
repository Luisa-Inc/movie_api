const express = require('express'),
app = express(),
bodyParser = require('body-parser'),
uuid = require('uuid'),
morgan = require('morgan');

const mongoose = require('mongoose');
mongoose.set('strictQuery', true);
const Models = require('./models.js');

const Movies = Models.Movie; //refer to the model names you defined in “models.js”
const Users = Models.User; //refer to the model names you defined in “models.js”

mongoose.connect('mongodb://localhost:27017/myFlixDB ', { useNewUrlParser: true, useUnifiedTopology: true });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('common'));

let users = [
  {
		id: 1,
		name: 'John',
		favoriteMovies: 'Love Actually',
	},
	{
		id: 2,
		name: 'James',
		favoriteMovies: 'The Notebook',
	},
];

let movies = [
  {
		Title: 'The Young and Prodigious T. S. Spivet',
		Description: 'Description 1',
		Genre: {
			Name: 'Drama',
			Description: 'Description Genre',
		},
		Director: {
			Name: 'Director 1',
			Bio: 'Bio Director 1',
			Birth: 1969,
		},
	},
	{
		Title: 'The Notebook',
		Description: 'Description 2',
		Genre: {
			Name: 'Drama',
			Description: 'Description Genre',
		},
		Director: {
			Name: 'Director 2',
			Bio: 'Bio Director 2',
			Birth: 1972,
		},
	},
	{
		Title: 'Love Actually',
		Description: 'Description 3',
		Genre: {
			Name: 'Romance',
			Description: 'Description Genre',
		},
		Director: {
			Name: 'Director 3',
			Bio: 'Bio Director 3',
			Birth: 1980,
		},
	},
	{
		Title: 'Title 4',
		Description: 'Description 4',
		Genre: {
			Name: 'Action',
			Description: 'Description Genre',
		},
		Director: {
			Name: 'Director 4',
			Bio: 'Bio Director 4',
			Birth: 1981,
		},
	},
	{
		Title: 'Title 5',
		Description: 'Description 5',
		Genre: {
			Name: 'Comedy',
			Description: 'Description Genre',
		},
		Director: {
			Name: 'Director 5',
			Bio: 'Bio Director 5',
			Birth: 1982,
		},
	},
    {
      Title: 'MovieTitle',
      Description: 'Description',
      Genre: {
        Name: 'GenreName',
        Description: 'DramaDescription',
      },
      Director: {
        Name: 'DirectorName',
        Bio: 'DirectorBio',
        Birth: 1988,
      },
    },

  ];


//Welcome
app.get('/', (req, res) => {
  res.send('Welcome to MyFlix App');
});

//Add a user / CREATE

/* We’ll expect JSON in this format
{
  ID: Integer,
  Username: String,
  Password: String,
  Email: String,
  Birthday: Date
}*/

app.post('/users', (req, res) => {
	Users.findOne({ Username: req.body.Username })
	  .then((user) => {
		if (user) {
		  return res.status(400).send(req.body.Username + 'already exists');
		} else {
		  Users
			.create({
			  Username: req.body.Username,
			  Password: req.body.Password,
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
app.get('/users', (req, res) => {
	Users.find()
	  .then((users) => {
		res.status(201).json(users);
	  })
	  .catch((err) => {
		console.error(err);
		res.status(500).send('Error: ' + err);
	  });
  });

  // Get a user by username / GET
app.get('/users/:Username', (req, res) => {
	Users.findOne({ Username: req.params.Username })
	  .then((user) => {
		res.json(user);
	  })
	  .catch((err) => {
		console.error(err);
		res.status(500).send('Error: ' + err);
	  });
  });

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
/* We’ll expect JSON in this format
{
  Username: String,
  (required)
  Password: String,
  (required)
  Email: String,
  (required)
  Birthday: Date
}*/
app.put('/users/:Username', (req, res) => {
	Users.findOneAndUpdate({ Username: req.params.Username }, { $set:
	  {
		Username: req.body.Username,
		Password: req.body.Password,
		Email: req.body.Email,
		Birthday: req.body.Birthday
	  }
	},
	{ new: true }, // This line makes sure that the updated document is returned
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
app.post('/users/:Username/movies/:MovieID', (req, res) => {
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
app.delete('/users/:Username/:MovieID', (req, res) => {
	Users.findOneAndUpdate({ Userame: req.params.Userame }, {
	   $pull: { Favorites: req.params.MovieID }
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
app.delete('/users/:Username', (req, res) => {
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
app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});