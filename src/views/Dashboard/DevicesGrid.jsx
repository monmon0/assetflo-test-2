import React from 'react';
import { styled } from '@mui/material/styles';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import Box from '@mui/material/Box';
import { connect } from 'react-redux';

const PREFIX = 'DevicesGrid';

const classes = {
  root: `${PREFIX}-root`,
  gridList: `${PREFIX}-gridList`,
  card: `${PREFIX}-card`,
  title: `${PREFIX}-title`,
  body: `${PREFIX}-body`
};

const Root = styled('div')(({ theme }) => ({
  [`&.${classes.root}`]: {
    width: '100%',
    marginLeft: '10px'
  },

  [`& .${classes.gridList}`]: {
    flexWrap: 'nowrap',
    transform: 'translateZ(0)'
  },

  [`& .${classes.card}`]: {
    borderRadius: '5px',
    background: '#F8931C',
    height: '97%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontSize: '16px'
  },

  [`& .${classes.title}`]: {
    marginTop: '10px',
    color: '#576574',
    fontSize: '16px',
    fontWeight: 'bold'
  },

  [`& .${classes.body}`]: { color: '#E4E5E6' }
}));

function DevicesGrid(props) {
  let devicesList;
  switch (props.devicesGridList) {
    case 'today':
      devicesList = props.metrics;
      break;

    case 'all':
      devicesList = props.allFacilityDevices;
      break;
    default:
      break;
  }

  return (
    <Root className={classes.root}>
      <ImageList cellHeight={250} className={classes.gridList} cols={2.5}>
        {devicesList &&
          devicesList.map((device) => (
            <ImageListItem key={device.deviceId}>
              <Box onClick={() => console.log(device)} className={classes.card}>
                <span className={classes.title}>Device name</span>
                <div className={classes.body}>{device.assetName} </div>
                <span className={classes.title}>Status</span>
                <div className={classes.body}>{device.status ? device.status : 'Active'}</div>
              </Box>
            </ImageListItem>
          ))}
      </ImageList>
    </Root>
  );
}

const mapStateToProps = ({ dashboard }) => ({
  metrics: dashboard.metrics,
  allFacilityDevices: dashboard.allFacilityDevices,
  devicesGridList: dashboard.devicesGridList
});

const mapDispatch = () => ({});

export default connect(mapStateToProps, mapDispatch)(DevicesGrid);
