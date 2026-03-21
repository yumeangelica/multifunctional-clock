/**
 * Display copyright information in the footer
 * Automatically updates the copyright year to the current year
 */
const showCopyRight = () => {
  const year = new Date().getFullYear();
  const copyRightElement = document.getElementById('copyright-text');

  // Safe DOM manipulation with proper null check
  if (copyRightElement) {
    copyRightElement.textContent = `© 2020 – ${year} yumeangelica.github.io. All Rights Reserved.`;
  }
};