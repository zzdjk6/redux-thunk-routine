import { Action } from 'redux-actions';
/**
 * A routine is an instance of this generic class
 */
export declare class ReduxThunkRoutine<PAYLOAD, ERROR extends Error = Error> {
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
    success: (payload: PAYLOAD) => Action<PAYLOAD>;
    /**
     * Action creator for failure action
     * @param payload
     */
    failure: (payload: ERROR) => Action<ERROR>;
    /**
     * Detect if a given action is the request action of this routine
     * @param action
     */
    isRequestAction: (action: Action<any>) => action is Action<any>;
    /**
     * Detect if a given action is the success action of this routine
     * @param action
     */
    isSuccessAction: (action: Action<any>) => action is Action<PAYLOAD>;
    /**
     * Detect if a given action is the failure action of this routine
     * @param action
     */
    isFailureAction: (action: Action<any>) => action is Action<ERROR>;
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
    getSuccessPayload: (action: Action<any>) => PAYLOAD;
    /**
     * Get typed failure payload from a given action, throw TypeError if the action does not match
     * @param action
     * @throws TypeError
     */
    getFailurePayload: (action: Action<any>) => ERROR;
}
/**
 * Helper function to create a routine
 * @param routineType
 */
export declare const createThunkRoutine: <PAYLOAD, ERROR extends Error = Error>(routineType: string) => ReduxThunkRoutine<PAYLOAD, ERROR>;
/**
 * Helper function to create a thunk from a given routine and executor functions
 * @param routine
 * @param getSuccessPayload
 * @param overwritePayload
 */
export declare const createThunk: <PAYLOAD, ERROR extends Error = Error, ARGUMENTS = void>(routine: ReduxThunkRoutine<PAYLOAD, ERROR>, getSuccessPayload: (args: ARGUMENTS) => Promise<PAYLOAD>, overwritePayload?: {
    getRequestPayload?: ((args: ARGUMENTS) => Promise<any>) | undefined;
    getFailurePayload?: ((error: Error) => Promise<ERROR>) | undefined;
} | undefined) => (args: ARGUMENTS) => (dispatch: any) => Promise<any>;
/**
 * @deprecated Use `createThunk` instead
 * @param dispatch
 * @param routine
 * @param executor
 */
export declare const dispatchRoutine: <PAYLOAD, ERROR extends Error>(dispatch: any, routine: ReduxThunkRoutine<PAYLOAD, ERROR>, executor: Executor<PAYLOAD, ERROR>) => Promise<any>;
/**
 * @deprecated
 * Use routine.getSuccessPayload instead
 */
export declare const getTypedPayload: <PAYLOAD>(routine: ReduxThunkRoutine<PAYLOAD, Error>, action: Action<any>) => PAYLOAD;
/**
 * @deprecated
 * Use routine.getFailurePayload instead
 */
export declare const getTypedError: <ERROR extends Error = Error>(routine: ReduxThunkRoutine<any, ERROR>, action: any) => ERROR;
/**
 * @deprecated
 */
export declare type ComposedExecutor<PAYLOAD, ERROR extends Error = Error> = {
    getRequestPayload?: () => any;
    getSuccessPayload: () => Promise<PAYLOAD>;
    getFailurePayload?: (error: Error) => ERROR;
};
/**
 * @deprecated
 */
export declare type PlainExecutor<PAYLOAD> = () => Promise<PAYLOAD>;
/**
 * @deprecated
 */
export declare type Executor<PAYLOAD, ERROR extends Error = Error> = PlainExecutor<PAYLOAD> | ComposedExecutor<PAYLOAD, ERROR>;
