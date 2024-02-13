import { useEffect, useState } from 'react';
import { ExpenseProps } from '../firebase/UploadGasto';
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
import { ReadData } from '../firebase/ReadData';
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
  const [expenseData, setExpenseData] = useState<ExpenseProps[]>([]);
  const [materiales, setMateriales] = useState<ProductoMaterial[]>([]);
  const [prodcutos, setProdcutos] = useState<DataProps[]>([]);

  const readMateriales = async () => {
    const rawData = await ReadMateriales();
    setMateriales(rawData);
  };

  const getData = async () => {
    if (prodcutos.length === 0) {
      const rawData = await ReadData();
      const formattedData: DataProps[] = rawData.map((item) => {
        return {
          description: item.data.description,
          img: item.data.img,
          name: item.data.name,
          price: item.data.price,
          type: item.data.type,
        };
      });
      setProdcutos(formattedData);
      readMateriales();
    }
  };

  useEffect(() => {
    getData();
  });

  console.log(prodcutos);

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
            {prodcutos.map((p: DataProps, index: number) => (
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
              </tr>
            ))}
          </tbody>
        </table>
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
                className="bg-black text-custom-red uppercase font-black border border-red-main"
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
