const { Component, Children } = require('react');
const { render } = require('react-dom');
const h = require('react-hyperscript');
const { call, task } = require('sead');

const defaultMapStateToProps = (data) => ({ data });

function createFetcher(fn) {
  let cache = undefined;
  const read = (...args) => {
    if (cache) {
      console.log('CACHE HIT');
      return cache;
    }

    console.log('CACHE MISS');
    throw task(fn.apply(this, args))
      .then((val) => { cache = val; });
  };

  return (stateFn = defaultMapStateToProps) => {
    const WrapComponent = ({ component, children, ...props }) => {
      const data = read(props);
      const compProps = stateFn(data);
      return h(component, { children, ...props, ...compProps });
    };

    return (component, loader) => {
      return (props) => h(FetchLoader, { loader }, [
        h(WrapComponent, { ...props, component }),
      ]);
    };
  };
}

class FetchLoader extends Component {
  state = {
    isLoading: false,
  }

  static defaultProps = {
    loader: null,
  }

  componentDidCatch(error) {
    this.setState(() => {
      return { isLoading: true };
    });

    error.then(() => {
      this.setState(() => {
        return { isLoading: false };
      });
    });
  }

  render() {
    const { children, loader } = this.props;
    const { isLoading } = this.state;

    if (isLoading) {
      return loader;
    };

    return h('div', Children.map(children, (child) => child));
  }
}

/*
 * USAGE
 */

function* fetchMovies(props) {
  console.log(props);
  const resp = yield call(window.fetch, 'http://httpbin.org/get');
  const json = yield call([resp, 'json']);
  console.log(json);
  return ["one", "two", "three"];
}
const Example = ({ movies = [] } = {}) => {
  return h('div',
    movies.map((movie) => h('div', { key: movie }, movie)),
  );
};
const movieFetcher = createFetcher(fetchMovies);
const mapStateToProps = (movies) => ({ movies });
const ExampleConn = movieFetcher(mapStateToProps)(Example);
const App = () => h('div', [
  h(ExampleConn),
]);

const r = () => render(h(App), document.getElementById('app'));
r();
setTimeout(() => { r(); }, 3000);
