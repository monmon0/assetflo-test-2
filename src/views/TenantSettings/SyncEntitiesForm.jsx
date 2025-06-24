import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import { Button, Grid, Switch } from '@mui/material';
import { connect } from 'react-redux';

import variables from '../../variables.json';
import CustomSwitch from '../Common/CustomSwitch';

const PREFIX = 'SyncEntitiesForm';

const classes = {
  switchBase: `${PREFIX}-switchBase`,
  checked: `${PREFIX}-checked`,
  track: `${PREFIX}-track`,
  doneButton: `${PREFIX}-doneButton`,
  header: `${PREFIX}-header`,
  headerRow: `${PREFIX}-headerRow`,
  row: `${PREFIX}-row`,
  cell: `${PREFIX}-cell`,
  description: `${PREFIX}-description`,
  subheader: `${PREFIX}-subheader`
};

// TODO jss-to-styled: The Fragment root was replaced by div. Change the tag if needed.
const Root = styled('div')(({ theme, ...props }) => ({
  [`& .${classes.doneButton}`]: {
    color: variables.LIGHT_GRAY_COLOR,
    background: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR
  },

  [`& .${classes.header}`]: {
    fontSize: '1.09375rem',
    fontWeight: '600',
    color: 'rgb(87, 101, 116)'
  },

  [`& .${classes.headerRow}`]: {
    borderBottom: '1px solid #E4E5E6',
    alignItems: 'baseline',
    padding: '16px 30px 8px 30px',
    overflow: 'hidden'
  },

  [`& .${classes.row}`]: {
    // borderColor: variables.LIGHT_GRAY_COLOR,
    fontSize: '1rem',
    alignItems: 'baseline',
    padding: '8px 25px 8px 25px',
    overflow: 'hidden',
    [theme.breakpoints.down('md')]: {
      padding: '5px 20px'
    }
  },

  [`& .${classes.cell}`]: {
    alignItems: 'baseline',
    [theme.breakpoints.down('md')]: {
      paddingRight: '15px'
    }
  },

  [`& .${classes.description}`]: {
    fontSize: '12px',
    color: 'rgb(87, 101, 116)',
    margin: '5px 0'
  },

  [`& .${classes.subheader}`]: {
    fontSize: '16px',
    fontWeight: 500,
    color: 'rgb(87, 101, 116)',
    margin: '5px 0 10px 0'
  }
}));

const SyncEntitiesForm = (props) => {
  // const OrangeSwitch = Switch;

  const [syncEntitiesPull, setSyncEntitiesPull] = useState(props.tenant.syncEntities);

  const handleInputChange = (e) => {
    const { name, checked } = e.target;
    if (name === 'iox') {
      setSyncEntitiesPull({ ...syncEntitiesPull, ['customData']: checked, [name]: checked });
    } else if (name === 'customData') {
      setSyncEntitiesPull({ ...syncEntitiesPull, ['iox']: checked, [name]: checked });
    } else {
      setSyncEntitiesPull({ ...syncEntitiesPull, [name]: checked });
    }
  };

  const handleSubmit = () => {
    const updateSyncEntities = { ...props.tenant.syncEntities, ...syncEntitiesPull };
    const payload = {
      ...props.tenant,
      syncEntities: { ...updateSyncEntities }
    };
    delete payload._id;
    delete payload.createdAt;
    delete payload.tableData;
    delete payload.serviceAccount;
    props.updateTenant(payload);
  };
  return (
    <Root wrldMapOnly={props.wrldMapOnly}>
      <form>
        <Grid container className={classes.container}>
          <Grid container justifyContent="center" className={classes.headerRow}>
            <Grid container item xs={12} justifyContent="center" className={classes.header}>
              Sync Entities
            </Grid>
          </Grid>
          <Grid container justifyContent="center">
            <Grid container item xs={12} justifyContent="center" className={classes.description}>
              Select services to synchronize with Geotab
            </Grid>
          </Grid>
          {/* PULL */}
          <Grid container justifyContent="center">
            <Grid container item xs={12} justifyContent="center" className={classes.subheader}>
              Geotab to Assetflo
            </Grid>
          </Grid>
          <Grid container style={{ padding: '10px 10%' }}>
            {/* <Grid container className={classes.row} spacing={5}>
              <Grid container item sm={6} xs={12} justify="center" className={classes.cell}>
                <Grid container item sm={12} xs={12} alignItems="baseline">
                  <Grid container item sm={6} xs={6} justify="flex-start">
                    Device:
                  </Grid>
                  <Grid container item sm={6} xs={6}>
                    <Grid component="label" container alignItems="center" className={classes.centerOnMobile}>
                      <Grid item>
                        <OrangeSwitch
                          name="device"
                          defaultChecked={props.tenant.syncEntities.device}
                          onChange={(e) => handleInputChange(e)}
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
              <Grid container item sm={6} xs={12} justify="center" className={classes.cell}>
                <Grid container item sm={12} xs={12} alignItems="baseline">
                  <Grid container item sm={6} xs={6} justify="flex-start">
                    Location:
                  </Grid>
                  <Grid container item sm={6} xs={6}>
                    <Grid component="label" container alignItems="center" className={classes.centerOnMobile}>
                      <Grid item>
                        <OrangeSwitch
                          name="location"
                          defaultChecked={props.tenant.syncEntities.location}
                          onChange={(e) => handleInputChange(e)}
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Grid> */}

            {/* <Grid container className={classes.row} spacing={5}>
              <Grid container item sm={6} xs={12} justify="center" className={classes.cell}>
                <Grid container item sm={12} xs={12} alignItems="baseline">
                  <Grid container item sm={6} xs={6} justify="flex-start">
                    Engine:
                  </Grid>
                  <Grid container item sm={6} xs={6}>
                    <Grid component="label" container alignItems="center" className={classes.centerOnMobile}>
                      <Grid item>
                        <OrangeSwitch
                          name="engine"
                          defaultChecked={props.tenant.syncEntities.engine}
                          onChange={(e) => handleInputChange(e)}
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
              <Grid container item sm={6} xs={12} justify="center" className={classes.cell}>
                <Grid container item sm={12} xs={12} alignItems="baseline">
                  <Grid container item sm={6} xs={6} justify="flex-start">
                    Zone:
                  </Grid>
                  <Grid container item sm={6} xs={6}>
                    <Grid component="label" container alignItems="center" className={classes.centerOnMobile}>
                      <Grid item>
                        <OrangeSwitch
                          name="zone"
                          defaultChecked={props.tenant.syncEntities.zone}
                          onChange={(e) => handleInputChange(e)}
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Grid> */}

            <Grid container className={classes.row} spacing={5}>
              <Grid container item sm={6} xs={12} justifyContent="center" className={classes.cell}>
                <Grid container item sm={12} xs={12} alignItems="baseline">
                  <Grid container item sm={6} xs={6} justifyContent="flex-start">
                    Zone:
                  </Grid>
                  <Grid container item sm={6} xs={6}>
                    <Grid component="label" container alignItems="center" className={classes.centerOnMobile}>
                      <Grid item>
                        <CustomSwitch
                          name="zone"
                          checked={(syncEntitiesPull && syncEntitiesPull.zone) || false}
                          onChange={(e) => handleInputChange(e)}
                          wrldMapOnly={props.wrldMapOnly}
                          classes={{
                            switchBase: classes.switchBase,
                            checked: classes.checked,
                            track: classes.track
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
              <Grid container item sm={6} xs={12} justifyContent="center" className={classes.cell}>
                <Grid container item sm={12} xs={12} alignItems="baseline">
                  <Grid
                    container
                    item
                    sm={12}
                    xs={12}
                    alignItems="baseline"
                    spacing={props.provisionType === 'Tenant' ? 5 : 0}
                  >
                    <Grid container item sm={6} xs={6} justifyContent="flex-start">
                      Group:
                    </Grid>
                    <Grid container item sm={6} xs={6}>
                      <Grid component="label" container alignItems="center" className={classes.centerOnMobile}>
                        <Grid item>
                          <CustomSwitch
                            name="group"
                            checked={(syncEntitiesPull && syncEntitiesPull.group) || false}
                            onChange={(e) => handleInputChange(e)}
                            wrldMapOnly={props.wrldMapOnly}
                            classes={{
                              switchBase: classes.switchBase,
                              checked: classes.checked,
                              track: classes.track
                            }}
                          />
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
            <Grid container className={classes.row} spacing={5}>
              <Grid container item sm={6} xs={12} justifyContent="center" className={classes.cell}>
                <Grid container item sm={12} xs={12} alignItems="baseline">
                  <Grid container item sm={6} xs={6} justifyContent="flex-start">
                    IOX:
                  </Grid>
                  <Grid container item sm={6} xs={6}>
                    <Grid component="label" container alignItems="center" className={classes.centerOnMobile}>
                      <Grid item>
                        <CustomSwitch
                          name="iox"
                          checked={(syncEntitiesPull && syncEntitiesPull.iox) || false}
                          onChange={(e) => handleInputChange(e)}
                          wrldMapOnly={props.wrldMapOnly}
                          classes={{
                            switchBase: classes.switchBase,
                            checked: classes.checked,
                            track: classes.track
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
              <Grid container item sm={6} xs={12} justifyContent="center" className={classes.cell}>
                <Grid container item sm={12} xs={12} alignItems="baseline">
                  <Grid
                    container
                    item
                    sm={12}
                    xs={12}
                    alignItems="baseline"
                    spacing={props.provisionType === 'Tenant' ? 5 : 0}
                  >
                    <Grid container item sm={6} xs={6} justifyContent="flex-start">
                      CustomData:
                    </Grid>
                    <Grid container item sm={6} xs={6}>
                      <Grid component="label" container alignItems="center" className={classes.centerOnMobile}>
                        <Grid item>
                          <CustomSwitch
                            name="customData"
                            checked={(syncEntitiesPull && syncEntitiesPull.customData) || false}
                            onChange={(e) => handleInputChange(e)}
                            wrldMapOnly={props.wrldMapOnly}
                            classes={{
                              switchBase: classes.switchBase,
                              checked: classes.checked,
                              track: classes.track
                            }}
                          />
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
            {/* PUSH */}
            {/* <Grid container justify="center">
              <Grid container item xs={12} justify="center" className={classes.subheader}>
                Assetflo to Geotab
              </Grid>
            </Grid>
            <Grid container className={classes.row} spacing={5}>
              <Grid container item sm={6} xs={12} justify="center" className={classes.cell}>
                <Grid container item sm={12} xs={12} alignItems="baseline">
                  <Grid container item sm={6} xs={6} justify="flex-start">
                    Device:
                  </Grid>
                  <Grid container item sm={6} xs={6}>
                    <Grid component="label" container alignItems="center" className={classes.centerOnMobile}>
                      <Grid item>
                        <OrangeSwitch
                          name="device"
                          //   defaultChecked={Boolean(syncEntitiesPull && syncEntitiesPull.device)}
                          //   onChange={(e) => handleSwitchChange(e, 1)}
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
              <Grid container item sm={6} xs={12} justify="center" className={classes.cell}>
                <Grid container item sm={12} xs={12} alignItems="baseline">
                  <Grid container item sm={6} xs={6} justify="flex-start">
                    Location:
                  </Grid>
                  <Grid container item sm={6} xs={6}>
                    <Grid component="label" container alignItems="center" className={classes.centerOnMobile}>
                      <Grid item>
                        <OrangeSwitch
                          name="location"
                          //   defaultChecked={Boolean(syncEntitiesPull && syncEntitiesPull.location)}
                          //   onChange={(e) => handleSwitchChange(e, 2)}
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
            <Grid container className={classes.row} spacing={5}>
              <Grid container item sm={6} xs={12} justify="center" className={classes.cell}>
                <Grid container item sm={12} xs={12} alignItems="baseline">
                  <Grid container item sm={6} xs={6} justify="flex-start">
                    User:
                  </Grid>
                  <Grid container item sm={6} xs={6}>
                    <Grid component="label" container alignItems="center" className={classes.centerOnMobile}>
                      <Grid item>
                        <OrangeSwitch
                          name="device"
                          //   defaultChecked={Boolean(syncEntitiesPull && syncEntitiesPull.device)}
                          //   onChange={(e) => handleSwitchChange(e, 1)}
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
              <Grid container item sm={6} xs={12} justify="center" className={classes.cell}>
                <Grid container item sm={12} xs={12} alignItems="baseline"></Grid>
              </Grid>
            </Grid> */}
            {/* SUBMIT BUTTON */}
            <Grid container className={classes.row}>
              <Grid container item sm={12} justifyContent="center">
                <Button onClick={handleSubmit} className={classes.doneButton}>
                  {'Save'}
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </form>
    </Root>
  );
};

const mapStateToProps = ({ provision, map, user }) => ({
  tenant: provision.selectedTenant,
  provisionType: provision.provisionType
});

const mapDispatch = ({ provision: { findAndUpdateTenantAction } }) => ({
  updateTenant: findAndUpdateTenantAction
});

export default connect(mapStateToProps, mapDispatch)(SyncEntitiesForm);
