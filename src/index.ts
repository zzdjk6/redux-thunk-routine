// It is a replacement of boilerplate code to define redux thunk actions
// Every Routine has three actions: REQUEST, SUCCESS and FAILURE
// To get the action type name of each action, call `routine.REQUEST/SUCCESS/FAILURE`
// To dispatch an action, call `routine.request/success/failure` with payload
// This is heavily inspired by https://github.com/afitiskin/redux-saga-routines
import { Action, createAction } from 'redux-actions';
import { AbortablePromise } from 'simple-abortable-promise';

// Class

/**
 * A routine is an instance of this generic class
 */
export class ReduxThunkRoutine<TPayload, TError extends Error = Error> {
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
    this.routineType = routineType;
    this.REQUEST = `${this.routineType}/REQUEST`;
    this.SUCCESS = `${this.routineType}/SUCCESS`;
    this.FAILURE = `${this.routineType}/FAILURE`;

    // Deprecated
    this.actionType = routineType;
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
  success = (payload: TPayload): Action<TPayload> => {
    const actionCreator = createAction(this.SUCCESS);
    return actionCreator(payload);
  };

  /**
   * Action creator for failure action
   * @param payload
   */
  failure = (payload: TError): Action<TError> => {
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
  isSuccessAction = (action: Action<any>): action is Action<TPayload> => {
    return action.type === this.SUCCESS;
  };

  /**
   * Detect if a given action is the failure action of this routine
   * @param action
   */
  isFailureAction = (action: Action<any>): action is Action<TError> => {
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
  getSuccessPayload = (action: Action<any>): TPayload => {
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
  getFailurePayload = (action: Action<any>): TError => {
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
export const createThunkRoutine = <TPayload, TError extends Error = Error>(
  routineType: string
): ReduxThunkRoutine<TPayload, TError> => {
  return new ReduxThunkRoutine(routineType);
};

/**
 * Helper function to generate a thunk action creator from the given routine and executor function
 * @param routine
 * @param getSuccessPayload
 * @param options
 */
export const getThunkActionCreator = <TPayload, TError extends Error = Error, TArguments = void>(
  routine: ReduxThunkRoutine<TPayload, TError>,
  getSuccessPayload: (args: TArguments) => Promise<TPayload>,
  options?: {
    getRequestPayload?: (args: TArguments) => Promise<any>;
    getFailurePayload?: (error: Error) => Promise<TError>;
  }
) => {
  return (args: TArguments) => (dispatch: any): AbortablePromise<Action<TPayload>> => {
    const abortableRequestPayloadCreator = new AbortablePromise<any>(async resolve => {
      // Get request payload, default is `args`
      let requestPayload: any = args;
      if (options && options.getRequestPayload && typeof options.getRequestPayload === 'function') {
        requestPayload = await options.getRequestPayload(args);
      }
      resolve(requestPayload);
    });

    const abortableSuccessPayloadCreator = AbortablePromise.from(getSuccessPayload(args));

    const executionPromise = new AbortablePromise<Action<TPayload>>(async (resolve, reject, abortSignal) => {
      // Abort internal promises when abort from outside
      abortSignal.onabort = () => {
        const reason = executionPromise.abortReason;
        abortableRequestPayloadCreator.abort(reason);
        abortableSuccessPayloadCreator.abort(reason);
      };

      try {
        // Dispatch REQUEST action
        const requestPayload = await abortableRequestPayloadCreator;
        const requestAction = routine.request(requestPayload);
        await dispatch(requestAction);

        // Dispatch SUCCESS action
        const successPayload = await abortableSuccessPayloadCreator;
        const successAction = routine.success(successPayload);
        await dispatch(successAction);

        // Resolve
        resolve(successAction);
      } catch (error) {
        // Get failure payload, default is the caught `Error`
        let failurePayload = error;

        try {
          if (options && options.getFailurePayload && typeof options.getFailurePayload === 'function') {
            failurePayload = await options.getFailurePayload(error);
          }
        } catch {
          // Swallow the error throw by `getFailurePayload`
        }

        // Dispatch FAILURE action
        await dispatch(routine.failure(failurePayload));

        // Reject
        reject(failurePayload);
      }
    });

    return executionPromise;
  };
};

/**
 * @deprecated Use `getThunkActionCreator` instead
 * @param dispatch
 * @param routine
 * @param executor
 */
export const dispatchRoutine = async <TPayload, TError extends Error>(
  dispatch: any,
  routine: ReduxThunkRoutine<TPayload, TError>,
  executor: Executor<TPayload, TError>
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
const isComposedExecutor = <TPayload, TError extends Error>(
  executor: Executor<TPayload, TError>
): executor is ComposedExecutor<TPayload, TError> => {
  return typeof executor === 'object';
};

/**
 * @deprecated
 * @param executor
 */
const isPlainExecutor = <TPayload, TError extends Error>(
  executor: Executor<TPayload, TError>
): executor is PlainExecutor<TPayload> => {
  return typeof executor === 'function';
};

/**
 * @deprecated
 * Use routine.getSuccessPayload instead
 */
export const getTypedPayload = <TPayload>(routine: ReduxThunkRoutine<TPayload>, action: Action<any>): TPayload => {
  return action.payload as TPayload;
};

/**
 * @deprecated
 * Use routine.getFailurePayload instead
 */
export const getTypedError = <TError extends Error = Error>(
  routine: ReduxThunkRoutine<any, TError>,
  action: any
): TError => {
  return action.payload as TError;
};

// Types

/**
 * @deprecated
 */
export type ComposedExecutor<TPayload, TError extends Error = Error> = {
  getRequestPayload?: () => any;
  getSuccessPayload: () => Promise<TPayload>;
  getFailurePayload?: (error: Error) => TError;
};

/**
 * @deprecated
 */
export type PlainExecutor<TPayload> = () => Promise<TPayload>;

/**
 * @deprecated
 */
export type Executor<TPayload, TError extends Error = Error> =
  | PlainExecutor<TPayload>
  | ComposedExecutor<TPayload, TError>;
