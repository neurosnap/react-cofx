import { Component, createElement } from 'react';
import { task } from 'cosed';

type Refetch = () => void;
type FetchFn = Function | Generator;
type MapStateToProps = (data: any) => { [key: string]: any };
type MapRefetchToProps = (refetch: Refetch) => { [key: string]: any };
type ReactFn = () => React.ReactElement<any>;
const defaultMapStateToProps = (data: any) => ({ data });
const defaultMapRefetchToProps = () => ({});

function createFetcher(fn: FetchFn) {
  return (mapStateToProps: MapStateToProps, mapRefetchToProps: MapRefetchToProps) => {
    return (component: ReactFn, loader: ReactFn) => {
      return (props: { [key: string]: any }) => createElement(FetchLoader, {
        loader,
        mapStateToProps,
        mapRefetchToProps,
        fetch: () => task(fn, props),
        component,
      }, null);
    };
  };
}

interface IProps {
  loader: ReactFn;
  mapStateToProps: MapStateToProps;
  mapRefetchToProps: MapRefetchToProps;
  fetch: () => Promise<any>;
  component: ReactFn;
}

interface IState {
  isLoading: boolean;
  data: any;
}

class FetchLoader extends Component<IProps, IState> {
  state: IState = {
    isLoading: false,
    data: undefined,
  }

  static defaultProps: IProps = {
    loader: null,
    mapStateToProps: defaultMapStateToProps,
    mapRefetchToProps: defaultMapRefetchToProps,
    fetch: () => Promise.resolve(),
    component: null,
  }

  componentDidMount() {
    this.fetch();
  }

  componentDidUpdate() {
    this.fetch();
  }

  fetch = () => {
    const shouldFetch = !this.state.isLoading && !this.state.data;
    if (shouldFetch) {
      console.log('FETCHING');
      this.setState(() => ({ isLoading: true }));
      this.props.fetch().then((data: any) => {
        this.setState(() => ({ data, isLoading: false }));
      });
    } else {
      console.log('NOT FETCHING');
    }
  }

  refetch = () => {
    this.setState(() => ({
      data: undefined,
      isLoading: false,
    }));
  }

  render() {
    const { loader, component, mapStateToProps, mapRefetchToProps } = this.props;
    const { isLoading, data } = this.state;

    if (isLoading) {
      if (!loader) return null;
      return createElement(loader, null, null);
    };

    const mapState = mapStateToProps(data);
    const mapRefetch = mapRefetchToProps(this.refetch);
    return createElement(component, { ...mapState, ...mapRefetch }, null);
  }
}

module.exports = createFetcher;
