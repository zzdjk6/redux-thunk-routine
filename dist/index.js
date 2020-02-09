"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// It is a replacement of boilerplate code to define redux thunk actions
// Every Routine has three actions: REQUEST, SUCCESS and FAILURE
// To get the action type name of each action, call `routine.REQUEST/SUCCESS/FAILURE`
// To dispatch an action, call `routine.request/success/failure` with payload
// This is heavily inspired by https://github.com/afitiskin/redux-saga-routines
const redux_actions_1 = require("redux-actions");
// Classes
class ReduxThunkRoutine {
    constructor(routineType) {
        this.request = (payload) => {
            const actionCreator = redux_actions_1.createAction(this.REQUEST);
            return actionCreator(payload);
        };
        this.success = (payload) => {
            const actionCreator = redux_actions_1.createAction(this.SUCCESS);
            return actionCreator(payload);
        };
        this.failure = (payload) => {
            const actionCreator = redux_actions_1.createAction(this.FAILURE);
            return actionCreator(payload);
        };
        this.isSuccessAction = (action) => {
            return action.type === this.SUCCESS;
        };
        this.isFailureAction = (action) => {
            return action.type === this.FAILURE;
        };
        this.getSuccessPayload = (action) => {
            if (this.isSuccessAction(action)) {
                return action.payload;
            }
            throw new TypeError();
        };
        this.getFailurePayload = (action) => {
            if (this.isFailureAction(action)) {
                return action.payload;
            }
            throw new TypeError();
        };
        this.actionType = routineType;
        this.routineType = routineType;
        this.REQUEST = `${this.routineType}/REQUEST`;
        this.SUCCESS = `${this.routineType}/SUCCESS`;
        this.FAILURE = `${this.routineType}/FAILURE`;
    }
}
exports.ReduxThunkRoutine = ReduxThunkRoutine;
// Helpers
exports.createThunkWithArgs = (routine, getSuccessPayload, overwritePayload) => {
    return (args) => (dispatch) => __awaiter(void 0, void 0, void 0, function* () {
        // Get request payload, default is `args`
        let requestPayload = args;
        if (overwritePayload &&
            overwritePayload.getRequestPayload &&
            typeof overwritePayload.getRequestPayload === 'function') {
            requestPayload = yield overwritePayload.getRequestPayload(args);
        }
        // Dispatch REQUEST action
        yield dispatch(routine.request(requestPayload));
        try {
            // Get success payload
            const successPayload = yield getSuccessPayload(args);
            // Dispatch SUCCESS action
            return yield dispatch(routine.success(successPayload));
        }
        catch (error) {
            // Get failure payload, default is the caught `Error`
            let failurePayload = error;
            if (overwritePayload &&
                overwritePayload.getFailurePayload &&
                typeof overwritePayload.getFailurePayload === 'function') {
                failurePayload = yield overwritePayload.getFailurePayload(error);
            }
            // Dispatch FAILURE action
            yield dispatch(routine.failure(failurePayload));
            // Re-throw error
            throw failurePayload;
        }
    });
};
exports.createThunkWithoutArgs = (routine, getSuccessPayload, overwritePayload) => {
    return exports.createThunkWithArgs(routine, getSuccessPayload, overwritePayload);
};
/**
 * @deprecated Use `createThunk` instead
 * @param dispatch
 * @param routine
 * @param executor
 */
exports.dispatchRoutine = (dispatch, routine, executor) => __awaiter(void 0, void 0, void 0, function* () {
    const requestPayload = isComposedExecutor(executor) && executor.getRequestPayload ? executor.getRequestPayload() : undefined;
    yield dispatch(routine.request(requestPayload));
    try {
        const payload = isPlainExecutor(executor) ? yield executor() : yield executor.getSuccessPayload();
        return yield dispatch(routine.success(payload));
    }
    catch (error) {
        const failurePayload = isComposedExecutor(executor) && executor.getFailurePayload ? executor.getFailurePayload(error) : error;
        yield dispatch(routine.failure(failurePayload));
        throw failurePayload;
    }
});
/**
 * @deprecated
 * @param executor
 */
const isComposedExecutor = (executor) => {
    return typeof executor === 'object';
};
/**
 * @deprecated
 * @param executor
 */
const isPlainExecutor = (executor) => {
    return typeof executor === 'function';
};
exports.createThunkRoutine = (routineType) => {
    return new ReduxThunkRoutine(routineType);
};
/**
 * @deprecated
 * Use routine.getSuccessPayload instead
 */
exports.getTypedPayload = (routine, action) => {
    const payload = action.payload;
    return payload;
};
/**
 * @deprecated
 * Use routine.getFailurePayload instead
 */
exports.getTypedError = (routine, action) => {
    const error = action.payload;
    return error;
};
//# sourceMappingURL=index.js.map