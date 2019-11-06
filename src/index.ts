// It is a replacement of boilerplate code to define redux thunk actions
// Every Routine has three actions: REQUEST, SUCCESS and FAILURE
// To get the action type name of each action, call `routine.REQUEST/SUCCESS/FAILURE`
// To dispatch an action, call `routine.request/success/failure` with payload
// This is heavily inspired by https://github.com/afitiskin/redux-saga-routines
import { createAction, Action } from "redux-actions";

export class ReduxThunkRoutine<P, E = Error> {
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

export function createThunkRoutine<P, E>(
  actionType: string
): ReduxThunkRoutine<P, E> {
  return new ReduxThunkRoutine(actionType);
}

export function getTypedPayload<P>(
  routine: ReduxThunkRoutine<P, Error>,
  action: Action<any>
): P {
  const payload: P = action.payload;
  return payload;
}

export function getTypedError<E>(
  routine: ReduxThunkRoutine<any, E>,
  action: any
): E {
  const error: E = action.payload;
  return error;
}
