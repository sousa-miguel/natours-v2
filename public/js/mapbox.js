/* eslint-disable */

import mapboxgl from 'mapbox-gl';

export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1Ijoic291c2EtbWlndWVsIiwiYSI6ImNsMjNlbTZwYzBhcjczZXA5bDgzeHJ1YzIifQ.A2akATZ_KhlMejOUn_bXyg';

  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/sousa-miguel/cl23fuyf0000d15p8re7pwkee',
    scrollZoom: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  const boundOptions = {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  };

  map.fitBounds(bounds, boundOptions);
};
