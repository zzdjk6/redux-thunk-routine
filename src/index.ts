// It is a replacement of boilerplate code to define redux thunk actions
// Every Routine has three actions: REQUEST, SUCCESS and FAILURE
// To get the action type name of each action, call `routine.REQUEST/SUCCESS/FAILURE`
// To dispatch an action, call `routine.request/success/failure` with payload
// This is heavily inspired by https://github.com/afitiskin/redux-saga-routines
import { createAction, Action } from 'redux-actions';

// Types

export type ComposedExecutor<P, E extends Error> = {
  getRequestPayload?: () => any;
  getSuccessPayload: () => Promise<P>;
  getFailurePayload?: (error: Error) => E;
};

export type PlainExecutor<P> = () => Promise<P>;

export type Executor<P, E extends Error> = PlainExecutor<P> | ComposedExecutor<P, E>;

// Classes

export class ReduxThunkRoutine<P, E extends Error = Error> {
  readonly actionType: string;
  readonly REQUEST: string;
  readonly SUCCESS: string;
  readonly FAILURE: string;

  constructor(actionType: string) {
    this.actionType = actionType;
    this.REQUEST = `${this.actionType}/REQUEST`;
    this.SUCCESS = `${this.actionType}/SUCCESS`;
    this.FAILURE = `${this.actionType}/FAILURE`;
  }

  request = (payload?: any): Action<any> => {
    const actionCreator = createAction(this.REQUEST);
    return actionCreator(payload);
  };

  success = (payload: P): Action<P> => {
    const actionCreator = createAction(this.SUCCESS);
    return actionCreator(payload);
  };

  failure = (payload: E): Action<E> => {
    const actionCreator = createAction(this.FAILURE);
    return actionCreator(payload);
  };
}

// Helpers

export const dispatchRoutine = async <P, E extends Error>(
  dispatch: any,
  routine: ReduxThunkRoutine<P, E>,
  executor: Executor<P, E>
) => {
  const requestPayload =
    isComposedExecutor(executor) && executor.getRequestPayload ? executor.getRequestPayload() : undefined;
  await dispatch(routine.request(requestPayload));

  try {
    const payload = isPlainExecutor(executor) ? await executor() : await executor.getSuccessPayload();
    return await dispatch(routine.success(payload));
  } catch (error) {
    const failuerPayload =
      isComposedExecutor(executor) && executor.getFailurePayload ? executor.getFailurePayload(error) : error;
    await dispatch(routine.failure(failuerPayload));
    throw failuerPayload;
  }
};

const isComposedExecutor = <P, E extends Error>(executor: Executor<P, E>): executor is ComposedExecutor<P, E> => {
  return typeof executor === 'object';
};

const isPlainExecutor = <P, E extends Error>(executor: Executor<P, E>): executor is PlainExecutor<P> => {
  return typeof executor === 'function';
};

export const createThunkRoutine = <P, E extends Error = Error>(actionType: string): ReduxThunkRoutine<P, E> => {
  return new ReduxThunkRoutine(actionType);
};

export const getTypedPayload = <P>(routine: ReduxThunkRoutine<P>, action: Action<any>): P => {
  const payload: P = action.payload;
  return payload;
};

export const getTypedError = <E extends Error = Error>(routine: ReduxThunkRoutine<any, E>, action: any): E => {
  const error: E = action.payload;
  return error;
};
