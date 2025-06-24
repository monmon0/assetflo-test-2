import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { styled } from '@mui/material/styles';
import moment from 'moment';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Box
} from '@mui/material';
import variables from '../../../variables.json';
import CustomSwitch from '../../Common/CustomSwitch';

/**
 * This modal is:
 * 1. to set device as configured attachment
 * 2. to set isAnchor or fixAsset
 * @component
 * @returns {JSX.Element} Rendered component.
 */
const PREFIX = 'AssetTypeModal';

const classes = {
  select: `${PREFIX}-select`,
  dialogReplaceWrap: `${PREFIX}-dialogReplaceWrap`,
  textField: `${PREFIX}-textField`,
  modalRow: `${PREFIX}-modalRow`,
  autoComplete: `${PREFIX}-autoComplete`,
  assignBox: `${PREFIX}-assignBox`
};

const StyledDialog = styled(Dialog)(({ theme, ...props }) => ({
  [`& .${classes.select}`]: {
    textAlign: 'center',
    '&:before': {
      borderBottomColor: variables.DARK_GRAY_COLOR
    },
    '&:after': {
      borderBottomColor: variables.DARK_GRAY_COLOR
    }
  },
  [`& .${classes.dialogReplaceWrap}`]: {
    display: 'flex',
    alignItems: 'baseline'
  },
  [`& .${classes.textField}`]: {
    marginLeft: 10,
    '& label.Mui-focused': {
      color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR
    },
    '& .MuiInput-underline:after': {
      borderBottomColor: variables.DARK_GRAY_COLOR
    },
    '& .MuiInput-underline.Mui-error:after': {
      borderBottomColor: 'red'
    },
    '& .MuiFormLabel-root.Mui-error': {
      color: 'red'
    },
    '& .MuiInputBase-root.Mui-disabled': {
      color: 'black'
    }
  },
  [`& .${classes.modalRow}`]: {
    marginBottom: 10
  },
  [`& .${classes.autoComplete}`]: { width: 300 },
  [`& .${classes.assignBox}`]: { display: 'flex', alignItems: 'center' }
}));

function AssetTypeModal(props) {
  const {
    assetTypeModal,
    handleAssetTypeSelected,
    setAssetTypeModal,
    handleUpdateData,
    assetType,
    setAssetType,
    createVirtualIOX
  } = props;
  const [attachTo, setAttachTo] = useState(null);

  useEffect(() => {
    if (assetType === 'configured' && !props.geotabGroupVehicleId) {
      props.getGeotabGroupVehicleId({ groups: ['GroupVehicleId'] });
    }
  }, []);

  useEffect(() => {
    const device = assetTypeModal && assetTypeModal.rowData;
    const attached =
      device && device.attachedState && device.attachedState.configured && device.attachedState.attachedTo;

    if (props.geotabGroupVehicleId && props.geotabGroupVehicleId.length && attached) {
      const idParts = attached.split('.');
      const id = idParts[idParts.length - 1];

      const truck = props.geotabGroupVehicleId.find((dev) => dev.id === id);
      setAttachTo(truck);
    }
  }, [props.geotabGroupVehicleId]);

  const handleSubmit = () => {
    if (assetType === 'configured' && attachTo && attachTo.id) {
      const prevData = assetTypeModal.rowData;
      const newData = {
        ...prevData,
        assetName: `${attachTo.name}-Tag`,
        attachedState: {
          configured: true,
          state: 'Attached',
          time: moment().valueOf(),
          correctionRssi: variables.DEFAULT_RSSI,
          rssi: variables.DEFAULT_RSSI,
          attachedTo: `${props.database}.${attachTo.id}`
        }
      };
      handleUpdateData(newData, prevData);
      createVirtualIOX({ goId: attachTo.id });
    }
    if (assetType !== 'configured') {
      handleAssetTypeSelected(
        {
          ...assetTypeModal.rowData
        },
        {
          fixAsset: assetType === 'fixAsset',
          isAnchor: assetType === 'isAnchor'
        }
      );
    }
    setAssetTypeModal({ open: false, rowData: null });
  };

  const handleChange = (e, newInputValue) => {
    // setName(newInputValue.name);
    setAttachTo(newInputValue);
  };

  return (
    <StyledDialog
      open={assetTypeModal.open}
      onClose={() => {
        setAssetTypeModal({ open: false, rowData: null });
      }}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle id="geopush-dialog-title">
        <span style={{ color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR }}>
          {!assetTypeModal.rowData.fixAsset && !assetTypeModal.rowData.isAnchor
            ? assetType === 'configured'
              ? 'Attach to'
              : 'Select Asset Type'
            : 'Change Asset Type'}
        </span>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {assetType !== 'configured' && (
            <div>
              <FormControlLabel
                control={
                  <CustomSwitch
                    checked={assetType === 'isAnchor'}
                    onChange={() => {
                      setAssetType('isAnchor');
                    }}
                    name="isAnchorSwitch"
                    size="small"
                    wrldMapOnly={props.wrldMapOnly}
                  />
                }
                label={
                  <span style={{ color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR }}>
                    Anchor
                  </span>
                }
              />
              <FormControlLabel
                control={
                  <CustomSwitch
                    checked={assetType === 'fixAsset'}
                    onChange={() => {
                      setAssetType('fixAsset');
                    }}
                    name="fixAssetSwitch"
                    size="small"
                    wrldMapOnly={props.wrldMapOnly}
                  />
                }
                label={
                  <span style={{ color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR }}>
                    Fixed Asset
                  </span>
                }
              />
            </div>
          )}
          <div>
            {assetType === 'configured' && props.geotabGroupVehicleId && props.geotabGroupVehicleId.length ? (
              <Autocomplete
                blurOnSelect
                // style={{ width: 300 }}
                fullWidth
                size="large"
                options={props.geotabGroupVehicleId.filter((device) => device.serialNumber.startsWith('G'))}
                getOptionLabel={(option) =>
                  option && option.serialNumber
                    ? `${option.name || option.id} - ${option.serialNumber}`
                    : option && !option.serialNumber
                    ? option.name || option.id
                    : ''
                }
                value={attachTo}
                ListboxProps={{ style: { minHeight: 100, maxHeight: 200, overflow: 'auto' } }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    className={classes.textField}
                    label={attachTo ? '' : 'Select vehicle'}
                    //   helperText={attachTo && attachTo.serialNumber ? 'replace serial number' : ''}
                  />
                )}
                onChange={handleChange}
              />
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
                <CircularProgress size={30} />
              </div>
            )}
          </div>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            setAssetTypeModal({ open: false, rowData: null });
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          style={{ color: variables.GREEN_COLOR }}
          disabled={!assetType || (assetType === 'configured' && !attachTo)}
        >
          {assetType === 'configured' ? 'Attach' : 'Continue'}
        </Button>
      </DialogActions>
    </StyledDialog>
  );
}

const mapStateToProps = ({ user, map, provision }) => ({
  database: user.database,
  wrldMapOnly: map.wrldMapOnly && user.loginType === 'verifyGeotabAddinAccount',
  geotabGroupVehicleId: provision.geotabGroupVehicleId
});

const mapDispatch = ({ provision: { getGeotabGroupVehicleIdAction }, configuration: { createVirtualIOXAction } }) => ({
  getGeotabGroupVehicleId: getGeotabGroupVehicleIdAction,
  createVirtualIOX: createVirtualIOXAction
});

export default connect(mapStateToProps, mapDispatch)(AssetTypeModal);
