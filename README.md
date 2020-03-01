# redux-thunk-routine [![Build Status](https://travis-ci.com/zzdjk6/redux-thunk-routine.svg?branch=master)](https://travis-ci.com/zzdjk6/redux-thunk-routine) [![Coverage Status](https://coveralls.io/repos/github/zzdjk6/redux-thunk-routine/badge.svg)](https://coveralls.io/github/zzdjk6/redux-thunk-routine)

## How to use it

```shell
npm install redux-thunk-routine
```

or

```shell
yarn add redux-thunk-routine
```

## Motivation

`redux-thunk` gives us the ability to create asynchronous actions, but do you feel that you are writing boilerplate code again and again?

Do you feel things are getting even worse when you trying to add static typing?

Inspired by [redux-saga-routines](https://github.com/afitiskin/redux-saga-routines) which is a library for `redux-saga`, we have [redux-thunk-routine](https://github.com/zzdjk6/redux-thunk-routine) for `redux-thunk`!

So what is a `routine`? Let's explain it with an example.

## Understand routine in 1 minute

Imagine that we are creating an asynchronous action to fetch data using API, we might write the code like below:

```typescript
// 1. Define the constants that are used as action types
const FETCH_DATA_REQUEST = 'FETCH_DATA/REQUEST';
const FETCH_DATA_SUCCESS = 'FETCH_DATA/SUCCESS';
const FETCH_DATA_FAILURE = 'FETCH_DATA/FAILURE';
```

```typescript
// 2. Define synchronous action creators (following Flux Standard Action)
const fetchDataRequest = (payload?: any) => {
  if (typeof payload === 'undefined') {
    return {
      type: FETCH_DATA_REQUEST
    };
  }

  return {
    type: FETCH_DATA_REQUEST,
    payload
  };
};
const fetchDataSuccess = (payload: DataType) => {
  return {
    type: FETCH_DATA_SUCCESS,
    payload
  };
};
const fetchDataFailure = (payload: Error) => {
  return {
    type: FETCH_DATA_FAILURE,
    payload,
    error: true
  };
};
```

```typescript
// There is a simplied version to define action creators using `redux-action`
const fetchDataRequest: (payload?: any) => Action<any> = createAction(FETCH_DATA_REQUEST);
const fetchDataSuccess: (payload: DataType) => Action<DataType> = createAction(FETCH_DATA_SUCCESS);
const fetchDataFailure: (payload: Error) => Action<Error> = createAction(FETCH_DATA_FAILURE);
```

```typescript
// 3. Define thunk action creator
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

Looking at the example, we could find there is smell of boilerplate:

For every `thunk`:

1. We have to define 3 constants: `REQUEST`, `SUCCESS`, `FAILURE`
2. We have to define 3 action creators: `request`, `success`, `failure`
3. We have same logic flow of dispatching actions

What if I tell you that there is a smart thing called `routine` to reduce these repetitive work?

Let's have a look at the `routine` version of the previous example:

```typescript
// 1. Define a routine
const fetchDataRoutine = createThunkRoutine<DataType>('FETCH_DATA');
// Or explicitly decalre the error type if need
// const fetchDataRoutine: createThunkRoutine<DataType, Error>('FETCH_DATA')

// 2. Define the thunk action creator
// Note: We will address the repetitive logic flow later on
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

See, there is no need to define constants and synchronous action creators:

- Each `routine` has 3 defined action types:
  - `routine.REQUEST`
  - `routine.SUCCESS`
  - `routine.FAILURE`
- Each `routine` has 3 defined action creators (their types are also defined clearly):
  - `routine.request()`
  - `routine.success()`
  - `routine.failure()`

## Further Discussion

### Remove boilerplate from the thunk action creator

Instead of dispatching 3 actions in every `thunk` manually as shown above, we can replace it like below:

```typescript
const fetchData = getThunkActionCreator(fetchDataRoutine, async (id: number) => {
  return await api.fetchData(id);
});
```

The actual flow is the same, but we write much less code.

If you want to overwrite the process of generating payload for request action and failure action, you can use the 3rd parameter:

```typescript
const fetchData = getThunkActionCreator(
  fetchDataRoutine,
  async (id: number) => {
    return await api.fetchData(id);
  },
  {
    // this is optional
    getRequestPayload: async (id: number) => {
      return {
        overwrittenPayload: id
      };
    },
    // this is also optional
    getFailurePayload: async (e: Error) => {
      return new Error('Overwritten Error!');
    }
  }
);
```

### Typing for reducer

By using `redux-thunk-routine`, the type of payloads are already checked when dispatching, so it is safe to put `Action<any>` when define the reducer:

```typescript
const reducer = (state: State = initState, action: Action<any>): State => {
  // The reducer logic goes here...
};
```

However, if you still want to strictly add type of actions to reducer signiture, you can refer the code below:

```typescript
type ValidAction =
  | ReturnType<typeof fetchDataRoutine.request>
  | ReturnType<typeof fetchDataRoutine.success>
  | ReturnType<typeof fetchDataRoutine.failure>;

const reducer = (state: State = initState, action: ValidAction): State => {
  // The reducer logic goes here...
};
```

### Get typed payload in reducer

To access typed payload inside the reducer, you can use these functions:

- `routine.isSuccessAction()`
- `routine.isFailureAction()`
- `routine.getSuccessPayload()`
- `routine.getFailurePayload()`

Example:

```typescript
// Use type guards
const reducer = (state: State = initState, action: Action<any>): State => {
  // isSuccessAction is a type guard
  if (fetchDataRoutine.isSuccessAction(action)) {
    // action is typed as Action<DataType>, so payload is DataType
    const payload = action.payload;
    // ...
  }

  // isFailureAction is a type guard
  if (fetchDataRoutine.isFailureAction(action)) {
    // action is typed as Action<Error>, so error is Error
    const error = action.payload;
    // ...
  }
};

// Use getter functions directly
const reducer = (state: State = initState, action: Action<any>): State => {
  switch (action.type) {
    case fetchDataRoutine.SUCCESS: {
      // payload is typed as Action<DataType>
      const payload = fetchDataRoutine.getSuccessPayload(action);
      // ...
      break;
    }
    case fetchDataRoutine.FAILURE: {
      // error is typed as Error
      const error = fetchDataRoutine.getFailurePayload(action);
      // ...
      break;
    }
  }
};
```

## How to use `getState` with `getThunkActionCreator`?

Well, there is a debate of using `getState` in action creators and it was indexed in [this blog](https://blog.isquaredsoftware.com/2017/01/idiomatic-redux-thoughts-on-thunks-sagas-abstraction-and-reusability/).

IMO, it is better to let the component to select all required states before dispatching a `thunk`. Because the flow and logic of `thunk` looks simpler in this way and it is easier to test.

According to that, there is no `getState` paramater passed to the executor function when using `getThunkActionCreator`.

However, if you need to call `getState` in some cases, you can do it by defining another thunk action creator to dispatch the `thunk` created by `routine`:

```typescript
// Imagine we defined a thunk action creator from routine
const fetchData = getThunkActionCreator(fetchDataRoutine, async (id: number) => {
  return await api.fetchData(id);
});

// We could write another thunk action creator to access the existing state
const fetchDataWithIdFromState = () => (dispatch: Dispatch, getState: () => RootState) => {
  const id = getState().somewhere.id;
  return dispatch(fetchData(id));
};
```

## Other benefits of using routines

When using `routine`, we are enforced to follow a common pattern to name our action types. This gives us a huge advantage if we want to pull out more repetitive logic in reducers.

For example, we can implement a global loading reducer and a global error reducer based on regular expression to match action types, then remove the branches of dealing "REQUEST" and "FAILURE" actions in other reducers.

There are more details in [this blog](https://medium.com/@zzdjk6/implement-global-loading-and-error-state-with-redux-thunk-routine-and-typescript-b278f93e99fd?source=friends_link&sk=2435bafc1714b4018116f475f865a62a).
