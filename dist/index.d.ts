import { Action } from 'redux-actions';
export declare type ComposedExecutor<P, E extends Error> = {
    getRequestPayload?: () => any;
    getSuccessPayload: () => Promise<P>;
    getFailurePayload?: (error: Error) => E;
};
export declare type PlainExecutor<P> = () => Promise<P>;
export declare type Executor<P, E extends Error> = PlainExecutor<P> | ComposedExecutor<P, E>;
export declare class ReduxThunkRoutine<P, E extends Error = Error> {
    readonly actionType: string;
    readonly REQUEST: string;
    readonly SUCCESS: string;
    readonly FAILURE: string;
    constructor(actionType: string);
    request: (payload?: any) => Action<any>;
    success: (payload: P) => Action<P>;
    failure: (payload: E) => Action<E>;
    isSuccessAction: (action: Action<any>) => action is Action<P>;
    isFailureAction: (action: Action<any>) => action is Action<E>;
    getSuccessPayload: (action: Action<any>) => P;
    getFailurePayload: (action: Action<any>) => E;
}
export declare const dispatchRoutine: <P, E extends Error>(dispatch: any, routine: ReduxThunkRoutine<P, E>, executor: Executor<P, E>) => Promise<any>;
export declare const createThunkRoutine: <P, E extends Error = Error>(actionType: string) => ReduxThunkRoutine<P, E>;
/**
 * @deprecated
 */
export declare const getTypedPayload: <P>(routine: ReduxThunkRoutine<P, Error>, action: Action<any>) => P;
/**
 * @deprecated
 */
export declare const getTypedError: <E extends Error = Error>(routine: ReduxThunkRoutine<any, E>, action: any) => E;
