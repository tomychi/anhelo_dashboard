import { FeatureCollection, Feature, Point } from 'geojson';
import mapboxgl from 'mapbox-gl';
import { PedidoProps } from '../types/map';
import { obtenerDiferenciaHorariaWithColor } from '../helpers/calculateDiffHours';
import { updateCadeteForOrder } from '../firebase/UploadOrder';

interface FeatureProperties {
  cadete: string;
  pedidoInfo: string;
  cadeteOptions: string[];
  fechaPedido: string;
  idPedido: string;
}

export const addDropoffLayer = (
  map: mapboxgl.Map,
  dropoffs: FeatureCollection
) => {
  map.addLayer({
    id: 'dropoffs-symbol',
    type: 'symbol',
    source: {
      data: dropoffs,
      type: 'geojson',
    },
    layout: {
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-image': 'marker-15', // Usa el marcador de Mapbox predeterminado
      'text-allow-overlap': true,
    },
  });
};

export const addTruckMarker = (
  map: mapboxgl.Map,
  restaurantLocation: [number, number]
) => {
  const marker = document.createElement('div');
  marker.classList.add('truck');
  new mapboxgl.Marker(marker).setLngLat(restaurantLocation).addTo(map);
};

export const addWarehouseLayers = (
  map: mapboxgl.Map,
  pedidos: PedidoProps[],
  cadetes: string[],
  setClickMap: (value: { value: boolean; id: string; fecha: string }) => void
) => {
  const warehouseFeatures: Feature<
    Point,
    { id: string; icon: string; cadete: string; pedidoInfo: string }
  >[] = pedidos.map((pedido, index) => {
    // calcular la diferencia de minutos entre la hora de entrada del pedido y la hora actual
    const colorsAsigned = obtenerDiferenciaHorariaWithColor(pedido.hora);

    const cadeteOptions = cadetes
      .map(
        (cadete, index) => `
      
    <option value="${cadete}" key="${index}">
      ${cadete}
    </option>
  `
      )
      .join('');

    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: pedido.map,
      },
      properties: {
        id: `warehouse-${index}`,
        icon: 'grocery-15',
        cadete: pedido.cadete || '',
        fechaPedido: pedido.fecha,
        idPedido: pedido.id,
        pedidoInfo: `${pedido.direccion}`, // Información del pedido para el popup
        iconColor: colorsAsigned, // Nuevo atributo para almacenar el color del ícono

        // Agregar un select con las opciones de cadetes
        cadeteOptions: cadeteOptions,
      },
    };
  });

  const warehouseCollection: FeatureCollection<
    Point,
    { id: string; icon: string; cadete: string; pedidoInfo: string }
  > = {
    type: 'FeatureCollection',
    features: warehouseFeatures,
  };

  map.addLayer({
    id: 'warehouse-triangles',
    type: 'symbol',
    source: {
      type: 'geojson',
      data: warehouseCollection,
    },

    layout: {
      'text-keep-upright': true,
      // texto no desaparezca al hacer zoom
      'text-allow-overlap': true,

      'text-field': [
        'case',
        ['==', ['get', 'cadete'], 'NO ASIGNADO'], // Verifica si el cadete es "NO ASIGNADO"
        '?', // Si es "NO ASIGNADO", muestra el símbolo de interrogación
        '▼', // De lo contrario, muestra el triángulo normal
      ],
      'text-size': 25,
    },
    paint: {
      'text-color': ['get', 'iconColor'],
      'text-halo-width': 2,
      'text-halo-color': 'hsl(55, 11%, 96%)',
    },
  });
  map.on('click', ['warehouse-triangles', 'warehouses'], (e) => {
    if (!e.features || !e.features.length) return;

    const feature = e.features[0];
    let coordinates: mapboxgl.LngLatLike;

    // Verificar el tipo de geometría del feature
    if (
      feature.geometry.type === 'Point' &&
      Array.isArray(feature.geometry.coordinates)
    ) {
      coordinates = feature.geometry.coordinates as [number, number];
    } else {
      // Manejar otros tipos de geometría (si es necesario)
      console.error('Tipo de geometría no compatible:', feature.geometry.type);
      return;
    }

    const { cadete, pedidoInfo, cadeteOptions, idPedido, fechaPedido } =
      feature.properties as FeatureProperties;

    // le podemos agregar al popup un select para que cambiar el cadete a cargo del pedido
    new mapboxgl.Popup()
      .setLngLat(coordinates)
      .setHTML(
        `<div style="font-size: 20px; line-height: 1.5em;"> 
          <h2 style="font-size: 28px; font-weight: bold; margin-bottom: 10px;"> 🛵 ${cadete} </h2>
          <select id="cadeteSelector" style="margin-bottom: 10px;">
    <option value="" key="">
          
          ${cadeteOptions}</select>

          <p>${pedidoInfo}</p>
          <button id="changeCoords" style="margin-top: 10px; padding: 10px; background-color: #3887be; color: white; border: none; border-radius: 5px; cursor: pointer;">Cambiar</button>

          </div>`
      )

      .addTo(map);

    // Agregar un evento de click al botón de cambiar coordenadas
    const changeCoordsButton = document.getElementById('changeCoords');
    changeCoordsButton?.addEventListener('click', () => {
      setClickMap({ value: true, id: idPedido, fecha: fechaPedido });
    });

    // Agregar un evento de cambio al select
    const cadeteSelector = document.getElementById(
      'cadeteSelector'
    ) as HTMLSelectElement;
    cadeteSelector?.addEventListener('click', () => {
      const nuevoCadete = cadeteSelector.value;

      if (!nuevoCadete) return;

      if (nuevoCadete === cadete) return;
      updateCadeteForOrder(fechaPedido, idPedido, nuevoCadete);
    });
  });

  // Cambiar el cursor al pasar sobre las ubicaciones del almacén
  map.on('mouseenter', 'warehouses', () => {
    map.getCanvas().style.cursor = 'pointer';
  });

  // Cambiar el cursor de nuevo cuando no esté sobre las ubicaciones del almacén
  map.on('mouseleave', 'warehouses', () => {
    map.getCanvas().style.cursor = '';
  });
};

export const addRoutes = (map: mapboxgl.Map, nothing: FeatureCollection) => {
  map.addSource('route', {
    type: 'geojson',
    data: nothing,
  });

  map.addLayer(
    {
      id: 'routeline-active',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#3887be',
        'line-width': ['interpolate', ['linear'], ['zoom'], 12, 3, 22, 12],
      },
    },
    'waterway-label'
  );

  map.addLayer(
    {
      id: 'routearrows',
      type: 'symbol',
      source: 'route',
      layout: {
        'symbol-placement': 'line',
        'text-field': '▶',
        'text-size': ['interpolate', ['linear'], ['zoom'], 12, 24, 22, 60],
        'symbol-spacing': [
          'interpolate',
          ['linear'],
          ['zoom'],
          12,
          30,
          22,
          160,
        ],
        'text-keep-upright': false,
      },
      paint: {
        'text-color': '#3887be',
        'text-halo-color': 'hsl(55, 11%, 96%)',
        'text-halo-width': 3,
      },
    },
    'waterway-label'
  );
};
