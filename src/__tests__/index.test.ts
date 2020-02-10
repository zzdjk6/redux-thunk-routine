import {
  createThunkRoutine,
  createThunk,
  dispatchRoutine,
  getTypedError,
  getTypedPayload,
  ReduxThunkRoutine
} from '../index';

test('Routine has correct action name', () => {
  const routine = createThunkRoutine('TEST/MOCK_ROUTINE');
  expect(routine.REQUEST).toBe('TEST/MOCK_ROUTINE/REQUEST');
  expect(routine.SUCCESS).toBe('TEST/MOCK_ROUTINE/SUCCESS');
  expect(routine.FAILURE).toBe('TEST/MOCK_ROUTINE/FAILURE');
});

test('Routine dispatches correct payload', () => {
  const routine: ReduxThunkRoutine<number, Error> = createThunkRoutine('TEST/MOCK_ROUTINE');

  expect(routine.request({ requestPayload: 'anything' })).toEqual({
    type: routine.REQUEST,
    payload: { requestPayload: 'anything' }
  });

  expect(routine.success(123)).toEqual({
    type: routine.SUCCESS,
    payload: 123
  });

  const error = new Error('I am an error');
  expect(routine.failure(error)).toEqual({
    type: routine.FAILURE,
    payload: error,
    error: true
  });
});

test('Get typed payload for success action', () => {
  const routine: ReduxThunkRoutine<number> = createThunkRoutine('TEST/MOCK_ROUTINE');
  const action = routine.success(123);
  expect(getTypedPayload(routine, action)).toEqual(123);
  expect(routine.getSuccessPayload(action)).toEqual(123);

  const mismatchingRoutine: ReduxThunkRoutine<string> = createThunkRoutine('TEST/MIS_MATCHED_ROUTINE');
  expect(() => mismatchingRoutine.getSuccessPayload(action)).toThrow();
});

test('Get typed payload for request action', () => {
  const routine: ReduxThunkRoutine<number, Error> = createThunkRoutine(
    'TEST/MOCK_ROUTINE'
  );
  const action = routine.request({ label: 'hello', value: 321 });
  expect(routine.getRequestPayload(action)).toEqual({ label: 'hello', value: 321 });

  const mismatchingRoutine: ReduxThunkRoutine<string> = createThunkRoutine('TEST/MIS_MATCHED_ROUTINE');
  expect(() => mismatchingRoutine.getRequestPayload(action)).toThrow();
});

test('Get typed payload for failure action', () => {
  class CustomError extends Error {
    name = 'CustomError';
  }
  const routine: ReduxThunkRoutine<number, CustomError> = createThunkRoutine('TEST/MOCK_ROUTINE');
  const action = routine.failure(new CustomError());
  expect(getTypedError(routine, action)).toHaveProperty('name', 'CustomError');
  expect(routine.getFailurePayload(action)).toHaveProperty('name', 'CustomError');

  const mismatchingRoutine: ReduxThunkRoutine<string> = createThunkRoutine('TEST/MIS_MATCHED_ROUTINE');
  expect(() => mismatchingRoutine.getFailurePayload(action)).toThrow();
});

test('Action creators are correctly bound', () => {
  const callActionCreatorWithPayload = (actionCreator: any, payload: any) => {
    return actionCreator(payload);
  };

  const routine: ReduxThunkRoutine<number> = createThunkRoutine('TEST/MOCK_ROUTINE');

  expect(callActionCreatorWithPayload(routine.request, 1)).toEqual({
    type: routine.REQUEST,
    payload: 1
  });

  expect(callActionCreatorWithPayload(routine.success, 2)).toEqual({
    type: routine.SUCCESS,
    payload: 2
  });

  const error = new Error('I am an Error');
  expect(callActionCreatorWithPayload(routine.failure, error)).toEqual({
    type: routine.FAILURE,
    error: true,
    payload: error
  });
});

describe('Helper - Dispatch routine', () => {
  const routine: ReduxThunkRoutine<number> = createThunkRoutine('TEST/MOCK_ROUTINE');

  let dispatchedActions: any;
  let dispatch: any;

  beforeEach(() => {
    dispatchedActions = [];
    dispatch = jest.fn(action => dispatchedActions.push(action));
  });

  test('Plain executor success', async () => {
    await dispatchRoutine(dispatch, routine, async () => {
      return 123;
    });
    expect(dispatch.mock.calls.length).toBe(2);
    expect(dispatchedActions).toEqual([routine.request(), routine.success(123)]);
  });

  test('Plain executor failure', async () => {
    expect.assertions(2);

    const error = new Error('I am an Error');
    try {
      await dispatchRoutine(dispatch, routine, async () => {
        throw error;
      });
    } catch (e) {}

    expect(dispatch.mock.calls.length).toBe(2);
    expect(dispatchedActions).toEqual([routine.request(), routine.failure(error)]);
  });

  test('Composed executor success - 1', async () => {
    await dispatchRoutine(dispatch, routine, {
      getSuccessPayload: async () => 223
    });
    expect(dispatch.mock.calls.length).toBe(2);
    expect(dispatchedActions).toEqual([routine.request(), routine.success(223)]);
  });

  test('Composed executor success - 2', async () => {
    const requestPayload = Symbol();
    await dispatchRoutine(dispatch, routine, {
      getRequestPayload: () => requestPayload,
      getSuccessPayload: async () => 223
    });
    expect(dispatch.mock.calls.length).toBe(2);
    expect(dispatchedActions).toEqual([routine.request(requestPayload), routine.success(223)]);
  });

  test('Composed executor failure', async () => {
    expect.assertions(2);

    const error = new Error('I am an Error');
    const requestPayload = Symbol();

    try {
      await dispatchRoutine(dispatch, routine, {
        getRequestPayload: () => requestPayload,
        getSuccessPayload: async () => {
          throw new Error('raw error!');
        },
        getFailurePayload: () => error
      });
    } catch (e) {}

    expect(dispatch.mock.calls.length).toBe(2);
    expect(dispatchedActions).toEqual([routine.request(requestPayload), routine.failure(error)]);
  });
});

describe('Helper - Create Thunk Without Args', () => {
  const routine: ReduxThunkRoutine<number> = createThunkRoutine('TEST/MOCK_ROUTINE');

  let dispatchedActions: any;
  let dispatch: any;

  beforeEach(() => {
    dispatchedActions = [];
    dispatch = jest.fn(async action => {
      dispatchedActions.push(action);
      return action;
    });
  });

  test('without overwrite - success', async () => {
    expect.assertions(2);

    const thunk = createThunk(routine, async () => {
      return await 1;
    });

    await thunk()(dispatch);

    expect(dispatch.mock.calls.length).toBe(2);
    expect(dispatchedActions).toEqual([routine.request(), routine.success(1)]);
  });

  test('without overwrite - failure', async () => {
    expect.assertions(3);

    const error = new Error('I am an Error');
    const thunk = createThunk(routine, async () => {
      throw error;
    });

    try {
      await thunk()(dispatch);
    } catch (e) {
      expect(e).toBe(error);
    }

    expect(dispatch.mock.calls.length).toBe(2);
    expect(dispatchedActions).toEqual([routine.request(), routine.failure(error)]);
  });

  test('overwrite request payload', async () => {
    expect.assertions(2);

    const thunk = createThunk(
      routine,
      async () => {
        return await 1;
      },
      {
        getRequestPayload: async () => {
          return 'Overwritten Request Payload';
        }
      }
    );

    await thunk()(dispatch);

    expect(dispatch.mock.calls.length).toBe(2);
    expect(dispatchedActions).toEqual([routine.request('Overwritten Request Payload'), routine.success(1)]);
  });

  test('overwrite failure payload', async () => {
    expect.assertions(3);

    const error1 = new Error('I am an Error');
    const error2 = new Error('I am another Error');
    const thunk = createThunk(
      routine,
      async () => {
        throw error1;
      },
      {
        getFailurePayload: async (e: Error) => error2
      }
    );

    try {
      await thunk()(dispatch);
    } catch (e) {
      expect(e).toBe(error2);
    }

    expect(dispatch.mock.calls.length).toBe(2);
    expect(dispatchedActions).toEqual([routine.request(), routine.failure(error2)]);
  });
});

describe('Helper - Create Thunk With Args', () => {
  const routine: ReduxThunkRoutine<string> = createThunkRoutine('TEST/MOCK_ROUTINE');

  let dispatchedActions: any;
  let dispatch: any;

  beforeEach(() => {
    dispatchedActions = [];
    dispatch = jest.fn(async action => {
      dispatchedActions.push(action);
      return action;
    });
  });

  test('without overwrite - success', async () => {
    expect.assertions(2);

    const thunk = createThunk(routine, async (str: string) => {
      return str + ' world';
    });

    await thunk('hello')(dispatch);

    expect(dispatch.mock.calls.length).toBe(2);
    expect(dispatchedActions).toEqual([routine.request('hello'), routine.success('hello world')]);
  });

  test('without overwrite - failure', async () => {
    expect.assertions(3);

    const error = new Error('I am an Error');
    const thunk = createThunk(routine, async (str: string) => {
      throw error;
    });

    try {
      await thunk('hello')(dispatch);
    } catch (e) {
      expect(e).toBe(error);
    }

    expect(dispatch.mock.calls.length).toBe(2);
    expect(dispatchedActions).toEqual([routine.request('hello'), routine.failure(error)]);
  });

  test('overwrite request payload', async () => {
    expect.assertions(2);

    const thunk = createThunk(
      routine,
      async (str: string) => {
        return str + ' world';
      },
      {
        getRequestPayload: async (str: string) => {
          return {
            str
          };
        }
      }
    );

    await thunk('hello')(dispatch);

    expect(dispatch.mock.calls.length).toBe(2);
    expect(dispatchedActions).toEqual([routine.request({ str: 'hello' }), routine.success('hello world')]);
  });

  test('overwrite failure payload', async () => {
    expect.assertions(3);

    const error1 = new Error('I am an Error');
    const error2 = new Error('I am another Error');
    const thunk = createThunk(
      routine,
      async (str: string) => {
        throw error1;
      },
      {
        getFailurePayload: async (e: Error) => error2
      }
    );

    try {
      await thunk('hello')(dispatch);
    } catch (e) {
      expect(e).toBe(error2);
    }

    expect(dispatch.mock.calls.length).toBe(2);
    expect(dispatchedActions).toEqual([routine.request('hello'), routine.failure(error2)]);
  });
});
