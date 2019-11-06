import {
  createThunkRoutine,
  getTypedError,
  getTypedPayload,
  ReduxThunkRoutine
} from "../index";

test("Routine has correct action name", () => {
  const routine = createThunkRoutine("TEST/MOCK_ROUTINE");
  expect(routine.REQUEST).toBe("TEST/MOCK_ROUTINE/REQUEST");
  expect(routine.SUCCESS).toBe("TEST/MOCK_ROUTINE/SUCCESS");
  expect(routine.FAILURE).toBe("TEST/MOCK_ROUTINE/FAILURE");
});

test("Routine dispatches correct payload", () => {
  const routine: ReduxThunkRoutine<number> = createThunkRoutine(
    "TEST/MOCK_ROUTINE"
  );

  expect(routine.request({ requestPayload: "anything" })).toEqual({
    type: routine.REQUEST,
    payload: { requestPayload: "anything" }
  });

  expect(routine.success(123)).toEqual({
    type: routine.SUCCESS,
    payload: 123
  });

  const error = new Error("I am an error");
  expect(routine.failure(error)).toEqual({
    type: routine.FAILURE,
    payload: error,
    error: true
  });
});

test("Get typed payload", () => {
  const routine: ReduxThunkRoutine<number> = createThunkRoutine(
    "TEST/MOCK_ROUTINE"
  );
  const action = routine.success(123);
  expect(getTypedPayload(routine, action)).toEqual(123);
});

test("Get typed error", () => {
  class CustomError extends Error {
    name = "CustomError";
  }
  const routine: ReduxThunkRoutine<number, CustomError> = createThunkRoutine(
    "TEST/MOCK_ROUTINE"
  );
  const action = routine.failure(new CustomError());
  expect(getTypedError(routine, action)).toHaveProperty("name", "CustomError");
});

test("Action creators are correctly bound", () => {
  const callActionCreatorWithPayload = (actionCreator: any, payload: any) => {
    return actionCreator(payload);
  };

  const routine: ReduxThunkRoutine<number> = createThunkRoutine(
    "TEST/MOCK_ROUTINE"
  );

  expect(callActionCreatorWithPayload(routine.request, 1)).toEqual({
    type: routine.REQUEST,
    payload: 1
  });

  expect(callActionCreatorWithPayload(routine.success, 2)).toEqual({
    type: routine.SUCCESS,
    payload: 2
  });

  const error = new Error("I am an Error");
  expect(callActionCreatorWithPayload(routine.failure, error)).toEqual({
    type: routine.FAILURE,
    error: true,
    payload: error
  });
});
