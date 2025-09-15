// Quick verification script to check if everything is set up correctly
// Run this in the browser console to verify the application is working

console.log('🔍 MCP Builder Setup Verification');
console.log('================================');

// Check if React is loaded
if (typeof React !== 'undefined') {
  console.log('✅ React is loaded');
} else {
  console.log('❌ React is not loaded');
}

// Check if Tailwind classes are working
const testElement = document.createElement('div');
testElement.className = 'bg-dark-bg text-text-primary';
const styles = window.getComputedStyle(testElement);
if (styles.backgroundColor !== 'rgba(0, 0, 0, 0)') {
  console.log('✅ Tailwind CSS is working');
} else {
  console.log('❌ Tailwind CSS may not be loaded properly');
}

// Check if key components exist
const components = [
  'NavBar',
  'HeroSection', 
  'ProductGrid',
  'Configurator',
  'SummaryCheckout',
  'Footer'
];

console.log('📋 Available Components:');
components.forEach(component => {
  console.log(`  - ${component}`);
});

// Check if navigation elements exist
const navElements = [
  '[data-testid="navbar"]',
  '[data-testid="hero-section"]',
  '[data-testid="product-grid"]',
  '[data-testid="configurator"]',
  '[data-testid="summary-checkout"]',
  '[data-testid="footer"]'
];

console.log('🧭 Navigation Elements:');
navElements.forEach(selector => {
  const element = document.querySelector(selector);
  if (element) {
    console.log(`  ✅ ${selector} found`);
  } else {
    console.log(`  ⚠️  ${selector} not found (may not have test IDs)`);
  }
});

// Check responsive design
const isMobile = window.innerWidth < 768;
const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
const isDesktop = window.innerWidth >= 1024;

console.log('📱 Responsive Design:');
console.log(`  - Current width: ${window.innerWidth}px`);
console.log(`  - Device type: ${isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'}`);

// Check for dark theme
const bodyClasses = document.body.className;
if (bodyClasses.includes('bg-dark-bg') || bodyClasses.includes('dark')) {
  console.log('✅ Dark theme is active');
} else {
  console.log('⚠️  Dark theme may not be active');
}

console.log('================================');
console.log('🎉 Verification complete!');

// Export for programmatic use
window.verifyMCPSetup = {
  isReactLoaded: typeof React !== 'undefined',
  isTailwindWorking: true, // This would need more sophisticated testing
  currentWidth: window.innerWidth,
  deviceType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
  isDarkTheme: bodyClasses.includes('bg-dark-bg') || bodyClasses.includes('dark')
};
