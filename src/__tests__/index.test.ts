import { createThunkRoutine, dispatchRoutine, getTypedError, getTypedPayload, ReduxThunkRoutine } from '../index';

test('Routine has correct action name', () => {
  const routine = createThunkRoutine('TEST/MOCK_ROUTINE');
  expect(routine.REQUEST).toBe('TEST/MOCK_ROUTINE/REQUEST');
  expect(routine.SUCCESS).toBe('TEST/MOCK_ROUTINE/SUCCESS');
  expect(routine.FAILURE).toBe('TEST/MOCK_ROUTINE/FAILURE');
});

test('Routine dispatches correct payload', () => {
  const routine: ReduxThunkRoutine<number> = createThunkRoutine('TEST/MOCK_ROUTINE');

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

test('Get typed payload', () => {
  const routine: ReduxThunkRoutine<number> = createThunkRoutine('TEST/MOCK_ROUTINE');
  const action = routine.success(123);
  expect(getTypedPayload(routine, action)).toEqual(123);
  expect(routine.getSuccessPayload(action)).toEqual(123);

  const mismatchingRoutine: ReduxThunkRoutine<string> = createThunkRoutine('TEST/MIS_MATCHED_ROUTINE');
  expect(() => mismatchingRoutine.getSuccessPayload(action)).toThrow();
});

test('Get typed error', () => {
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

  test('Composed executor failuer', async () => {
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
