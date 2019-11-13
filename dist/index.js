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
    constructor(actionType) {
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
        this.actionType = actionType;
        this.REQUEST = `${this.actionType}/REQUEST`;
        this.SUCCESS = `${this.actionType}/SUCCESS`;
        this.FAILURE = `${this.actionType}/FAILURE`;
    }
}
exports.ReduxThunkRoutine = ReduxThunkRoutine;
// Helpers
exports.dispatchRoutine = (dispatch, routine, executor) => __awaiter(void 0, void 0, void 0, function* () {
    const requestPayload = isComposedExecutor(executor) && executor.getRequestPayload ? executor.getRequestPayload() : undefined;
    yield dispatch(routine.request(requestPayload));
    try {
        const payload = isPlainExecutor(executor) ? yield executor() : yield executor.getSuccessPayload();
        return yield dispatch(routine.success(payload));
    }
    catch (error) {
        const failuerPayload = isComposedExecutor(executor) && executor.getFailurePayload ? executor.getFailurePayload(error) : error;
        yield dispatch(routine.failure(failuerPayload));
        throw failuerPayload;
    }
});
const isComposedExecutor = (executor) => {
    return typeof executor === 'object';
};
const isPlainExecutor = (executor) => {
    return typeof executor === 'function';
};
exports.createThunkRoutine = (actionType) => {
    return new ReduxThunkRoutine(actionType);
};
exports.getTypedPayload = (routine, action) => {
    const payload = action.payload;
    return payload;
};
exports.getTypedError = (routine, action) => {
    const error = action.payload;
    return error;
};
//# sourceMappingURL=index.js.map