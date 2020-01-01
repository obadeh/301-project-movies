'use strict';


require('dotenv').config();
const express = require('express');
const PORT = process.env.PORT || 3000;
const app = express();
const superagent = require('superagent');
const pg = require('pg');
const methodOverride = require('method-override')
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('./public/../'));
app.set('view engine', 'ejs')



// Middleware to handle PUT and DELETE
app.use(methodOverride((request, response) => {
  if (request.body && typeof request.body === 'object' && '_method' in request.body) {
    // look in urlencoded POST bodies and delete it
    let method = request.body._method;
    delete request.body._method;
    return method;
  }
}))


// Database Connection Setup
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => { throw err; });


// routes 

let page = 1;
app.get('/', (request, response) => {
  const url = `https://api.themoviedb.org/3/movie/top_rated?api_key=${process.env.MOV_API}&language=en-US&page=${page}`
  return superagent(url)
    .then(data => {
      // console.log('data : ', data);
      let movie = data.body.results;
      let movi = movie.map(val => {
        return new Movie(val);
      })
      // console.log('movie : ', movie);
      response.render('../views/index', { data: movi })
    })
});

// functions handlers.....

app.get('/search', (request, response) => {
  response.render('../views/pages/search')
})

app.post('/dosearches', (request, response) => {
  let sort = request.body.disc;
  let releaseYear = request.body.year;
  console.log('releaseYear : ', releaseYear);
  console.log('sort : ', sort);
  ;
  let url;

  if (sort === 'popularity') { url = `https://api.themoviedb.org/3/discover/movie?api_key=${process.env.MOV_API}&language=en-US&sort_by=popularity.desc&include_adult=false&include_video=false&page=${page}` };
  if (sort === 'revenue') { url = `https://api.themoviedb.org/3/discover/movie?api_key=${process.env.MOV_API}&language=en-US&sort_by=revenue.desc.desc&include_adult=false&include_video=false&page=${page}` };
  if (releaseYear) { url += `&primary_release_year=${releaseYear}` };
  // console.log('releaseYear : ', releaseYear);
  // console.log('url : ', url);
  superagent(url)
    .then(data => {
      let movie = data.body.results;
      //  console.log('movie : ', movie);
      let movi = movie.map(val => {
        // console.log('val : ', val);
        let moviesConst = new Movie(val);
        return moviesConst;
        
      })
      // console.log('movies : ', movi)
      response.render('../views/pages/result', { data: movi })
    })
});

app.post('/searchbox', (request, response) => {
  let text = request.body.box;
  let url = `https://api.themoviedb.org/3/search/movie?api_key=57a6b853590432570e83f7520825c046&query=${text}`
  superagent(url)
    .then(data => {
      let movie = data.body.results;
      let movi = movie.map(val => {
        let moviesConst = new Movie(val)
        return moviesConst;
      })
      // console.log('moviesConst : ', moviesConst);
      response.render('../views/pages/result', { data: movi })
    })
});

app.post('/selectMovie', (request, response) => {

  // console.log('request.body : ', request.body);
  response.render('../views/pages/details', { data: request.body })
})

app.get('/show', (request, response) => {
  let SQL = 'SELECT * FROM movies';
  client.query(SQL)
    .then(results => response.render('../views/pages/fav', { data: results.rows }))
    .catch(err => errorHandler(err, response));
})

app.post('/add', (request, response) => {
  let { title, poster_path, overview, popularity, vote_average, release_date } = request.body;
  let values = [title, poster_path, overview, popularity, vote_average, release_date];
  const SQL = 'INSERT INTO movies(title,poster_path,overview,popularity,vote_average,release_date) VALUES ($1, $2, $3, $4, $5 ,$6);';
  return client.query(SQL, values)
    .then(response.redirect('/show'))
    .catch(err => errorHandler(err, response));

})

app.put('/edit/:movie_id', (request, response) => {

  let { title, poster_path, overview, popularity, vote_average, release_date } = request.body;
  let values = [title, poster_path, overview, popularity, vote_average, release_date, request.params.movie_id]
  let SQL = 'UPDATE movies SET title=$1, poster_path=$2, overview=$3, popularity=$4, vote_average=$5, release_date=$6 WHERE id=$7 ;';
  return client.query(SQL, values)
    .then(response.redirect('/show'))
    .catch(err => errorHandler(err));
})

app.delete('/delete/:movie_id', (request, response) => {
  let val = [request.params.movie_id];
  let SQL = 'DELETE FROM movies WHERE id=$1 ;'
  return client.query(SQL, val)
    .then(response.redirect('/show'))
    .catch(err => errorHandler(err));
})


app.get('/next', (request, response) => {
  page = page + 1;
  response.redirect('/')
})

app.get('/previous', (request, response) => {
  page = page - 1;
  response.redirect('/')
})

// app.post('/nextS', (request, response) => {
//   page = page + 1;
//   response.redirect('/dosearches')
// })





function Movie(movi) {

  this.title = movi.title;
  this.poster_path = `https://image.tmdb.org/t/p/w500${movi.poster_path}` || 'not avalible';
  this.overview = movi.overview;
  this.popularity = movi.popularity;
  this.vote_average = movi.vote_average;
  this.release_date = movi.release_date;
  this.id = movi.id;

}


// error functions handlers
function notFound(request, response) {
  response.status(404).send('NOT FOUND!!!');
}
function errorHandler(error, request, response) {
  response.status(500).send(error);
}



// Connect to DB and THEN Start the Web Server

client.connect()
  .then(() => {
    app.listen(PORT, () => console.log('Server up on', PORT)
    );
  })
  .catch(err => {
    throw `PG Startup Error: ${err.message}`;
  });


