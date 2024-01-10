import { UserAuth } from './authReducer';

export const loginSuccess = (user: UserAuth) => {
  return {
    type: 'LOGIN_SUCCESS',
    payload: user,
  };
};
