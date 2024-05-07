import { feature, point, featureCollection } from '@turf/turf';
import { FeatureCollection } from 'geojson';
import mapboxgl from 'mapbox-gl';
import { CoordinatesProps, PointHopper } from '../types/map';

export const assembleQueryURL = (
  restaurantLocation: [number, number],
  warehouseLocations: [number, number][],
  pointHopper: PointHopper,
  lastAtRestaurant: number
) => {
  // Store the location of the truck in a variable called coordinates
  const coordinates = [restaurantLocation];
  const distributions = [];
  let restaurantIndex;
  // Crear una característica geoespacial para representar la ubicación del camión

  // Create an array of GeoJSON feature collections for each point
  const restJobs = Object.keys(pointHopper).map((key) => pointHopper[key]);

  // If there are actually orders from this restaurant
  if (restJobs.length > 0) {
    // Check to see if the request was made after visiting the restaurant
    const needToPickUp =
      restJobs.filter(
        (d) =>
          d.properties &&
          d.properties.orderTime &&
          d.properties.orderTime > lastAtRestaurant
      ).length > 0;

    // If the request was made after picking up from the restaurant,
    // Add the restaurant as an additional stop
    if (needToPickUp) {
      restaurantIndex = coordinates.length;
      // Agregar las ubicaciones de los almacenes al arreglo de coordenadas
      coordinates.push(...warehouseLocations);
    }

    for (const job of restJobs) {
      // Add dropoff to list
      coordinates.push(job.geometry.coordinates as [number, number]);
      // if order not yet picked up, add a reroute
      if (needToPickUp && job.properties?.orderTime > lastAtRestaurant) {
        distributions.push(`${restaurantIndex},${coordinates.length - 1}`);
      }
    }
  }

  // Set the profile to `driving`
  // Coordinates will include the current location of the truck,
  return `https://api.mapbox.com/optimized-trips/v1/mapbox/driving/${coordinates.join(
    ';'
  )}?distributions=${distributions.join(
    ';'
  )}&overview=full&steps=true&geometries=geojson&source=first&access_token=${
    mapboxgl.accessToken
  }`;
};

export const newDropoff = async (
  coordinates: CoordinatesProps,
  restaurantLocation: [number, number],
  warehouseLocations: [number, number][],
  dropoffs: FeatureCollection,
  lastAtRestaurant: number,
  pointHopper: PointHopper,
  map: mapboxgl.Map
) => {
  // Store the clicked point as a new GeoJSON feature with
  // two properties: `orderTime` and `key`
  const pt = point([coordinates.lng, coordinates.lat], {
    orderTime: Date.now(),
    key: Math.random(),
  });

  dropoffs.features.push(pt);
  if (pt.properties) {
    pointHopper[pt.properties.key] = pt;
  }

  // Make a request to the Optimization API
  const query = await fetch(
    assembleQueryURL(
      restaurantLocation,
      warehouseLocations,
      pointHopper,
      lastAtRestaurant
    ),
    { method: 'GET' }
  );
  const response = await query.json();

  // Create an alert for any requests that return an error
  if (response.code !== 'Ok') {
    const handleMessage =
      response.code === 'InvalidInput'
        ? 'Refresh to start a new route. For more information: https://docs.mapbox.com/api/navigation/optimization/#optimization-api-errors'
        : 'Try a different point.';
    alert(`${response.code} - ${response.message}\n\n${handleMessage}`);
    // Remove invalid point
    dropoffs.features.pop();
    if (pt.properties && pt.properties.key) {
      delete pointHopper[pt.properties.key];
    }

    return;
  }

  // Create a GeoJSON feature collection
  const routeGeoJSON = featureCollection([feature(response.trips[0].geometry)]);

  const routeSource = map.getSource('route') as
    | mapboxgl.GeoJSONSource
    | undefined;
  if (routeSource) {
    routeSource.setData(routeGeoJSON);
  } else {
    console.error('Route source not found');
  }
};

export const updateDropoffs = (
  map: mapboxgl.Map,
  geojson: FeatureCollection
) => {
  const routeSource = map.getSource('dropoffs-symbol') as
    | mapboxgl.GeoJSONSource
    | undefined;
  if (routeSource) {
    routeSource.setData(geojson);
  } else {
    console.error('dropoffs symbol source not found');
  }
};
