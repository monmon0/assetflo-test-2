import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Accordion from '@mui/material/Accordion';
import AccordionActions from '@mui/material/AccordionActions';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Button from '@mui/material/Button';
import * as turf from '@turf/turf';

import { isValidLocation } from '../../util/validation';

function FloorList({ map, loaded }) {
  const [selectedPoi, setSelectedPoi] = useState(-1);
  const [isAccordionExpanded, setIsAccordionExpanded] = useState(false);
  const pois = useSelector((state) => state.map.pois);
  const screenWidth = useSelector((state) => state.location.screenWidth);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const accordionElement = document.getElementById('poi-list');
      if (accordionElement && !accordionElement.contains(event.target)) {
        setIsAccordionExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getImageDimensions = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = function () {
        // console.log('getImageDimensions', { width: img.naturalWidth, height: img.naturalHeight });
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = function () {
        reject(new Error('Could not load image'));
      };
      img.src = url;
    });
  };

  const addPoiImage = (poi) => {
    const poisImgLayer = map.getLayer(`poi-layer`);
    const poisImgSource = map.getSource(`poi-source`);

    poi.imageUrl &&
      getImageDimensions(poi.imageUrl)
        .then((dimensions) => {
          const { width, height } = dimensions;
          const { lat, lng } = poi.geocoordinates;
          const pixelsPerMeter = poi.pixelsPerMeter;
          const widthInMeters = width / pixelsPerMeter / 2;

          const heightMeters = height / pixelsPerMeter / 2;

          const centerPoint = [lng, lat];
          const offset = ['texas-instruments', 'indoor-assetio'].includes(poi.organization)
            ? poi.offset + 1.3
            : poi.offset;
          const topLeftSide = findDestination(centerPoint, heightMeters, offset + 0); // North
          const topLeft = findDestination(topLeftSide, widthInMeters, offset - 90);
          // const
          // const topLeft = [lng, lat];
          const topRight = findDestination(topLeft, widthInMeters * 2, offset + 90);
          const bottomRight = findDestination(topRight, heightMeters * 2, offset + 180);
          const bottomLeft = findDestination(topLeft, heightMeters * 2, offset + 180);
          // console.log('[topLeft, topRight, bottomRight, bottomLeft]: %o', [topLeft, topRight, bottomRight, bottomLeft]);
          // Add the image as a source
          const poiImg = createRaster(poi, [topLeft, topRight, bottomRight, bottomLeft]);
          //   console.log('poiImg', poiImg);
          !poisImgSource
            ? map.addSource(`poi-source`, poiImg)
            : poisImgSource.setCoordinates([topLeft, topRight, bottomRight, bottomLeft]);

          // Add a layer to use the image source
          !poisImgLayer &&
            map.addLayer({
              id: `poi-layer`,
              type: 'raster',
              source: `poi-source`,
              paint: {
                'raster-opacity': 0.5
              }
            });
        })
        .catch((error) => {
          console.error('Error loading image:', error);
        });
  };

  const findDestination = (initPoint, distance, bearing) => {
    const startPoint = turf.point(initPoint);
    const destinationPoint = turf.destination(startPoint, distance, bearing, { units: 'meters' });
    return destinationPoint.geometry.coordinates;
  };

  const createRaster = (poi, coordinates) => {
    const rasterSource = {
      type: 'image',
      url: poi.imageUrl,
      coordinates: coordinates
    };
    return rasterSource;
  };

  const handleListItemClick = (event, index) => {
    const selectedPOI = pois[index];
    map.jumpTo({
      center: [selectedPOI.location.lng, selectedPOI.location.lat]
    });

    setSelectedPoi(index === selectedPoi ? -1 : index);

    if (selectedPOI.type !== 'Image') return;
    clearPoiLayer();
    index !== selectedPoi && addPoiImage(selectedPOI);

    setIsAccordionExpanded(false); // Close the dropdown on selection
  };

  const clearPoiLayer = () => {
    const poisImgLayer = map?.getLayer(`poi-layer`);
    const poisImgSource = map?.getSource(`poi-source`);

    if (poisImgLayer) {
      map.removeLayer(`poi-layer`);
    }
    if (poisImgSource) {
      map.removeSource(`poi-source`);
    }
  };

  return (
    <div id="poi-list" style={{ position: 'absolute', zIndex: 20, top: screenWidth > 700 ? 10 : 70, left: 10 }}>
      {pois && pois.length ? (
        <Accordion expanded={isAccordionExpanded} onChange={() => setIsAccordionExpanded(!isAccordionExpanded)}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              minHeight: 36,
              '.MuiAccordionSummary-content': { margin: 0 },
              '&.Mui-expanded': { minHeight: 36, height: 36 },
              fontSize: 16
            }}
          >
            Buildings
          </AccordionSummary>
          <AccordionDetails sx={{ padding: 0 }}>
            <Box sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
              <List component="nav" sx={{ padding: 0 }}>
                {pois?.map((poi, index) => (
                  <ListItemButton
                    key={poi.poiId}
                    selected={selectedPoi === index}
                    onClick={(event) => handleListItemClick(event, index)}
                  >
                    <ListItemText primary={poi.name} />
                  </ListItemButton>
                ))}
              </List>
            </Box>
          </AccordionDetails>
        </Accordion>
      ) : null}
    </div>
  );
}

export default FloorList;
