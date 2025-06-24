import { useEffect, useRef } from 'react';
import _ from 'lodash';

const useDebounce = (callback, delay) => {
  const debouncedCallback = useRef(_.debounce(callback, delay)).current;

  useEffect(() => {
    return () => {
      // Cleanup the debounced function on unmount
      debouncedCallback.cancel();
    };
  }, [debouncedCallback]);

  return debouncedCallback;
};

export default useDebounce;
