import React, { useCallback, useState, useEffect } from 'react';
import { Autocomplete, TextField, Popper, Box, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import { autocompleteClasses } from '@mui/material/Autocomplete';
import DoneIcon from '@mui/icons-material/Done';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';

const StyledAutocompletePopper = styled(Popper)(({ theme }) => ({
  [`& .${autocompleteClasses.paper}`]: {
    boxShadow: 'none',
    margin: 0,
    color: 'inherit',
    fontSize: 13,
    backgroundColor: theme.palette.background.default
  },
  [`& .${autocompleteClasses.listbox}`]: {
    padding: 0,
    borderRadius: 4,
    backgroundColor: theme.palette.background.default,
    [`& .${autocompleteClasses.option}`]: {
      padding: '8px 16px',
      borderBottom: `1px solid ${theme.palette.divider}`,
      "&[aria-selected='true']": {
        backgroundColor: 'transparent'
      },
      '&:hover': {
        backgroundColor: theme.palette.action.hover
      }
    },
    '&::-webkit-scrollbar': {
      width: '8px'
    },
    '&::-webkit-scrollbar-track': {
      background: '#f1f1f1'
    },
    '&::-webkit-scrollbar-thumb': {
      background: '#888',
      borderRadius: '4px'
    },
    '&::-webkit-scrollbar-thumb:hover': {
      background: '#555'
    }
  }
}));

function PopperComponent(props) {
  return <StyledAutocompletePopper {...props} />;
}

/**
 * CustomAutocomplete component renders a customized Autocomplete input field for selecting BLE tags.
 *
 * @component
 * @param {Object[]} availableTags - Array of available BLE tags to choose from (including those assigned).
 * @param {string[]} selectedTags - Array of currently selected tag device IDs.
 * @param {function} handleTagChange - Callback function to handle changes in selected tags.
 *
 * @example
 * const availableTags = [{ deviceId: 'tag1' }, { deviceId: 'tag2' }];
 * const selectedTags = ['tag1'];
 * const handleTagChange = (event, newValue) => {
 *   console.log(newValue);
 * };
 *
 * <CustomAutocomplete
 *   availableTags={availableTags}
 *   selectedTags={selectedTags}
 *   handleTagChange={handleTagChange}
 * />
 */
const CustomAutocomplete = ({ availableTags, selectedTags, handleTagChange, placeholder }) => {
  const [initialSelectedTags, setInitialSelectedTags] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setInitialSelectedTags(selectedTags);
    }
  }, [open, selectedTags]);

  return (
    <Box sx={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'right' }}>
      <Autocomplete
        multiple
        disableCloseOnSelect
        renderTags={() => null}
        noOptionsText="No Available Devices"
        options={availableTags}
        autoHighlight
        disableClearable
        // Selected Tags are pinned to the top of the list
        // options={[...availableTags].sort((a, b) => {
        //   let ai = initialSelectedTags.indexOf(a.deviceId);
        //   ai = ai === -1 ? initialSelectedTags.length + availableTags.indexOf(a) : ai;
        //   let bi = initialSelectedTags.indexOf(b.deviceId);
        //   bi = bi === -1 ? initialSelectedTags.length + availableTags.indexOf(b) : bi;
        //   return ai - bi;
        // })}
        getOptionLabel={(option) => option.deviceId}
        onChange={handleTagChange}
        value={availableTags.filter((tag) => selectedTags.includes(tag.deviceId))}
        renderOption={(props, option, { selected }) => {
          return (
            <li {...props} key={option.deviceId} style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              {/* Selection Indicator */}
              <Box
                component={DoneIcon}
                sx={{ width: 17, height: 17, mr: '5px', ml: '-2px' }}
                style={{
                  visibility: selected ? 'visible' : 'hidden'
                }}
              />
              {/* Device Color Indicator */}
              <Box
                component="span"
                sx={{
                  width: 14,
                  height: 14,
                  flexShrink: 0,
                  borderRadius: '3px',
                  mr: 1,
                  mt: '2px'
                }}
                style={{ backgroundColor: option.color }}
              />
              {/* Name & MAC */}
              <Box
                sx={(t) => ({
                  flexGrow: 1,
                  '& span': {
                    color: '#8b949e',
                    ...t.applyStyles('light', {
                      color: '#586069'
                    })
                  }
                })}
              >
                {option.deviceId}
                {/* <br />
                <span>{option.deviceId}</span> */}
              </Box>
              {/* Close Icon */}
              <Box
                component={CloseIcon}
                sx={{ opacity: 0.6, width: 18, height: 18 }}
                style={{
                  visibility: selected ? 'visible' : 'hidden'
                }}
              />
            </li>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            placeholder={placeholder}
            InputProps={{
              ...params.InputProps,
              style: { backgroundColor: 'white' }
            }}
          />
        )}
        PopperComponent={PopperComponent}
        disablePortal
        PaperComponent={useCallback(
          ({ children }) => (
            <div
              style={{
                backgroundColor: '#fff',
                borderBottom: '1px solid #eaecef',
                borderLeft: '1px solid #eaecef',
                borderRight: '1px solid #eaecef'
              }}
            >
              {children}
            </div>
          ),
          []
        )}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        sx={{
          width: {
            xs: '100%',
            sm: 300,
            md: '40%'
          },
          minWidth: 200
        }}
      />
      {open && (
        <IconButton
          onClick={() => setOpen(false)}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 1,
            backgroundColor: 'white',
            '&:hover': {
              backgroundColor: 'lightgray'
            }
          }}
        >
          <CheckIcon />
        </IconButton>
      )}
    </Box>
  );
};

export default CustomAutocomplete;
