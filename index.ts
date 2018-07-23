import * as React from 'react';
import { task, TaskFn } from 'cosed';

type Refetch = (...args: any[]) => void;
type FetchFn = (...args: any[]) => IterableIterator<any>;
export type MapStateToProps = (data: any, error: any) => { [key: string]: any };
export type MapRefetchToProps = (refetch: Refetch) => { [key: string]: any };
type ReactFn = (...args: any[]) => React.ReactElement<any>;
interface CancellablePromise {
  promise: Promise<any>;
  cancel: () => void;
}
const defaultMapStateToProps = (data: any, error: any) => ({ data, error });
const defaultMapRefetchToProps = (refetch: Refetch) => ({ refetch });

export default function createFetcher(fn: FetchFn, taskRunner: TaskFn = task) {
  return (
    mapStateToProps?: MapStateToProps,
    mapRefetchToProps?: MapRefetchToProps,
  ) => {
    return (component: ReactFn, loader?: ReactFn) => {
      return (props: { [key: string]: any }) =>
        React.createElement(
          FetchLoader,
          {
            loader,
            mapStateToProps,
            mapRefetchToProps,
            fetch: (extra: any) => makeCancelable(taskRunner(fn, props, extra)),
            component,
            props,
          },
          null,
        );
    };
  };
}

export const makeCancelable = (promise: Promise<any>): CancellablePromise => {
  let hasCanceled_ = false;

  const wrappedPromise = new Promise((resolve, reject) => {
    promise.then(
      (val) => (hasCanceled_ ? reject({ isCanceled: true }) : resolve(val)),
      (error) => (hasCanceled_ ? reject({ isCanceled: true }) : reject(error)),
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
  loader?: ReactFn;
  mapStateToProps?: MapStateToProps;
  mapRefetchToProps?: MapRefetchToProps;
  fetch: (...args: any[]) => CancellablePromise;
  component: ReactFn;
  props: { [key: string]: any };
}

interface IState {
  data: any;
  error: any;
  extra: any;
  isLoading: boolean;
  shouldFetch: boolean;
}

export class FetchLoader extends React.Component<IProps, IState> {
  fetcher: CancellablePromise = {
    promise: Promise.resolve(),
    cancel: () => {},
  };

  state: IState = {
    data: undefined,
    error: undefined,
    extra: undefined,
    isLoading: false,
    shouldFetch: true,
  };

  static defaultProps: IProps = {
    loader: null,
    component: null,
    mapStateToProps: defaultMapStateToProps,
    mapRefetchToProps: defaultMapRefetchToProps,
    fetch: () => makeCancelable(Promise.resolve()),
    props: {},
  };

  componentDidMount() {
    this.fetch();
  }

  componentDidUpdate() {
    this.fetch();
  }

  componentWillUnmount() {
    this.fetcher.cancel();
  }

  _fetch = () => {
    const { extra } = this.state;
    const fetchFn = this.props.fetch;
    this.setState(() => ({ isLoading: true }));

    this.fetcher = fetchFn(extra);
    this.fetcher.promise
      .then((data: any) => {
        this.setState(() => ({
          shouldFetch: false,
          data,
          error: undefined,
          extra: undefined,
          isLoading: false,
        }));
      })
      .catch((error) => {
        if (error.isCanceled) {
          return;
        }

        this.setState(() => ({
          shouldFetch: false,
          data: undefined,
          error,
          extra: undefined,
          isLoading: false,
        }));
      });
  }

  shouldFetch = () => {
    const { isLoading, shouldFetch } = this.state;
    return !isLoading && shouldFetch;
  }

  fetch = () => {
    if (!this.shouldFetch()) {
      return;
    }

    this._fetch();
  };

  refetch = (extra: any) => {
    this.setState(() => ({
      shouldFetch: true,
      extra,
    }));
  };

  render() {
    const {
      loader,
      component,
      mapStateToProps,
      mapRefetchToProps,
      props,
    } = this.props;
    const { isLoading, data, error } = this.state;

    if (isLoading && loader) {
      return React.createElement(loader, null, null);
    }

    const mapState = mapStateToProps(data, error);
    const mapRefetch = mapRefetchToProps(this.refetch);
    return React.createElement(
      component,
      { ...props, ...mapState, ...mapRefetch },
      null,
    );
  }
}
