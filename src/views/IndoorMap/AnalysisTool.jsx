import { useState, useEffect, useContext } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { IconButton } from '@mui/material';
import DoneIcon from '@mui/icons-material/Done';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import KeyboardDoubleArrowUpIcon from '@mui/icons-material/KeyboardDoubleArrowUp';
import { MarkerContext } from '../../context/Map/MarkerContext';

// AnalysisTool component for displaying and analyzing device accuracy on a map.
const AnalysisTool = ({ mapRef, mapLoaded, displayedDevices, setAccuracyFilter }) => {
  // context
  const { accuracyThreshold, setAccuracyThreshold } = useContext(MarkerContext);

  // state
  const [avgAcc, setAvgAcc] = useState('N/A');
  const [min, setMin] = useState({ device: null, value: 'N/A' });
  const [max, setMax] = useState({ device: null, value: 'N/A' });
  const [minAccFilter, setMinAccFilter] = useState(0);
  const [total, setTotal] = useState(0);
  const [expand, setExpand] = useState(false);
  const [threshold, setThreshold] = useState({ ...accuracyThreshold });

  // redux
  const showAdvanceTool = useSelector((state) => state.location.showAdvanceTool);
  const database = useSelector((state) => state.user.database);

  const dispatch = useDispatch();

  useEffect(() => {
    const existingThreshold = window.localStorage.getItem(`af_accuracyThreshold_${database}`);
    if (existingThreshold) {
      setAccuracyThreshold(JSON.parse(existingThreshold));
    }
  }, []);

  useEffect(() => {
    if (mapRef && mapLoaded) {
      const markerSource = mapRef.getSource('marker-source');
      const data = markerSource?._data;

      // reset values if there are no markers in the view
      if (!data?.features?.length) return resetMinMaxAvg();

      // filter out non fixed assets without accuracy
      const distances = data.features.filter(
        (feature) =>
          feature.properties.fixAsset &&
          feature.properties.accuracy !== undefined &&
          feature.properties.accuracy !== null
      );
      // console.log('Filtered distances:', distances);
      setTotal(distances.length);
      calculateMinMaxAvg(distances);
    }
  }, [displayedDevices, mapRef, mapLoaded]);

  useEffect(() => {
    if (!showAdvanceTool) {
      setMinAccFilter(0);
      setAccuracyFilter(0);
    }
  }, [showAdvanceTool]);

  useEffect(() => {
    setThreshold(accuracyThreshold);
  }, [accuracyThreshold]);

  const calculateMinMaxAvg = (distances) => {
    if (distances?.length > 0) {
      // Find the min and max objects
      let minDev = distances[0];
      let maxDev = distances[0];

      distances.forEach((d) => {
        if (d.properties.accuracy < minDev.properties.accuracy) {
          minDev = d;
        }
        if (d.properties.accuracy > maxDev.properties.accuracy) {
          maxDev = d;
        }
      });
      const minDistance = minDev.properties.accuracy;
      const maxDistance = maxDev.properties.accuracy;

      typeof minDistance === 'number' && !isNaN(minDistance)
        ? setMin({ device: minDev.properties, value: minDistance.toFixed(2) })
        : setMin({ device: null, value: 'N/A' });
      typeof maxDistance === 'number' && !isNaN(maxDistance)
        ? setMax({ device: maxDev.properties, value: maxDistance.toFixed(2) })
        : setMax({ device: null, value: 'N/A' });

      // Calculate AVG
      const averageDistance = distances.reduce((sum, d) => sum + d.properties.accuracy, 0) / distances.length;
      const validated = averageDistance.toFixed(2);
      typeof averageDistance === 'number' && !isNaN(averageDistance) ? setAvgAcc(validated) : setAvgAcc(0);
    } else {
      resetMinMaxAvg();
    }
  };

  const resetMinMaxAvg = () => {
    setMin({ device: null, value: 'N/A' });
    setMax({ device: null, value: 'N/A' });
    setAvgAcc('N/A');
  };

  const handleMinClick = () => {
    if (!max.device) return;
    // find marker with max distance accuracy
    const selected = displayedDevices.find((device) => device.deviceId === min.device.deviceId);

    dispatch.map.setDeviceSelectedAction(selected);
  };

  const handleMaxClick = () => {
    if (!max.device) return;
    // find marker with max distance accuracy
    const selected = displayedDevices.find((device) => device.deviceId === max.device.deviceId);

    dispatch.map.setDeviceSelectedAction(selected);
  };

  const handleMinAccuracyChange = (e) => {
    setMinAccFilter(e.target.value);
  };

  const handleSaveThreshold = () => {
    const updatedThreshold = { near: parseFloat(threshold.near), far: parseFloat(threshold.far) };
    if (isNaN(parseFloat(threshold.near)) || threshold.near >= threshold.far)
      updatedThreshold.near = accuracyThreshold.near;
    if (isNaN(parseFloat(threshold.far)) || threshold.far <= threshold.near)
      updatedThreshold.far = accuracyThreshold.far;

    setAccuracyThreshold(updatedThreshold);
    window.localStorage.setItem(`af_accuracyThreshold_${database}`, JSON.stringify(updatedThreshold));
  };

  return (
    <>
      {showAdvanceTool && (
        <div id="assetflo-analysis-container">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <div>Min: </div>
            <div id="assetflo-analysis-min" onClick={handleMinClick}>
              {min.value}
            </div>
            <div>Max: </div>
            <div id="assetflo-analysis-max" onClick={handleMaxClick}>
              {max.value}
            </div>
            <div>AVG ({total}): </div>
            <div>{avgAcc}</div>
            {/* {'Min: ' + min + ', Max: ' + max + ', AVG: ' + avgAcc} */}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <div>Filter assets </div>
            <div>
              <input
                type="number"
                style={{ width: 40, marginLeft: 10 }}
                value={minAccFilter}
                onChange={handleMinAccuracyChange}
              />
            </div>
            <div>
              <IconButton
                size="small"
                onClick={() => {
                  setAccuracyFilter(minAccFilter);
                }}
                color="success"
              >
                <DoneIcon fontSize="inherit" />
              </IconButton>
            </div>
            {minAccFilter > 0 && (
              <div>
                <IconButton
                  aria-label="delete"
                  size="small"
                  onClick={() => {
                    setMinAccFilter(0);
                    setAccuracyFilter(0);
                  }}
                  color="error"
                >
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              </div>
            )}
          </div>
          <div style={{ textAlign: 'center' }}>
            <IconButton aria-label="delete" size="small" onClick={() => setExpand(!expand)}>
              {expand ? (
                <KeyboardDoubleArrowUpIcon fontSize="inherit" />
              ) : (
                <KeyboardDoubleArrowDownIcon fontSize="inherit" />
              )}
            </IconButton>
          </div>
          {expand && (
            <div id="assetflo-analysis-advanced">
              <div>Near</div>
              <div>
                <input
                  type="number"
                  style={{ width: 50, marginLeft: 10 }}
                  value={threshold.near}
                  onChange={(e) => setThreshold({ ...threshold, near: e.target.value })}
                />
              </div>
              <div style={{ marginLeft: 10 }}>Far</div>
              <div>
                <input
                  type="number"
                  style={{ width: 50, marginLeft: 10 }}
                  value={threshold.far}
                  onChange={(e) => setThreshold({ ...threshold, far: e.target.value })}
                />
              </div>
              <div>
                <IconButton size="small" onClick={handleSaveThreshold} color="success">
                  <DoneIcon fontSize="inherit" />
                </IconButton>
              </div>

              <div>
                <IconButton
                  aria-label="delete"
                  size="small"
                  onClick={() => {
                    setAccuracyThreshold({ near: 2, far: 5.9 });
                    window.localStorage.setItem(
                      `af_accuracyThreshold_${database}`,
                      JSON.stringify({ near: 2, far: 5.9 })
                    );
                  }}
                  color="error"
                >
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default AnalysisTool;
