import { projectAuth } from '../firebase/config';

let error: string | null = null;

const login = async (email: string, password: string) => {
  error = null;

  try {
    const res = await projectAuth.signInWithEmailAndPassword(email, password);
    error = null;

    return res;
  } catch (err) {
    if (typeof err === 'object' && err !== null && 'message' in err) {
      error = (err as Error).message;
    } else {
      error = 'Error desconocido';
    }

    console.log(error);
  }
};

const userLogin = () => {
  return { error, login };
};

export default userLogin;
