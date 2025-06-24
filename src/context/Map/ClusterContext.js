import React, { createContext, useState } from 'react';

// Create a context with a default value
export const ClusterContext = createContext(null);

export const ClusterProvider = ({ children }) => {
  const [method, setMethod] = useState(0);
  const [kNumber, setKNumber] = useState(2);
  const [weight, setWeight] = useState(true);
  const [locErrorCluster, setLocErroCluster] = useState(null);

  return (
    <ClusterContext.Provider
      value={{ method, setMethod, kNumber, setKNumber, locErrorCluster, setLocErroCluster, weight, setWeight }}
    >
      {children}
    </ClusterContext.Provider>
  );
};
