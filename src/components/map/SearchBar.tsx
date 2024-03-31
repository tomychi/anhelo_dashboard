import { ChangeEvent, useRef, useContext } from 'react';
import { SearchResults } from '.';
import { PlacesContext } from '../../context';

export const SearchBar = () => {
  const { searchPlacesByTerm } = useContext(PlacesContext);

  const debouneRef = useRef<NodeJS.Timeout>();

  const onQueryChanged = (event: ChangeEvent<HTMLInputElement>) => {
    if (debouneRef.current) {
      clearTimeout(debouneRef.current);
    }

    debouneRef.current = setTimeout(() => {
      const query = event.target.value;
      searchPlacesByTerm(query);
    }, 350);
  };
  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '5px',
        boxShadow: '0px 5px 10px rgba(0, 0, 0, 0.2)',
        padding: '5px',
        position: 'fixed',
        top: '20px',
        width: '250px',
        zIndex: '999',
      }}
    >
      <input
        type="text"
        onChange={onQueryChanged}
        className="w-full px-4 py-3 border rounded-lg shadow-lg bg-white focus:outline-none focus:border-blue-500"
        placeholder="Buscar lugar..."
      />
      <SearchResults />
    </div>
  );
};
