import React, { useState, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import {
  Menu,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Button,
  IconButton,
  List,
  ListItem,
  Collapse
} from '@mui/material';
import { connect } from 'react-redux';

import variables from '../../variables.json';
import GroupIcon from '@mui/icons-material/Group';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { groupTree } from '../../util/groupTree';

const PREFIX = 'GroupSelector';

const classes = {
  container: `${PREFIX}-container`,
  mainButton: `${PREFIX}-mainButton`,
  checkbox: `${PREFIX}-checkbox`,
  buttonContainer: `${PREFIX}-buttonContainer`,
  mainDropDown: `${PREFIX}-mainDropDown`
};

const Root = styled('div')(({ theme }) => ({
  [`& .${classes.container}`]: {
    height: '48px'
  },

  [`& .${classes.mainButton}`]: {
    textTransform: 'none',
    color: variables.ORANGE_COLOR
  },

  [`& .${classes.checkbox}`]: {
    color: variables.ORANGE_COLOR,
    '&.Mui-checked': {
      color: variables.ORANGE_COLOR
    }
  },

  [`& .${classes.buttonContainer}`]: {
    justifyContent: 'space-between'
  },

  [`& .${classes.mainDropDown}`]: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%'
  }
}));

const GroupSelector = (props) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [checkedGroups, setCheckedGroups] = useState({});
  const [expand, setExpand] = useState({});
  const [groupsHashMap, setGroupsHashMap] = useState('');
  const [groupsTree, setGroupsTree] = useState('');

  useEffect(() => {
    // create a tree
    if (props.groupObjects) {
      const { generatedHashMap, generatedTree } = groupTree(props.groupObjects, props.database, props.groups);
      setGroupsTree(generatedTree);
      setGroupsHashMap(generatedHashMap);
    }
  }, [props.groupObjects]);
  useEffect(() => {
    let groupFilter = JSON.parse(localStorage.getItem(`groupFilter_${props.database}`));
    let checkedGroups = {};
    if (groupFilter) {
      groupFilter.map((group) => {
        checkedGroups[group] = true;
      });
      setCheckedGroups(checkedGroups);
      props.setGroupFilter({ groupList: groupFilter });
    }
  }, []);

  const handleExpand = (value) => {
    setExpand({ ...expand, [value]: !expand[value] });
  };

  const handleOpenDropDown = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseDropDown = () => {
    applyGroups();
    setAnchorEl(null);
  };

  const applyGroups = () => {
    let groupFilter = [];
    for (let group in checkedGroups) {
      if (checkedGroups[group]) {
        groupFilter.push(group);
      }
    }
    props.setGroupFilter({ groupList: groupFilter });
    localStorage.setItem(`groupFilter_${props.database}`, JSON.stringify(groupFilter));
    setAnchorEl(null);
  };

  const handleToggle = (groupId) => () => {
    const value = !checkedGroups[groupId];
    let currentCheckedGroup = { ...checkedGroups, [groupId]: value };
    currentCheckedGroup = handleParentSelected(currentCheckedGroup, groupId, value);
    currentCheckedGroup = setChildrenChecked(currentCheckedGroup, groupId, value);
    setCheckedGroups({ ...checkedGroups, ...currentCheckedGroup });
  };

  const setChildrenChecked = (currentCheckedGroup, groupId, value) => {
    let children = groupsHashMap[groupId].children;
    if (children.length > 0) {
      children.map((childGroup) => {
        currentCheckedGroup = { ...currentCheckedGroup, [childGroup.groupId]: value };
        currentCheckedGroup = {
          ...currentCheckedGroup,
          ...setChildrenChecked(currentCheckedGroup, childGroup.groupId, value)
        };
      });
    }
    return currentCheckedGroup;
  };

  const handleParentSelected = (currentCheckedGroup, groupId, value) => {
    let parent = groupsHashMap[groupId].parent;
    if (parent) {
      let allChildrenSelected = !value;
      parent.children.map((childGroup) => {
        if (!currentCheckedGroup[childGroup]) {
          allChildrenSelected = value;
        }
      });
      allChildrenSelected !== value && (currentCheckedGroup = { ...currentCheckedGroup, [parent.groupId]: value });
      currentCheckedGroup = handleParentSelected(currentCheckedGroup, parent.groupId, value);
    }
    return currentCheckedGroup;
  };

  const resetGroups = () => {
    setCheckedGroups({});
    props.setGroupFilter({ groupList: [] });
    localStorage.setItem(`groupFilter_${props.database}`, JSON.stringify([]));
    setAnchorEl(null);
  };

  const MultiLevelList = (groupMap) => {
    return (
      groupMap &&
      Object.values(groupMap).map((group) => {
        return group.children.length === 0 ? (
          <ListItem key={group._id} button>
            <ListItemIcon onClick={handleToggle(group.groupId)}>
              <Checkbox
                edge="start"
                checked={checkedGroups[group.groupId] || false}
                disableRipple
                className={classes.checkbox}
              />
            </ListItemIcon>
            <ListItemText secondary={group.groupId === 'GroupCompanyId' ? 'Admin' : group.name} />
          </ListItem>
        ) : (
          <Root key={group._id}>
            <ListItem button>
              <ListItemIcon onClick={handleToggle(group.groupId)}>
                <Checkbox
                  edge="start"
                  checked={checkedGroups[group.groupId] || false}
                  disableRipple
                  className={classes.checkbox}
                />
              </ListItemIcon>
              <div
                onClick={() => {
                  handleExpand(group.groupId);
                }}
                className={classes.mainDropDown}
              >
                <ListItemText secondary={group.groupId === 'GroupCompanyId' ? 'Admin' : group.name} />
                <ArrowDropDownIcon />
              </div>
            </ListItem>
            <Collapse in={expand[group.groupId]} timeout="auto" unmountOnExit style={{ paddingLeft: '20px' }}>
              <List component="div">{MultiLevelList(group.children)}</List>
            </Collapse>
          </Root>
        );
      })
    );
  };

  return (
    <Root>
      {props.screenWidth > 750 ? (
        <Button
          aria-controls="group-menu"
          className={classes.mainButton}
          style={{ marginTop: props.screenWidth > 750 ? 10 : 0 }}
          aria-haspopup="true"
          onClick={handleOpenDropDown}
          endIcon={<ArrowDropDownIcon />}
        >
          {props.groupFilter.length === 1
            ? props.groupObjects && props.groupObjects.find((group) => group.groupId === props.groupFilter[0])?.name
            : props.groupFilter.length > 1
            ? 'Multiple Groups'
            : 'Company Group'}
        </Button>
      ) : (
        <IconButton
          aria-controls="group-menu"
          className={classes.mainButton}
          aria-haspopup="true"
          onClick={handleOpenDropDown}
          size="large"
        >
          <GroupIcon />
        </IconButton>
      )}
      <Menu
        anchorEl={anchorEl}
        keepMounted
        elevation={1}
        open={Boolean(anchorEl)}
        onClose={handleCloseDropDown}
        getcontentanchorel={null}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center'
        }}
      >
        <List
          component="nav"
          aria-labelledby="nested-list-subheader"
          className={classes.root}
          style={{ minWidth: '250px' }}
        >
          {groupsTree && MultiLevelList(groupsTree)}
          {/* {groups && <DropdownTreeSelect data={groups} />} */}
          <ListItem className={classes.buttonContainer}>
            <Button onClick={resetGroups} style={{ color: variables.ORANGE_COLOR }}>
              Reset
            </Button>
          </ListItem>
        </List>
      </Menu>
    </Root>
  );
};

const mapStateToProps = ({ location, user }) => ({
  screenWidth: location.screenWidth,
  groupFilter: user.groupFilter,
  groupObjects: user.groupObjects,
  database: user.database,
  groups: user.groups
});

const mapDispatch = ({ user: { setGroupFilterAction } }) => ({
  setGroupFilter: setGroupFilterAction
});

export default connect(mapStateToProps, mapDispatch)(GroupSelector);
