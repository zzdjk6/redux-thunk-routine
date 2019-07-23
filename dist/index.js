"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// It is a replacement of boilerplate code to define redux thunk actions
// Every Routine has three actions: REQUEST, SUCCESS and FAILURE
// To get the action type name of each action, call `routine.REQUEST/SUCCESS/FAILURE`
// To dispatch an action, call `routine.request/success/failure` with payload
// This is heavily inspired by https://github.com/afitiskin/redux-saga-routines
const redux_actions_1 = require("redux-actions");
class ReduxThunkRoutine {
    constructor(actionType) {
        this.actionType = actionType;
    }
    get REQUEST() {
        return `${this.actionType}/REQUEST`;
    }
    get SUCCESS() {
        return `${this.actionType}/SUCCESS`;
    }
    get FAILURE() {
        return `${this.actionType}/FAILURE`;
    }
    request(payload) {
        const actionCreator = redux_actions_1.createAction(this.REQUEST);
        return actionCreator(payload);
    }
    success(payload) {
        const actionCreator = redux_actions_1.createAction(this.SUCCESS);
        return actionCreator(payload);
    }
    failure(payload) {
        const actionCreator = redux_actions_1.createAction(this.FAILURE);
        return actionCreator(payload);
    }
}
exports.ReduxThunkRoutine = ReduxThunkRoutine;
function createThunkRoutine(actionType) {
    return new ReduxThunkRoutine(actionType);
}
exports.createThunkRoutine = createThunkRoutine;
function getTypedPayload(routine, action) {
    const payload = action.payload;
    return payload;
}
exports.getTypedPayload = getTypedPayload;
function getTypedError(routine, action) {
    const error = action.payload;
    return error;
}
exports.getTypedError = getTypedError;
//# sourceMappingURL=index.js.map