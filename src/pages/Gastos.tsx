import { ChangeEvent, FormEvent, useState } from 'react';
import { obtenerFechaActual } from '../helpers/dateToday';
import { ExpenseProps, UploadExpense } from '../firebase/UploadGasto';

export const Gastos = () => {
  const [formData, setFormData] = useState<ExpenseProps>({
    descripcion: '',
    total: 0,
    categoria: '',
    fecha: obtenerFechaActual(),
    nombre: '',
    cantidad: 0,
    unidad: '',
  });

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    UploadExpense(formData);
    // Aquí puedes enviar el objeto formData a tu backend o hacer lo que necesites
  };

  console.log(formData);

  return (
    <form
      onSubmit={handleSubmit}
      className="grid fixed font-antonio font-black ml-2 bg-custom-red"
    >
      <div className="section">
        <label htmlFor="descripcion">Descripción del Gasto:</label>
        <input
          type="text"
          id="descripcion"
          name="descripcion"
          value={formData.descripcion}
          onChange={handleChange}
        />
      </div>

      <div className="section">
        <label htmlFor="total">Cantidad Gastada:</label>
        <input
          type="number"
          id="total"
          name="total"
          value={formData.total}
          onChange={handleChange}
        />
      </div>

      <div className="section">
        <label htmlFor="categoria">Categoría del Gasto:</label>
        <input
          type="text"
          id="categoria"
          name="categoria"
          value={formData.categoria}
          onChange={handleChange}
        />
      </div>

      <div className="section">
        <label htmlFor="fecha">Fecha del Gasto:</label>
        <input
          type="string"
          id="fecha"
          name="fecha"
          value={formData.fecha}
          onChange={handleChange}
        />
      </div>

      <div className="item-section">
        <label htmlFor="nombre">Nombre del Ítem:</label>
        <input
          type="text"
          id="nombre"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
        />

        <label htmlFor="cantidad">Cantidad:</label>
        <input
          type="number"
          id="cantidad"
          name="cantidad"
          value={formData.cantidad}
          onChange={handleChange}
        />

        <label htmlFor="unidad">Unidad de Medida:</label>
        <input
          type="text"
          id="unidad"
          name="unidad"
          value={formData.unidad}
          onChange={handleChange}
        />
      </div>

      <button type="submit">Guardar</button>
    </form>
  );
};
