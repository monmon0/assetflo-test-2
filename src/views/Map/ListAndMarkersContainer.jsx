import React, { useState } from 'react';
import useFilterByActivity from '../../hooks/useFilterByActivity';
import List from './List';
import Markers from './Markers';

const ListAndMarkersContainer = ({
  mapbox,
  bearing,
  mainLayer,
  displayIndoor,
  displayedMap,
  iconColor,
  handleMarkerSelected,
  inCluster,
  setInCluster,
  devices,
  syncFilterWithMap,
  deviceSelected,
  setViewState
}) => {
  const filterByActivityAdapter = useFilterByActivity();
  const [searchString, setSearchString] = useState('');

  return (
    <>
      <List
        mapbox={mapbox}
        bearing={bearing}
        layout={mainLayer}
        displayIndoor={displayIndoor}
        displayedMap={displayedMap}
        filterByActivityAdapter={filterByActivityAdapter}
        setViewState={setViewState}
        searchString={searchString}
        setSearchString={setSearchString}
      />
      <Markers
        iconColor={iconColor}
        handleMarkerSelected={handleMarkerSelected}
        map={mapbox}
        inCluster={inCluster}
        setInCluster={setInCluster}
        filterByActivityAdapter={filterByActivityAdapter}
        devices={devices}
        syncFilterWithMap={syncFilterWithMap}
        deviceSelected={deviceSelected}
        setViewState={setViewState}
      />
    </>
  );
};

export default ListAndMarkersContainer;
