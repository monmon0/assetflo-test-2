import React, { useState, useEffect, useRef, useMemo } from 'react';
import Supercluster from 'supercluster';
import { point } from '@turf/helpers';
import { Children, createElement } from 'react';
import PropTypes from 'prop-types';
import { Marker } from 'react-map-gl';
import usePrevious from '../../hooks/usePrevious';

const childrenKeys = (children) => Children.toArray(children).map((child) => child.key);

const shallowCompareChildren = (prevChildren, newChildren) => {
  if (Children.count(prevChildren) !== Children.count(newChildren)) {
    return false;
  }

  const prevKeys = childrenKeys(prevChildren);
  const newKeys = new Set(childrenKeys(newChildren));
  return prevKeys.length === newKeys.size && prevKeys.every((key) => newKeys.has(key));
};

const Cluster = (props) => {
  const { map, minZoom, maxZoom, radius, extent, nodeSize, children: originalChildren, innerRef, element } = props;

  const [clusters, setClusters] = useState([]);
  const clusterRef = useRef(null);

  const children = useMemo(() => originalChildren, [originalChildren]);

  const createCluster = () => {
    const clusterInstance = new Supercluster({
      radius,
      extent,
      nodeSize
    });

    const points = Children.map(children, (child) => {
      if (child) return point([child.props.longitude, child.props.latitude], child);
      return null;
    });

    clusterInstance.load(points);
    clusterRef.current = clusterInstance;
    if (innerRef) innerRef(clusterRef.current);
  };

  const recalculate = () => {
    const zoom = map.getZoom();
    const bounds = map.getBounds().toArray();
    const bbox = bounds[0].concat(bounds[1]);

    const updatedClusters = clusterRef.current.getClusters(bbox, Math.floor(zoom));

    setClusters(updatedClusters);
  };

  useEffect(() => {
    map.on('move', recalculate);
    return () => {
      // Cleanup event listener on component unmount
      map.off('move', recalculate);
    };
  }, []);

  useEffect(() => {
    createCluster();
    recalculate();
  }, [map, minZoom, maxZoom, radius, extent, nodeSize, children, innerRef]);

  return clusters.map((cluster) => {
    if (cluster.properties.cluster) {
      const [longitude, latitude] = cluster.geometry.coordinates;
      return (
        <Marker
          key={`cluster-${cluster.properties.cluster_id}`}
          longitude={longitude}
          latitude={latitude}
          offsetLeft={-28 / 2}
          offsetTop={-28}
        >
          {createElement(element, {
            cluster,
            superCluster: clusterRef.current
          })}
        </Marker>
      );
    }

    const { type, key, props } = cluster.properties;
    return createElement(type, { key, ...props });
  });
};

Cluster.propTypes = {
  map: PropTypes.object,
  minZoom: PropTypes.number,
  maxZoom: PropTypes.number,
  radius: PropTypes.number,
  extent: PropTypes.number,
  nodeSize: PropTypes.number,
  element: PropTypes.func,
  innerRef: PropTypes.func,
  children: PropTypes.node
};

export default Cluster;
