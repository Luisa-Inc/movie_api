// mongoose for keeping documents in collections uniform


const mongoose = require('mongoose');

let movieSchema = mongoose.Schema({ //define schema for documents in the movies collection 
    Title: {type: String, required: true},
    Description: {type: String, required: true}, // everything in the brackets is required and ensures uniformity
    Genre: {
      Name: String,
      Description: String
    },
    Director: { // subdocument
      Name: String,
      Bio: String
    },
    Actors: [String], // added: Actors with required array of strings
    ImagePath: String,
    Featured: Boolean
  });
  
  let userSchema = mongoose.Schema({ //define schema for documents in the users collection
    Username: {type: String, required: true},
    Password: {type: String, required: true},
    Email: {type: String, required: true},
    Birthday: Date, //where documents in this schema have a Birthday key, the must be a "Date".
    FavoriteMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }] //rederence to the moviedatabase "Movie"
    // referred to in a set of an array of IDs OR actual ovie titles
  });
  
  let Movie = mongoose.model('Movie', movieSchema); //creates collesction "db.movies"
  let User = mongoose.model('User', userSchema);// creates collection "db.users"  
  
  module.exports.Movie = Movie;
  module.exports.User = User;

 