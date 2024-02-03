import { ChangeEvent, FormEvent, useState } from 'react';
import { obtenerFechaActual } from '../../helpers/dateToday';
import { UploadExpense, ExpenseProps } from '../../firebase/UploadGasto';
import Swal from 'sweetalert2';

export const FormGasto = () => {
  const [formData, setFormData] = useState<ExpenseProps>({
    description: '',
    total: 0,
    category: '',
    fecha: obtenerFechaActual(),
    name: '',
    quantity: 0,
    unit: '',
    id: '',
  });

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: name === 'total' ? parseInt(value) : value,
    }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    UploadExpense(formData)
      .then((result) => {
        Swal.fire({
          icon: 'success',
          title: `Gasto cargado`,
          text: `El gasto ${result.id} se cargó correctamente`,
        });
      })
      .catch((error) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: `Hubo un error al cargar el gasto: ${error}`,
        });
      });

    setFormData({
      description: '',
      total: 0,
      category: '',
      fecha: obtenerFechaActual(),
      name: '',
      quantity: 0,
      unit: '',
      id: '',
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid font-antonio font-black ml-2 bg-custom-red"
    >
      <div className="item-section">
        <div className="section">
          <label htmlFor="name">Nombre del Ítem:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="section">
          <label htmlFor="quantity">Cantidad:</label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            required
          />
        </div>
        <div className="section">
          <label htmlFor="unit">Unidad de Medida:</label>
          <input
            type="text"
            id="unit"
            name="unit"
            value={formData.unit}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="section">
        <label htmlFor="total">Total $:</label>
        <input
          type="number"
          id="total"
          name="total"
          value={formData.total}
          onChange={handleChange}
          required
        />
      </div>
      <div className="section">
        <label htmlFor="description">Descripción:</label>
        <input
          type="text"
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
        />
      </div>

      <div className="section">
        <label htmlFor="category">Categoría:</label>
        <input
          type="text"
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
        />
      </div>

      <div className="section">
        <label htmlFor="fecha">Fecha:</label>
        <input
          type="string"
          id="fecha"
          name="fecha"
          value={formData.fecha}
          onChange={handleChange}
          required
        />
      </div>

      <button type="submit">Guardar</button>
    </form>
  );
};
