document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('loginBtn');

  // Login handler
  loginBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    const email = document.querySelector('.sign-in-form input[type="email"]').value.trim();
    const password = document.querySelector('.sign-in-form input[type="password"]').value.trim();

    if (!email || !password) {
      alert('Please enter your email and password');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok && data.user) {
        localStorage.setItem('chat_username', data.user.username);
        localStorage.setItem('chat_avatar', data.user.avatar_url || '/avatars/default.jpg');
        window.location.href = 'chat.html';
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      alert('Server error');
    }
  });

  // Registration handler
  const signUpBtn = document.getElementById('signUpBtn');

  signUpBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    const username = document.getElementById('nameInput').value.trim();
    const email = document.getElementById('emailInput').value.trim();
    const password = document.getElementById('passwordInput').value.trim();
    const avatar_url = document.getElementById('avatarInput').value.trim();

    if (!username || !email || !password) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, avatar_url })
      });

      const data = await res.json();

      if (res.ok && data.user) {
        localStorage.setItem('chat_username', data.user.username);
        localStorage.setItem('chat_avatar', data.user.avatar_url || '/avatars/default.jpg');
        window.location.href = 'chat.html';
      } else {
        alert(data.message || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      alert('Server error');
    }
  });
});
