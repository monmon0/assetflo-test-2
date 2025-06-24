// Function to copy data and show a toast notification
export const copyToClipBoard = (data, field) => {
  navigator.clipboard
    .writeText(data)
    .then(() => showToast(`${field} copied!`))
    .catch(() => showToast('Failed to copy MAC address.'));
};

// Function to show the toast message
export const showToast = (message) => {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.className = 'toast';
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
  }, 100); // Delay to trigger the animation

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300); // Remove element after animation
  }, 2000); // Show for 2 seconds
};
