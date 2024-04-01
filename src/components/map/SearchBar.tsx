import { ChangeEvent, useRef, useContext } from 'react';
import { SearchResults } from '.';
import { PlacesContext } from '../../context';

export const SearchBar = () => {
  const { searchPlacesByOrder } = useContext(PlacesContext);

  const debouneRef = useRef<NodeJS.Timeout>();

  const onQueryChanged = (event: ChangeEvent<HTMLInputElement>) => {
    if (debouneRef.current) {
      clearTimeout(debouneRef.current);
    }

    debouneRef.current = setTimeout(() => {
      const query = event.target.value;
      searchPlacesByOrder(query);
    }, 350);
  };
  return (
    <div>
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
