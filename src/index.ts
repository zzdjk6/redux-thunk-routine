// It is a replacement of boilerplate code to define redux thunk actions
// Every Routine has three actions: REQUEST, SUCCESS and FAILURE
// To get the action type name of each action, call `routine.REQUEST/SUCCESS/FAILURE`
// To dispatch an action, call `routine.request/success/failure` with payload
// This is heavily inspired by https://github.com/afitiskin/redux-saga-routines
import { Action, createAction } from 'redux-actions';

// Class

/**
 * A routine is an instance of this generic class
 */
export class ReduxThunkRoutine<PAYLOAD, ERROR extends Error = Error> {
  /**
   * The type of routine, used as prefix of generated actions
   */
  readonly routineType: string;

  /**
   * The type of request action, formatted as `${routineType}/REQUEST`
   */
  readonly REQUEST: string;

  /**
   * The type of success action, formatted as `${routineType}/SUCCESS`
   */
  readonly SUCCESS: string;

  /**
   * The type of failure action, formatted as `${routineType}/FAILURE`
   */
  readonly FAILURE: string;

  /**
   * @deprecated
   * Use routineType instead
   */
  readonly actionType: string;

  constructor(routineType: string) {
    this.actionType = routineType;
    this.routineType = routineType;
    this.REQUEST = `${this.routineType}/REQUEST`;
    this.SUCCESS = `${this.routineType}/SUCCESS`;
    this.FAILURE = `${this.routineType}/FAILURE`;
  }

  /**
   * Action creator for request action
   * @param payload
   */
  request = (payload?: any): Action<any> => {
    const actionCreator = createAction(this.REQUEST);
    return actionCreator(payload);
  };

  /**
   * Action creator for success action
   * @param payload
   */
  success = (payload: PAYLOAD): Action<PAYLOAD> => {
    const actionCreator = createAction(this.SUCCESS);
    return actionCreator(payload);
  };

  /**
   * Action creator for failure action
   * @param payload
   */
  failure = (payload: ERROR): Action<ERROR> => {
    const actionCreator = createAction(this.FAILURE);
    return actionCreator(payload);
  };

  /**
   * Detect if a given action is the request action of this routine
   * @param action
   */
  isRequestAction = (action: Action<any>): action is Action<any> => {
    return action.type === this.REQUEST;
  };

  /**
   * Detect if a given action is the success action of this routine
   * @param action
   */
  isSuccessAction = (action: Action<any>): action is Action<PAYLOAD> => {
    return action.type === this.SUCCESS;
  };

  /**
   * Detect if a given action is the failure action of this routine
   * @param action
   */
  isFailureAction = (action: Action<any>): action is Action<ERROR> => {
    return action.type === this.FAILURE;
  };

  /**
   * Get typed request payload from a given action, throw TypeError if the action does not match
   * @param action
   * @throws TypeError
   */
  getRequestPayload = (action: Action<any>): any => {
    if (!this.isRequestAction(action)) {
      throw new TypeError();
    }

    return action.payload;
  };

  /**
   * Get typed success payload from a given action, throw TypeError if the action does not match
   * @param action
   * @throws TypeError
   */
  getSuccessPayload = (action: Action<any>): PAYLOAD => {
    if (!this.isSuccessAction(action)) {
      throw new TypeError();
    }

    return action.payload;
  };

  /**
   * Get typed failure payload from a given action, throw TypeError if the action does not match
   * @param action
   * @throws TypeError
   */
  getFailurePayload = (action: Action<any>): ERROR => {
    if (!this.isFailureAction(action)) {
      throw new TypeError();
    }

    return action.payload;
  };
}

// Helpers

/**
 * Helper function to create a routine
 * @param routineType
 */
export const createThunkRoutine = <PAYLOAD, ERROR extends Error = Error>(
  routineType: string
): ReduxThunkRoutine<PAYLOAD, ERROR> => {
  return new ReduxThunkRoutine(routineType);
};

/**
 * Helper function to create a thunk from a given routine and executor functions
 * @param routine
 * @param getSuccessPayload
 * @param overwritePayload
 */
export const createThunk = <PAYLOAD, ERROR extends Error = Error, ARGUMENTS = void>(
  routine: ReduxThunkRoutine<PAYLOAD, ERROR>,
  getSuccessPayload: (args: ARGUMENTS) => Promise<PAYLOAD>,
  overwritePayload?: {
    getRequestPayload?: (args: ARGUMENTS) => Promise<any>;
    getFailurePayload?: (error: Error) => Promise<ERROR>;
  }
) => {
  return (args: ARGUMENTS) => async (dispatch: any) => {
    // Get request payload, default is `args`
    let requestPayload: any = args;
    if (
      overwritePayload &&
      overwritePayload.getRequestPayload &&
      typeof overwritePayload.getRequestPayload === 'function'
    ) {
      requestPayload = await overwritePayload.getRequestPayload(args);
    }

    // Dispatch REQUEST action
    await dispatch(routine.request(requestPayload));

    try {
      // Get success payload
      const successPayload = await getSuccessPayload(args);

      // Dispatch SUCCESS action
      return await dispatch(routine.success(successPayload));
    } catch (error) {
      // Get failure payload, default is the caught `Error`
      let failurePayload = error;
      if (
        overwritePayload &&
        overwritePayload.getFailurePayload &&
        typeof overwritePayload.getFailurePayload === 'function'
      ) {
        failurePayload = await overwritePayload.getFailurePayload(error);
      }

      // Dispatch FAILURE action
      await dispatch(routine.failure(failurePayload));

      // Re-throw error
      throw failurePayload;
    }
  };
};

/**
 * @deprecated Use `createThunk` instead
 * @param dispatch
 * @param routine
 * @param executor
 */
export const dispatchRoutine = async <PAYLOAD, ERROR extends Error>(
  dispatch: any,
  routine: ReduxThunkRoutine<PAYLOAD, ERROR>,
  executor: Executor<PAYLOAD, ERROR>
) => {
  const requestPayload =
    isComposedExecutor(executor) && executor.getRequestPayload ? executor.getRequestPayload() : undefined;
  await dispatch(routine.request(requestPayload));

  try {
    const payload = isPlainExecutor(executor) ? await executor() : await executor.getSuccessPayload();
    return await dispatch(routine.success(payload));
  } catch (error) {
    const failurePayload =
      isComposedExecutor(executor) && executor.getFailurePayload ? executor.getFailurePayload(error) : error;
    await dispatch(routine.failure(failurePayload));
    throw failurePayload;
  }
};

/**
 * @deprecated
 * @param executor
 */
const isComposedExecutor = <PAYLOAD, ERROR extends Error>(
  executor: Executor<PAYLOAD, ERROR>
): executor is ComposedExecutor<PAYLOAD, ERROR> => {
  return typeof executor === 'object';
};

/**
 * @deprecated
 * @param executor
 */
const isPlainExecutor = <PAYLOAD, ERROR extends Error>(
  executor: Executor<PAYLOAD, ERROR>
): executor is PlainExecutor<PAYLOAD> => {
  return typeof executor === 'function';
};

/**
 * @deprecated
 * Use routine.getSuccessPayload instead
 */
export const getTypedPayload = <PAYLOAD>(routine: ReduxThunkRoutine<PAYLOAD>, action: Action<any>): PAYLOAD => {
  return action.payload as PAYLOAD;
};

/**
 * @deprecated
 * Use routine.getFailurePayload instead
 */
export const getTypedError = <ERROR extends Error = Error>(
  routine: ReduxThunkRoutine<any, ERROR>,
  action: any
): ERROR => {
  return action.payload as ERROR;
};

// Types

/**
 * @deprecated
 */
export type ComposedExecutor<PAYLOAD, ERROR extends Error = Error> = {
  getRequestPayload?: () => any;
  getSuccessPayload: () => Promise<PAYLOAD>;
  getFailurePayload?: (error: Error) => ERROR;
};

/**
 * @deprecated
 */
export type PlainExecutor<PAYLOAD> = () => Promise<PAYLOAD>;

/**
 * @deprecated
 */
export type Executor<PAYLOAD, ERROR extends Error = Error> = PlainExecutor<PAYLOAD> | ComposedExecutor<PAYLOAD, ERROR>;
