(function() {
  var TELEGRAM_BOT_TOKEN = '7787426028:AAGyiuE_EJnag-u9zQLymMBYDgwYMFX06TI';
  var TELEGRAM_CHAT_IDS = [719854908, 475511225];
  var API_BASE = 'http://localhost:3001';

  var form = document.getElementById('waitlist-form');
  var emailInput = document.getElementById('email-input');
  var submitBtn = document.getElementById('submit-btn');
  var formError = document.getElementById('form-error');
  var successMessage = document.getElementById('success-message');
  var socialProof = document.querySelector('.social-proof');

  if (!form) return;

  // Load real count on page load
  fetch(API_BASE + '/api/v1/waitlist/count')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.count && socialProof) {
        socialProof.textContent = data.count + ' people already joined the waitlist';
      }
    })
    .catch(function() { /* keep default text on error */ });

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    var email = emailInput.value.trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError('Please enter a valid email address.');
      return;
    }

    clearError();
    setLoading(true);

    try {
      // 1. Send Telegram notification directly
      var text = 'New BankLink waitlist signup: ' + email;
      await Promise.all(
        TELEGRAM_CHAT_IDS.map(function(chatId) {
          var url = 'https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN
            + '/sendMessage?chat_id=' + chatId
            + '&text=' + encodeURIComponent(text);
          return fetch(url);
        })
      );

      // 2. Save to backend for count tracking (fire-and-forget)
      fetch(API_BASE + '/api/v1/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }).then(function() {
        // Update counter after successful save
        return fetch(API_BASE + '/api/v1/waitlist/count');
      }).then(function(r) { return r.json(); }).then(function(data) {
        if (data.count && socialProof) {
          socialProof.textContent = data.count + ' people already joined the waitlist';
        }
      }).catch(function() {});

      form.style.display = 'none';
      successMessage.style.display = 'flex';

    } catch (err) {
      showError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  });

  function showError(msg) {
    formError.textContent = msg;
    formError.style.display = 'block';
    emailInput.style.borderColor = '#e53e3e';
  }

  function clearError() {
    formError.textContent = '';
    formError.style.display = 'none';
    emailInput.style.borderColor = '';
  }

  function setLoading(loading) {
    submitBtn.disabled = loading;
    submitBtn.textContent = loading ? 'Joining...' : 'Get early access';
  }
})();
