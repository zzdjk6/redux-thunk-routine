import { Action } from 'redux-actions';
/**
 * A routine is an instance of this generic class
 */
export declare class ReduxThunkRoutine<TPayload, TError extends Error = Error> {
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
    constructor(routineType: string);
    /**
     * Action creator for request action
     * @param payload
     */
    request: (payload?: any) => Action<any>;
    /**
     * Action creator for success action
     * @param payload
     */
    success: (payload: TPayload) => Action<TPayload>;
    /**
     * Action creator for failure action
     * @param payload
     */
    failure: (payload: TError) => Action<TError>;
    /**
     * Detect if a given action is the request action of this routine
     * @param action
     */
    isRequestAction: (action: Action<any>) => action is Action<any>;
    /**
     * Detect if a given action is the success action of this routine
     * @param action
     */
    isSuccessAction: (action: Action<any>) => action is Action<TPayload>;
    /**
     * Detect if a given action is the failure action of this routine
     * @param action
     */
    isFailureAction: (action: Action<any>) => action is Action<TError>;
    /**
     * Get typed request payload from a given action, throw TypeError if the action does not match
     * @param action
     * @throws TypeError
     */
    getRequestPayload: (action: Action<any>) => any;
    /**
     * Get typed success payload from a given action, throw TypeError if the action does not match
     * @param action
     * @throws TypeError
     */
    getSuccessPayload: (action: Action<any>) => TPayload;
    /**
     * Get typed failure payload from a given action, throw TypeError if the action does not match
     * @param action
     * @throws TypeError
     */
    getFailurePayload: (action: Action<any>) => TError;
}
/**
 * Helper function to create a routine
 * @param routineType
 */
export declare const createThunkRoutine: <TPayload, TError extends Error = Error>(routineType: string) => ReduxThunkRoutine<TPayload, TError>;
/**
 * Helper function to generate a thunk action creator from the given routine and executor function
 * @param routine
 * @param getSuccessPayload
 * @param options
 */
export declare const getThunkActionCreator: <TPayload, TError extends Error = Error, TArguments = void>(routine: ReduxThunkRoutine<TPayload, TError>, getSuccessPayload: (args: TArguments) => Promise<TPayload>, options?: {
    getRequestPayload?: ((args: TArguments) => Promise<any>) | undefined;
    getFailurePayload?: ((error: Error) => Promise<TError>) | undefined;
} | undefined) => (args: TArguments) => (dispatch: any) => Promise<Action<TPayload>>;
/**
 * @deprecated Use `getThunkActionCreator` instead
 * @param dispatch
 * @param routine
 * @param executor
 */
export declare const dispatchRoutine: <TPayload, TError extends Error>(dispatch: any, routine: ReduxThunkRoutine<TPayload, TError>, executor: Executor<TPayload, TError>) => Promise<any>;
/**
 * @deprecated
 * Use routine.getSuccessPayload instead
 */
export declare const getTypedPayload: <TPayload>(routine: ReduxThunkRoutine<TPayload, Error>, action: Action<any>) => TPayload;
/**
 * @deprecated
 * Use routine.getFailurePayload instead
 */
export declare const getTypedError: <TError extends Error = Error>(routine: ReduxThunkRoutine<any, TError>, action: any) => TError;
/**
 * @deprecated
 */
export declare type ComposedExecutor<TPayload, TError extends Error = Error> = {
    getRequestPayload?: () => any;
    getSuccessPayload: () => Promise<TPayload>;
    getFailurePayload?: (error: Error) => TError;
};
/**
 * @deprecated
 */
export declare type PlainExecutor<TPayload> = () => Promise<TPayload>;
/**
 * @deprecated
 */
export declare type Executor<TPayload, TError extends Error = Error> = PlainExecutor<TPayload> | ComposedExecutor<TPayload, TError>;
