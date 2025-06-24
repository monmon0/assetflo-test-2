import React from 'react';
// import useFilterByActivity from '../../../hooks/useFilterByActivity';
import { IconButton, Tooltip } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import FilterByStatus from '../Common/FilterByStatus';
import variables from '../../variables';

const FilterByStatusButton = ({
  dropDownAnchor,
  openDropDown,
  closeDropDown,
  filterByActivity,
  updateActivityFilter,
  routerLocation,
  wrldMapOnly
}) => {
  return (
    <>
      <Tooltip title={`Filter by status`}>
        <IconButton
          aria-label="filter"
          onClick={(e) => openDropDown(e)}
          style={{
            color:
              routerLocation === 'wrldAddin' || wrldMapOnly
                ? variables.GEOTAB_PRIMARY_COLOR
                : // : props.filterType !== 'All'
                  // ? variables.GREEN_COLOR
                  variables.ORANGE_COLOR,
            zIndex: '10'
          }}
          size="small"
        >
          <FilterListIcon />
        </IconButton>
      </Tooltip>
      <FilterByStatus
        dropDownAnchor={dropDownAnchor}
        closeDropDown={closeDropDown}
        filterByActivity={filterByActivity}
        updateActivityFilter={updateActivityFilter}
      />
    </>
  );
};

export default FilterByStatusButton;
