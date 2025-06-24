// ClusterGroup.js
import React, { useEffect, useState } from 'react';
import { Popup } from 'react-map-gl';
import variables from '../../variables.json';
import WebMercatorViewport from 'viewport-mercator-project';
import useDebounce from '../../hooks/useDebounde';

const MapClusterGroup = ({
  cluster,
  superCluster,
  map,
  deviceSelected,
  inCluster,
  setInCluster,
  screenWidth,
  deviceHM,
  filter,
  setViewState
}) => {
  const [popup, setPopup] = useState([]);
  const [popupInfo, setPopupInfo] = useState({ tags: 0, locators: 0 });

  const clusterZoom = (leaves) => {
    let bounds = {};
    bounds.n = leaves[0].geometry.coordinates[1];
    bounds.e = leaves[0].geometry.coordinates[0];
    bounds.s = bounds.n;
    bounds.w = bounds.e;
    leaves.map((l) => {
      if (l.geometry.coordinates[1] > bounds.n) {
        bounds.n = l.geometry.coordinates[1];
      }
      if (l.geometry.coordinates[0] > bounds.e) {
        bounds.e = l.geometry.coordinates[0];
      }
      if (l.geometry.coordinates[1] < bounds.s) {
        bounds.s = l.geometry.coordinates[1];
      }
      if (l.geometry.coordinates[0] < bounds.w) {
        bounds.w = l.geometry.coordinates[0];
      }
    });

    const viewport = new WebMercatorViewport({ width: 800, height: 600 }).fitBounds(
      [
        [bounds.e, bounds.n],
        [bounds.w, bounds.s]
      ],
      {
        padding: 0
      }
    );
    const { longitude, latitude, zoom } = viewport;

    setViewState({
      longitude,
      latitude,
      zoom
    });
  };

  const getPopupInfo = (leaves) => {
    let tags = 0;
    let locators = 0;
    let anchors = 0;
    leaves.map((leaf) => {
      // let clusterDevice = mapDevices.find((device) => device.deviceId === leaf.key);
      let clusterDevice = deviceHM[leaf.properties.key];
      if (!clusterDevice) return;
      if (clusterDevice.deviceType === 'Tag') {
        if (clusterDevice.isAnchor) {
          ++anchors;
        } else {
          ++tags;
        }
      } else {
        ++locators;
      }
    });
    setPopupInfo({ tags, locators, anchors });
  };

  const leaves = superCluster.getLeaves(cluster.properties.cluster_id, Infinity);
  //   console.log(leaves);
  const count = cluster.properties.point_count_abbreviated;
  const { coordinates } = cluster.geometry;

  // const zoom = map ? map.getZoom() : 0;

  const checkClusters = (isDeviceInCluster) => {
    if (!inCluster && !isDeviceInCluster) return;
    if (deviceSelected?.deviceId !== inCluster?.deviceId) {
      return setInCluster(false);
    }
    const bbox = map.getBounds();
    const allClusters = superCluster.getClusters(
      [bbox._sw.lng, bbox._sw.lat, bbox._ne.lng, bbox._ne.lat],
      map.getZoom()
    );

    const clusterExists = allClusters.find((cl) => cl.id === inCluster.clusterId);
    if (!clusterExists) {
      setInCluster(false);
    }
  };

  const debouncedCheckClusters = useDebounce((isDeviceInCluster) => {
    checkClusters(isDeviceInCluster);
  }, 500);

  const multiplier = 3 * Math.log(3 * count);
  useEffect(() => {
    if (map) {
      const isDeviceInCluster = !!(
        deviceSelected && leaves.find((device) => device.properties.key === deviceSelected.deviceId)
      );

      if (
        isDeviceInCluster &&
        (!inCluster ||
          deviceSelected?.deviceId !== inCluster?.deviceId ||
          inCluster.location.lng !== coordinates[0] ||
          inCluster.location.lat !== coordinates[1])
      ) {
        setInCluster({
          ...deviceSelected,
          location: { lng: coordinates[0], lat: coordinates[1] },
          clusterId: cluster.properties.cluster_id
        });
      }

      debouncedCheckClusters(isDeviceInCluster);
    }
  }, [map]);

  return (
    <div
      key={JSON.stringify(coordinates)}
      onMouseEnter={() => {
        // console.log('over');
        setPopup([...coordinates]);
        getPopupInfo(leaves);
      }}
      onMouseOut={() => {
        // console.log('out');
        setPopup([]);
        setPopupInfo({ tags: 0, locators: 0 });
      }}
      // onDoubleClick={(evt) => {
      //   console.log('onDoubleClick', evt);
      //   setPopup([]);
      //   setPopupInfo({ tags: 0, locators: 0 });
      //   // // getPopupInfo(leaves);
      //   clusterZoom(leaves);
      // }}
      onClick={(evt) => {
        console.log('onClick', evt.originalEvent);
        // if (screenWidth >= 1000) return;
        setPopup([]);
        setPopupInfo({ tags: 0, locators: 0 });
        clusterZoom(leaves);
      }}
    >
      <div
        className="cluster"
        style={{
          backgroundColor: variables.ORANGE_COLOR,
          width: `${40 + multiplier}px`,
          height: `${40 + multiplier}px`,
          minWidth: '25px',
          minHeight: '25px',
          borderRadius: '50%',
          color: variables.WHITE_COLOR,
          fontSize: 16,
          zIndex: 11,
          outline: 'none',
          pointerEvents: 'none'
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            outline: 'none',
            borderRadius: '50%',
            border: '5px solid rgba(255, 255, 255, .5)',
            pointerEvents: 'none'
          }}
        >
          {count}
        </div>
      </div>
      {popup.length > 0 && (
        <Popup
          style={{ zIndex: 20 }}
          longitude={popup[0]}
          latitude={popup[1]}
          anchor="bottom"
          offset={{
            'bottom-left': [12, -35],
            bottom: [0, -35],
            'bottom-right': [12, -35]
          }}
        >
          <div style={{ margin: '13px 19px' }}>
            {filter.indexOf('Tag') > -1 && <p>Number of Tags: {popupInfo.tags}</p>}
            {filter.indexOf('Anchor') > -1 && <p>Number of Anchors: {popupInfo.anchors}</p>}
            {filter.indexOf('Locator') > -1 && <p>Number of Locators: {popupInfo.locators}</p>}
          </div>
        </Popup>
      )}
    </div>
  );
};

export default MapClusterGroup;
