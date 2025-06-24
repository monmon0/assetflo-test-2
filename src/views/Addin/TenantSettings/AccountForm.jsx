import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import { Button, Checkbox } from '@mui/material';
import { connect } from 'react-redux';
import variables from '../../../variables.json';

const PREFIX = 'AccountForm';

const classes = {
  textField: `${PREFIX}-textField`,
  tabs: `${PREFIX}-tabs`,
  tab: `${PREFIX}-tab`,
  description: `${PREFIX}-description`,
  input: `${PREFIX}-input`,
  legend: `${PREFIX}-legend`
};

// TODO jss-to-styled codemod: The Fragment root was replaced by div. Change the tag if needed.
const Root = styled('div')(({ theme }) => ({
  [`& .${classes.textField}`]: {
    width: '100%',
    fontSize: 12
  },

  [`& .${classes.tabs}`]: {
    display: 'flex'
  },

  [`& .${classes.tab}`]: {
    margin: '5px',
    fontSize: '12px'
  },

  [`& .${classes.description}`]: {
    fontSize: '12px',
    color: 'rgb(87, 101, 116)',
    margin: '5px 0'
  },

  [`& .${classes.input}`]: {
    height: 32,
    fontSize: 12,
    borderColor: 'rgba(44,56,74,.95) !important'
  },

  [`& .${classes.legend}`]: {
    fontSize: '0.75em'
  }
}));

const AccountForm = (props) => {
  const [newAccount, setNewAccount] = useState({ userName: '', password: '' });
  const [myAdminAccount, setMyAdminAccount] = useState({ userName: '', password: '' });
  const [digAccount, setDigAccount] = useState({ userName: '', password: '' });
  const [sameDigAccount, setSameDigAccount] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  const handleSubmit = () => {
    const syncEntities = props.tenant.syncEntities;
    const payload = {
      organization: props.tenant.organization,
      database: props.tenant.organization,
      geotabAccount: {
        ...newAccount,
        database: props.tenant.organization
      },
      ...(syncEntities && !Array.isArray(syncEntities) && { syncEntities: syncEntities })
    };
    console.log('payload', payload);
    props.setServiceAccount(payload);
  };

  const submitMyAccount = () => {
    const payload = {
      ...myAdminAccount,
      organization: props.tenant.organization,
      type: 'myadmin'
    };
    console.log('submitMyAccount', payload);
    props.setMyAdminDigAccount(payload);
  };

  const submitDigAccount = () => {
    const payload = {
      ...digAccount,
      organization: props.tenant.organization,
      type: 'dig'
    };
    console.log('submitDigAccount', payload);
    props.setMyAdminDigAccount(payload);
  };

  return (
    <Root>
      <fieldset className="geo-form">
        <legend className={classes.legend}>Sync account</legend>
        <div className="checkmateField geo-form__field notFlexible">
          <label className="label">Username:</label>
          <div>
            <input
              name="userName"
              title="Account username"
              type="text"
              className="checkmateFormEditField geo-text-input"
              maxLength="50"
              style={{ width: 300 }}
              value={newAccount.userName}
              onChange={(e) => {
                let value = e.target.value;
                value && (value = value.trim());
                setNewAccount({ ...newAccount, userName: value });
              }}
            />
          </div>
        </div>
        <div className="checkmateField geo-form__field">
          <label className="label">Password:</label>
          <div>
            <input
              name="password"
              title="Account password"
              type="password"
              className="checkmateFormEditField geo-text-input"
              maxLength="50"
              style={{ width: 300 }}
              value={newAccount.password}
              onChange={(e) => {
                let value = e.target.value;
                value && (value = value.trim());
                setNewAccount({ ...newAccount, password: value });
              }}
            />
          </div>
        </div>
        <div className="checkmateField geo-form__field">
          <label className="label" htmlFor="af_database">
            Database:
          </label>
          <p id="af_database" title="database" data-initial-value="">
            {props.tenant.organization ? props.tenant.organization : ''}
          </p>
        </div>
        <div className="checkmateField geo-form__field">
          <label className="label">Current sync account:</label>
          <p title="database" data-initial-value="">
            {props.tenant.geotabAccount ? props.tenant.geotabAccount : 'Not set'}
          </p>
          <p>&nbsp;</p>
          <div className="elementWithoutLabel fullWidth">
            <Button className="geo-button geo-button--action fullWidth" onClick={handleSubmit}>
              Save
            </Button>
          </div>
        </div>
      </fieldset>
      {/* <fieldset className="geo-form">
        <legend className={classes.legend}>MyAdmin account</legend>
        <div className="checkmateField geo-form__field notFlexible">
          <label className="label">Username:</label>
          <div>
            <input
              name="userName"
              title="Account username"
              type="text"
              className="checkmateFormEditField geo-text-input"
              maxLength="50"
              style={{ width: 300 }}
              value={myAdminAccount.userName}
              onChange={(e) => {
                let value = e.target.value;
                value && (value = value.trim());
                setMyAdminAccount({ ...myAdminAccount, userName: value });
              }}
            />
          </div>
        </div>
        <div className="checkmateField geo-form__field">
          <label className="label">Password:</label>
          <div>
            <input
              name="password"
              title="Account password"
              type="password"
              className="checkmateFormEditField geo-text-input"
              maxLength="50"
              style={{ width: 300 }}
              value={myAdminAccount.password}
              onChange={(e) => {
                let value = e.target.value;
                value && (value = value.trim());
                setMyAdminAccount({ ...myAdminAccount, password: value });
              }}
            />
          </div>
        </div>
        <div className="checkmateField geo-form__field">
          <label className="label" htmlFor="af_database">
            Database:
          </label>
          <p id="af_database" title="database" data-initial-value="">
            {props.tenant.organization ? props.tenant.organization : ''}
          </p>
        </div>
        <div className="checkmateField geo-form__field">
          <label className="label">Current MyAdmin account:</label>
          <p title="database" data-initial-value="">
            {props.myAdminAccount ? props.myAdminAccount : 'Not set'}
          </p>
        </div>
        <div className="checkmateField geo-form__field">
          <div style={{ width: '100%', maxWidth: '100%' }}>
            <Checkbox
              checked={sameDigAccount}
              onChange={(e) => {
                setSameDigAccount(e.target.checked);
                !scrolled &&
                  setTimeout(() => {
                    window.scrollBy(0, 500);
                    setScrolled(true);
                  }, 300);
              }}
              size="small"
              style={{ color: variables.GEOTAB_PRIMARY_COLOR, marginLeft: -9 }}
            />
            <label className="label" style={{ width: '100%' }}>
              DIG account is the same as MyAdmin account
            </label>
          </div>
          <p>&nbsp;</p>
          <div className="elementWithoutLabel fullWidth">
            <Button className="geo-button geo-button--action fullWidth" onClick={submitMyAccount}>
              Save
            </Button>
          </div>
        </div>
      </fieldset>
      {!sameDigAccount && (
        <fieldset className="geo-form">
          <legend className={classes.legend}>DIG account (optional)</legend>
          <div className="checkmateField geo-form__field notFlexible">
            <label className="label" htmlFor="af_userName">
              Username:
            </label>
            <div>
              <input
                id="af_userName"
                name="userName"
                title="Account username"
                type="text"
                className="checkmateFormEditField geo-text-input"
                maxLength="50"
                style={{ width: 300 }}
                value={digAccount.userName}
                onChange={(e) => {
                  let value = e.target.value;
                  value && (value = value.trim());
                  setDigAccount({ ...digAccount, userName: value });
                }}
              />
            </div>
          </div>
          <div className="checkmateField geo-form__field">
            <label className="label" htmlFor="af_password">
              Password:
            </label>
            <div>
              <input
                id="af_password"
                name="password"
                title="Account password"
                type="password"
                className="checkmateFormEditField geo-text-input"
                maxLength="50"
                style={{ width: 300 }}
                value={digAccount.password}
                onChange={(e) => {
                  let value = e.target.value;
                  value && (value = value.trim());
                  setDigAccount({ ...digAccount, password: value });
                }}
              />
            </div>
          </div>
          <div className="checkmateField geo-form__field">
            <label className="label" htmlFor="af_database">
              Database:
            </label>
            <p id="af_database" title="database" data-initial-value="">
              {props.tenant.organization ? props.tenant.organization : ''}
            </p>
          </div>
          <div className="checkmateField geo-form__field">
            <label className="label">Current DIG account:</label>
            <p title="database" data-initial-value="">
              {props.digAccount ? props.digAccount : 'Not set'}
            </p>
            <p>&nbsp;</p>
            <div className="elementWithoutLabel fullWidth">
              <Button className="geo-button geo-button--action fullWidth" onClick={submitDigAccount}>
                Save
              </Button>
            </div>
          </div>
        </fieldset>
      )} */}
    </Root>
  );
};

const mapStateToProps = ({ user, provision }) => ({
  userName: user.email,
  tenant: provision.selectedTenant,
  database: user.database,
  provisionType: provision.provisionType,
  digAccount: provision.digAccount,
  myAdminAccount: provision.myAdminAccount
});

const mapDispatch = ({ provision: { setServiceAccountAction, setMyAdminDigAccountAction } }) => ({
  setServiceAccount: setServiceAccountAction,
  setMyAdminDigAccount: setMyAdminDigAccountAction
});

export default connect(mapStateToProps, mapDispatch)(AccountForm);
