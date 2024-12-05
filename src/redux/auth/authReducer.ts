export interface User {
	uid: string;
	email: string;
}

export interface UserState {
	user: User;
	isAuth: boolean;
}

interface AuthAction {
	type: string;
	payload?: UserState;
}

const initialState = {
	user: {
		uid: "",
		email: "",
	},
	isAuth: false,
};

const authReducer = (state = initialState, action: AuthAction) => {
	switch (action.type) {
		case "LOGIN_SUCCESS":
			console.log("🔵 Login Success - Estado anterior:", state);
			console.log("🔵 Login Success - Payload recibido:", action.payload);
			const loginState = {
				...state,
				isAuth: true,
				user: action.payload,
			};
			console.log("🔵 Login Success - Nuevo estado:", loginState);
			return loginState;

		case "LOGOUT_SUCCESS":
			console.log("🔴 Logout Success - Estado anterior:", state);
			console.log("🔴 Logout Success - Volviendo a estado inicial");
			return {
				...initialState,
			};

		default:
			return state;
	}
};

export default authReducer;
