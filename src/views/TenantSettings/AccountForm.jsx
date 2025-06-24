import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import { Button, Grid, TextField, Checkbox } from '@mui/material';
import { connect } from 'react-redux';
import variables from '../../variables.json';

const PREFIX = 'AccountForm';

const classes = {
  doneButton: `${PREFIX}-doneButton`,
  header: `${PREFIX}-header`,
  headerRow: `${PREFIX}-headerRow`,
  row: `${PREFIX}-row`,
  cell: `${PREFIX}-cell`,
  textField: `${PREFIX}-textField`,
  tabs: `${PREFIX}-tabs`,
  tab: `${PREFIX}-tab`,
  description: `${PREFIX}-description`
};

// TODO jss-to-styled codemod: The Fragment root was replaced by div. Change the tag if needed.
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
    padding: '5px 30px 5px 30px',
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

  [`& .${classes.textField}`]: {
    width: '100%',
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
  }
}));

const AccountForm = (props) => {
  const [newAccount, setNewAccount] = useState({ userName: '', password: '' });
  const [tab, setTab] = useState('sync');
  const [sameDigAccount, setSameDigAccount] = useState(true);

  const handleTabSelected = (tab) => {
    setNewAccount({ ...newAccount, userName: '', password: '', database: props.tenant.organization });
    setTab(tab);
  };

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

  const submitMyAdminDig = () => {
    const { database, ...credentials } = newAccount;
    const payload = {
      ...credentials,
      organization: props.tenant.organization,
      type: tab
    };
    console.log('submitMyAdminDig', payload);
    props.setMyAdminDigAccount(payload);
  };

  return (
    <Root wrldMapOnly={props.wrldMapOnly}>
      <form>
        <Grid container>
          <Grid container justifyContent="center" className={classes.headerRow}>
            <Grid container item xs={12} justifyContent="center" className={classes.header}>
              {props.tenant && !props.tenant.hasServiceAccount
                ? `Set Service Account for ${props.tenant && (props.tenant.name || props.tenant.organization)}`
                : `Change Service Account for ${props.tenant && (props.tenant.name || props.tenant.organization)}`}
            </Grid>
          </Grid>
          <Grid container justifyContent="center">
            <Grid container item sm={12} xs={12} justifyContent="center" className={classes.description}>
              <Button
                style={{
                  backgroundColor:
                    tab === 'sync'
                      ? props.wrldMapOnly
                        ? variables.GEOTAB_PRIMARY_COLOR
                        : variables.ORANGE_COLOR
                      : variables.LIGHT_GRAY_COLOR,
                  color: tab === 'sync' ? variables.WHITE_COLOR : '#000',
                  margin: '0 5px'
                }}
                onClick={() => {
                  handleTabSelected('sync');
                }}
              >
                Sync Account
              </Button>
              {props.loginType !== 'verifyGeotabAddinAccount' && (
                <>
                  <Button
                    style={{
                      backgroundColor:
                        tab === 'myadmin'
                          ? props.wrldMapOnly
                            ? variables.GEOTAB_PRIMARY_COLOR
                            : variables.ORANGE_COLOR
                          : variables.LIGHT_GRAY_COLOR,
                      color: tab === 'myadmin' ? variables.WHITE_COLOR : '#000',
                      margin: '0 5px'
                    }}
                    onClick={() => {
                      handleTabSelected('myadmin');
                    }}
                  >
                    MyAdmin Account
                  </Button>
                  {!sameDigAccount && (
                    <Button
                      style={{
                        backgroundColor:
                          tab === 'dig'
                            ? props.wrldMapOnly
                              ? variables.GEOTAB_PRIMARY_COLOR
                              : variables.ORANGE_COLOR
                            : variables.LIGHT_GRAY_COLOR,
                        color: tab === 'dig' ? variables.WHITE_COLOR : '#000',
                        margin: '0 5px'
                      }}
                      onClick={() => {
                        handleTabSelected('dig');
                      }}
                    >
                      DIG Account
                    </Button>
                  )}
                </>
              )}
            </Grid>
          </Grid>
          <Grid container justifyContent="center">
            <Grid container item sm={12} xs={12} justifyContent="center" className={classes.description}>
              {props.tenant && props.tenant.hasServiceAccount && tab === 'sync' && (
                <div style={{ fontSize: '12px' }}>
                  Current Service Account: <strong>{props.tenant.geotabAccount}</strong>
                </div>
              )}
              {props.tenant && props.myAdminAccount && tab === 'myadmin' && (
                <div style={{ fontSize: '12px' }}>
                  Current MyAdmin Account: <strong>{props.myAdminAccount}</strong>
                </div>
              )}
              {props.tenant && props.digAccount && tab === 'dig' && (
                <div style={{ fontSize: '12px' }}>
                  Current DIG Account: <strong>{props.digAccount}</strong>
                </div>
              )}
            </Grid>
          </Grid>
          {tab === 'myadmin' && (
            <Grid container justifyContent="center">
              <Grid
                container
                item
                sm={12}
                xs={12}
                justifyContent="center"
                alignItems="center"
                className={classes.description}
              >
                <Checkbox
                  checked={sameDigAccount}
                  onChange={(e) => {
                    setSameDigAccount(e.target.checked);
                    // !scrolled &&
                    //   setTimeout(() => {
                    //     window.scrollBy(0, 500);
                    //     setScrolled(true);
                    //   }, 300);
                  }}
                  size="small"
                  style={{ color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR }}
                />
                <div style={{ fontSize: '12px' }}>DIG account is the same as MyAdmin account</div>
              </Grid>
            </Grid>
          )}
          <Grid container>
            <Grid container className={classes.row} spacing={2}>
              <Grid container item sm={12} xs={12} justifyContent="center" className={classes.cell}>
                <Grid container item sm={12} xs={12} justifyContent="center">
                  <TextField
                    className={classes.textField}
                    label="Username"
                    type="email"
                    name="userName"
                    value={newAccount.userName}
                    style={{
                      width: props.provisionType === 'Tenant' ? '100%' : '50%'
                    }}
                    onChange={(e) => {
                      let value = e.target.value;
                      value && (value = value.trim());
                      setNewAccount({ ...newAccount, userName: value });
                    }}
                    InputLabelProps={{
                      formlabelclasses: {
                        root: `
                              &.focused {
                                color: red;
                              }
                            `,
                        focused: 'focused',
                        shrink: true
                      }
                    }}
                  />
                </Grid>
              </Grid>
              <Grid container item sm={12} xs={12} justifyContent="center" className={classes.cell}>
                <Grid container item sm={12} xs={12} justifyContent="center">
                  <TextField
                    className={classes.textField}
                    label="Password"
                    type="password"
                    name="password"
                    style={{
                      width: props.provisionType === 'Tenant' ? '100%' : '50%'
                    }}
                    value={newAccount.password}
                    onChange={(e) => {
                      let value = e.target.value;
                      value && (value = value.trim());
                      setNewAccount({ ...newAccount, password: value });
                    }}
                    InputLabelProps={{
                      formlabelclasses: {
                        root: `
                              &.focused {
                                color: red;
                              }
                            `,
                        focused: 'focused',
                        shrink: true
                      }
                    }}
                  />
                </Grid>
              </Grid>
              <Grid container item sm={12} xs={12} justifyContent="center" className={classes.cell}>
                <Grid container item sm={12} xs={12} justifyContent="center">
                  <TextField
                    className={classes.textField}
                    label="Database"
                    type="text"
                    name="database"
                    value={props.tenant.organization ? props.tenant.organization : ''}
                    style={{
                      width: props.provisionType === 'Tenant' ? '100%' : '50%'
                    }}
                    onChange={(e) => setNewAccount({ ...newAccount, database: e.target.value })}
                    InputLabelProps={{
                      formlabelclasses: {
                        root: `
                              &.focused {
                                color: red;
                              }
                            `,
                        focused: 'focused',
                        shrink: true
                      }
                    }}
                    disabled={true}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* SUBMIT BUTTON */}
            <Grid container className={classes.row}>
              <Grid container item sm={12} justifyContent="center">
                <Button
                  onClick={() => {
                    tab === 'sync' ? handleSubmit() : submitMyAdminDig();
                  }}
                  className={classes.doneButton}
                >
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

const mapStateToProps = ({ user, provision, map }) => ({
  userName: user.email,
  loginType: user.loginType,
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
