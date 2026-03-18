export function detectAdBlock(): Promise<boolean> {
  return new Promise((resolve) => {
    // Create test ad element
    const testAd = document.createElement('div');
    testAd.className = 'adsbox adsbygoogle';
    testAd.style.cssText = 'position: absolute !important; top: -1000px !important; left: -1000px !important; width: 1px !important; height: 1px !important; visibility: hidden !important;';

    document.body.appendChild(testAd);

    // Check after short delay
    setTimeout(() => {
      const isBlocked = testAd.offsetHeight === 0 && testAd.offsetWidth === 0;
      
      // Cleanup
      if (testAd.parentNode) {
        testAd.parentNode.removeChild(testAd);
      }
      
      resolve(isBlocked);
    }, 150);
  });
}

