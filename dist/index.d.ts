import { Action } from 'redux-actions';
export declare type ComposedExecutor<P, E extends Error> = {
    getRequestPayload?: () => any;
    getSuccessPayload: () => Promise<P>;
    getFailurePayload?: (error: Error) => E;
};
export declare type PlainExecutor<P> = () => Promise<P>;
export declare type Executor<P, E extends Error> = PlainExecutor<P> | ComposedExecutor<P, E>;
export declare class ReduxThunkRoutine<P, E extends Error = Error> {
    /**
     * @deprecated
     * Use routineType instead
     */
    readonly actionType: string;
    readonly routineType: string;
    readonly REQUEST: string;
    readonly SUCCESS: string;
    readonly FAILURE: string;
    constructor(routineType: string);
    request: (payload?: any) => Action<any>;
    success: (payload: P) => Action<P>;
    failure: (payload: E) => Action<E>;
    isSuccessAction: (action: Action<any>) => action is Action<P>;
    isFailureAction: (action: Action<any>) => action is Action<E>;
    getSuccessPayload: (action: Action<any>) => P;
    getFailurePayload: (action: Action<any>) => E;
}
export declare const createThunkWithArgs: <A, P, E extends Error>(routine: ReduxThunkRoutine<P, E>, getSuccessPayload: (args: A) => Promise<P>, overwritePayload?: {
    getRequestPayload?: ((args: A) => Promise<any>) | undefined;
    getFailurePayload?: ((error: Error) => Promise<E>) | undefined;
} | undefined) => (args: A) => (dispatch: any) => Promise<any>;
export declare const createThunkWithoutArgs: <P, E extends Error>(routine: ReduxThunkRoutine<P, E>, getSuccessPayload: () => Promise<P>, overwritePayload?: {
    getRequestPayload?: (() => Promise<any>) | undefined;
    getFailurePayload?: ((error: Error) => Promise<E>) | undefined;
} | undefined) => (args: void) => (dispatch: any) => Promise<any>;
/**
 * @deprecated Use `createThunk` instead
 * @param dispatch
 * @param routine
 * @param executor
 */
export declare const dispatchRoutine: <P, E extends Error>(dispatch: any, routine: ReduxThunkRoutine<P, E>, executor: Executor<P, E>) => Promise<any>;
export declare const createThunkRoutine: <P, E extends Error = Error>(routineType: string) => ReduxThunkRoutine<P, E>;
/**
 * @deprecated
 * Use routine.getSuccessPayload instead
 */
export declare const getTypedPayload: <P>(routine: ReduxThunkRoutine<P, Error>, action: Action<any>) => P;
/**
 * @deprecated
 * Use routine.getFailurePayload instead
 */
export declare const getTypedError: <E extends Error = Error>(routine: ReduxThunkRoutine<any, E>, action: any) => E;
