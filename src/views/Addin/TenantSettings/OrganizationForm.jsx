import React, { useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import { Button, Grid, TextField } from '@mui/material';
import { connect } from 'react-redux';

import variables from '../../../variables.json';
import { isValidEmail } from '../../../util/validation';

const PREFIX = 'OrganizationForm';

const classes = {
  doneButton: `${PREFIX}-doneButton`,
  header: `${PREFIX}-header`,
  headerRow: `${PREFIX}-headerRow`,
  row: `${PREFIX}-row`,
  cell: `${PREFIX}-cell`,
  textField: `${PREFIX}-textField`,
  description: `${PREFIX}-description`,
  subheader: `${PREFIX}-subheader`
};

// TODO jss-to-styled codemod: The Fragment root was replaced by div. Change the tag if needed.
const Root = styled('div')(({ theme }) => ({
  [`& .${classes.doneButton}`]: {
    color: variables.LIGHT_GRAY_COLOR,
    background: variables.ORANGE_COLOR
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
      color: variables.ORANGE_COLOR
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

  [`& .${classes.description}`]: {
    fontSize: '12px',
    color: 'rgb(87, 101, 116)',
    margin: '5px 0'
  },

  [`& .${classes.subheader}`]: {
    fontSize: '16px',
    fontWeight: 500,
    color: 'rgb(87, 101, 116)',
    margin: '15px 0 0 0'
  }
}));

const OrganizationForm = (props) => {
  const [contactInfo, setContactInfo] = useState('');
  const [name, setName] = useState('');
  useEffect(() => {
    if (props.tenant) {
      props.tenant.primaryContactInfo && setContactInfo(props.tenant.primaryContactInfo);
      props.tenant.name && setName(props.tenant.name);
    }
  }, [props.tenant]);

  const handleSubmit = () => {
    const payload = {
      ...props.tenant,
      organization: props.tenant.organization,
      name: name || props.tenant.name,
      primaryContactInfo: {
        ...contactInfo
      }
    };
    delete payload._id;
    delete payload.createdAt;
    delete payload.tableData;
    // console.log(payload);
    props.updateTenant(payload);
  };

  const isNumeric = (number) => {
    const regex = new RegExp('^[0-9]*$');
    return regex.test(number);
  };

  const disableSave = () => {
    if (
      !name ||
      !contactInfo ||
      (contactInfo && (!contactInfo.phone || !contactInfo.email)) ||
      // check name
      (name !== undefined && name.trim() === '') ||
      // check phone
      (contactInfo &&
        contactInfo.phone !== undefined &&
        (contactInfo.phone.trim() === '' || contactInfo.phone.trim().length < 10)) ||
      // check email
      (contactInfo &&
        contactInfo.email !== undefined &&
        (contactInfo.email.trim() === '' || !isValidEmail(contactInfo.email.trim())))
    ) {
      return true;
    }
    return false;
  };

  return (
    <Root>
      {name && (
        <form>
          <Grid container>
            <Grid container justifyContent="center" className={classes.headerRow}>
              <Grid container item xs={12} justifyContent="center" className={classes.header}>
                Organization settings
              </Grid>
            </Grid>
            <Grid container justifyContent="center">
              <Grid container item sm={12} xs={12} justifyContent="center" className={classes.description}>
                Change Organization information
              </Grid>
            </Grid>
            <Grid container>
              <Grid container className={classes.row} spacing={2}>
                <Grid container item sm={12} xs={12} justifyContent="center" className={classes.tabs}>
                  <TextField
                    className={classes.textField}
                    label="Company name"
                    type="text"
                    name="name"
                    value={(name && name) || ''}
                    style={{
                      width: props.provisionType === 'Tenant' ? '100%' : '50%'
                    }}
                    onChange={(e) => setName(e.target.value)}
                    error={name !== undefined && name.trim() === ''}
                    helperText={name !== undefined && name.trim() === '' ? "company name can't be empty" : ''}
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
              {/* PRIMARY CONTACT INFO */}
              <Grid container justifyContent="center">
                <Grid container item xs={12} justifyContent="center" className={classes.subheader}>
                  Primary Contact Information
                </Grid>
              </Grid>
              <Grid container className={classes.row} spacing={2}>
                <Grid container item sm={12} xs={12} justifyContent="center" className={classes.cell}>
                  <Grid container item sm={12} xs={12} justifyContent="center">
                    <TextField
                      className={classes.textField}
                      label="Email"
                      type="email"
                      name="email"
                      style={{
                        width: props.provisionType === 'Tenant' ? '100%' : '50%'
                      }}
                      value={(contactInfo && contactInfo.email) || ''}
                      onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                      error={Boolean(
                        contactInfo &&
                          contactInfo.email !== undefined &&
                          (contactInfo.email.trim() === '' || !isValidEmail(contactInfo.email))
                      )}
                      helperText={
                        contactInfo && contactInfo.email !== undefined && contactInfo.email.trim() === ''
                          ? 'field required'
                          : contactInfo && contactInfo.email !== undefined && !isValidEmail(contactInfo.email)
                          ? 'invalid email'
                          : ''
                      }
                      InputLabelProps={{
                        formlabelclasses: {
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
                      label="Phone"
                      type="text"
                      name="phone"
                      style={{
                        width: props.provisionType === 'Tenant' ? '100%' : '50%'
                      }}
                      value={(contactInfo && contactInfo.phone) || ''}
                      onChange={(e) => {
                        if (!isNumeric(e.target.value)) {
                          return;
                        }
                        setContactInfo({ ...contactInfo, phone: e.target.value });
                      }}
                      error={Boolean(
                        contactInfo && contactInfo.phone !== undefined && contactInfo.phone.trim().length < 10
                      )}
                      helperText={
                        contactInfo && contactInfo.phone !== undefined && contactInfo.phone.trim() === ''
                          ? 'field required'
                          : contactInfo && contactInfo.phone !== undefined && contactInfo.phone.trim().length < 10
                          ? 'invalid phone number'
                          : ''
                      }
                      InputLabelProps={{
                        formlabelclasses: {
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
                      label="Address"
                      type="text"
                      name="address"
                      defaultValue={
                        props.tenant && props.tenant.primaryContactInfo && props.tenant.primaryContactInfo.organization
                      }
                      style={{
                        width: props.provisionType === 'Tenant' ? '100%' : '50%'
                      }}
                      onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })}
                      InputLabelProps={{
                        formlabelclasses: {
                          shrink: true
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* SUBMIT BUTTON */}
              <Grid container className={classes.row}>
                <Grid container item sm={12} justifyContent="center">
                  <Button onClick={handleSubmit} className={classes.doneButton} disabled={disableSave()}>
                    {'Save'}
                  </Button>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </form>
      )}
    </Root>
  );
};

const mapStateToProps = ({ user, provision }) => ({
  tenant: provision.selectedTenant,
  provisionType: provision.provisionType
});

const mapDispatch = ({ provision: { findAndUpdateTenantAction } }) => ({
  updateTenant: findAndUpdateTenantAction
});

export default connect(mapStateToProps, mapDispatch)(OrganizationForm);
