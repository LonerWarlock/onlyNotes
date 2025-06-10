// Show message box for errors or success
function showMessage(message, type = 'error') {
  const msgBox = document.getElementById('messageBox');
  if (!msgBox) return;

  msgBox.textContent = message;
  msgBox.style.display = 'block';

  // Style based on type
  msgBox.style.backgroundColor = type === 'error' ? '#f44336' : '#4CAF50';
  msgBox.style.color = 'white';
  msgBox.style.border = '1px solid #ccc';
  msgBox.style.padding = '10px';
  msgBox.style.position = 'fixed';
  msgBox.style.top = '10px';
  msgBox.style.left = '50%';
  msgBox.style.transform = 'translateX(-50%)';
  msgBox.style.zIndex = '9999';
  msgBox.style.maxWidth = '90%';
  msgBox.style.borderRadius = '5px';
  msgBox.style.textAlign = 'center';

  setTimeout(() => {
    msgBox.style.display = 'none';
    msgBox.textContent = '';
  }, 3000);
}

// Logout handler
function logout() {
  localStorage.removeItem('token');
  window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('registerForm');
  const loginForm = document.getElementById('loginForm');
  const fileList = document.getElementById('file-list');
  const pdfViewer = document.getElementById('pdfViewer');

  // Handle Register
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(registerForm);
      const body = {
        username: formData.get('username'),
        password: formData.get('password'),
      };
      const res = await fetch('http://localhost:5000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        // Directly login after successful registration
        const loginRes = await fetch('http://localhost:5000/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (loginRes.ok) {
          const { token } = await loginRes.json();
          localStorage.setItem('token', token);
          window.location.href = 'index.html';
        } else {
          showMessage('Registered but auto-login failed. Please login manually.', 'error');
          window.location.href = 'login.html';
        }
      } else {
        showMessage('Registration failed, try again with a different username', 'error');
      }
    });
  }

  // Handle Login
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(loginForm);
      const body = {
        username: formData.get('username'),
        password: formData.get('password'),
      };

      const res = await fetch('http://localhost:5000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const { token } = await res.json();
        localStorage.setItem('token', token);
        window.location.href = 'index.html';
      } else {
        showMessage('Invalid Credentials, Please try again', 'error');
      }
    });
  }

  // Handle PDF List and Viewer on index.html
  if (fileList && pdfViewer) {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = 'login.html';
      return;
    }

    fetch('http://localhost:5000/files', {
      headers: { Authorization: 'Bearer ' + token }
    })
      .then(async res => {
        if (res.status === 403 || res.status === 401) {
          showMessage("Session expired. Please log in again.", 'error');
          logout();
          return null;
        }
        return await res.json();
      })
      .then(files => {
        if (!files) return;
        fileList.innerHTML = '';
        files.forEach(file => {
          const btn = document.createElement('button');
          btn.textContent = file.filename;
          btn.addEventListener('click', () => {
            viewFile(file._id, token);
          });
          fileList.appendChild(btn);
        });
      })
      .catch(err => {
        console.error(err);
        showMessage('Failed to fetch files.', 'error');
      });
  }
});

// View a file by ID
function viewFile(fileId, token) {
  const pdfViewer = document.getElementById('pdfViewer');
  if (pdfViewer) {
    pdfViewer.src = `http://localhost:5000/file/${fileId}?token=${token}`;
    pdfViewer.style.display = 'block';
  }
}

// TODO: Implement refresh token mechanism to avoid frequent logins
