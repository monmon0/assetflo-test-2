import React, { useState } from 'react';
import LineChart from './LineChart';
import { connect } from 'react-redux';
import { Button, Modal, Chip } from '@mui/material';

const Modals = (props) => {
  const { device } = props;

  const [modal, setModal] = useState(false);

  const toggle = () => {
    // props.clearDeviceMetrics();
    setModal(!modal);
  };
  // console.log("device", device);

  const handleDeviceMetrics = (device) => {
    // console.log("handleDeviceMetrics", device);
    let payload = {
      deviceId: device && device.deviceId
    };
    props.getMetricsPerDevice(payload);
  };

  return (
    <div>
      <Chip
        style={{
          // cursor: "pointer",
          background: '#7CC7F9',
          color: '#FFFFFF'
        }}
        size="small"
        label="Metrics"
        onClick={() => {
          toggle();
          handleDeviceMetrics(device);
        }}
      />
      {/* <span>metrics</span> */}

      <Modal open={modal} onClose={toggle}>
        <center style={{ margin: '100px' }}>
          {<LineChart />}
          <Button variant="contained" style={{ marginTop: '5px', width: '100px' }} onClick={toggle}>
            Cancel
          </Button>
        </center>
      </Modal>
    </div>
  );
};
const mapStateToProps = ({ dashboard, map }) => ({
  metrics: dashboard.metrics,
  deviceMetrics: dashboard.deviceMetrics,
  map
});

const mapDispatch = ({ dashboard: { getMetricsPerDeviceAction, clearDeviceMetricsAction }, map: {} }) => ({
  getMetricsPerDevice: getMetricsPerDeviceAction,
  clearDeviceMetrics: clearDeviceMetricsAction
});

export default connect(mapStateToProps, mapDispatch)(Modals);
