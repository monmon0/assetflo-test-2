import React, { useEffect, useState } from 'react';
import ProvisionTable from './ProvisionTable';
import { connect } from 'react-redux';
import ProvisionButton from './ProvisionButton';
import AdminProvisionTable from './AdminProvisionTable';
import ProvisionTableMobSize from './ProvisionTableMobSize';
import PoiTable from './PoiTable';
import TenantTable from './TenantTable';
import FirmwareTable from './FirmwareTable';
import variables from '../../variables.json';
import { MTableCell } from '@material-table/core';
import { Tooltip, FormControl, Select, Input, MenuItem } from '@mui/material';
import { hasAccess } from '../../util/hasAccess';
import { groupTree } from '../../util/groupTree';
import { handleGroupList, arr_diff, getGroupChildren, handleParentGroupSelection } from '../../util/handleGroups';
import OrganizationMain from '../TenantSettings/OrganizationMain';
import CustomSwitch from '../Common/CustomSwitch';
import { styled } from '@mui/material/styles';

const PREFIX = 'Provision';
const classes = {
  select: `${PREFIX}-select`
};

const Root = styled('div')(({ theme, ...props }) => ({
  [`& .${classes.select}`]: {
    '&.Mui-selected': {
      backgroundColor: 'rgb(248, 147, 28, 0.5)'
    }
  }
}));

function Provision(props) {
  const ITEM_HEIGHT = 48;
  const ITEM_PADDING_TOP = 8;
  const MenuProps = {
    PaperProps: {
      style: {
        maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
        width: 250
      }
    },
    variant: 'menu',
    getContentAnchorEl: null
  };

  let allTenantsOrganization =
    props.allTenants &&
    props.allTenants.reduce((acc, cur) => {
      acc[cur.organization] = cur.organization;

      return acc;
    }, {});

  const [groupsTree, setGroupsTree] = useState('');

  useEffect(() => {
    // create a tree
    if (props.groupObjects) {
      const { generatedTree } = groupTree(props.groupObjects, props.database, props.groups);
      let groupsList = [];
      handleGroupList(groupsList, Object.values(generatedTree), 18);
      setGroupsTree(groupsList);
    }
  }, [props.groupObjects]);

  useEffect(() => {
    props.provisionType === 'Provision' &&
      hasAccess(props.userPermissions, variables.ADVANCETOOL, props.role, props.database, props.group) &&
      props.getAllTenants();
  }, [props.provisionType]);

  const renderTable = () => {
    if (
      (props.provisionType === 'Locator' || props.provisionType === 'Tag' || props.provisionType === 'Ancher') &&
      props.screenWidth > 1000
    ) {
      return (
        <ProvisionTable
          renderSwitcher={renderSwitcher}
          validateMac={validateMac}
          customComponents={{ ...groupCell }}
          renderGroupNames={renderGroupNames}
          groupsEditComponent={groupsEditComponent}
        />
      );
    } else if (
      (props.provisionType === 'Locator' || props.provisionType === 'Tag' || props.provisionType === 'Ancher') &&
      props.screenWidth <= 1000
    ) {
      return <ProvisionTableMobSize renderGroupNames={renderGroupNames} />;
    }
    if (props.provisionType === 'Provision' && props.screenWidth > 1000) {
      return <AdminProvisionTable tableData={tableData()} />;
    } else if (props.provisionType === 'Provision' && props.screenWidth <= 1000) {
      return <ProvisionTableMobSize renderGroupNames={renderGroupNames} />;
    }

    if (props.provisionType === 'Poi') {
      return (
        <PoiTable groupCell={groupCell} renderGroupNames={renderGroupNames} groupsEditComponent={groupsEditComponent} />
      );
    }
    if (props.provisionType === 'Tenant') {
      return <TenantTable renderSwitcher={renderSwitcher} />;
    }

    if (props.provisionType === 'Organization' || props.provisionType === 'Geotab') {
      return <OrganizationMain />;
    }
    if (props.provisionType === 'Firmware') {
      return <FirmwareTable protocolColumn={protocolColumn} />;
    }
  };

  const validateMac = (mac) => {
    const reg = new RegExp('^[A-Fa-f0-9]+$');
    return reg.test(mac);
  };

  const renderGroupNames = (groups) => {
    // get array of group Objects
    let deviceGroups =
      props.groupObjects &&
      props.groupObjects.filter((groupObj) => {
        return groups && groups.includes(groupObj.groupId);
      });

    // get parent groups to display
    let filteredGroups = [];
    deviceGroups &&
      deviceGroups.map((group) => {
        let parent = getParent(group, deviceGroups);
        if (!filteredGroups.some((g) => g.groupId === parent.groupId)) filteredGroups.push(parent);
      });
    // console.log(filteredGroups);
    if (filteredGroups.length === 0) filteredGroups = deviceGroups;

    filteredGroups &&
      filteredGroups.length > 1 &&
      (filteredGroups = filteredGroups.filter((group) => {
        return group.groupId !== 'GroupCompanyId';
      }));
    return (
      (filteredGroups &&
        filteredGroups
          .map((gr) => {
            return gr.groupId === 'GroupCompanyId' ? 'Admin' : gr.name;
          })
          .join(',')) ||
      'Admin'
    );
  };

  const getParent = (group, groupList) => {
    if (!group.parent || !groupList.some((g) => g.groupId === group.parent.groupId)) return group;
    return getParent(group.parent, groupList);
  };

  const groupCell = {
    Cell: (cellProps) => {
      // if (cellProps.columnDef.title === 'Groups' || cellProps.columnDef.title === 'Group') {
      //   // TODO: verify - this stopped working probably because Tooltip changed in mui v5
      //   return (
      //     <Tooltip title={renderGroupNames(cellProps.value)} placement="bottom-start">
      //       <MTableCell {...cellProps} />
      //     </Tooltip>
      //   );
      // }
      return <MTableCell {...cellProps} />;
    }
  };

  const groupsEditComponent = (groupsArray, fieldProps) => {
    return (
      <FormControl style={{ maxWidth: '100%', overflow: 'hidden' }}>
        <Select
          multiple
          MenuProps={MenuProps}
          value={groupsArray}
          style={{ fontSize: '13px' }}
          onChange={(e) => {
            if (fieldProps.rowData.serialNo) {
              props.setNote({
                message: 'Devices with Serial № can be edited on Geotab portal only',
                variant: 'warning'
              });
              return;
            }
            let prevGroups = fieldProps.value || ['GroupCompanyId'];
            let currentlySelected = e.target.value;
            let res = handleGroupSelection(prevGroups, currentlySelected);

            fieldProps.onChange(res);
          }}
          input={<Input />}
        >
          {groupsListForSelect(groupsTree)}
        </Select>
      </FormControl>
    );
  };

  const groupsListForSelect = (groups) => {
    return (
      groups &&
      groups.map((group) => {
        return (
          <MenuItem
            key={group._id || JSON.stringify(group)}
            value={group.groupId}
            style={{
              paddingLeft: group.paddingLeft
            }}
            className={classes.select}
          >
            {group.groupId === 'GroupCompanyId' ? 'Admin' : group.name}
          </MenuItem>
        );
      })
    );
  };

  const handleGroupSelection = (prevGroups, currentlySelected) => {
    let res = currentlySelected;
    let selected = arr_diff(prevGroups, res)[0];
    console.log('handleGroupSelection', res, prevGroups);
    if (selected !== 'GroupCompanyId' && res.length > prevGroups.length) {
      //new group selected
      const index = res.indexOf('GroupCompanyId');
      if (index > -1) {
        res.splice(index, 1);
      }
      // select children of selected element
      res &&
        res.map((groupId) => {
          let currentGroup = groupsTree.find((group) => group.groupId === groupId);
          currentGroup && getGroupChildren(currentGroup, res);
        });
      res = handleParentGroupSelection(selected, true, res, groupsTree);
    } else if (selected === 'GroupCompanyId' && res.length > prevGroups.length) {
      // GroupCompanyId selected
      res = ['GroupCompanyId'];
    } else if (selected !== 'GroupCompanyId' && res.length < prevGroups.length) {
      // group removed
      let removed = [selected];
      let removedGroup = groupsTree.find((group) => group.groupId === selected);
      removedGroup && getGroupChildren(removedGroup, removed);
      res = arr_diff(prevGroups, removed);
      res = handleParentGroupSelection(selected, false, res, groupsTree);
    }
    return res;
  };

  const renderSwitcher = (fieldProps) => {
    // console.log('fieldProps', fieldProps);
    return (
      <CustomSwitch
        checked={fieldProps.value || false}
        onChange={(e) => {
          fieldProps.onChange(!fieldProps.value);
        }}
        name="checkedA"
      />
    );
  };

  const protocolColumn = {
    title: 'Protocol',
    field: 'protocol',
    filtering: false,
    headerStyle: {
      color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
      fontWeight: 'bold'
    },
    cellStyle: {
      color: '#576574',
      width: '20%'
    },
    editComponent: (fieldProps) => {
      const deviceType = fieldProps.rowData.deviceType;
      const protocols =
        deviceType === 'Tag'
          ? props.provisionType === 'Firmware'
            ? ['BLE', 'LTE', 'IOX']
            : ['BLE', 'OTS.BLE', 'LTE', 'IOX']
          : ['WIFI', 'LTE'];
      const defaultValue = protocols.includes(fieldProps.value) ? fieldProps.value : protocols[0];
      if (defaultValue !== fieldProps.value) {
        fieldProps.onChange(defaultValue);
      }
      return (
        <Select
          value={defaultValue}
          style={{ fontSize: '13px' }}
          input={<Input />}
          onChange={(e) => {
            fieldProps.onChange(e.target.value);
          }}
        >
          {protocols &&
            protocols.map((option, key) => {
              return (
                <MenuItem key={key} value={option}>
                  {option}
                </MenuItem>
              );
            })}
        </Select>
      );
    }
  };

  function tableData() {
    let columns = [
      {
        title: 'MAC',
        field: 'deviceId',
        filtering: false,
        headerStyle: {
          color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
          fontWeight: 'bold'
        },
        cellStyle: {
          color: '#576574',
          width: '20%'
        },
        editable: 'onAdd',
        validate: (rowData) => {
          return rowData.deviceId === '' || (rowData.deviceId && rowData.deviceId.trim() === '')
            ? { isValid: false, helperText: 'required field' }
            : true;
        }
      },
      {
        title: 'Organization',
        field: 'organization',
        filtering: false,
        headerStyle: {
          color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
          fontWeight: 'bold'
        },
        cellStyle: {
          color: '#576574',
          width: '20%'
        },
        initialEditValue: (props.allTenants && props.allTenants.length > 0 && props.allTenants[0].organization) || '',
        lookup: allTenantsOrganization && allTenantsOrganization
      },
      {
        title: 'Type',
        field: 'deviceType',
        filtering: false,
        headerStyle: {
          color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
          fontWeight: 'bold'
        },
        cellStyle: {
          color: '#576574',
          width: '20%'
        },
        lookup: { Tag: 'Tag', Locator: 'Locator' },
        initialEditValue: 'Tag'
      },
      // {
      //   title: 'Supported Protocols',
      //   field: 'supported',
      //   filtering: false,
      //   headerStyle: {
      //     color: '#F8931C',
      //     fontWeight: 'bold'
      //   },
      //   cellStyle: {
      //     color: '#576574',
      //     width: '20%'
      //   }
      // editComponent: (fieldProps) => {
      //   const deviceType = fieldProps.rowData.deviceType;
      //   const protocols = deviceType === 'Tag' ? ['BLE', 'LTE'] : ['WIFI', 'LTE'];

      //   const checker = (arr, target) => target.every((v) => arr.includes(v));

      //   const defaultValue = checker(protocols, fieldProps.value || []) ? fieldProps.value : [protocols[0]];
      //   return (
      //     <Select
      //       multiple
      //       value={defaultValue}
      //       style={{ fontSize: '13px' }}
      //       input={<Input />}
      //       onChange={(e) => {
      //         // groups can't be empty
      //         if (e.target.value.length === 0) return;
      //         fieldProps.onChange(e.target.value);
      //       }}
      //     >
      //       {protocols &&
      //         protocols.map((option, key) => {
      //           return (
      //             <MenuItem key={key} value={option}>
      //               {option}
      //             </MenuItem>
      //           );
      //         })}
      //     </Select>
      //   );
      // }
      // },

      {
        ...protocolColumn
      },
      {
        title: 'Provisioned',
        field: 'isProvisioned',
        filtering: false,
        headerStyle: {
          color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
          fontWeight: 'bold'
        },
        cellStyle: {
          color: '#576574',
          width: '20%'
        },
        customSort: (a, b) => {
          const aVal = a?.isProvisioned ? 1 : 0;
          const bVal = b?.isProvisioned ? 1 : 0;
          return aVal - bVal;
        },
        // editable: 'onUpdate',
        // render: (rowData) => renderIsProvisioned(rowData),
        editComponent: (fieldProps) => renderSwitcher(fieldProps),
        type: 'boolean'
      },
      {
        title: 'Source',
        field: 'source',
        filtering: false,
        headerStyle: {
          color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
          fontWeight: 'bold'
        },
        cellStyle: {
          color: '#576574',
          width: '20%'
        },
        editable: 'never'
      },
      {
        title: 'Status',
        field: 'status',
        filtering: false,
        headerStyle: {
          color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
          fontWeight: 'bold'
        },
        cellStyle: {
          color: '#576574',
          width: '20%'
        },
        editable: 'never'
      }
    ];

    let data = [];
    props.provisionDevices &&
      props.provisionDevices.length > 0 &&
      props.provisionDevices.map((d) => {
        // console.log('provision data', d);
        let tableRowData = [];
        tableRowData = {
          deviceId: d.deviceId,
          createdAt: d.createdAt,
          status: d.status,
          deviceType: d.deviceType,
          // lat: d.location && d.location.lat,
          // lng: d.location && d.location.lng,
          // alt: d.location && d.location.alt,
          organization: d.organization,
          isProvisioned: d.isProvisioned,
          source: d.source,
          protocol: d.protocol,
          supported: d.supported
        };
        data.push(tableRowData);
      });

    return { columns, data };
  }

  return (
    <Root
      style={{
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'column',
        // marginTop: '5px',
        minHeight: 'calc(100vh - 100px)'
      }}
    >
      <ProvisionButton />
      {renderTable()}
    </Root>
  );
}

const mapStateToProps = ({ provision, location, user, map }) => ({
  provisionType: provision.provisionType,
  screenWidth: location.screenWidth,
  provisionDevices: provision.provisionDevices,
  allTenants: provision.allTenants,
  database: user.database,
  role: user.role,
  groups: user.groups,
  userPermissions: user.userPermissions,
  groupObjects: user.groupObjects,
  groupFilter: user.groupFilter,
  group: user.group,
  wrldMapOnly: map.wrldMapOnly && user.loginType === 'verifyGeotabAddinAccount'
});

const mapDispatch = ({
  provision: { setProvisionTypeAction, updateIsProvisionedAction, getAllTenantsAction },
  notifications: { setNoteAction }
}) => ({
  setProvisionType: setProvisionTypeAction,
  updateIsProvisioned: updateIsProvisionedAction,
  getAllTenants: getAllTenantsAction,
  setNote: setNoteAction
});

export default connect(mapStateToProps, mapDispatch)(Provision);
