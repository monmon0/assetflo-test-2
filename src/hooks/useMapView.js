// useMapView.js
import { useState } from 'react';
import { WebMercatorViewport } from 'react-map-gl';

export const useMapView = () => {
  const [viewState, setViewState] = useState({});

  const centerOnPoi = (poi, mapboxStyle) => {
    const { location, zoom, offset } = poi;
    setViewState({
      bearing: offset && offset,
      zoom: mapboxStyle === 'satellite' ? 18.5 : (zoom && zoom) || 24,
      longitude: location.lng,
      latitude: location.lat,
      maxZoom: 22
    });
  };

  const centerOnDevices = (devices, mapRef) => {
    const bbox = getAllDevicesBoundingBox(devices);
    const viewport = new WebMercatorViewport({ width: 800, height: 600 }).fitBounds(
      [
        [bbox[0], bbox[1]],
        [bbox[2], bbox[3]]
      ],
      {
        padding: 0
      }
    );
    const { longitude, latitude, zoom } = viewport;
    setViewState({
      bearing: mapRef.current.getBearing(),
      longitude,
      latitude,
      zoom,
      maxZoom: 22
    });
  };

  return {
    viewState,
    setViewState,
    centerOnPoi,
    centerOnDevices
  };
};
