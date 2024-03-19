require("dotenv").config();

const express = require("express"),
  bodyParser = require("body-parser"),
  uuid = require("uuid"),
  morgan = require("morgan");
(fs = require("fs")), (path = require("path"));

const app = express();
const mongoose = require("mongoose");
mongoose.set("strictQuery", true);

// Require Mongoose models from models.js
const Models = require("./models.js");
const { check, validationResult } = require("express-validator");
const Movies = Models.Movie; //refer to the model names you defined in “models.js”
const Users = Models.User; //refer to the model names you defined in “models.js”

/*mongoose.connect('mongodb://localhost:27017/myFlixDB ', { useNewUrlParser: true, useUnifiedTopology: true });*/
mongoose.connect(process.env.CONNECTION_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// app.use(cors()); // //any time using req.body, the data will be expected to be in JSON format
// app.use(cors()); // Allow all domains to access APi

///List of allowed domains to access API//
const cors = require("cors");
let allowedOrigins = [
  "http://localhost:8080",
  "http://testsite.com",
  "http://localhost:1234",
  "https://mighty-harbor-05233.herokuapp.com/",
  "https://myluisaflix.netlify.app/",
  "http://localhost:3000",
];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        // If a specific origin isn’t found on the list of allowed origins
        let messsage =
          "The CORS policy for this application doesn’t allow access from origin " +
          origin;
        return callback(new Error(messsage), false);
      }
      return callback(null, true);
    },
  })
);

// Import auth.js
let auth = require("./auth")(app);

// Import passport and passport.js
const passport = require("passport");
require("./passport");

// log all requests
const accessLogStream = fs.createWriteStream(path.join(__dirname, "log.txt"), {
  flags: "a",
});
app.use(morgan("common", { stream: accessLogStream }));
app.use(express.static("public"));

/**
 * READ index page
 * @function
 * @name getIndexPage
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Object} - Sends a string response "Welcome to my movie page!".
 */
app.get("/", (req, res) => {
  res.send("Welcome to MyFlix App");
});

/**
 * CREATE new user
 * @function
 * @name signupUser
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @throws {Error} - If there is an error when creating the new user.
 * @returns {Object} - Returns JSON response containing the new user.
 */
app.post(
  "/users",
  [
    // minimum value of 5 characters
    check("Username", "Username is required").isLength({ min: 5 }),
    check(
      "Username",
      "Username contains non alphanumeric character - not allowed."
    ).isAlphanumeric(),
    // not empty
    check("Password", "Password is required").not().isEmpty(),
    check("Email", "Email does not appear to be valid").isEmail(),
  ],
  (req, res) => {
    // checks validation object for errors
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    let hashedPassword = Users.hashPassword(req.body.Password); // this hash the password before storing it in the mongoDB database
    Users.findOne({ Username: req.body.Username }) // Search to see if a user with the requested username already exists
      .then((user) => {
        if (user) {
          return res.status(400).send(req.body.Username + " already exists");
        } else {
          Users.create({
            Username: req.body.Username,
            Password: hashedPassword,
            Email: req.body.Email,
            Birthday: req.body.Birthday,
          })
            .then((user) => {
              res.status(201).json(user);
            })
            .catch((error) => {
              console.error(error);
              res.status(500).send("Error: " + error);
            });
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

/**
 * READ a user by username
 * @function
 * @name getOneUser
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {string} req.params.Username - The username of the user to retrieve.
 * @throws {Error} - If there is an error while retrieving the user from the database.
 * @returns {Object} - Returns JSON response containing the user with this username.
 */
app.get(
  "/users",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.find()
      .then((users) => {
        res.status(200).json(users);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

// Get a user by username / GET
app.get(
  "/users/:Username",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.findOne({ Username: req.params.Username })
      .then((User) => {
        res.status(200).json(User);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error " + err);
      });
  }
);

/**
 * READ movie list
 * @function
 * @name getAllMovies
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @throws {Error} - If there is an error while retrieving movies from the database.
 * @returns {Object} - Returns JSON response containing all movies.
 */
app.get(
  "/movies",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Movies.find()
      .then((movies) => {
        res.status(200).json(movies);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

/**
 * READ movie by title
 * @function
 * @name getOneMovie
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {string} req.params.title - The title of the movie to retrieve.
 * @throws {Error} - If there is an error while retrieving the movie from the database.
 * @returns {Object} - Returns JSON response containing the requested movie.
 */
app.get(
  "/movies/:title",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Movies.findOne({ Title: req.params.title })
      .then((movie) => {
        res.status(200).json(movie);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

/**
 * READ genre by name
 * @function
 * @name getGenre
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {string} req.params.genreName - The name of the genre to retrieve from the database.
 * @throws {Error} - If there is an error while retrieving genre from the database.
 * @returns {Object} - Returns JSON response containing the genre object of the requested movies.
 */
app.get(
  "/movies/genres/:Name",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Movies.findOne({ "Genre.Name": req.params.Name })
      .then((movies) => {
        res.send(movies.Genre);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

/**
 * READ director by name
 * @function
 * @name getDirector
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {string} req.params.directorName - The name of the director to retrieve from the database.
 * @throws {Error} - If there is an error while retrieving director from the database.
 * @returns {Object} - Returns JSON response containing the director object of the requested movies.
 */
app.get(
  "/movies/directors/:Name",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Movies.findOne({ "Director.Name": req.params.Name })
      .then((movies) => {
        res.send(movies.Director);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

/**
 * UPDATE user information by username
 * @function
 * @name updateUser
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {string} req.params.Username - The username of the user to update.
 * @throws {Error} - If there is an error while validating input or updating user data in the database.
 * @returns {Object} - JSON response containing the updated user.
 */
app.put(
  "/users/:Username",
  passport.authenticate("jwt", { session: false }),
  [
    check("Username", "Username is required").isLength({ min: 5 }),
    check(
      "Username",
      "Username contains non alphanumeric character - not allowed."
    ).isAlphanumeric(),
    check("Password", "Password is required").not().isEmpty(),
    check("Email", "Email does not appear to be valid").isEmail(),
  ],
  (req, res) => {
    // check the validation object for errors
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    let hashedPassword = Users.hashPassword(req.body.Password);
    Users.findOneAndUpdate(
      { Username: req.params.Username },
      {
        $set: {
          // If there is new data update the database with new data, else use old data
          Username: req.body.Username,
          Password: hashedPassword,
          Email: req.body.Email,
          Birthday: req.body.Birthday,
        },
      },
      { new: true }, //This line makes sure that the updated document is returned
      (err, updatedUser) => {
        if (err) {
          console.error(err);
          res.status(500).send("Error: " + err);
        } else {
          res.json(updatedUser);
        }
      }
    );
  }
);

/**
 * CREATE new favorite movie for user
 * @function
 * @name addFavMovie
 * @param {Object} req - Express request object.
 * @param {Object} req.user - User object obtained from JWT authentication.
 * @param {string} req.params.Username - The username of the user.
 * @param {string} req.params.MovieID - The ID of the movie to add to the user's favorites.
 * @param {Object} res - Express response object.
 * @throws {Error} - If there is an error while updating user data in the database.
 * @returns {Object} - Returns JSON response containing the updated user's information.
 */
app.post(
  "/users/:Username/movies/:MovieID",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    // Condition to check user authorization
    Users.findOneAndUpdate(
      { Username: req.params.Username },
      {
        $push: { FavoriteMovies: req.params.MovieID },
      },
      { new: true }, // This line makes sure that the updated document is returned
      (err, updatedUser) => {
        if (err) {
          console.error(err);
          res.status(500).send("Error: " + err);
        } else {
          res.json(updatedUser);
        }
      }
    );
  }
);

/**
 * DELETE favorite movie for user
 * @function
 * @name deleteFavMovie
 * @param {Object} req - Express request object.
 * @param {Object} req.user - User object obtained from JWT authentication.
 * @param {string} req.params.Username - The username of the user.
 * @param {string} req.params.MovieID - The ID of the movie to remove from the user's favorites.
 * @param {Object} res - Express response object.
 * @throws {Error} - If there is an error while updating user data in the database.
 * @returns {Object} - Returns JSON response containing the updated user's information.
 */
app.delete(
  "/users/:Username/movies/:MovieID",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    // Condition to check user authorization
    Users.findOneAndUpdate(
      { Username: req.params.Username },
      {
        $pull: { FavoriteMovies: req.params.MovieID },
      },
      { new: true }, // This line makes sure that the updated document is returned
      (err, updatedUser) => {
        if (err) {
          console.error(err);
          res.status(500).send("Error: " + err);
        } else {
          res.json(updatedUser);
        }
      }
    );
  }
);

/**
 * DELETE user by Username
 * @function
 * @name deleteUser
 * @param {Object} req - Express request object.
 * @param {Object} req.user - User object obtained from JWT authentication.
 * @param {string} req.params.Username - The username of the user to delete.
 * @param {Object} res - Express response object.
 * @throws {Error} -  If there is an error while deleting the user from the database.
 * @returns {Object} - Returns message indicating whether the user was successfully deleted or not.
 */
app.delete(
  "/users/:Username",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    // Condition to check user authorization
    Users.findOneAndRemove({ Username: req.params.Username })
      .then((user) => {
        if (!user) {
          res.status(400).send(req.params.Username + " was not found");
        } else {
          res.status(200).send(req.params.Username + " was deleted.");
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

// GET request - Documentation
app.get("/documentation", (req, res) => {
  res.sendFile("public/documentation.html", { root: __dirname });
});

// error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Oooops, something went wrong!");
});

// listen for requests
const port = process.env.PORT || 6673;
app.listen(port, "0.0.0.0", () => {
  console.log("Listening on Port " + port);
});
