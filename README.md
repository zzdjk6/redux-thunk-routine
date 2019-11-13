# redux-thunk-routine [![Build Status](https://travis-ci.com/zzdjk6/redux-thunk-routine.svg?branch=master)](https://travis-ci.com/zzdjk6/redux-thunk-routine)

## Motivation

There is too much boilerplate code when using `redux-thunk`!
It becomes even worse when adding static types for `actions`!
Let's find a way to reduce the boilerplate!

Actually, `redux-saga-routines`(https://github.com/afitiskin/redux-saga-routines) is a good option.
But we are not using `redux-saga`, we want static types (using `Typescript` or `Flow`), and we don't need 5 actions for each `routine`, that's why `redux-thunk-routine` is created.

So what is a `routine`? Let's explain it with an example.

## Understand routine in 1 minute

Imagine that we want to fetch data using API, we may write the code below:

```typescript
// 1. Define the constants that are used as action types
const FETCH_DATA_REQUEST: string = 'FETCH_DATA/REQUEST';
const FETCH_DATA_SUCCESS: string = 'FETCH_DATA/SUCCESS';
const FETCH_DATA_FAILURE: string = 'FETCH_DATA/FAILURE';

// 2. Define action creators
const fetchDataRequest: () => Action<void> = createAction(FETCH_DATA_REQUEST);
const fetchDataSuccess: (payload: DataType) => Action<DataType> = createAction(FETCH_DATA_SUCCESS);
const fetchDataFailure: (payload: Error) => Action<Error> = createAction(FETCH_DATA_FAILURE);

// 3. Create a thunk
const fetchData = () => async (dispatch: Dispatch, getState: () => RootState) => {
  await dispatch(fetchDataRequest());
  try {
    const data = await api.fetchData();
    return await dispatch(fetchDataSuccess(data));
  } catch (e) {
    await dispatch(fetchDataFailure(e));
    throw e;
  }
}

// 4. Handle actions in reducers
switch (action.type) {
  case FETCH_DATA_REQUEST:
    return {
        ...state,
        isFetching: true,
        error: null
    };
  case FETCH_DATA_SUCCESS:
     return {
        ...state,
        isFetching: false,
        data: action.payload,
        error: null
    };
  case FETCH_DATA_FAILURE:
    return {
        ...state,
        isFetching: false,
        error: action.payload
    };
}
```

By observing the example, we could see there are at least 3 pain points:

1. We have to define 3 constants for every `thunk`: REQUEST, SUCCESS, FAILURE
2. We have to define 3 action creators for every `thunk`: request, success, failure
3. Adding static types is a time-consuming and no-brain labour

What if I tell you that there is a smart thing called `routine` to reduce these repeatable work?

Let's see what is the `routine` version of the previous example:

```typescript
// 1. Define a routine
const fetchDataRoutine = createThunkRoutine<DataType>('FETCH_DATA');
// Or explicitly decalre the error type
// const fetchDataRoutine: createThunkRoutine<DataType, Error>('FETCH_DATA')

// 2. Create a thunk
const fetchData = () => async (dispatch: Dispatch, getState: () => RootState) => {
  await dispatch(fetchDataRoutine.request());
  try {
    const data = await api.fetchData();
    return await dispatch(fetchDataRoutine.success(data));
  } catch (e) {
    await dispatch(fetchDataRoutine.failure(e));
    throw e;
  }
}

// 3. Handle actions in reducers
switch (action.type) {
  case fetchDataRoutine.REQUEST:
    return {
        ...state,
        isFetching: true,
        error: null
    };
  case fetchDataRoutine.SUCCESS:
    return {
        ...state,
        isFetching: false,
        data: action.payload,
        error: null
    };
  case fetchDataRoutine.FAILURE:
    return {
        ...state,
        isFetching: false,
        error: action.payload
    };
}
```

See, there is no need to define `constants` and `action creators` for every `thunk`: `routine` gots them.
And yes, the type for each action is well-defined too!
The type for `fetchDataRoutine.success` is generated as `(payload: DataType) => Action<DataType>` by magic (well, it's generic).

## Furthur improvements

### Dispatch routine in 1-stop manner

Instead of dispatching 3 actions in a `thunk` manually as shown above, we can replace it using the following code:

```typescript
const fetchData = () => async (dispatch: Dispatch, getState: () => RootState) => {
  return await dispatchRoutine(dispatch, fetchDataRoutine, async () => {
    return await api.fetchData();
  });
}
```

The `dispatchRoutine` function wraps the standard flow for us so that we can focus on what really matters.
It also accept a variation which allow us to customize the standard flow:

```typescript
const fetchData = () => async (dispatch: Dispatch, getState: () => RootState) => {
  return await dispatchRoutine(dispatch, fetchDataRoutine, {
    getRequestPayload: () => {
      // Genereated customized payload for '.request' action
      return {};
    },
    getSuccessPayload: async () => {
      return await api.fetchData();
    },
    getFailurePayload: (error: Error) => {
      // Transform the catched error to a customized one
      return new CustomError(error);
    }
  });
}
```

### Get typed payload in reducer

It could be tedious when trying to use types in reducer, and it is not necessary.
By using `redux-thunk-routine`, the type of payloads are already checked when dispatching them in thunks.
According to that, it is safe to put `Action<any>` when define the reducer, e.g,:

```typescript
const reducer = (state: State = initState, action: Action<any>): State => {
  // The reducer logic goes here...
}
```

However, we may want to use the type information of payload inside the reducer, so that 4 more functions are there to help: 

* `.isSuccessAction`
* `.isFailureAction`
* `.getSuccessPayload`
* `.getFailurePayload`

So we can write the following code in reducer to get typed payload from `Action<any>`:

```typescript
// isSuccessAction is a type guard
if (fetchDataRoutine.isSuccessAction(action)) {
  // action is now typed as Action<DataType>
}

// isFailureAction is a type guard
if (fetchDataRoutine.isFailureAction(action)) {
  // action is now typed as Action<Error>
}
```

or 

```typescript
// payload will be typed as Action<DataType>
const payload = fetchDataRoutine.getSuccessPayload(action);

// error will be typed as Error
const error = fetchDataRoutine.getFailurePayload(action);
```

Note: these 2 functions will check the action type in runtime to prevent mismatching routine and payload type.