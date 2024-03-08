import { User } from './authReducer';

export const loginSuccess = (user: User) => {
  return {
    type: 'LOGIN_SUCCESS',
    payload: user,
  };
};
