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

`redux-thunk` gives us the ability to create asynchronous actions for `redux`, that's awesome! However, it seems that we have to write a lot of boilerplate code for each asynchronous action, and things are even worse when adding static type checking (i.e. TypeScript).

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

// Note: There is a simplied version below to define action creators using `redux-action` library.
// But we still have to define the types manually for each of them
const fetchDataRequest: (payload?: any) => Action<any> = createAction(FETCH_DATA_REQUEST);
const fetchDataSuccess: (payload: DataType) => Action<DataType> = createAction(FETCH_DATA_SUCCESS);
const fetchDataFailure: (payload: Error) => Action<Error> = createAction(FETCH_DATA_FAILURE);

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
if (action.type === FETCH_DATA_REQUEST) {
  return {
    ...state,
    isFetching: true,
    error: null
  };
}
if (action.type === FETCH_DATA_SUCCESS) {
  return {
    ...state,
    isFetching: false,
    data: action.payload,
    error: null
  };
}
if (action.type === FETCH_DATA_FAILURE) {
  return {
    ...state,
    isFetching: false,
    error: action.payload
  };
}
```

Looking at the example, we see that for every asynchronous action:

1. We have to define 3 constants: `REQUEST`, `SUCCESS`, `FAILURE`
2. We have to define 3 synchronous action creators: `request`, `success`, `failure`
3. We have to write same logic flow of dispatching actions: request -> side effects -> success/failure

What if I tell you that there is a smart thing called `routine` to wipe these repetitive work out?

Let's have a look at the `routine` version of the previous example:

```typescript
// 1. Define a routine
const fetchDataRoutine = createThunkRoutine<DataType>('FETCH_DATA');
// Or explicitly decalre the error type if need
// const fetchDataRoutine: createThunkRoutine<DataType, Error>('FETCH_DATA')

// 2. Define the thunk action creator
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
// Note: The code above can be simplified one step further using
// `getThunkActionCreator` like below (we will discuss it later):
const fetchData = getThunkActionCreator(fetchDataRoutine, api.fetchData);

// 3. Handle actions in reducers
// We will discuss type guard helper functions later
if (action.type === fetchDataRoutine.REQUEST) {
  return {
    ...state,
    isFetching: true,
    error: null
  };
}
if (action.type === fetchDataRoutine.SUCCESS) {
  return {
    ...state,
    isFetching: false,
    data: action.payload,
    error: null
  };
}
if (action.type === fetchDataRoutine.FAILURE) {
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

In the example, we dispatch 3 synchronous actions mannually:

```typescript
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
```

By using a helper function called `getThunkActionCreator`, we could simplied it to the code below:

```typescript
const fetchData = getThunkActionCreator(fetchDataRoutine, async (id: number) => {
  return await api.fetchData(id);
});
```

Even better, we could get the code compact as one line:

```typescript
const fetchData = getThunkActionCreator(fetchDataRoutine, api.fetchData);
```

The actual flow is the same, but we write much less code.

That is, we could focus on the side effects of each asynchronous action instead of the general flow.

Apart from that, the helper function `getThunkActionCreator` also provides an optional 3rd parameter which allows us to overwrite how the payload for request action and failure action are generated:

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

### Type checking for reducer

By using `redux-thunk-routine`, the type of payloads are already checked when dispatching, so it is safe to put `Action<any>` when define the reducer:

```typescript
const reducer = (state: State = initState, action: Action<any>): State => {
  // The reducer logic goes here...
};
```

If needed, strictly adding types of actions is also possible:

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

- `routine.isRequestAction()`
- `routine.isSuccessAction()`
- `routine.isFailureAction()`
- `routine.getRequestPayload()`
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

IMO, it is better to let the component to select all required states before dispatching a thunk action. Because the flow looks simpler in this way and it is easier to test.

According to that, there is no `getState` paramater passed to the executor function when using `getThunkActionCreator`.

However, if you need to call `getState` in some cases, you can do it by defining another thunk action creator to dispatch the thunk action created by `routine`:

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

When using `routine`, we are enforced to follow a common pattern to name our action types, and we are sure that each routine has the same flow of dispatching actions. That gives us a huge advantage if we want to pull out repetitive logic in reducers.

For example, we can implement a global loading reducer and a global error reducer based on regular expression to match action types, then remove the branches of dealing "REQUEST" and "FAILURE" actions in other reducers.

There are more details in [this blog](https://medium.com/@zzdjk6/implement-global-loading-and-error-state-with-redux-thunk-routine-and-typescript-b278f93e99fd?source=friends_link&sk=2435bafc1714b4018116f475f865a62a).
