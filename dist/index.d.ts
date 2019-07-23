export declare type Action<T> = {
    type: string;
    payload: T;
};
export declare class ReduxThunkRoutine<P, E = Error> {
    actionType: string;
    constructor(actionType: string);
    readonly REQUEST: string;
    readonly SUCCESS: string;
    readonly FAILURE: string;
    request(payload?: any): Action<any>;
    success(payload: P): Action<P>;
    failure(payload: E): Action<E>;
}
export declare function createThunkRoutine<P, E>(actionType: string): ReduxThunkRoutine<P, E>;
export declare function getTypedPayload<P>(routine: ReduxThunkRoutine<P, Error>, action: Action<any>): P;
export declare function getTypedError<E>(routine: ReduxThunkRoutine<any, E>, action: any): E;
