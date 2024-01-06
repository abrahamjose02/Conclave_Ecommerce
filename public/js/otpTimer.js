window.addEventListener('DOMContentLoaded', () => {
    function startTimer(duration, display) {
        let timer = duration, minutes, seconds;
        let resendButton = document.getElementById('resendOtpButton');
        resendButton.disabled = true; // Initially disable the Resend OTP button

        let countdown = setInterval(function () {
            minutes = parseInt(timer / 60, 10);
            seconds = parseInt(timer % 60, 10);

            minutes = minutes < 10 ? "0" + minutes : minutes;
            seconds = seconds < 10 ? "0" + seconds : seconds;

            display.textContent = minutes + ":" + seconds;

            if (--timer < 0) {
                clearInterval(countdown); // Stop the timer
                resendButton.disabled = false; // Enable the Resend OTP button when timer reaches zero
            }
        }, 1000);
    }

    // Set the duration of the timer in seconds (adjust as needed)
    let duration = 30; // 5 minutes in this example
    let display = document.querySelector('#timer-minutes');

    startTimer(duration, display);
});
