import { User } from "./authReducer";

export const loginSuccess = (user: User) => {
	return {
		type: "LOGIN_SUCCESS",
		payload: user,
	};
};

export const logoutSuccess = () => {
	return {
		type: "LOGOUT_SUCCESS",
	};
};
