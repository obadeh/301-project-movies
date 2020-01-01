DROP TABLE IF EXISTS movies;

CREATE TABLE movies (
    id serial PRIMARY KEY ,
    title text,
    poster_path text,
    overview text,
    popularity text,
    vote_average text,
    release_date text

);

INSERT INTO movies (title,poster_path,overview,popularity,vote_average,release_date) VALUES('movie','dd','321541','22.221','36.33','2020-2-21')