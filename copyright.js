document.addEventListener('DOMContentLoaded', () => {
  showCopyRight(); // Call the function to display the real-time clock when the page is loaded
});

const showCopyRight = () => {
  const date = new Date();
  const year = date.getFullYear();
  let copyRightElement = document.getElementById('copyRight');

  copyRightElement.textContent = `© 2020 – ${year} yumeangelica.github.io. All Rights Reserved.`;
}

