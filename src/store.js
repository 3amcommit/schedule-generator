import {createStore} from 'redux';

const reducer = (state, action) => {
    if(state === undefined) {
        return [];
    }
    return action.courses;
}

export const store = createStore(reducer);


