import * as React from 'react';
import { task, TaskFn } from 'cosed';

type Refetch = () => void;
type FetchFn = () => IterableIterator<any>;
export type MapStateToProps = (data: any, error: any) => { [key: string]: any };
export type MapRefetchToProps = (refetch: Refetch) => { [key: string]: any };
type ReactFn = (...args: any[]) => React.ReactElement<any>;
interface CancellablePromise {
  promise: Promise<any>;
  cancel: () => void;
}
const defaultMapStateToProps = (data: any, error: any) => ({ data, error });
const defaultMapRefetchToProps = () => ({});

export default function createFetcher(fn: FetchFn, taskRunner: TaskFn = task) {
  return (mapStateToProps?: MapStateToProps, mapRefetchToProps?: MapRefetchToProps) => {
    return (component: ReactFn, loader?: ReactFn) => {
      return (props: { [key: string]: any }) => React.createElement(FetchLoader, {
        loader,
        mapStateToProps,
        mapRefetchToProps,
        fetch: () => makeCancelable(taskRunner(fn, props)),
        component,
      }, null);
    };
  };
}

const makeCancelable = (promise: Promise<any>): CancellablePromise => {
  let hasCanceled_ = false;

  const wrappedPromise = new Promise((resolve, reject) => {
    promise.then(
      (val) => hasCanceled_ ? reject({ isCanceled: true }) : resolve(val),
      (error) => hasCanceled_ ? reject({ isCanceled: true }) : reject(error)
    );
  });

  return {
    promise: wrappedPromise,
    cancel() {
      hasCanceled_ = true;
    },
  };
};

interface IProps {
  loader: ReactFn;
  mapStateToProps: MapStateToProps;
  mapRefetchToProps: MapRefetchToProps;
  fetch: () => CancellablePromise;
  component: ReactFn;
}

interface IState {
  isLoading: boolean;
  data: any;
  error: any;
}

class FetchLoader extends React.Component<IProps, IState> {
  fetcher: CancellablePromise = {
    promise: Promise.resolve(),
    cancel: () => {},
  };

  state: IState = {
    isLoading: false,
    data: undefined,
    error: undefined,
  }

  static defaultProps: IProps = {
    loader: null,
    component: null,
    mapStateToProps: defaultMapStateToProps,
    mapRefetchToProps: defaultMapRefetchToProps,
    fetch: () => makeCancelable(Promise.resolve()),
  }

  componentDidMount() {
    this.fetch();
  }

  componentDidUpdate() {
    this.fetch();
  }

  componentWillUnmount() {
    this.fetcher.cancel();
  }

  fetch = () => {
    const { isLoading, data } = this.state;
    const fetchFn = this.props.fetch;
    const shouldFetch = !isLoading && typeof data === 'undefined';

    if (!shouldFetch) {
      return;
    }

    this.setState(() => ({ isLoading: true }));

    this.fetcher = fetchFn();
    this.fetcher
      .promise
      .then((value: any) => {
        const data = typeof value === 'undefined' ? null : value;
        this.setState(() => ({ data, error: undefined, isLoading: false }));
      })
      .catch((error) => {
        if (error.isCanceled) return;
        this.setState(() => ({ error, data: null, isLoading: false }))
      });
  }

  refetch = () => {
    this.setState(() => ({
      data: undefined,
      error: undefined,
      isLoading: false,
    }));
  }

  render() {
    const { loader, component, mapStateToProps, mapRefetchToProps } = this.props;
    const { isLoading, data, error } = this.state;

    if (isLoading) {
      if (!loader) return null;
      return React.createElement(loader, null, null);
    };

    const mapState = mapStateToProps(data, error);
    const mapRefetch = mapRefetchToProps(this.refetch);
    return React.createElement(component, { ...mapState, ...mapRefetch }, null);
  }
}
