import { useEffect, useState } from 'react';
import currencyFormat from '../helpers/currencyFormat';

import {
  getFirestore,
  collection,
  addDoc,
  DocumentReference,
} from 'firebase/firestore';
import { ProductoMaterial } from '../types/types';
import { ReadMateriales } from '../firebase/Materiales';
import { DataProps } from './DynamicForm';
import { ReadDataSell } from '../firebase/ReadData';
import { calcularCostoHamburguesa } from '../helpers/calculator';
import { Ingredients } from '../components/gastos';
export const UploadMateriales = (
  materiales: ProductoMaterial[]
): Promise<DocumentReference[]> => {
  const firestore = getFirestore();
  const materialesCollectionRef = collection(firestore, 'materiales');

  // Mapear cada material para subirlo a la base de datos
  const uploadPromises: Promise<DocumentReference>[] = materiales.map(
    async (material) => {
      try {
        // Agregar el material a la colección 'materiales'
        const docRef = await addDoc(materialesCollectionRef, material);
        return docRef;
      } catch (error) {
        console.error('Error al subir el material:', error);
        throw error;
      }
    }
  );

  return Promise.all(uploadPromises);
};

export const Neto = () => {
  const [materiales, setMateriales] = useState<ProductoMaterial[]>([]);
  const [productos, setProductos] = useState<DataProps[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<DataProps | null>(
    null
  );
  const [materialesCargados, setMaterialesCargados] = useState(false);

  const openModal = (product: DataProps) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };
  const readMateriales = async () => {
    const rawData = await ReadMateriales();
    setMateriales(rawData);
  };

  useEffect(() => {
    const getData = async () => {
      await readMateriales();
      setMaterialesCargados(true);
    };

    if (!materialesCargados) {
      getData();
    }
  }, [materialesCargados]);

  useEffect(() => {
    const cargarProductos = async () => {
      if (materialesCargados && productos.length === 0) {
        const rawData = await ReadDataSell();
        const formattedData: DataProps[] = rawData.map((item) => ({
          description: item.data.description,
          img: item.data.img,
          name: item.data.name,
          price: item.data.price,
          type: item.data.type,
          ingredients: item.data.ingredients,
          id: item.id,
          costo: calcularCostoHamburguesa(materiales, item.data.ingredients),
        }));
        setProductos(formattedData);
        setIsLoading(false);
      }
    };

    cargarProductos();
  }, [productos, materialesCargados, materiales]);

  if (isLoading) {
    return <p>Cargando...</p>;
  }

  return (
    <div className="flex p-4 gap-4  justify-between flex-row w-full">
      <div className="w-4/5 flex flex-col gap-4">
        <table className=" h-min w-full font-antonio text-sm text-left rtl:text-right text-black">
          <thead className="text-xs  uppercase text-black border border-red-main bg-custom-red ">
            <tr>
              <th scope="col" className="px-6 py-3">
                Productos
              </th>
              <th scope="col" className="px-6 py-3">
                Categoria
              </th>
              <th scope="col" className="px-6 py-3">
                costo
              </th>
              <th scope="col" className="px-6 py-3">
                precio venta
              </th>
              <th scope="col" className="px-6 py-3">
                Ganancia
              </th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p: DataProps, index: number) => (
              <tr
                key={index}
                className="bg-black text-custom-red uppercase font-black border border-red-main"
              >
                <th
                  scope="row"
                  className="px-6 py-4 font-black text-custom-red whitespace-nowrap"
                >
                  {p.name}
                </th>
                <td className="px-6 py-4">{p.type}</td>
                <td
                  className="px-6 py-4 cursor-pointer hover:bg-custom-red hover:text-black"
                  onClick={() => openModal(p)}
                >
                  {currencyFormat(p.costo)}
                </td>

                <td className="px-6 py-4">
                  {currencyFormat(Math.ceil(p.costo * 2.3))}
                </td>
                <td className="px-6 py-4">
                  {currencyFormat(p.costo * 2.3 - p.costo)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {modalOpen && selectedProduct && (
          <Ingredients
            selectedProduct={selectedProduct}
            setModalOpen={setModalOpen}
            materiales={materiales}
          />
        )}
        <h1 className="text-custom-red font-antonio text-8xl font-black">
          ENVIOS:
        </h1>
        <h2 className="text-custom-red font-antonio text-2xl font-black">
          JUEVES $20.000 <br />
          VIERNES, SABADO & DOMINGO $30.000
        </h2>
      </div>
      <div className="w-1/5">
        <table className=" h-min w-full font-antonio text-sm text-left rtl:text-right text-black">
          <thead className="text-xs  uppercase text-black border border-red-main bg-custom-red ">
            {/* Encabezados de la tabla */}
            <tr>
              <th scope="col" className="px-6 py-3">
                materiales
              </th>
              <th scope="col" className="px-6 py-3">
                precio
              </th>
            </tr>
          </thead>
          <tbody>
            {materiales.map((m: ProductoMaterial, index: number) => (
              <tr
                key={index}
                // className="bg-black text-custom-red uppercase font-black border border-red-main"
                draggable
                className={
                  'bg-black text-custom-red uppercase font-black border border-red-main cursor-pointer'
                }
              >
                <th
                  scope="row"
                  className="px-6 py-4 font-black text-custom-red whitespace-nowrap"
                >
                  {m.nombre}
                </th>
                <td className="px-6 py-4">{currencyFormat(m.costo)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
