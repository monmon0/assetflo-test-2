import { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { ClearIcon } from '@mui/x-date-pickers';
import { Button, Grid, TextField, Checkbox } from '@mui/material';
import SyncEntitiesForm from '../TenantSettings/SyncEntitiesForm';

const MenuIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
  </svg>
);

function EditTenantModal({ isOpen, onClose, tenant, onSave, ...props }) {
  // State to track which view is active
  const [newAccount, setNewAccount] = useState({ userName: '', password: '', database: '' });
  const [activeView, setActiveView] = useState('serviceAccount');
  const [tab, setTab] = useState('sync'); // For account type selection
  const [sameDigAccount, setSameDigAccount] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // State for toggle switches
  const [syncSettings, setSyncSettings] = useState({
    zone: false,
    group: false,
    iox: false,
    customData: false
  });

  // Initialize account with tenant organization
  useEffect(() => {
    if (tenant?.organization) {
      setNewAccount((prev) => ({
        ...prev,
        database: tenant.organization
      }));
    }
  }, [tenant?.organization]);

  const handleTabSelected = (selectedTab) => {
    setNewAccount({
      userName: '',
      password: '',
      database: tenant?.organization || ''
    });
    setTab(selectedTab);
    // Close sidebar on mobile after selection
    setIsSidebarOpen(false);
  };

  const handleSyncSettingsSave = () => {
    // Handle sync settings save logic here
    console.log('Saving sync settings:', syncSettings);
  };

  const handleToggleChange = (setting) => {
    setSyncSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleSubmit = () => {
    const syncEntities = tenant?.syncEntities;
    const payload = {
      organization: tenant?.organization,
      database: tenant?.organization,
      geotabAccount: {
        ...newAccount,
        database: tenant?.organization
      },
      ...(syncEntities && !Array.isArray(syncEntities) && { syncEntities: syncEntities })
    };
    // console.log('payload', payload);
    if (props.setServiceAccount) {
      console.log('save');
    }
    props.setServiceAccount && props.setServiceAccount(payload);
  };

  const submitMyAdminDig = () => {
    const { database, ...credentials } = newAccount;
    const payload = {
      ...credentials,
      organization: tenant?.organization,
      type: tab
    };
    console.log('submitMyAdminDig', payload);
    props.setMyAdminDigAccount && props.setMyAdminDigAccount(payload);
  };

  const handleChange = (e) => {
    let value = e.target.value;
    let id = e.target.id || e.target.name;
    if (value && typeof value === 'string') {
      value = value.trim();
    }
    setNewAccount({ ...newAccount, [id]: value });
  };

  const getCurrentAccountDisplay = () => {
    if (tab === 'sync' && tenant?.hasServiceAccount) {
      return `Current Service Account: ${tenant.geotabAccount}`;
    }
    if (tab === 'myadmin' && props.myAdminAccount) {
      return `Current MyAdmin Account: ${props.myAdminAccount}`;
    }
    if (tab === 'dig' && props.digAccount) {
      return `Current DIG Account: ${props.digAccount}`;
    }
    return null;
  };

  const handleViewChange = (view) => {
    setActiveView(view);
    setIsSidebarOpen(false); // Close sidebar on mobile
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl flex flex-col lg:flex-row overflow-hidden max-h-[95vh]">
        {/* Mobile Header with Menu Button */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-700">Settings</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-md hover:bg-gray-200 lg:hidden"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
            <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-200">
              <ClearIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Sidebar - Hidden on mobile unless toggled */}
        <div
          className={`
          ${isSidebarOpen ? 'block' : 'hidden'} lg:block
          w-full lg:w-64 bg-gray-50 p-4 lg:p-6 border-r-0 lg:border-r
          absolute lg:relative z-10 lg:z-auto
          lg:max-h-none max-h-[calc(100vh-8rem)] overflow-y-auto
        `}
        >
          <h2 className="text-xl lg:text-2xl font-semibold text-gray-700 mb-6 lg:mb-8 hidden lg:block">Settings</h2>
          <nav className="space-y-1">
            <div
              className={`py-3 px-4 font-medium rounded cursor-pointer transition-colors ${
                activeView === 'serviceAccount' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-300'
              }`}
              onClick={() => handleViewChange('serviceAccount')}
            >
              Service Account
            </div>
            <div
              className={`py-3 px-4 font-medium rounded cursor-pointer transition-colors ${
                activeView === 'syncEntities' ? 'bg-blue-50 text-blue-500' : 'text-blue-500 hover:bg-gray-300'
              }`}
              onClick={() => handleViewChange('syncEntities')}
            >
              Sync Entities
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Service Account view */}
          {activeView === 'serviceAccount' && (
            <div className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                <h1 className="text-lg md:text-2xl font-semibold text-gray-700 leading-tight">
                  {tenant && !tenant.hasServiceAccount
                    ? `Set Service Account for ${tenant?.name || tenant?.organization}`
                    : `Change Service Account for ${tenant?.name || tenant?.organization}`}
                </h1>
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 self-end sm:self-auto hidden lg:block"
                >
                  <ClearIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Tab Selection - Responsive */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-6">
                <button
                  onClick={() => handleTabSelected('sync')}
                  className={`${
                    tab === 'sync' ? (props.wrldMapOnly ? 'bg-blue-600' : 'bg-blue-500') : 'bg-gray-300 text-black'
                  } hover:opacity-90 text-white py-2 px-4 rounded-md font-medium transition-colors text-sm sm:text-base`}
                >
                  SYNC ACCOUNT
                </button>

                {props.loginType !== 'verifyGeotabAddinAccount' && (
                  <>
                    <button
                      onClick={() => handleTabSelected('myadmin')}
                      className={`${
                        tab === 'myadmin'
                          ? props.wrldMapOnly
                            ? 'bg-blue-600'
                            : 'bg-blue-500'
                          : 'bg-gray-200 text-black'
                      } hover:opacity-90 text-white py-2 px-4 rounded-md font-medium transition-colors text-sm sm:text-base`}
                    >
                      MY ADMIN ACCOUNT
                    </button>

                    {!sameDigAccount && (
                      <button
                        onClick={() => handleTabSelected('dig')}
                        className={`${
                          tab === 'dig' ? (props.wrldMapOnly ? 'bg-blue-600' : 'bg-blue-500') : 'bg-gray-200 text-black'
                        } hover:opacity-90 text-white py-2 px-4 rounded-md font-medium transition-colors text-sm sm:text-base`}
                      >
                        DIG ACCOUNT
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Current Account Display */}
              {getCurrentAccountDisplay() && (
                <div className="mb-6">
                  <p className="text-gray-600 text-sm break-words">{getCurrentAccountDisplay()}</p>
                </div>
              )}

              {/* DIG Account Checkbox */}
              {tab === 'myadmin' && (
                <div className="mb-6 flex items-start sm:items-center gap-2">
                  <Checkbox
                    checked={sameDigAccount}
                    onChange={(e) => {
                      setSameDigAccount(e.target.checked);
                    }}
                    size="small"
                    style={{
                      color: props.wrldMapOnly ? '#1976d2' : '#f97316'
                    }}
                  />
                  <span className="text-sm leading-relaxed">DIG account is the same as MyAdmin account</span>
                </div>
              )}

              <div>
                <div className="space-y-4 md:space-y-6">
                  <div>
                    <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <input
                      type="email"
                      id="userName"
                      name="userName"
                      value={newAccount.userName}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={newAccount.password}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="database" className="block text-sm font-medium text-gray-700 mb-1">
                      Database
                    </label>
                    <input
                      type="text"
                      id="database"
                      name="database"
                      value={tenant?.organization || ''}
                      className="w-full p-3 border border-gray-300 rounded-md bg-gray-100 text-gray-600 text-sm sm:text-base"
                      disabled
                    />
                  </div>
                </div>

                <div className="mt-6 md:mt-8 flex justify-end">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      tab === 'sync' ? handleSubmit() : submitMyAdminDig();
                    }}
                    className={`${
                      props.wrldMapOnly ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
                    } text-white py-3 px-6 md:px-8 rounded-md font-medium transition-colors text-sm sm:text-base w-full sm:w-auto`}
                  >
                    SAVE
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sync Entities view */}
          {activeView === 'syncEntities' && (
            <>
              <div className="lg:hidden flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-700">Sync Entities</h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                  <ClearIcon className="h-6 w-6" />
                </button>
              </div>
              <SyncEntitiesForm />
            </>
          )}
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-25 z-5 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
    </div>
  );
}

const mapStateToProps = ({ user, provision, map }) => ({
  userName: user.email,
  loginType: user.loginType,
  tenant: provision.selectedTenant,
  database: user.database,
  provisionType: provision.provisionType,
  digAccount: provision.digAccount,
  myAdminAccount: provision.myAdminAccount
});

const mapDispatch = ({ provision: { setServiceAccountAction, setMyAdminDigAccountAction } }) => ({
  setServiceAccount: setServiceAccountAction,
  setMyAdminDigAccount: setMyAdminDigAccountAction
});

export default connect(mapStateToProps, mapDispatch)(EditTenantModal);

// import { useState, useEffect } from 'react';
// import { ClearIcon } from '@mui/x-date-pickers';
// import { Button, Grid, TextField, Checkbox } from '@mui/material';

// export default function EditTenantModal({ isOpen, onClose, tenant, onSave }) {
//   // State to track which view is active
//   const [newAccount, setNewAccount] = useState({ userName: '', password: '' });
//   const [activeView, setActiveView] = useState('serviceAccount');
//   const [isAdminView, setAdminView] = useState(false);
//   const [sameDigAccount, setSameDigAccount] = useState(true);

//   // State for toggle switches
//   const [syncSettings, setSyncSettings] = useState({
//     zone: false,
//     group: false,
//     iox: false,
//     customData: false
//   });

//   const handleSyncSettingsSave = () => {};

//   const handleToggleChange = (setting) => {
//     setSyncSettings((prev) => ({
//       ...prev,
//       [setting]: !prev[setting]
//     }));
//   };

//   const handleSubmit = () => {
//     const syncEntities = propsroppropp.tenant.syncEntities;
//     const payload = {
//       organization: tenant.organization,
//       database: tenant.organization,
//       geotabAccount: {
//         ...newAccount,
//         database: tenant.organization
//       },
//       ...(syncEntities && !Array.isArray(syncEntities) && { syncEntities: syncEntities })
//     };
//     console.log('payload', payload);
//     props.setServiceAccount(payload);
//   };

//   const submitMyAdminDig = () => {
//     const { database, ...credentials } = newAccount;
//     const payload = {
//       ...credentials,
//       organization: props.tenant.organization,
//       type: tab
//     };
//     console.log('submitMyAdminDig', payload);
//     props.setMyAdminDigAccount(payload);
//   };

//   const handleChange = (e) => {
//     let value = e.target.value;
//     let id = e.target.id;
//     value && (value = value.trim());
//     setNewAccount({ ...newAccount, [id]: value });
//   };
//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl flex overflow-hidden">
//         {/* Sidebar */}
//         <div className="w-64 bg-gray-50 p-6 border-r">
//           <h2 className="text-2xl font-semibold text-gray-700 mb-8">Settings</h2>
//           <nav className="space-y-1">
//             <div
//               className={`py-3 px-4 font-medium rounded cursor-pointer ${
//                 activeView === 'serviceAccount' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
//               }`}
//               onClick={() => setActiveView('serviceAccount')}
//             >
//               Service Account
//             </div>
//             <div
//               className={`py-3 px-4 font-medium rounded cursor-pointer ${
//                 activeView === 'syncEntities' ? 'bg-blue-50 text-blue-500' : 'text-orange-500 hover:bg-gray-100'
//               }`}
//               onClick={() => setActiveView('syncEntities')}
//             >
//               Sync Entities
//             </div>
//           </nav>
//         </div>

//         {/* Main Content */}
//         <div className="flex-1">
//           {/* Service Account view */}
//           {activeView === 'serviceAccount' && (
//             <div className="p-6">
//               <div className="flex justify-between items-center mb-6">
//                 <h1 className="text-2xl font-semibold text-gray-700">
//                   Change Service Account for {tenant.name || tenant.organization} :
//                 </h1>
//                 <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
//                   <ClearIcon className="h-6 w-6" />
//                 </button>
//               </div>

//               <div className="flex space-x-4 mb-8">
//                 <button
//                   onClick={() => setAdminView(!isAdminView)}
//                   className={`${
//                     !isAdminView ? 'bg-blue-500' : 'bg-gray-200'
//                   }  hover:bg-blue-600 text-white py-2 px-4 rounded-md font-medium`}
//                 >
//                   SYNC ACCOUNT
//                 </button>
//                 <button
//                   onClick={() => setAdminView(!isAdminView)}
//                   className={`${
//                     isAdminView ? 'bg-blue-500' : 'bg-gray-200'
//                   }  hover:bg-blue-600 text-white py-2 px-4 rounded-md font-medium`}
//                 >
//                   MY ADMIN ACCOUNT
//                 </button>
//               </div>
//               {!isAdminView ? (
//                 <div className="mb-6">
//                   <p className="text-gray-600 text-lg">
//                     Current Service Account:{' '}
//                     <span className="font-medium text-gray-800">
//                       {/* not sure wat to put here  */}
//                       {tenant.geotabAccount}
//                     </span>
//                   </p>
//                 </div>
//               ) : (
//                 <div className="">
//                   <Checkbox
//                     checked={sameDigAccount}
//                     onChange={(e) => {
//                       setSameDigAccount(e.target.checked);
//                     }}
//                     size="small"
//                   />
//                   DIG account is the same as MyAdmin account
//                 </div>
//               )}

//               <form onSubmit={handleSubmit}>
//                 <div className="space-y-6">
//                   <div>
//                     <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
//                       Username
//                     </label>
//                     <input
//                       type="text"
//                       id="userName"
//                       name="userName"
//                       value={newAccount.userName}
//                       onChange={handleChange}
//                       className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     />
//                   </div>

//                   <div>
//                     <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
//                       Password
//                     </label>
//                     <input
//                       type="text"
//                       id="password"
//                       name="password"
//                       value={newAccount.password}
//                       onChange={handleChange}
//                       className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     />
//                   </div>

//                   <div>
//                     <label htmlFor="group" className="block text-sm font-medium text-gray-700 mb-1">
//                       Database
//                     </label>
//                     <p className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
//                       {tenant.organization}
//                     </p>
//                   </div>
//                 </div>

//                 <div className="mt-8 flex justify-end">
//                   <button
//                     className="bg-orange-500 hover:bg-orange-600 text-white py-3 px-8 rounded-md font-medium"
//                     onSubmit={handleSubmit}
//                   >
//                     SAVE
//                   </button>
//                 </div>
//               </form>
//             </div>
//           )}

//           {/* Sync Entities view */}
//           {activeView === 'syncEntities' && (
//             <div className="p-6">
//               <div className="flex justify-between items-center mb-6">
//                 <h1 className="text-2xl font-semibold text-gray-700">Sync Entities</h1>
//                 <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
//                   <ClearIcon className="h-6 w-6" />
//                 </button>
//               </div>

//               <div className="mb-8">
//                 <p className="text-gray-600 text-lg">Select services to synchronize with Geotab</p>
//               </div>

//               <div className="mb-8">
//                 <h2 className="text-xl font-medium text-gray-600 mb-8">Geotab to Assetflo</h2>

//                 <div className="grid grid-cols-2 gap-8">
//                   <div className="flex items-center justify-between">
//                     <span className="text-lg font-medium">Zone:</span>
//                     <div
//                       className={`w-14 h-7 flex items-center rounded-full p-1 cursor-pointer ${
//                         syncSettings.zone ? 'bg-orange-500' : 'bg-gray-300'
//                       }`}
//                       onClick={() => handleToggleChange('zone')}
//                     >
//                       <div
//                         className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${
//                           syncSettings.zone ? 'translate-x-7' : ''
//                         }`}
//                       ></div>
//                     </div>
//                   </div>

//                   <div className="flex items-center justify-between">
//                     <span className="text-lg font-medium">Group:</span>
//                     <div
//                       className={`w-14 h-7 flex items-center rounded-full p-1 cursor-pointer ${
//                         syncSettings.group ? 'bg-orange-500' : 'bg-gray-300'
//                       }`}
//                       onClick={() => handleToggleChange('group')}
//                     >
//                       <div
//                         className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${
//                           syncSettings.group ? 'translate-x-7' : ''
//                         }`}
//                       ></div>
//                     </div>
//                   </div>

//                   <div className="flex items-center justify-between">
//                     <span className="text-lg font-medium">IOX:</span>
//                     <div
//                       className={`w-14 h-7 flex items-center rounded-full p-1 cursor-pointer ${
//                         syncSettings.iox ? 'bg-orange-500' : 'bg-gray-300'
//                       }`}
//                       onClick={() => handleToggleChange('iox')}
//                     >
//                       <div
//                         className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${
//                           syncSettings.iox ? 'translate-x-7' : ''
//                         }`}
//                       ></div>
//                     </div>
//                   </div>

//                   <div className="flex items-center justify-between">
//                     <span className="text-lg font-medium">CustomData:</span>
//                     <div
//                       className={`w-14 h-7 flex items-center rounded-full p-1 cursor-pointer ${
//                         syncSettings.customData ? 'bg-orange-500' : 'bg-gray-300'
//                       }`}
//                       onClick={() => handleToggleChange('customData')}
//                     >
//                       <div
//                         className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${
//                           syncSettings.customData ? 'translate-x-7' : ''
//                         }`}
//                       ></div>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               <div className="flex justify-center mt-12">
//                 <button
//                   onClick={handleSyncSettingsSave}
//                   className="bg-orange-500 hover:bg-orange-600 text-white py-3 px-8 rounded-md font-medium"
//                 >
//                   SAVE
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
