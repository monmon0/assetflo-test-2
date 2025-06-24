import { useState } from 'react';

const useDropdown = () => {
  const [dropDownAnchor, setDropDownAnchor] = useState(null);

  const openDropDown = (evt) => {
    setDropDownAnchor(evt.currentTarget);
  };

  const closeDropDown = () => {
    setDropDownAnchor(null);
  };
  return {
    dropDownAnchor,
    openDropDown,
    closeDropDown
  };
};

export default useDropdown;
