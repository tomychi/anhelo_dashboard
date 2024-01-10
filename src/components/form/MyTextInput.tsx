import { ErrorMessage, useField } from 'formik';

interface MyTextInputProps {
  name: string; // Define el tipo para 'name'
  label?: string;
  type: string;
  placeholder: string;
  autoComplete: string;
  // Otros props aquí si los tienes
}

const MyTextInput = ({ name, ...props }: MyTextInputProps) => {
  const [field] = useField({ ...props, name });

  return (
    <>
      <input
        className="font-antonio focus:border-none focus:outline-none bg-gray-300 text-xs p-2 mb-2 text-black md:w-6/12"
        {...field}
        {...props}
      />
      <ErrorMessage
        name={name}
        component="span"
        className="text-sm text-red-main font-antonio font-light"
      />
    </>
  );
};

export default MyTextInput;
