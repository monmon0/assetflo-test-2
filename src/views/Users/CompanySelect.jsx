import './styles.css';
import { styled } from '@mui/material/styles';
import React, { useEffect, useState } from 'react';
import { Box, FormControl, TextField, MenuItem, Button, CircularProgress } from '@mui/material';
import { connect } from 'react-redux';

import variables from '../../variables.json';

const PREFIX = 'CompanySelect';

const classes = {
  continer: `${PREFIX}-continer`,
  submitButton: `${PREFIX}-submitButton`,
  error: `${PREFIX}-error`,
  lable: `${PREFIX}-lable`,
  header: `${PREFIX}-header`,
  LoginWithGeotabAccount: `${PREFIX}-LoginWithGeotabAccount`,
  select: `${PREFIX}-select`
};

const StyledBox = styled(Box)(({ theme }) => ({
  [`& .${classes.continer}`]: {
    borderRadius: '5px',
    boxShadow: '0 4px 8px 0 rgba(0,0,0,0.10)',
    marginBottom: '10px',
    cursor: 'pointer',
    padding: '15px',
    alignItems: 'center',
    background: variables.WHITE_COLOR
  },

  [`& .${classes.submitButton}`]: {
    background: variables.ORANGE_COLOR,
    color: variables.WHITE_COLOR,
    display: 'block',
    boxSizing: 'border-box',
    // width: '30%',
    borderRadius: '4px',
    border: '1px solid white',
    padding: '10px 15px',
    margin: 'auto',
    marginTop: '10px',
    fontSize: '14px'
  },

  [`& .${classes.error}`]: {
    color: variables.RED_COLOR
  },

  [`& .${classes.lable}`]: {
    color: variables.ORANGE_COLOR
  },

  [`& .${classes.header}`]: {
    marginBottom: '10px',
    color: variables.ORANGE_COLOR,
    fontWeight: 'bold',
    fontSize: '20px'
  },

  [`& .${classes.LoginWithGeotabAccount}`]: {
    cursor: 'pointer',
    color: variables.ORANGE_COLOR
  },

  [`& .${classes.select}`]: {
    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: variables.DARK_GRAY_COLOR
    }
  }
}));

const CompanySelect = (props) => {
  const [db, setDb] = useState(props.database);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTenants = async () => {
      // // Simulate a delay to test the loading spinner
      // await new Promise(resolve => setTimeout(resolve, 1000));
      await props.getAllTenants();
      setLoading(false);
    };
    fetchTenants();
  }, []);

  const handleSubmitForm = async (data) => {
    // await props.assetfloLogin(data);
    // get groups
    window.localStorage.removeItem(`af_token_${props.database}`);
    await props.getGroups({ database: db, group: props.group });
    await props.renderComponent('mapbox');
  };

  const handleChange = (e) => {
    setDb(e.target.value);
  };

  const sortedTenants = props.allTenants
    ? [...props.allTenants].sort((a, b) => (a.name || a.organization).localeCompare(b.name || b.organization))
    : [];

  return (
    <StyledBox
      style={{
        paddingTop: 200,
        height: 'calc(100vh - 150px)'
      }}
    >
      <Box
        style={{
          width: props.screenWidth > 750 ? '30%' : '95%',
          marginLeft: props.screenWidth > 750 ? 'auto' : '10px',
          marginRight: props.screenWidth > 750 ? 'auto' : '10px'
        }}
        className={classes.continer}
      >
        {props.error && <span className={classes.error}>{props.error}</span>}
        <Box className={classes.header}>
          <span>Select Company</span>
        </Box>
        {loading ? (
          <Box style={{ textAlign: 'center', marginTop: 20, marginBottom: 20 }}>
            <CircularProgress />
          </Box>
        ) : (
          <FormControl fullWidth>
            <TextField
              className={classes.select}
              id="database"
              value={db}
              variant="outlined"
              onChange={handleChange}
              select
            >
              {sortedTenants.map((tenant) => (
                <MenuItem key={tenant.organization} value={tenant.organization}>
                  {tenant.name || tenant.organization}
                </MenuItem>
              ))}
            </TextField>
          </FormControl>
        )}

        {props.allTenants && props.allTenants.length > 0 && (
          <Button className={classes.submitButton} onClick={handleSubmitForm}>
            Select
          </Button>
        )}
      </Box>
    </StyledBox>
  );
};

const mapStateToProps = ({ user, location, provision }) => ({
  email: user.email,
  group: user.group,
  database: user.database,
  routerLocation: location.routerLocation,
  screenWidth: location.screenWidth,
  allTenants: provision.allTenants
});

const mapDispatch = ({
  user: { getGroupsAction },
  location: { renderComponentAction },
  provision: { getAllTenantsAction }
}) => ({
  getGroups: getGroupsAction,
  renderComponent: renderComponentAction,
  getAllTenants: getAllTenantsAction
});

export default connect(mapStateToProps, mapDispatch)(CompanySelect);
