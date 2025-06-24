import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import { Button, Switch } from '@mui/material';
import { connect } from 'react-redux';

import variables from '../../../variables.json';

const PREFIX = 'SyncEntitiesForm';

const classes = {
  switchBase: `${PREFIX}-switchBase`,
  checked: `${PREFIX}-checked`,
  track: `${PREFIX}-track`,
  rightCol: `${PREFIX}-rightCol`,
  legend: `${PREFIX}-legend`
};

// TODO jss-to-styled codemod: The Fragment root was replaced by div. Change the tag if needed.
const Root = styled('div')(({ theme }) => ({
  [`& .${classes.rightCol}`]: {
    marginTop: -10
  },

  [`& .${classes.legend}`]: {
    fontSize: '0.75em'
  }
}));

const BlueSwitch = Switch;

const SyncEntitiesForm = (props) => {
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
    <Root>
      <fieldset className="geo-form">
        <legend className={classes.legend}>Sync entities</legend>
        <div className="checkmateField geo-form__field">
          <label className="label">Zone:</label>
          <div className={classes.rightCol}>
            <BlueSwitch
              name="zone"
              checked={(syncEntitiesPull && syncEntitiesPull.zone) || false}
              onChange={(e) => handleInputChange(e)}
              classes={{
                switchBase: classes.switchBase,
                checked: classes.checked,
                track: classes.track
              }}
            />
          </div>
        </div>
        <div className="checkmateField geo-form__field">
          <label className="label">IOX:</label>
          <div className={classes.rightCol}>
            <BlueSwitch
              name="iox"
              checked={(syncEntitiesPull && syncEntitiesPull.iox) || false}
              onChange={(e) => handleInputChange(e)}
              classes={{
                switchBase: classes.switchBase,
                checked: classes.checked,
                track: classes.track
              }}
            />
          </div>
        </div>
        <div className="checkmateField geo-form__field">
          <label className="label">Group:</label>
          <div className={classes.rightCol}>
            <BlueSwitch
              name="group"
              checked={(syncEntitiesPull && syncEntitiesPull.group) || false}
              onChange={(e) => handleInputChange(e)}
              classes={{
                switchBase: classes.switchBase,
                checked: classes.checked,
                track: classes.track
              }}
            />
          </div>
        </div>
        <div className="checkmateField geo-form__field">
          <label className="label">CustomData:</label>
          <div className={classes.rightCol}>
            <BlueSwitch
              name="customData"
              checked={(syncEntitiesPull && syncEntitiesPull.customData) || false}
              onChange={(e) => handleInputChange(e)}
              classes={{
                switchBase: classes.switchBase,
                checked: classes.checked,
                track: classes.track
              }}
            />
          </div>
          <p>&nbsp;</p>
          <div className="elementWithoutLabel fullWidth">
            <Button className="geo-button geo-button--action fullWidth" onClick={handleSubmit}>
              Save
            </Button>
          </div>
        </div>
      </fieldset>
    </Root>
  );
};

const mapStateToProps = ({ provision }) => ({
  tenant: provision.selectedTenant,
  provisionType: provision.provisionType
});

const mapDispatch = ({ provision: { findAndUpdateTenantAction } }) => ({
  updateTenant: findAndUpdateTenantAction
});

export default connect(mapStateToProps, mapDispatch)(SyncEntitiesForm);
