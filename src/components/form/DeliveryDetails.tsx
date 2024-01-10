import MyTextInput from './MyTextInput';

import { FieldInputProps, FieldConfig } from 'formik';

interface MyFormData {
  isFlat: boolean;
  name: string;
}
interface DeliveryDetailsProps {
  getFieldProps: (
    nameOrOptions: string | FieldConfig<MyFormData>
  ) => FieldInputProps<MyFormData>;
}

const DeliveryDetails = ({ getFieldProps }: DeliveryDetailsProps) => {
  return (
    <>
      <hr className="my-6 border border-black border-opacity-50 md:w-6/12" />

      <a className="font-antonio mb-2 font-bold text-2xl">DIRECCIÓN:</a>
      <MyTextInput
        label="Dirección"
        name="address"
        type="text"
        placeholder="CALLE Y NÚMERO"
        autoComplete="address-line1"
      />

      <div className="flex flex-row items-center mb-2">
        <label
          htmlFor="isFlat"
          className="text-sm font-medium text-gray-700 cursor-pointer"
        >
          <div className="flex flex-row font-antonio text-xs items-center">
            <input
              type="checkbox"
              name="isFlat"
              id="isFlat"
              className="mr-2 cursor-pointer w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              checked={!!getFieldProps('isFlat').value} // Utiliza !! para convertir MyFormData a un booleano
              onChange={getFieldProps('isFlat').onChange}
            />
            ES UN DEPARTAMENTO
          </div>
        </label>
      </div>
      {getFieldProps('isFlat').value ? (
        <MyTextInput
          label="Piso y número"
          name="floorAndNumber"
          type="text"
          placeholder="PISO Y NÚMERO"
          autoComplete="off"
        />
      ) : null}
      <hr className="my-6 border border-black border-opacity-50 md:w-6/12" />

      <>
        <a className="font-antonio mb-2 font-bold text-2xl">
          ACLARACIONES PARA EL CADETE:
        </a>

        <MyTextInput
          label="Referencias"
          name="references"
          type="text"
          placeholder="COLOR, PLANTAS, ARBOLES, ENTRE OTROS"
          autoComplete="off"
        />
      </>
    </>
  );
};

export default DeliveryDetails;
