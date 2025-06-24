export const groupTree = (groupArr, organization, groupIdArr) => {
  // create hashmap
  let generatedHashMap = {};
  groupArr.map((groupObj) => {
    if (groupObj.organization === organization && groupIdArr.includes(groupObj.groupId)) {
      generatedHashMap[groupObj.groupId] = groupObj;
    }
  });
  let generatedTree = Object.assign({}, generatedHashMap);
  // find children and replace with objects
  for (let i = 0; i < groupArr.length; i++) {
    let doc = groupArr[i];
    if (typeof doc === 'string') continue;
    let children = doc.children;
    let ref_children = [];
    for (let j = 0; j < children.length; j++) {
      let childId = typeof children[j] === 'string' ? children[j] : children[j].groupId;
      if (generatedTree[childId]) {
        generatedTree[childId].parent = { ...doc };
        ref_children.push(generatedTree[childId]);
        delete generatedTree[childId];
      }
    }
    doc.children = ref_children;
  }
  return { generatedHashMap, generatedTree };
};
