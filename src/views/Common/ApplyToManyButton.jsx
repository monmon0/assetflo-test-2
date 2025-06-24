import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Grid, Tooltip, Typography, Select, MenuItem, Input, IconButton } from '@mui/material';
import DoneIcon from '@mui/icons-material/Done';
import ClearIcon from '@mui/icons-material/Clear';
import { styled } from '@mui/material/styles';
import { handleGroupList, arr_diff, getGroupChildren, handleParentGroupSelection } from '../../util/handleGroups';
import { groupTree } from '../../util/groupTree';
import variables from '../../variables.json';

const PREFIX = 'FirmwareForm';

const classes = {
  root: `${PREFIX}-root`,
  checked: `${PREFIX}-checked`,
  selectItem: `${PREFIX}-selectItem`
};

const StyledGrid = styled(Grid)(({ theme, ...props }) => ({
  [`& .${classes.selectItem}`]: {
    '&.Mui-selected': {
      backgroundColor: variables.DISABLED_ORANGE_COLOR
    }
  }
}));

const ApplyToManyButton = ({
  allowAuto,
  selectedGroups,
  setSelectedGroups,
  MenuProps,
  setShowApply,
  updateMultipleCalibrations
}) => {
  const [groups, setGroups] = useState('');
  const userGroups = useSelector((state) => state.user.groups);
  const groupObjects = useSelector((state) => state.user.groupObjects);
  const database = useSelector((state) => state.user.database);
  const device = useSelector((state) => state.provision.selectedRow);

  useEffect(() => {
    if (groupObjects) {
      const { generatedTree } = groupTree(groupObjects, database, userGroups);
      let groupsList = [];
      handleGroupList(groupsList, Object.values(generatedTree), 16);
      setGroups(groupsList);
    }
  }, []);

  const handleMultiSelect = (e) => {
    let res = e.target.value;
    // new selected group
    let selected = arr_diff(selectedGroups, res)[0];
    // if new selected group is not GroupCompanyId then remove GroupCompanyId from selected groups
    // else if GroupCompanyId was not selected and user selects GroupCompanyId
    // then only GroupCompanyId (all) should be selected
    if (selected !== 'GroupCompanyId' && res.length > selectedGroups.length) {
      //new group selected
      const index = res.indexOf('GroupCompanyId');
      if (index > -1) {
        res.splice(index, 1);
      }
      // select children groups of selected group
      res.map((groupId) => {
        let currentGroup = groups.find((group) => group.groupId === groupId);
        currentGroup && getGroupChildren(currentGroup, res);
      });
      // select parent group of current group if
      // all children of this group are selcted
      res = handleParentGroupSelection(selected, true, res, groups);
    } else if (selected === 'GroupCompanyId' && res.length > selectedGroups.length) {
      // GroupCompanyId selected
      res = ['GroupCompanyId'];
    } else if (selected !== 'GroupCompanyId' && res.length < selectedGroups.length) {
      // group removed
      let removed = [selected];
      let removedGroup = groups.find((group) => group.groupId === selected);
      // unselect children groups of current group
      removedGroup && getGroupChildren(removedGroup, removed);
      res = arr_diff(selectedGroups, removed);

      // unselect parent group of current group
      res = handleParentGroupSelection(selected, false, res, groups);
    }
    if (res.length === 0) return;
    setSelectedGroups(res);
  };

  return (
    <StyledGrid item sm={12}>
      <Typography variant="span" component="span" style={{ marginRight: 10, display: 'inline-block', color: 'black' }}>
        {allowAuto ? 'Enable auto-calibration for ' : 'Disable auto-calibration for '}
      </Typography>
      <Select
        multiple
        MenuProps={MenuProps}
        name="selectedGroups"
        value={selectedGroups}
        onChange={handleMultiSelect}
        input={<Input style={{ width: 270, marginRight: 10 }} />}
      >
        {groups &&
          groups.map((group) => (
            <MenuItem
              key={group.groupId}
              value={group.groupId}
              className={classes.selectItem}
              style={{ paddingLeft: group.paddingLeft }}
            >
              {group.groupId === 'GroupCompanyId'
                ? `${allowAuto ? 'Enable' : 'Disable'} auto-calibration for all ${device.protocol} ${
                    device.deviceType
                  }s`
                : `${group.name}`}
            </MenuItem>
          ))}
      </Select>
      <Tooltip title={`Apply`}>
        <IconButton
          aria-label="Apply"
          color="primary"
          style={{ margin: 'auto', backgroundColor: 'grey', padding: '2px', marginRight: 10 }}
          onClick={() => {
            updateMultipleCalibrations();
            setShowApply(false);
          }}
          size="large"
        >
          <DoneIcon style={{ margin: 'auto', color: 'white' }} />
        </IconButton>
      </Tooltip>
      <Tooltip title={`Cancel`}>
        <IconButton
          aria-label="Apply"
          color="primary"
          style={{ margin: 'auto', backgroundColor: 'grey', padding: '2px' }}
          onClick={() => setShowApply(false)}
          size="large"
        >
          <ClearIcon style={{ margin: 'auto', color: 'white' }} />
        </IconButton>
      </Tooltip>
    </StyledGrid>
  );
};

export default ApplyToManyButton;
