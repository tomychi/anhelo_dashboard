import { UserState } from './authReducer';

export const loginSuccess = (user: UserState) => {
  return {
    type: 'LOGIN_SUCCESS',
    payload: user,
  };
};
