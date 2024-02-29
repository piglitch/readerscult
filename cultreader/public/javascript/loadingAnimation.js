document.addEventListener('DOMContentLoaded', function() {
  const loadingAnimation = document.getElementById('loading-animation');

  function startAnimation() {
    let slashes = '//';
    setInterval(() => {
      if (slashes.length === 10) {
        slashes = '//'; // Reset back to //
      } else {
        slashes += '/'; // Add two slashes
      }
      loadingAnimation.textContent = slashes;
    }, 300); // Repeat every 0.3 seconds
  }

  startAnimation();
});
