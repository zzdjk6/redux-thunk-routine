There is too much boilerplate code when using `redux-thunk`!
It becomes even worse when adding static types for `actions`!
Let's find a way to reduce the boilerplate!

Actually, `redux-saga-routines`(https://github.com/afitiskin/redux-saga-routines) is a good option.
But we are not using `redux-saga`, we want static types (using `Typescript` or `Flow`), and we don't need 5 actions for each `routine`, that's why `redux-thunk-routine` is created.

So what is a `routine`? Let's explain it with an example.

Imagine that we want to fetch data using API, we may write the code below:

```typescript
// 1. Define the constants
const FETCH_DATA_REQUEST: string = 'FETCH_DATA/REQUEST';
const FETCH_DATA_SUCCESS: string = 'FETCH_DATA/SUCCESS';
const FETCH_DATA_FAILURE: string = 'FETCH_DATA/FAILURE';

// 2. Define action creators
const fetchDataRequest: () => Action<void> = createAction(FETCH_DATA_REQUEST);
const fetchDataSuccess: (payload: DataType) => Action<DataType> = createAction(FETCH_DATA_SUCCESS);
const fetchDataFailure: (payload: Error) => Action<Error> = createAction(FETCH_DATA_FAILURE);

// 3. Create a thunk
const fetchData = () => async (dispatch: Dispatch, getState: () => RootState) => {
  dispatch(fetchDataRequest());
  try {
    const data = await api.fetchData();
    dispatch(fetchDataSuccess(data));
  } catch (e) {
    dispatch(fetchDataFailure(e));
  }
}

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

By oberving the example, we could see there are at least 3 pain points:

1. We have to define 3 constants for every `thunk`: REQUEST, SUCCESS, FAILURE
2. We have to define 3 action creators for every `thunk`: request, success, failure
3. Adding static types is a time-comsuming and no-brain labor

What if I tell you that there is a smart thing called `routine` to reduce these repeatable work?

Let's see what is the `routine` version of the previous example:

```typescript
// 1. Define a routine
const FetchDataRoutine: createThunkRoutine<DataType, Error>('FETCH_DATA')

// 2. Create a thunk
const fetchData = () => async (dispatch: Dispatch, getState: () => RootState) => {
  dispatch(FetchDataRoutine.request());
  try {
    const data = await api.fetchData();
    dispatch(FetchDataRoutine.success(data));
  } catch (e) {
    dispatch(FetchDataRoutine.failure(e));
  }
}

// 3. Handle actions in reducers
if (action.type === FetchDataRoutine.REQUEST) {
    return {
        ...state,
        isFetching: true,
        error: null
    };
}

if (action.type === FetchDataRoutine.SUCCESS) {
    return {
        ...state,
        isFetching: false,
        data: action.payload,
        error: null
    };
}

if (action.type === FetchDataRoutine.FAILURE) {
    return {
        ...state,
        isFetching: false,
        error: action.payload
    };
}
```

See, there is no need to define `constants` and `action creators` for every `thunk`: `routine` gots them.
And yes, the type for each action is well-defined too!
The type for `FetchDataRoutine.success` is generated as `(payload: DataType) => Action<DataType>` by magic (well, it's generic).

Bonus:

There are 2 util functions to help you get typed payload/error:

```typescript
const data = getTypedPayload(FetchDataRoutine, action);

const error = getTypedError(FetchDataRoutine, action);
```