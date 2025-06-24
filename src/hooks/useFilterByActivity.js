import { useState, useEffect } from 'react';
import useDropdown from './useDropdown';
import moment from 'moment';
import { useSelector } from 'react-redux';
import { getLastSeenMoment } from '../util/getLastSeen';

const useFilterByActivity = () => {
  const { dropDownAnchor, openDropDown, closeDropDown } = useDropdown();
  const database = useSelector((state) => state.user.database);

  const [filterByActivity, setFilterByActivity] = useState({
    All: false,
    'Active Now': false,
    'Reported Today': false,
    'Reported this Month': true,
    'No data for more than a day': false,
    'No data for more than a month': false
  });

  useEffect(() => {
    const currentFilter = JSON.parse(localStorage.getItem(`deviceStatusFilter_${database}`));
    currentFilter && setFilterByActivity(currentFilter);
  }, []);

  const updateActivityFilter = (type) => {
    const updatedFilter = Object.keys(filterByActivity).reduce((acc, key) => {
      acc[key] = key === type ? true : false;
      return acc;
    }, {});
    localStorage.setItem(`deviceStatusFilter_${database}`, JSON.stringify(updatedFilter));
    setFilterByActivity(updatedFilter);
  };

  const applyFilterByActivity = (devices) => {
    const now = moment();
    if (filterByActivity['All']) return devices;
    const res = devices?.filter((device) => {
      // If device is a POI, always include it in the list
      if (device.poiId) return true;

      const lastSeenMoment = getLastSeenMoment(device);

      if (filterByActivity['Active Now'] && now.diff(lastSeenMoment, 'minutes') <= 10) {
        return true; // Include devices active in the last 10 minutes
      }

      if (filterByActivity['Reported Today'] && lastSeenMoment.isSame(now, 'day')) {
        return true; // Include devices reported today
      }

      if (filterByActivity['Reported this Month'] && now.diff(lastSeenMoment, 'months') < 1) {
        return true; // Include devices reported this month
      }

      if (filterByActivity['No data for more than a day'] && now.diff(lastSeenMoment, 'day') > 1) {
        return true; // Include devices reported today
      }

      if (filterByActivity['No data for more than a month'] && now.diff(lastSeenMoment, 'months') >= 1) {
        return true; // Include devices with no data more than a month ago
      }

      return false; // Exclude devices that don't match any filter
    });

    return res;
  };

  return { dropDownAnchor, openDropDown, closeDropDown, filterByActivity, updateActivityFilter, applyFilterByActivity };
};

export default useFilterByActivity;
