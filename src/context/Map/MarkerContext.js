import React, { createContext, useState } from 'react';

// Create a context with a default value
export const MarkerContext = createContext(null);

export const MarkerProvider = ({ children }) => {
  const [selectedDeviceList, setSelectedDeviceList] = useState([]);
  const [accuracyThreshold, setAccuracyThreshold] = useState({ near: 2, far: 5.9 });

  return (
    <MarkerContext.Provider
      value={{ selectedDeviceList, setSelectedDeviceList, accuracyThreshold, setAccuracyThreshold }}
    >
      {children}
    </MarkerContext.Provider>
  );
};
