


  $(document).ready(function () {
    function updateTimerDisplay(minutes, seconds) {
      $('#timer-minutes').text(minutes < 10 ? '0' + minutes : minutes);
      $('#timer-seconds').text(seconds < 10 ? '0' + seconds : seconds);
    }

    function startTimer(durationInSeconds) {
      let startTime, elapsed;

      function animate() {
        const now = Date.now();
        elapsed = Math.floor((now - startTime) / 1000);

        const remainingSeconds = Math.max(durationInSeconds - elapsed, 0);
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;

        updateTimerDisplay(minutes, seconds);

        if (remainingSeconds > 0) {
          requestAnimationFrame(animate);
        }
      }

      startTime = Date.now();
      animate();
    }

    function resetTimer() {
      startTimer(30);
    }

    function resendOTP() {
      // Make an AJAX POST request to trigger OTP resend
      $.ajax({
        url: '/resendOTP', // Endpoint to trigger resend OTP
        method: 'POST',
        success: function (response) {
          console.log(response); // Log the response from the server
          // Handle success (if needed)
        },
        error: function (error) {
          console.error('Error:', error); // Log any errors
          // Handle error (if needed)
        }
      });
    }

    $('#resendOtpButton').click(function (event) {
      event.preventDefault();
      resendOTP();
      resetTimer();
      location.reload(); // Reload the page
    });

    startTimer(30);
  });

