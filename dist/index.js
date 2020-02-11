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
// Class
/**
 * A routine is an instance of this generic class
 */
class ReduxThunkRoutine {
    constructor(routineType) {
        /**
         * Action creator for request action
         * @param payload
         */
        this.request = (payload) => {
            const actionCreator = redux_actions_1.createAction(this.REQUEST);
            return actionCreator(payload);
        };
        /**
         * Action creator for success action
         * @param payload
         */
        this.success = (payload) => {
            const actionCreator = redux_actions_1.createAction(this.SUCCESS);
            return actionCreator(payload);
        };
        /**
         * Action creator for failure action
         * @param payload
         */
        this.failure = (payload) => {
            const actionCreator = redux_actions_1.createAction(this.FAILURE);
            return actionCreator(payload);
        };
        /**
         * Detect if a given action is the request action of this routine
         * @param action
         */
        this.isRequestAction = (action) => {
            return action.type === this.REQUEST;
        };
        /**
         * Detect if a given action is the success action of this routine
         * @param action
         */
        this.isSuccessAction = (action) => {
            return action.type === this.SUCCESS;
        };
        /**
         * Detect if a given action is the failure action of this routine
         * @param action
         */
        this.isFailureAction = (action) => {
            return action.type === this.FAILURE;
        };
        /**
         * Get typed request payload from a given action, throw TypeError if the action does not match
         * @param action
         * @throws TypeError
         */
        this.getRequestPayload = (action) => {
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
        this.getSuccessPayload = (action) => {
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
        this.getFailurePayload = (action) => {
            if (!this.isFailureAction(action)) {
                throw new TypeError();
            }
            return action.payload;
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
/**
 * Helper function to create a routine
 * @param routineType
 */
exports.createThunkRoutine = (routineType) => {
    return new ReduxThunkRoutine(routineType);
};
/**
 * Helper function to generate a thunk action creator from the given routine and executor function
 * @param routine
 * @param getSuccessPayload
 * @param overwritePayload
 */
exports.getThunkActionCreator = (routine, getSuccessPayload, overwritePayload) => {
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
/**
 * @deprecated Use `getThunkActionCreator` instead
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
/**
 * @deprecated
 * Use routine.getSuccessPayload instead
 */
exports.getTypedPayload = (routine, action) => {
    return action.payload;
};
/**
 * @deprecated
 * Use routine.getFailurePayload instead
 */
exports.getTypedError = (routine, action) => {
    return action.payload;
};
//# sourceMappingURL=index.js.map