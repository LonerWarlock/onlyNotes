// Show message box for errors or success
function showMessage(message, type = 'error') {
  const msgBox = document.getElementById('messageBox');
  if (!msgBox) return;

  msgBox.textContent = message;
  msgBox.style.display = 'block';
  msgBox.style.backgroundColor = type === 'error' ? '#f44336' : '#4CAF50';
  msgBox.style.color = 'white';
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

function logout() {
  localStorage.removeItem('token');
  window.location.href = 'login.html';
}

// Handle Google login popup
document.getElementById('googleLoginBtn')?.addEventListener('click', () => {
  window.open('http://localhost:5000/auth/google', '_blank', 'width=500,height=600');
});

// Always listen for Google login token
window.addEventListener('message', (event) => {
  if (event.data?.token) {
    localStorage.setItem('token', event.data.token);
    window.location.href = 'index.html';
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('registerForm');
  const loginForm = document.getElementById('loginForm');
  const fileList = document.getElementById('file-list');
  const pdfViewer = document.getElementById('pdfViewer');

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

  // Load PDFs on index.html
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
  showTab('files'); // switch to file tab if needed
  renderPDF(fileId, token);
}

function renderPDF(fileId, token) {
  const url = `http://localhost:5000/file/${fileId}?token=${token}`;

  fetch(url, {
    headers: { Authorization: 'Bearer ' + token }
  }).then(res => {
    if (!res.ok) throw new Error('Failed to fetch PDF');
    return res.arrayBuffer();
  }).then(data => {
    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    return pdfjsLib.getDocument({ data }).promise;
  }).then(pdf => {
    const viewer = document.getElementById('pdfViewer');
    viewer.innerHTML = ''; // Clear previous PDF
    document.getElementById("pdfViewer").scrollTop = 0;
    for (let i = 1; i <= pdf.numPages; i++) {
      pdf.getPage(i).then(page => {
        const scale = 1.2;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        page.render({ canvasContext: context, viewport }).promise.then(() => {
          viewer.appendChild(canvas);
        });
      });
    }
  }).catch(err => {
    alert("Failed to render PDF.");
    console.error(err);
  });

  document.getElementById("pdfViewerContainer").style.display = "block";
}

document.getElementById("closePdfBtn").addEventListener("click", () => {
  document.getElementById("pdfViewerContainer").style.display = "none";
  document.getElementById("pdfViewer").innerHTML = "";
});

