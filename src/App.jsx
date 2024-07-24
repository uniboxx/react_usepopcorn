import { useEffect, useState, useRef } from 'react';

import StarRating from './components/StarRating';

function average(arr) {
  return +arr
    .reduce((acc, cur, i, arr) => acc + (cur ? cur : 0) / arr.length, 0)
    .toFixed(2);
}

const KEY = '5e1ac1dc';
const fetchUrl = `//www.omdbapi.com/?apikey=${KEY}&`;

function App() {
  const [movies, setMovies] = useState([]);
  const [query, setQuery] = useState('');

  const localStore = JSON.parse(localStorage.getItem('watched'));

  //- è possibile passare a useState anche una callback oltre ad un valore
  const [watched, setWatched] = useState(() => localStore || []);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  async function handleSelectedMovie(id) {
    if (id === selectedId) return;
    setSelectedId(id);
  }

  function handleCloseMovie() {
    setSelectedId(null);
  }

  function handleAddWatched(movie) {
    setWatched(watched => [...watched, movie]);

    //= va bene così ma si può fare lo stesso con useEffect
    // localStorage.setItem('watched', JSON.stringify([...watched, movie]));
  }

  function handleDeleteWatched(id) {
    setWatched(watched => watched.filter(movie => movie.imdbID !== id));
  }

  useEffect(
    function () {
      localStorage.setItem('watched', JSON.stringify(watched));
    },
    [watched]
  );

  useEffect(
    function () {
      //- serve nel caso avessi richieste multiple - stoppa la precedente e inizia la nuova (vedere l'oggetto in fetch, l'errore in catch, e la funzione di clean up)
      const controller = new AbortController();

      async function fetchMovies() {
        try {
          setIsLoading(true);
          setError('');
          const res = await fetch(`${fetchUrl}s=${query}`, {
            signal: controller.signal,
          });

          if (!res.ok)
            throw new Error('Something went wrong with fetching movies!');

          const data = await res.json();
          if (data.Response === 'False') throw new Error(data.Error);
          // console.log(data.Search);
          setMovies(data.Search);
          setError('');
        } catch (err) {
          console.error(err.message);
          if (err.name !== 'AbortError') setError(err.message);
        } finally {
          setIsLoading(false);
        }
      }

      if (query.length < 3) {
        setMovies([]);
        setError('');
        return;
      }

      handleCloseMovie();
      fetchMovies();

      return function () {
        controller.abort();
      };
    },
    [query]
  );

  return (
    <>
      <NavBar>
        <Logo />
        <Search
          query={query}
          setQuery={setQuery}
          onCloseMovie={handleCloseMovie}
        />
        <NumResults movies={movies} />
      </NavBar>
      <Main>
        {/* <Box element={<MovieList movies={movies} />} />
        <Box
          element={
            <>
              <WatchedSummary watched={watched} />
              <WatchedMovieList watched={watched} />
            </>
          }></Box> */}
        <Box>
          {!query && (
            <p className='beforeMovieSearch'>
              Insert text in searchbox to see the result here ...
            </p>
          )}
          {!isLoading && !error && (
            <MovieList
              movies={movies}
              handleSelectedMovie={handleSelectedMovie}
            />
          )}
          {isLoading && <Loader />}
          {error && <ErrorMessage message={error} />}
        </Box>
        <Box>
          {!selectedId ? (
            <>
              <WatchedSummary watched={watched} />
              <WatchedMovieList
                watched={watched}
                onDeleteWatched={handleDeleteWatched}
              />
            </>
          ) : (
            <MovieDetails
              selectedId={selectedId}
              onCloseMovie={handleCloseMovie}
              onAddWatched={handleAddWatched}
              onDeleteWatched={handleDeleteWatched}
              watched={watched}
            />
          )}
          {/* <StarRating
            maxRating={5}
            className='test'
            messages={['Terrible', 'Bad', 'Okay', 'Good', 'Amazing']}
            defaultRating={2}
            onSetRating={setMovieRating}
          /> */}
          {/* <StarRating onSetRating={setMovieRating} />
          <p>This movie was rated {movieRating} stars</p> */}
        </Box>
      </Main>
    </>
  );
}

function Loader() {
  return <p className='loader'>Loading...</p>;
}

function ErrorMessage({ message }) {
  return (
    <p className='error'>
      <span>⛔️</span> {message}
    </p>
  );
}

function NavBar({ children }) {
  return <nav className='nav-bar'>{children}</nav>;
}

function Logo() {
  return (
    <div className='logo'>
      <span role='img'>🍿</span>
      <h1>usePopcorn</h1>
    </div>
  );
}

function Search({ query, setQuery, onCloseMovie }) {
  const inputEl = useRef(null);

  function callback(e) {
    if (document.activeElement === inputEl) return;
    if (e.code === 'Enter') {
      setQuery('');
      inputEl.current.focus();
      onCloseMovie();
    }
  }

  useEffect(function () {
    document.addEventListener('keydown', callback);

    // console.log(inputEl.current);
    inputEl.current.focus();
    return () => document.removeEventListener('keydown', callback);
  }, []);
  // useEffect(function () {
  //   const el = document.querySelector('.search');
  //   console.log(el);
  //   el.focus();
  // }, []);

  return (
    <form
      className='search__form'
      onSubmit={e => {
        e.preventDefault();
        // console.log(e.target.query.value);

        setQuery(e.target.query.value);
        e.target.query.value = '';
      }}>
      <input
        className='search'
        type='text'
        placeholder='Search movies...'
        name='query'
        // value={inputValue}
        // onChange={e => (useRef.current = e.target.value)}
        ref={inputEl}
      />
      <button className='search__button'>Search</button>
    </form>
  );
}

function NumResults({ movies }) {
  return (
    <p className='num-results'>
      Found <strong>{movies?.length || 0}</strong> results
    </p>
  );
}

function Main({ children }) {
  return <main className='main'>{children}</main>;
}

function Box({ children }) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className='box'>
      <Button onClick={() => setIsOpen(open => !open)}>
        {isOpen ? '–' : '+'}
      </Button>
      {isOpen && children}
    </div>
  );
}

// function WatchedBox() {
//   const [watched, setWatched] = useState(tempWatchedData);
//   const [isOpen2, setIsOpen2] = useState(true);

//   return (
//     <div className='box'>
//       <Button onClick={() => setIsOpen2(open => !open)}>
//         {isOpen2 ? '–' : '+'}
//       </Button>
//       {isOpen2 && (
//         <>
//           <WatchedSummary watched={watched} />
//           <WatchedMovieList watched={watched} />
//         </>
//       )}
//     </div>
//   );
// }

function Button({ onClick, children }) {
  return (
    <button className='btn-toggle' onClick={onClick}>
      {children}
    </button>
  );
}

function MovieList({ movies, handleSelectedMovie }) {
  return (
    <ul className='list list-movies'>
      {movies?.map(movie => (
        <Movie
          movie={movie}
          handleSelectedMovie={handleSelectedMovie}
          key={movie.imdbID}
        />
      ))}
    </ul>
  );
}

function Movie({ movie, handleSelectedMovie }) {
  return (
    <li onClick={() => handleSelectedMovie(movie.imdbID)}>
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>🗓</span>
          <span>{movie.Year}</span>
        </p>
      </div>
    </li>
  );
}

function MovieDetails({
  selectedId,
  onCloseMovie,
  onAddWatched,
  onDeleteWatched,
  watched,
}) {
  const [movie, setMovie] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [userRating, setUserRating] = useState(0);

  const isWatched = watched?.map(movie => movie.imdbID).includes(selectedId);

  const watchedMovieUserRating = watched.find(
    movie => movie.imdbID === selectedId
  )?.userRating;

  const {
    Title: title,
    Year: year,
    Poster: poster,
    Runtime: runtime,
    imdbRating,
    Plot: plot,
    Released: released,
    Actors: actors,
    Director: director,
    Genre: genre,
  } = movie;

  function handleAdd() {
    const newWatchedMovie = {
      imdbID: selectedId,
      title,
      year,
      poster,
      imdbRating: +imdbRating,
      runtime: Number(runtime.split(' ')[0]),
      userRating,
    };

    if (isWatched) onDeleteWatched(selectedId);

    onAddWatched(newWatchedMovie);
    onCloseMovie();
  }

  useEffect(
    function () {
      async function getMovieDetails() {
        setIsLoading(true);
        try {
          // setIsLoading(true);
          const res = await fetch(`${fetchUrl}i=${selectedId}`);
          // console.log(res);
          if (!res.ok) throw new Error('Invalid imdbID!');
          const data = await res.json();

          // console.log(data);
          setMovie(data);
        } catch (err) {
          console.error(err.message);
        } finally {
          // setSelectedId('');
          setIsLoading(false);
        }
      }
      getMovieDetails();
    },
    [selectedId]
  );

  useEffect(
    function () {
      if (!title) return;
      document.title = `Movie | ${title}`;

      return function () {
        document.title = 'usePopcorn';
        // console.log(`Clean up effect for movie ${title}`);
      };
    },
    [title]
  );

  useEffect(function () {
    function callback(e) {
      if (e.code === 'Escape') {
        onCloseMovie();
      }
    }
    document.addEventListener('keydown', callback);
    return function () {
      document.removeEventListener('keydown', callback);
    };
  }, []);

  return (
    <div className='details'>
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <header>
            <button className='btn-back' onClick={onCloseMovie}>
              &larr;
            </button>
            <img src={poster} alt={`Poster of ${title} movie`} />
            <div className='details-overview'>
              <h2>{title}</h2>
              <p>
                {released} &bull; {runtime}
              </p>
              <p>{genre}</p>
              <p>
                <span>⭐️</span>
                {imdbRating} IMDb rating
              </p>
            </div>
          </header>
          <section>
            <div className='rating'>
              <StarRating
                maxRating={10}
                size={24}
                onSetRating={setUserRating}
                onRating={watchedMovieUserRating || 0}
              />
              {(userRating > 0 || watchedMovieUserRating) && (
                <button className='btn-add' onClick={handleAdd}>
                  {userRating > 0 && !isWatched
                    ? '+ Add to list'
                    : 'Change rating'}
                </button>
              )}
            </div>
            <p>
              <em>{plot}</em>
            </p>
            <p>Starring {actors}</p>
            <p>Directed by {director}</p>
          </section>
        </>
      )}
    </div>
  );
}

function WatchedSummary({ watched }) {
  const avgImdbRating = average(watched?.map(movie => movie.imdbRating));
  const avgUserRating = average(watched?.map(movie => movie.userRating));
  const avgRuntime = average(watched?.map(movie => movie.runtime));

  return (
    <div className='summary'>
      <h2>Movies you watched</h2>
      <div>
        <p>
          <span>#️⃣</span>
          <span>{watched.length} movies</span>
        </p>
        <p>
          <span>⭐️</span>
          <span>{avgImdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{avgUserRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{avgRuntime} min</span>
        </p>
      </div>
    </div>
  );
}

function WatchedMovieList({ watched, onDeleteWatched }) {
  return (
    <ul className='list'>
      {watched?.map(movie => (
        <WatchedMovie
          movie={movie}
          key={movie.imdbID}
          onDeleteWatched={onDeleteWatched}
        />
      ))}
    </ul>
  );
}

function WatchedMovie({ movie, onDeleteWatched }) {
  const { poster, title, imdbRating, userRating, runtime, imdbID } = movie;
  return (
    <li>
      <img src={poster} alt={`${title} poster`} />
      <h3>{title}</h3>
      <div>
        <p>
          <span>⭐️</span>
          <span>{imdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{userRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{runtime ? runtime + ' min' : 'N/A'}</span>
        </p>
        <button className='btn-delete' onClick={() => onDeleteWatched(imdbID)}>
          X
        </button>
      </div>
    </li>
  );
}

export default App;
