import React from 'react';
import { useSelector } from 'react-redux';
import { Source, Layer, Popup } from 'react-map-gl';
import * as turf from '@turf/turf';
import variables from '../../variables.json';
import { filterArray } from '../../util/filters';

const ZoneLayer = (props) => {
  const { show, zone } = props;
  const zones = useSelector((state) => state.map.zones);
  const groupFilter = useSelector((state) => state.user.groupFilter);

  const renderZone = () => {
    if (!show) return null;
    // filtered zones
    const filteredZones = zones.filter((zone) => {
      if (!zone.points || zone.points.length === 0) return false;
      if (groupFilter && groupFilter.length > 0 && !zone.groups.find((group) => filterArray(groupFilter, group))) {
        return false;
      }
      return true;
    });

    const zoneList = [];
    filteredZones.forEach((zone) => {
      const { fillColor } = zone;
      const geojsonStyles = {
        linePaint: {
          'line-color': `rgb(${fillColor.r}, ${fillColor.g}, ${fillColor.b})`,
          'line-width': 1,
          'line-opacity': 1
        },
        fillPaint: {
          'fill-color': `rgb(${fillColor.r}, ${fillColor.g}, ${fillColor.b})`,
          'fill-opacity': Math.round((fillColor.a / 255) * 100) / 100
        }
      };

      const coordinates = zone.points.map((coordinate) => [coordinate.x, coordinate.y]);

      const polygon = turf.polygon([coordinates], {
        fillColor: `rgb(${fillColor.r}, ${fillColor.g}, ${fillColor.b})`,
        fillOpacity: Math.round((fillColor.a / 255) * 100) / 100,
        zoneName: zone.name,
        zoneId: zone.zoneId
      });
      zoneList.push(polygon);
    });

    return (
      <>
        <Source id="zoneSource" type="geojson" data={{ type: 'FeatureCollection', features: zoneList }}>
          <Layer
            id="zoneLayer"
            type="fill"
            paint={{
              'fill-color': ['get', 'fillColor'],
              'fill-opacity': ['get', 'fillOpacity']
            }}
          />
        </Source>
      </>
    );
  };

  const renderZonePopup = () => {
    if (!zone || !zone.id) return null;
    return (
      <Popup
        style={{
          opacity: 1,
          zIndex: 10
        }}
        key={zone.id}
        latitude={zone.location.lat}
        longitude={zone.location.lng}
        anchor={'top'}
        offset={{
          bottom: [0, 40]
        }}
        closeButton={false}
        borderRadius="20px"
      >
        <div style={{ padding: '0px' }}>
          <span>
            <strong style={{ color: variables.ORANGE_COLOR }}>zone: </strong>
            {zone.name}
          </span>
        </div>
      </Popup>
    );
  };

  return (
    <>
      {renderZone()}
      {zone && renderZonePopup()}
    </>
  );
};

export default ZoneLayer;
