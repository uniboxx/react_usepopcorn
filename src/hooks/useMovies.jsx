import { useState, useEffect } from 'react';

const KEY = '5e1ac1dc';
const fetchUrl = `//www.omdbapi.com/?apikey=${KEY}&`;

export function useMovies(query) {
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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

      fetchMovies();

      return function () {
        controller.abort();
      };
    },
    [query]
  );

  return { movies, isLoading, error };
}
