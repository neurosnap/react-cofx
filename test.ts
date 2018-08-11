import * as h from 'react-hyperscript';
import * as Enzyme from 'enzyme';
import * as Adapter from 'enzyme-adapter-react-16';

import { FetchLoader, makeCancelable } from './index';

const mount = Enzyme.mount;
// const shallow = Enzyme.shallow;
Enzyme.configure({ adapter: new Adapter() });

describe('FetchLoader', () => {
  describe('when mounting the component and waiting for promise to fulfil', () => {
    describe('when the promise succeeds', () => {
      it('should render the text', (done) => {
        const tree = mount(
          h(FetchLoader, {
            component: ({ data }: any) => h('div', data),
            fetch: () => makeCancelable(Promise.resolve('some data')),
          }),
        );

        setTimeout(() => {
          expect(tree.text()).toEqual('some data');
          expect(tree.state()).toEqual({
            data: 'some data',
            error: undefined,
            isLoading: false,
            extra: undefined,
            shouldFetch: false,
          });
          done();
        }, 0);
      });

      it('should use mapStateToProps', () => {
        const tree = mount(
          h(FetchLoader, {
            component: ({ someData }: any) => h('div', someData),
            fetch: () => makeCancelable(Promise.resolve('some data')),
            mapStateToProps: (d) => ({ someData: d }),
          }),
        );

        return new Promise((resolve) => {
          setTimeout(() => {
            try {
              expect(tree.text()).toEqual('some data');
            } finally {
              resolve();
            }
          }, 0);
        });
      });

      /* it('should use mapRefetchToProps', () => {
        expect.assertions(1);
        const tree = mount(h(FetchLoader, {
          component: ({ onClick }: any) => h('div', { onClick }, 'click me'),
          fetch: () => makeCancelable(Promise.resolve('some data')),
          mapRefetchToProps: (onClick) => ({ onClick }),
        }));

        return new Promise((resolve, reject) => {
          setTimeout(() => {
            try {
              tree.simulate('click');
              expect(tree.state()).toEqual({
                data: undefined,
                error: undefined,
                isLoading: true,
              });
            } catch (err) {
              reject(err);
            } finally  {
              resolve();
            }
          }, 0);
        });
      }); */
    });

    describe('when the promise fails', () => {
      it('should return error data', (done) => {
        const tree = mount(
          h(FetchLoader, {
            component: ({ data, error }: any) => {
              if (error) return h('div', error);
              return h('div', data);
            },
            fetch: () => makeCancelable(Promise.reject('some error')),
          }),
        );

        setTimeout(() => {
          expect(tree.text()).toEqual('some error');
          expect(tree.state()).toEqual({
            data: undefined,
            error: 'some error',
            isLoading: false,
            extra: undefined,
            shouldFetch: false,
          });
          done();
        }, 0);
      });
    });
  });

  describe('when component is mounted', () => {
    describe('when loader component was not passed', () => {});
    describe('when loader prop is passed', () => {
      it('should render loading text', () => {
        const tree = mount(
          h(FetchLoader, {
            component: ({ data }: any) => h('div', data),
            fetch: () => makeCancelable(Promise.resolve('some data')),
            loader: () => h('div', 'loading'),
          }),
        );

        expect(tree.text()).toEqual('loading');
        expect(tree.state()).toEqual({
          data: undefined,
          error: undefined,
          isLoading: true,
          extra: undefined,
          shouldFetch: true,
        });
      });
    });
  });

  describe('when component is rendered multiple times', () => {
    it('should cache the results of the async function', (done) => {
      const fn = jest.fn();
      const tree = mount(
        h(FetchLoader, {
          component: ({ data }: any) => h('div', data),
          fetch: () =>
            makeCancelable(
              new Promise((resolve) => {
                fn();
                resolve();
              }),
            ),
        }),
      );

      tree.update();

      setTimeout(() => {
        tree.update();
      }, 0);

      setTimeout(() => {
        tree.update();
      }, 100);

      setTimeout(() => {
        tree.update();
      }, 200);

      setTimeout(() => {
        expect(fn.mock.calls.length).toBe(1);
        done();
      }, 300);
    });
  });

  describe('when the component is unmounted', () => {
    it('should not throw an error', (done) => {
      const original = console.error;
      const error = jest.fn();
      console.error = error;

      const tree = mount(
        h(FetchLoader, {
          component: ({ data }: any) => h('div', data),
          fetch: () =>
            makeCancelable(
              new Promise((resolve) => {
                setTimeout(() => {
                  resolve('done!');
                }, 50);
              }),
            ),
        }),
      );

      tree.unmount();

      setTimeout(() => {
        expect(error.mock.calls.length).toBe(0);
        (console.error as any).mockClear();
        console.error = original;
        done();
      }, 100);
    });
  });
});
