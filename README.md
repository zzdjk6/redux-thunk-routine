# redux-thunk-routine [![Build Status](https://travis-ci.com/zzdjk6/redux-thunk-routine.svg?branch=master)](https://travis-ci.com/zzdjk6/redux-thunk-routine) [![Coverage Status](https://coveralls.io/repos/github/zzdjk6/redux-thunk-routine/badge.svg)](https://coveralls.io/github/zzdjk6/redux-thunk-routine)

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
const FETCH_DATA_REQUEST = 'FETCH_DATA/REQUEST';
const FETCH_DATA_SUCCESS = 'FETCH_DATA/SUCCESS';
const FETCH_DATA_FAILURE = 'FETCH_DATA/FAILURE';

// 2. Define action creators
const fetchDataRequest: (payload?: any) => Action<any> = createAction(FETCH_DATA_REQUEST);
const fetchDataSuccess: (payload: DataType) => Action<DataType> = createAction(FETCH_DATA_SUCCESS);
const fetchDataFailure: (payload: Error) => Action<Error> = createAction(FETCH_DATA_FAILURE);

// 3. Create a thunk
const fetchData = (id: number) => async (dispatch: Dispatch) => {
  await dispatch(fetchDataRequest(id));
  try {
    const data = await api.fetchData(id);
    return await dispatch(fetchDataSuccess(data));
  } catch (e) {
    await dispatch(fetchDataFailure(e));
    throw e;
  }
};

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

Also we get a feeling that most `thunks` seems to have similar logic statements of dispatching actions, and the related branches in reducer to deal with those actions may looks quite repetitive.

What if I tell you that there is a smart thing called `routine` can reduce these repeatable work?

Let's see what is the basic `routine` version of the previous example:

```typescript
// 1. Define a routine
const fetchDataRoutine = createThunkRoutine<DataType>('FETCH_DATA');
// Or explicitly decalre the error type
// const fetchDataRoutine: createThunkRoutine<DataType, Error>('FETCH_DATA')

// 2. Create a thunk
const fetchData = (id: number) => async (dispatch: Dispatch) => {
  await dispatch(fetchDataRoutine.request(id));
  try {
    const data = await api.fetchData(id);
    return await dispatch(fetchDataRoutine.success(data));
  } catch (e) {
    await dispatch(fetchDataRoutine.failure(e));
    throw e;
  }
};

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

See, there is no need to define `constants` and `action creators` for every `thunk`: `routine` automatically generates them.
For example, the type of `fetchDataRoutine.success` is generated as `(payload: DataType) => Action<DataType>` by magic (well, it's generic).

## Further improvements

### Remove boilerplate from the thunk

Instead of dispatching 3 actions in every `thunk` manually as shown above, we can replace it using the following code:

```typescript
const fetchData = createThunk(fetchDataRoutine, async (id: number) => {
  return await api.fetchData(id);
});
```

The `createThunk` helper function generate the standard flow of dispatching actions for us so that we can focus on what is really special to each `thunk`.
It also accept a variation which allow us to overwrite how to generate payload for request action and failure action in the standard flow:

```typescript
const fetchData = createThunk(
  fetchDataRoutine,
  async (id: number) => {
    return await api.fetchData(id);
  },
  {
    getRequestPayload: async (id: number) => {
      return {
        overwrittenPayload: id
      };
    },
    getFailurePayload: async (e: Error) => {
      return new Error('Overwritten Error!');
    }
  }
);
```

### Get typed payload in reducer

It could be tedious when trying to use types in reducer, and it is not necessary.
By using `redux-thunk-routine`, the type of payloads are already checked when dispatching them in thunks.
According to that, it is safe to put `Action<any>` when define the reducer, e.g,:

```typescript
const reducer = (state: State = initState, action: Action<any>): State => {
  // The reducer logic goes here...
};
```

However, we may want to use the type information of payload inside the reducer, so that 4 more functions are there to help:

- `.isSuccessAction`
- `.isFailureAction`
- `.getSuccessPayload`
- `.getFailurePayload`

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

Note: these 2 functions will check the action type in runtime and throw error to prevent mismatching routine and payload type.

Note: if there is really a need to explicitly adding valid action types to reducer signiture, it is possible (see example below).

```typescript
type ValidAction =
  | ReturnType<typeof fetchDataRoutine.request>
  | ReturnType<typeof fetchDataRoutine.success>
  | ReturnType<typeof fetchDataRoutine.failure>;
```

## How about using `getState` with `createThunk`?

Well, there is a debate of using `getState` in action creators and it was indexed in [this blog](https://blog.isquaredsoftware.com/2017/01/idiomatic-redux-thoughts-on-thunks-sagas-abstraction-and-reusability/).

IMO, it is better to let the component to select required states before dispatching a `thunk` as it adds certainty to the `thunk` and it is easier to test without accessing state in action creators, so that there is no `getState` function passed to the executor function when using `createThunk`.

However, if it is really needed, calling `getState` can be done via a wrapped `thunk`:

```typescript
// Imagine we have a created thunk from routine
const fetchData = createThunk(fetchDataRoutine, async (id: number) => {
  return await api.fetchData(id);
});

// We can have a wrapped thunk to access existing state before dispatch the generated thunk
const fetchDataWithIdFromState = () => (dispatch: Dispatch, getState: () => RootState) => {
  const id = getState().somewhere.id;
  return dispatch(fetchData(id));
};
```

## Is there other benefits of using routines?

Absolutely, yes.

When using routine, we are enforced to follow a common pattern to name our action types. This gives us a huge advantage if we want to pull out the repetitive logic in reducers.

For example, we can implement a global loading reducer and a global error reducer based on regular expression to match action types, then remove the branches of dealing "REQUEST" and "FAILURE" actions in other reducers. The example is explained in detail in [this blog](https://medium.com/@zzdjk6/implement-global-loading-and-error-state-with-redux-thunk-routine-and-typescript-b278f93e99fd?source=friends_link&sk=2435bafc1714b4018116f475f865a62a) and code can be found on [GitHub](https://github.com/zzdjk6/demo-global-loading-state).
