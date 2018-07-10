const { Component, Children, cloneElement } = require('react');
const { render } = require('react-dom');
const h = require('react-hyperscript');
const { call, task } = require('sead');

const defaultMapStateToProps = (data) => ({ data });
const defaultMapRefetchToProps = (refetch) => ({});

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

  const bust = () => {
    console.log('CACHE BUSTED');
    cache = undefined;
  };

  return (mapStateToProps = defaultMapStateToProps, mapRefetchToProps) => {
    const WrapComponent = ({ component, children, ...props }) => {
      const data = read(props);
      const compProps = mapStateToProps(data);
      return h(component, { children, ...props, ...compProps });
    };

    return (component, loader) => {
      return (props) => h(FetchLoader, { loader, bust, mapRefetchToProps }, [
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
    bust: () => {},
    mapRefetchToProps: defaultMapRefetchToProps,
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

  refetch = () => {
    this.props.bust();
    this.setState({ isLoading: false });
  }

  render() {
    const { children, loader } = this.props;
    const { isLoading } = this.state;

    if (isLoading) {
      return loader;
    };

    const compProps = mapRefetchToProps(this.refetch);
    const mapChild = (child) => cloneElement(child, { ...compProps });
    return h('div', Children.map(children, mapChild));
  }
}

/*
 * USAGE
 */

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
const ExampleConn = movieFetcher(mapStateToProps, mapRefetchToProps)(Example);
const App = () => h('div', [
  h(ExampleConn),
]);

const r = () => render(h(App), document.getElementById('app'));
r();
setTimeout(() => { r(); }, 3000);
