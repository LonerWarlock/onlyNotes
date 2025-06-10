async function login(username, password) {
  const res = await fetch('http://localhost:5000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (data.token) {
    localStorage.setItem('token', data.token);
    window.location.href = 'index.html';
  } else {
    alert('Login failed');
  }
}
