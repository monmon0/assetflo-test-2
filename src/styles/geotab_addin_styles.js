import makeStyles from '@mui/styles/makeStyles';
import variables from '../variables.json';

const useStyles = makeStyles((theme) => ({
  paper: {
    margin: 0,
    outline: 'none',
    padding: '15px 25px; for main container',
    width: '598px'
  },
  cell: {
    alignItems: 'baseline',
    fontFamily:
      '"IBM Plex Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"',
    margin: '4px 0',
    fontSize: 12,
    lineHeight: '16px',
    height: 50
  },
  label: {
    color: '#4e677e',
    fontSize: '12px'
  },
  slider: {
    color: '#0078d3',
    padding: '8px 0',
    '& .MuiSlider-thumb': {
      height: 13,
      width: 13,
      backgroundColor: '#fff',
      border: '2px solid currentColor',
      '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
        boxShadow: 'inherit'
      },
      '&:before': {
        display: 'none'
      }
    }
  },
  textField: {
    width: '100%',
    '& label.Mui-focused': {
      color: variables.GEOTAB_PRIMARY_COLOR
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

  dropDown: {
    width: '60%',
    '& label.Mui-focused': {
      color: variables.GEOTAB_PRIMARY_COLOR
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
  input: {
    height: 32,
    fontSize: 12
  },
  tempInput: {
    height: 32,
    width: 173,
    fontSize: '12px'
  },
  activeButton: {
    color: '#fff',
    fill: '#fff',
    borderColor: variables.GEOTAB_PRIMARY_COLOR,
    backgroundColor: variables.GEOTAB_PRIMARY_COLOR,
    fontSize: '12px',
    fontStyle: 'normal',
    fontWeight: 400,
    letterSpacing: '.02rem',
    lineHeight: '1rem',
    textTransform: 'none',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: '4px',
    padding: '7px 9px',
    cursor: 'pointer',
    outline: 0,
    textDecoration: 'none',
    textAlign: 'center',
    fontFamily: 'Roboto, "Segoe UI", Segoe, "Helvetica Neue", Helvetica, sans-serif',
    '&:hover': {
      backgroundColor: variables.SELECTED_GEOTAB_COLOR
    }
  },
  versionItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '12px',
    width: '100%'
  },
  versionDates: {
    display: 'flex',
    flexDirection: 'column',
    fontSize: '12px',
    color: 'grey'
  },
  autoComplete: {
    fontSize: 13
  },
  fwAppliedChip: {
    position: 'absolute',
    right: '-150px',
    top: 4
  }
}));

export default useStyles;
