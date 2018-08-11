const { render } = require('react-dom');
const h = require('react-hyperscript');
const { call } = require('cofx');

const createFetcher = require('../dist/index').default;

function* fetchMovies(props) {
  // throw new Error('Something bad happened');
  console.log(props);
  const resp = yield call(
    window.fetch,
    'https://endpoints.uncaughtexception.wtf/9b45d01b5c3447539b0bfca393b3305d',
  );
  const json = yield call([resp, 'json']);
  const movies = json.movies;
  return movies;
}
const Example = ({ movies = [], refetch, error }) => {
  if (error) {
    return h('div', error.message);
  }

  return h('div', [
    h(
      'a',
      {
        href: '#',
        onClick: () => {
          refetch();
        },
      },
      'refetch',
    ),
    h('div', movies.map((movie) => h('div', { key: movie }, movie))),
  ]);
};
const Loading = () => h('div', 'LOADING');

const movieFetcher = createFetcher(fetchMovies);
const mapStateToProps = (movies, error) => ({
  movies: movies || [],
  error,
});
const mapRefetchToProps = (refetch) => ({ refetch });
const ExampleConn = movieFetcher(mapStateToProps, mapRefetchToProps)(
  Example,
  Loading,
);
const App = () => h('div', [h(ExampleConn, { hi: 'there' })]);

const r = () => render(h(App), document.getElementById('app'));
r();
setTimeout(() => {
  r();
}, 3000);
