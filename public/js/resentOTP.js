// verify.js (assuming you use jQuery)

$(document).ready(function() {
    $('#resendOtpButton').click(function(event) {
      event.preventDefault(); // Prevent the default form submission
  
      // Make an AJAX POST request to trigger OTP resend
      $.ajax({
        url: '/resendOTP', // Endpoint to trigger resend OTP
        method: 'POST',
        success: function(response) {
          console.log(response); // Log the response from the server
          // Handle success (optional)
        },
        error: function(error) {
          console.error('Error:', error); // Log any errors
          // Handle error (optional)
        }
      });
    });
  });
  
  
  