import React, { useState, useEffect } from 'react';
import { Box, Grid, Typography, Tabs, Tab, Pagination, Chip, Button } from '@mui/material';
import variables from '../../../../variables.json';

const LayerGrid = ({ x, y, z, view, assignedTags, activeLayer, setValidPositions, highlightPosition }) => {
  const [gridCells, setGridCells] = useState([]);

  // Get the grid cells based on the current view.
  const getGridCells = () => {
    const { x: x_tot, y: y_tot, z: z_tot } = { x, y, z };

    switch (view) {
      // Top View from bottom left of truck
      case 'yx':
        return Array.from({ length: y }, (_, y) =>
          Array.from({ length: x }, (_, x) => ({
            y: y_tot - 1 - y,
            x,
            z: activeLayer
          }))
        );

      // Side View from bottom left of truck
      case 'zx':
        return Array.from({ length: z }, (_, z) =>
          Array.from({ length: x }, (_, x) => ({
            z: z_tot - 1 - z,
            x,
            y: activeLayer
          }))
        );

      // Back View from bottom right of truck
      case 'zy':
        return Array.from({ length: z }, (_, z) =>
          Array.from({ length: y }, (_, y) => ({
            z: z_tot - 1 - z,
            y: y_tot - 1 - y,
            x: activeLayer
          }))
        );
    }
  };

  // Format the coordinate as (x, y, z) where:
  // The x, y is the rows and columns of the grid.
  // Use the view to determine the correct coordinate format.
  // Adding 1 to each value to make it 1-based index. (except for coordinates)
  const formatPosition = (x, y, z) => {
    const type = 'LNN';

    switch (type) {
      case 'LNN': {
        // Letter Code: A-1-1, B-2-1, C-3-1, etc.
        const letter = String.fromCharCode(65 + y);
        const suffix = '-';
        return `${letter}${suffix}${x + 1}${suffix}${z + 1}`;
      }
      case 'RAZ':
        // Truck Code: Aisle 1, Row 2, Zone 3, etc.
        return `Aisle ${y + 1}, Zone ${x + 1}, Level ${z + 1}`;
      case 'NNN':
        // Coordinates: (x: 1, y: 2, z: 3)
        return `(x: ${x}, y: ${y}, z: ${z})`;
      default:
        return `Aisle ${y}, Zone ${x}, Level ${z}`;
    }
  };

  useEffect(() => {
    // Get the grid cells based on the current view.
    const gridCells = getGridCells();
    setGridCells(gridCells);

    // Get the valid positions based on the grid cells.
    // const validPositions = gridCells.flat().map((cell) => formatPosition(cell.x, cell.y, cell.z));

    // Don't show tags that are already assigned.
    // const validPositions = gridCells.flat()
    // .map(cell => formatPosition(cell.x, cell.y, cell.z))
    // .filter(position => !assignedTags.some(tag => tag.position === position));

    // setValidPositions(validPositions);
  }, [x, y, z, view, activeLayer]);

  const handleSelectCell = (cellId) => {
    const cell = document.getElementById(cellId);
    const container = document.getElementById('grid-container');
    if (cell && container) {
      const containerRect = container.getBoundingClientRect();
      const cellRect = cell.getBoundingClientRect();
      container.scrollTo({
        top:
          cellRect.top - containerRect.top + container.scrollTop - container.clientHeight / 2 + cell.clientHeight / 2,
        left:
          cellRect.left - containerRect.left + container.scrollLeft - container.clientWidth / 2 + cell.clientWidth / 2,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    if (highlightPosition) {
      handleSelectCell(highlightPosition);
    }
  }, [highlightPosition]);

  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [startY, setStartY] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  const handleMouseDown = (e) => {
    const container = e.currentTarget;
    setIsDragging(true);
    setStartX(e.pageX - container.offsetLeft);
    setScrollLeft(container.scrollLeft);
    setStartY(e.pageY - container.offsetTop);
    setScrollTop(container.scrollTop);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const container = e.currentTarget;
    const x = e.pageX - container.offsetLeft;
    const y = e.pageY - container.offsetTop;
    container.scrollLeft = scrollLeft - (x - startX);
    container.scrollTop = scrollTop - (y - startY);
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <Box sx={{ pb: 3, pt: 1 }}>
      {/* Trailer Grid */}
      <Box
        id="grid-container"
        sx={{
          maxHeight: '600px',
          overflow: 'auto',
          display: 'flex',
          justifyContent: 'center',

          // Border, and background color (for grid gaps)
          backgroundColor: '#934409',
          outline: '2px solid #934409',

          zIndex: 2,
          position: 'relative',
          cursor: isDragging ? 'all-scroll' : 'default'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridCells[0]?.length || 1},  minmax(max-content, auto))`, // Set columns to auto size
            gridTemplateRows: `repeat(${gridCells.length}, auto)`, // Set rows to auto size
            gridAutoFlow: 'row', // Ensure the grid flows in rows
            gap: '1px',

            // Make the grid responsive
            width: '100%'
            // maxWidth: '800px',
            // backgroundColor: '#934409'
          }}
        >
          {gridCells.flat().map((cell, index) => {
            const coordLabel = formatPosition(cell.x, cell.y, cell.z);
            const tag = assignedTags.find((tag) => tag.position === coordLabel);

            return (
              <Box
                key={coordLabel}
                id={coordLabel}
                sx={{
                  background: tag ? '#e8f5e9' : '#f9f9f9',
                  // Highlight the cell if it matches the highlightPosition
                  border:
                    highlightPosition &&
                    highlightPosition.x === cell.x &&
                    highlightPosition.y === cell.y &&
                    highlightPosition.z === cell.z
                      ? '2px solid red'
                      : 'none',
                  padding: '8px', // Add padding to fit the chip size
                  textAlign: 'center',

                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  // overflow: 'hidden',
                  minWidth: '80px',
                  minHeight: '60px'
                }}
              >
                <Typography variant="caption" noWrap sx={{ userSelect: 'none' }}>
                  {coordLabel}
                </Typography>
                {tag && (
                  <Chip
                    key={tag.deviceId}
                    label={tag.deviceId}
                    size="small"
                    sx={{ borderRadius: '5px', userSelect: 'none' }}
                  />
                )}
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Trailer Side Icon */}
      <Box
        component="img"
        src={
          process.env.NODE_ENV === 'production'
            ? variables.PRODUCTION_URL_IMAGE + variables.TRAILER_SIDE_ICON
            : variables.STAGING_URL_IMAGE + variables.TRAILER_SIDE_ICON
        }
        alt="Trailer Side"
        onError={(e) => {
          const target = e.target;
          target.removeAttribute('onerror'); // Prevent infinite loops
          target.removeAttribute('src'); // Instead of setting it to empty string

          Object.assign(target.style, {
            marginTop: '20px',
            marginBottom: '0',
            marginLeft: '0',
            marginRight: '0',
            width: '100%',
            height: '100px',
            backgroundColor: '#f0f0f0',
            color: '#999',
            transform: 'scaleX(1)'
          });
        }}
        sx={{
          height: 'auto',
          zIndex: 1,
          display: 'block', // Center the icon
          margin: '0 auto', // Center the icon
          width: 'calc(110%)',
          userSelect: 'none',

          // Note: These are calculated percentages based on the transparent top of the image
          // (50px of 221px is transparent from the top)
          marginTop: '-6%',
          marginLeft: '-6%',
          marginRight: '-4%',
          transform: 'scaleX(-1)',
          position: 'relative'
        }}
      />
    </Box>
  );
};

// Main component to control the view and active layer navigation.
const LayerView = ({ x, y, z, assignedTags, setValidPositions, highlightPosition }) => {
  // Mapping after swap:
  // x = rows/zones, y = aisles, z = level/elevation.
  const [activeLayer, setActiveLayer] = useState(0);
  const [view, setView] = useState('zx'); // Default to Side View (ZX)
  const [totalLayers, setTotalLayers] = useState(0); // Total layers based on the current view.
  const [aisleTabs, setAisleTabs] = useState([]);

  useEffect(() => {
    let maxLayer;
    switch (view) {
      case 'yz':
      case 'zy':
        // Active layer corresponds to x (Rows/Zones)
        maxLayer = x;
        break;
      case 'xy':
      case 'yx':
        // Active layer corresponds to z (level/elevation)
        maxLayer = z;
        break;
      case 'xz':
      case 'zx':
      default:
        // Active layer corresponds to y (Aisles)
        maxLayer = y;
    }
    setTotalLayers(maxLayer);
    setAisleTabs(
      Array.from({ length: maxLayer }, (_, index) => (
        <Tab key={index} label={`Aisle - ${String.fromCharCode(65 + index)}`} value={index} />
      ))
    );

    maxLayer -= 1;
    if (activeLayer > maxLayer) {
      setActiveLayer(maxLayer);
    }
  }, [x, y, z, view, activeLayer]);

  // View change component to switch between different views.
  // const ViewChange = () => (
  //   <Box sx={{ display: 'flex', justifyContent: 'center', marginBottom: 2 }}>
  //     <Tabs value={view} onChange={(event, newValue) => setView(newValue)}>
  //       {/* These are Views Where you have to tilt your head horizontally... or the truck vertically */}
  //       {/* <Tab label="XY View" value="xy" /> */}
  //       {/* <Tab label="XZ View" value="xz" /> */}
  //       {/* <Tab label="YZ View" value="yz" /> */}

  //       {/* Side View from bottom left of truck */}
  //       <Tab label="Side View" value="zx" />

  //       {/* Top View from bottom left of truck */}
  //       <Tab label="Top View" value="yx" />

  //       {/* Back View from bottom right of truck */}
  //       <Tab label="Back View" value="zy" />
  //     </Tabs>
  //   </Box>
  // );

  // update activeLayer on highlightPosition change
  useEffect(() => {
    if (highlightPosition) {
      const [letter, xStr, yStr] = highlightPosition.split('-');
      setActiveLayer(letter.charCodeAt(0) - 65);
    }
  }, [highlightPosition]);

  return (
    <Box>
      {/* Render the view selection */}
      {/* <ViewChange /> */}

      {/* Render the aisle tabs */}
      <Box sx={{ display: 'flex', justifyContent: 'center', marginBottom: 2 }}>
        <Tabs
          value={activeLayer}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          onChange={(_, newValue) => setActiveLayer(newValue)}
        >
          {aisleTabs}
        </Tabs>
      </Box>

      {/* Render the 2D grid slice */}
      <LayerGrid
        x={x}
        y={y}
        z={z}
        activeLayer={activeLayer}
        view={view}
        assignedTags={assignedTags}
        setValidPositions={setValidPositions}
        highlightPosition={highlightPosition}
      />
    </Box>
  );
};

export default LayerView;
