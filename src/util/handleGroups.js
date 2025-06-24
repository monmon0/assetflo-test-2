export const handleGroupList = (result, list, padding) => {
  list.map((item) => {
    item.paddingLeft = padding;
    result.push(item);
    item.children.length > 0 && handleGroupList(result, item.children, padding + 12);
  });
};

export const getGroupChildren = (group, groupChildren) => {
  group.children.map((child) => {
    getGroupChildren(child, groupChildren);
    child && child.groupId && groupChildren.indexOf(child.groupId) === -1 && groupChildren.push(child.groupId);
  });
};

export const arr_diff = (arr1, arr2) => {
  let arr = [],
    diff = [];
  if (!arr1 || !arr2) return ['GroupCompanyId'];
  for (let i = 0; i < arr1.length; i++) {
    arr[arr1[i]] = true;
  }

  for (let i = 0; i < arr2.length; i++) {
    if (arr[arr2[i]]) {
      delete arr[arr2[i]];
    } else {
      arr[arr2[i]] = true;
    }
  }

  for (let k in arr) {
    diff.push(k);
  }

  return diff;
};

export const handleParentGroupSelection = (selected, value, res, groupsTree) => {
  if (!groupsTree) return;
  let selectedObj = groupsTree.find((group) => group.groupId === selected);
  let parent = selectedObj.parent;
  if (parent) {
    let parentIndex = res.indexOf(parent.groupId);
    let allChildrenSelected = true;
    parent.children.map((childGroup) => {
      if (res.indexOf(childGroup.groupId) < 0) {
        allChildrenSelected = false;
      }
    });
    allChildrenSelected && value && res.push(parent.groupId);
    !allChildrenSelected && !value && parentIndex > -1 && res.splice(parentIndex, 1);
    res = handleParentGroupSelection(parent.groupId, value, res, groupsTree);
  }
  return res;
};

export const handleGeoGroupSelection = (res, groupsTree) => {
  // res - selected groups [groupsId, groupId]
  // groupsTree array of group objects with relationships
  if (!groupsTree) return;
  const filtered = [];
  res.map((group) => {
    const selectedObj = groupsTree.find((groupObj) => groupObj.groupId === group);
    console.log(selectedObj);
    if (selectedObj.parent && res.includes(selectedObj.parent.groupId)) return;
    filtered.push(group);
  });
  return filtered;
};

export const handleGroupsParam = (userGroups, minParams, groupFilter) => {
  const hasGroupFilter = groupFilter && groupFilter.length;
  if ((userGroups && !userGroups.includes('GroupCompanyId')) || hasGroupFilter)
    minParams.groups = hasGroupFilter ? groupFilter : userGroups;
  return minParams;
};
