import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import variables from '../../variables.json';
import { ClusterContext } from '../../context/Map/ClusterContext';

const ClusterSettings = ({ deviceSelected, mapbox }) => {
  const { method, setMethod, kNumber, setKNumber, weight, setWeight } = useContext(ClusterContext);
  const showAdvanceTool = useSelector((state) => state.location.showAdvanceTool);
  return (
    <div
      style={{
        display: 'flex',
        position: 'absolute',
        top: 50,
        right: 30,
        zIndex: 10
      }}
    >
      {showAdvanceTool && (
        <>
          <FormControl>
            <InputLabel>Method</InputLabel>
            <Select
              sx={{ backgroundColor: 'white', color: 'black', marginRight: 1 }}
              value={method}
              label="Method"
              onChange={(e) => setMethod(e.target.value)}
            >
              <MenuItem value={'k-medoids'}>k-medoids</MenuItem>
              <MenuItem value={'k-means'}>k-means</MenuItem>
              <MenuItem value={0}>none</MenuItem>
            </Select>
          </FormControl>
          <FormControl>
            <InputLabel>kN</InputLabel>
            <Select
              sx={{ backgroundColor: 'white', color: 'black', marginRight: 1 }}
              value={kNumber}
              label="K Number"
              onChange={(e) => setKNumber(e.target.value)}
            >
              <MenuItem value={2}>2</MenuItem>
              <MenuItem value={3}>3</MenuItem>
              <MenuItem value={4}>4</MenuItem>
              <MenuItem value={5}>5</MenuItem>
            </Select>
          </FormControl>
          <FormControl>
            <InputLabel>Weight of 2nd cluster</InputLabel>
            <Select
              sx={{ backgroundColor: 'white', color: 'black' }}
              value={weight}
              label="Weight"
              onChange={(e) => setWeight(e.target.value)}
            >
              <MenuItem value={true}>True</MenuItem>
              <MenuItem value={false}>False</MenuItem>
            </Select>
          </FormControl>
        </>
      )}
    </div>
  );
};

export default ClusterSettings;
