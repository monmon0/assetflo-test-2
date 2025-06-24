import React from 'react';
import { Menu, MenuItem } from '@mui/material';

const FilterByStatus = ({ dropDownAnchor, closeDropDown, filterByActivity, updateActivityFilter }) => {
  return (
    <Menu
      anchorEl={dropDownAnchor}
      keepMounted
      open={Boolean(dropDownAnchor)}
      onClose={closeDropDown}
      PaperProps={{
        style: {
          width: 250
        }
      }}
      variant="menu"
    >
      {filterByActivity &&
        Object.entries(filterByActivity).map(([key, value]) => (
          <MenuItem
            key={key}
            selected={value}
            onClick={() => {
              closeDropDown();
              updateActivityFilter(key);
            }}
          >
            {key}
          </MenuItem>
        ))}
    </Menu>
  );
};

export default FilterByStatus;
