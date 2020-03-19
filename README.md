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

I use `redux` and `redux-thunk` in my day-to-day work, and they do really great job to help manage the states of my application.

However, I find that I have to write a lot of boilerplate code for each asynchronous action, and it is even more tedious to add static type checking (i.e. use TypeScript).

That's why I created `redux-thunk-routine`, a small libary to reduce the boilerplate and improve the support of static typing.

## Elevator Pitch

- This libary can save your time (less boilerplate and better static typing)
- It can also generalize the flow of dispatching actions (example: [Global Loading & Error State](https://github.com/zzdjk6/demo-global-loading-state))
- There is no harm to your existing code when you add this library
- It comes with drop-in replacement to your hand-writen code as well as helpers to simplify more
- Test Coverage is 100%

## Understand routine in 1 minute

So what is a `routine`? Let's explain it with an example.

Imagine that we are creating an asynchronous action to fetch data using API, we might write the typical code like below:

```typescript
// 1. Define Constants

// These constants are used as action types
const FETCH_DATA_REQUEST = 'FETCH_DATA/REQUEST';
const FETCH_DATA_SUCCESS = 'FETCH_DATA/SUCCESS';
const FETCH_DATA_FAILURE = 'FETCH_DATA/FAILURE';
```

```typescript
// 2. Define Synchronous Action Creators

// We are creating Flux Standard Actions
const fetchDataRequest = (payload?: any) => ({
  type: FETCH_DATA_REQUEST,
  payload
});

const fetchDataSuccess = (payload: DataType) => ({
  type: FETCH_DATA_SUCCESS,
  payload
});

const fetchDataFailure = (payload: Error) => ({
  type: FETCH_DATA_FAILURE,
  payload,
  error: true
});

// Note: There is a simplied version below to define action creators using `redux-action` library.
// But we still have to define the types manually for each of them
const fetchDataRequest: (payload?: any) => Action<any> = createAction(FETCH_DATA_REQUEST);
const fetchDataSuccess: (payload: DataType) => Action<DataType> = createAction(FETCH_DATA_SUCCESS);
const fetchDataFailure: (payload: Error) => Action<Error> = createAction(FETCH_DATA_FAILURE);
```

```typescript
// 3. Define thunk action creator

// The outer function is called "Thunk Action Creator"
const fetchData = (id: number) => {
  // The inner function is called "Thunk Action"
  return async (dispatch: Dispatch) => {
    dispatch(fetchDataRequest(id));
    try {
      const data = await api.fetchData(id);
      return dispatch(fetchDataSuccess(data));
    } catch (e) {
      dispatch(fetchDataFailure(e));
      throw e;
    }
  };
};
```

```typescript
// 4. Handle actions in reducers

// Define Types for actions
type FetchDataRequestAction = {
  type: typeof FETCH_DATA_REQUEST;
  payload: any;
};

type FetchDataSuccessAction = {
  type: typeof FETCH_DATA_SUCCESS;
  payload: DataType;
};

type FetchDataFailureAction = {
  type: typeof FETCH_DATA_FAILURE;
  payload: Error;
  error: boolean;
};

// Make a union type
type ValidAction = FetchDataRequestAction | FetchDataSuccessAction | FetchDataFailureAction;

// In each condition branch, the type of action will be inferred
const reducer = (state: State = {}, action: ValidAction): State => {
  // When receive REQUEST action, switch on the loading flag and clear the error
  if (action.type === FETCH_DATA_REQUEST) {
    // action: FetchDataRequestAction
    return {
      ...state,
      isFetching: true,
      error: null
    };
  }

  // When receive SUCCESS action, store the data, switch off the loading flag, and clear the error
  if (action.type === FETCH_DATA_SUCCESS) {
    // action: FetchDataSuccessAction
    const data = action.payload;
    return {
      ...state,
      isFetching: false,
      data: action.payload,
      error: null
    };
  }

  // When receive FAILURE action, store the error and switch off the loading flag
  if (action.type === FETCH_DATA_FAILURE) {
    // action: FetchDataFailureAction
    const error = action.payload;
    return {
      ...state,
      isFetching: false,
      error: action.payload
    };
  }
};
```

```typescript
// 5. Dispatch the thunk action to start the asynchronous journey

store.dispatch(fetchData(id));
```

Looking at the example, we see that for every asynchronous action:

1. We have to define 3 constants: `REQUEST`, `SUCCESS`, `FAILURE`
2. We have to define 3 synchronous action creators: `request`, `success`, `failure`
3. We have to write same logic flow of dispatching actions: request -> side effects -> success/failure
4. We have to write a lot of type definitions to make the static type checking works

What if I tell you that there is a smart thing called `routine` to wipe these repetitive work out?

If we rewrite the previous example using `routine`, we can have a minimum example like below:

```typescript
// 1. Define a routine
const fetchDataRoutine = createThunkRoutine<DataType>('FETCH_DATA');

// 2. Get the thunk action creator
const fetchData = getThunkActionCreator(fetchDataRoutine, async (id: number) => {
  return await api.fetchData(id);
});

// 3. Write the reducer
const reducer = (state: State = {}, action: Action<any>): State => {
  // We only focus on SUCCESS action here
  // We will discuss how to deal with REQUEST and ERROR actions later (using a more elegant way)
  if (fetchDataRoutine.isSuccessAction(action)) {
    const data = action.payload;
    return {
      ...state,
      data
    };
  }
};

// 4. Dispatch the thunk action
store.dispatch(fetchData(id));
```

## API Explain

### Define Routine

We only need to provide 2 basic information: type of success payload and a string as routine type.

```typescript
const fetchDataRoutine = createThunkRoutine<DataType>('FETCH_DATA');
```

Option: we can explicitly decalre the error type if need

```typescript
const fetchDataRoutine: createThunkRoutine<DataType, Error>('FETCH_DATA')
```

When define a `routine`, we have the following things automatically generated for us:

- 3 action types:
  - `routine.REQUEST`
  - `routine.SUCCESS`
  - `routine.FAILURE`
- 3 synchronous action creators:
  - `routine.request()`
  - `routine.success()`
  - `routine.failure()`
- 3 methods to match actions (also as type guards):
  - `routine.isRequestAction()`
  - `routine.isSuccessAction()`
  - `routine.isFailureAction()`

### Get Thunk Action Creator

When use helper function, we just need to provide the routine and the async function to create success payload:

```typescript
const fetchData = getThunkActionCreator(fetchDataRoutine, async (id: number) => {
  return await api.fetchData(id);
});
```

> Note: if you have multiple arguments to pass here, you can pack them as an object. (e.g., {arg1: 1, arg2: 'B'}). It sounds like "named arguments" in some other languages, and it is easier to infer type signature of the generated Thunk Action in this way.

It is equal to use the synchronous action creators manually:

```typescript
const fetchData = (id: number) => async (dispatch: Dispatch) => {
  dispatch(fetchDataRoutine.request(id));
  try {
    const data = await api.fetchData(id);
    return dispatch(fetchDataRoutine.success(data));
  } catch (e) {
    dispatch(fetchDataRoutine.failure(e));
    throw e;
  }
};
```

Obviously, we write much less code using the helper function, but you can always fallback when you have such needs.

Apart from that, the helper function `getThunkActionCreator` also provides an optional 3rd parameter which allows us to provide more options to overwrite how the payload for request action and failure action are generated:

```typescript
const fetchData = getThunkActionCreator(
  fetchDataRoutine,
  async (id: number) => {
    return await api.fetchData(id);
  },
  {
    // [Optional] We can overwrite how we create request payload.
    // Usually we just use this payload to do logging
    getRequestPayload: async (id: number) => {
      return {
        overwrittenPayload: id
      };
    },
    // [Optional] We can overwrite how we create failure payload.
    getFailurePayload: async (e: Error) => {
      return new Error('Overwritten Error!');
    }
  }
);
```

### Get Typed Action Payload In Reducer

We can easily get typed action payload by using type guard match functions (recommend):

```typescript
const reducer = (state: State = initState, action: Action<any>): State => {
  // .isSuccessAction() is a type guard
  if (fetchDataRoutine.isSuccessAction(action)) {
    // action is typed as Action<DataType>, so payload is DataType
    const payload = action.payload;
    // ...
  }

  // .isFailureAction() is a type guard
  if (fetchDataRoutine.isFailureAction(action)) {
    // action is typed as Action<Error>, so error is Error
    const error = action.payload;
    // ...
  }

  // .isRequestAction()
  if (fetchDataRoutine.isRequestAction(action)) {
    // ...
  }
};
```

Or we can use the `getXXX` functions:

```typescript
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

### Reducer Signature

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

## Experimental feature: abort/cancel thunk action

Since `1.1.0-beta.0`, if your `ThunkAction` is created by using `getThunkActionCreator`, then the `Promise` returned by `ThunkAction` can be aborted.

That is, we can write the code below to abort the execution of `ThunkAction`:

```typescript
// `fetchData` is the thunk action creator
const promise = dispatch(fetchData(id));

// Abort without reason
promise.abort();

// Abort with reason
promise.abort('I abort it');
```

When aborted, the `Promise` will be rejected with an `AbortError`, and the `AbortError` will be dispatched as the payload of failure action.

Under the ground, it is using `AbortablePromise` from [simple-abortable-promise](https://github.com/zzdjk6/simple-abortable-promise).

If your `getSuccessPayload` function returns an `AbortablePromise`, then that `Promise` will be aborted as well when the `Promise` returned by `ThunkAction` is aborted. Otherwise, the logic of `getSuccessPayload` will still be executed, and the result will be ignored.

## Other benefits of using routines

When using `routine`, we are enforced to follow a common pattern to name our action types, and we are sure that each routine has the same flow of dispatching actions. That gives us a huge advantage if we want to pull out repetitive logic in reducers.

For example, we can implement a global loading reducer and a global error reducer based on regular expression to match action types, then remove the branches of dealing "REQUEST" and "FAILURE" actions in other reducers.

Quick example here:

```typescript
// We start with defining the LoadingState

// The shape of LoadingState is a hashmap-like object
// Example: {
//   FETCH_BLOG: true,
//   FETCH_USER: false,
// }
//
export type LoadingState = Record<string, boolean>;

// Then we write the reducer to handle the logic of changing the global loading state

export default (state: LoadingState = {}, action: Action<any>): LoadingState => {
  const { type } = action;
  const matches = /(.*)\/(REQUEST|SUCCESS|FAILURE)/.exec(type);

  // Ignore non-routine actions:
  //   A routine action should have one of three suffixes:
  //   ['/REQUEST', '/SUCCESS', '/FAILURE']
  if (!matches) return state;

  const [, routineType, status] = matches;
  return {
    ...state,
    // Set loading state to true only when the status is "REQUEST"
    //    Otherwise set the loading state to false
    [routineType]: status === 'REQUEST'
  };
};

// Then we can write some selectors to use it

// Select whether any routine is loading
export const isLoadingAnyRoutine = (state: RootState) => {
  return Object.values(state.ui.loading).some(Boolean);
};

// Select whether a given routine is loading
export const isLoadingRoutine = (routineType: string) => (state: RootState) => {
  return Boolean(state.ui.loading[routineType]);
};

// Select whether any of a given set of routines is loading
export const isLoadingAnyRoutineOf = (routineTypes: string[]) => (state: RootState) => {
  return routineTypes.some(routineType => Boolean(state.ui.loading[routineType]));
};
```

There are more details in [this blog](https://medium.com/@zzdjk6/implement-global-loading-and-error-state-with-redux-thunk-routine-and-typescript-b278f93e99fd?source=friends_link&sk=2435bafc1714b4018116f475f865a62a).

## FAQ

### Can I use this library in JavaScript projects without introducing TypeScript?

Yes, the library itself is written in TypeScript and compiled to ES6 with a `.d.ts` file for type definition.

That is, it still can reduce boilerplate when use in a plain JavaScript project.

### Can I use this library in my current project? How hard it is to migrate existing code?

Sure, this library is a very thin abstraction layer built on top of `redux-thunk`, and there is no conflict to the foundation library. That is, it is totally harmless to add this library to your current project.

When introducing new library, I would suggest to start using it for new features only to test if it fits your needs before considering to migrate existing codebase. Once you have some experience with it, the migration path should be clear.

## Acknoledgement

This library uses [redux-actions](https://github.com/redux-utilities/redux-actions) to create [Flux Standard Actions](https://github.com/redux-utilities/flux-standard-action)

This library is inspired by [redux-saga-routines](https://github.com/afitiskin/redux-saga-routines).
