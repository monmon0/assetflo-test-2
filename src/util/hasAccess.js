// const roles = {
//   superAdmin: [
//     "provisionTable",
//     "tableEditAction",
//     "selectToAssingOrgnizationAction",
//     "displayDeviceColumnAction",
//     "dragDeviceAction",
//     "advanceToolAction",
//     "addEditPolygon"
//   ],
//   admin: [
//     "tableEditAction",
//     "displayDeviceColumnAction",
//     "dragDeviceAction",
//     "addEditPolygon"
//   ],
//   user: ["displayDeviceColumnAction"],
//   operator: [""]
// };

// export const hasAccess = (role, accessType) =>
//   role && roles[role].includes(accessType);

export const hasAccess = (userPermissions, accessType, role, database, group) => {
  let userPermissionsColne = userPermissions && [...userPermissions];

  if (role && database && role === 'admin' && database === 'assetflo' && group === 'GroupCompanyId')
    userPermissionsColne = userPermissionsColne && [...userPermissionsColne, 'advanceTool', 'provision.*'];
  // console.log(userPermissionsColne);
  return userPermissionsColne && userPermissionsColne.includes(accessType);
};
