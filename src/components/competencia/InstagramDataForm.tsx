// src/components/InstagramDataForm.tsx
import React, { useState } from 'react';
import { storeInstagramData } from '../../firebase/InstagramData';

export const InstagramDataForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [followers, setFollowers] = useState<number | ''>('');
  const [likes, setLikes] = useState<number | ''>('');
  const [comentarios, setComentarios] = useState<number | ''>('');
  // Formato YYYY-MM-DD
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username && followers !== '') {
      const data = {
        username,
        followers: Number(followers),
        likes: Number(likes),
        comentarios: Number(comentarios),
        date,
      };

      try {
        await storeInstagramData(data);
        alert('Datos guardados con éxito');
        setUsername('');
        setFollowers('');
        setLikes('');
        setComentarios('');
      } catch (error) {
        alert('Error al guardar los datos');
      }
    } else {
      alert('Por favor, completa todos los campos');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
    >
      <div className="mb-4">
        <label
          className="block text-gray-700 text-sm font-bold mb-2"
          htmlFor="username"
        >
          Nombre de Usuario
        </label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          placeholder="Nombre de usuario"
        />
      </div>
      <div className="mb-4">
        <label
          className="block text-gray-700 text-sm font-bold mb-2"
          htmlFor="followers"
        >
          Seguidores
        </label>
        <input
          type="number"
          id="followers"
          value={followers}
          onChange={(e) => setFollowers(Number(e.target.value))}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          placeholder="Número de seguidores"
        />
      </div>
      <div className="mb-4">
        <label
          className="block text-gray-700 text-sm font-bold mb-2"
          htmlFor="likes"
        >
          Likes
        </label>
        <input
          type="number"
          id="likes"
          value={likes}
          onChange={(e) => setLikes(Number(e.target.value))}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          placeholder="Número de likes"
        />
      </div>
      <div className="mb-4">
        <label
          className="block text-gray-700 text-sm font-bold mb-2"
          htmlFor="comentarios"
        >
          Comentarios
        </label>
        <input
          type="number"
          id="comentarios"
          value={comentarios}
          onChange={(e) => setComentarios(Number(e.target.value))}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          placeholder="Número de comentarios"
        />
      </div>
      <div className="mb-4">
        <label
          className="block text-gray-700 text-sm font-bold mb-2"
          htmlFor="date"
        >
          Fecha
        </label>
        <input
          type="date"
          id="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          placeholder="Fecha"
        />
      </div>
      <div className="flex items-center justify-between">
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Guardar
        </button>
      </div>
    </form>
  );
};
