const { render } = require('react-dom');
const h = require('react-hyperscript');
const { call } = require('cosed');

const createFetcher = require('../dist/index');

function* fetchMovies(props) {
  console.log(props);
  const resp = yield call(window.fetch, 'https://endpoints.uncaughtexception.wtf/9b45d01b5c3447539b0bfca393b3305d');
  const json = yield call([resp, 'json']);
  const movies = json.movies;
  return movies;
}
const Example = ({ movies = [], refetch }) => {
  return h('div', [
    h('a', { href: '#', onClick: () => { refetch() } }, 'refetch'),
    h('div', movies.map((movie) => h('div', { key: movie }, movie))),
  ]);
};

const movieFetcher = createFetcher(fetchMovies);
const mapStateToProps = (movies) => ({ movies });
const mapRefetchToProps = (refetch) => ({ refetch });
const ExampleConn = movieFetcher(mapStateToProps, mapRefetchToProps)(Example, () => h('div', 'LOADING'));
const App = () => h('div', [
  h(ExampleConn, { hi: 'there' }),
]);

const r = () => render(h(App), document.getElementById('app'));
r();
setTimeout(() => { r(); }, 3000);
