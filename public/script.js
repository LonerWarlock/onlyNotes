const API_BASE = 'http://localhost:5000';  // Change if your backend URL differs
const fileListDiv = document.getElementById('file-list');
const pdfViewer = document.getElementById('pdf-viewer');

async function fetchPdfFiles() {
  try {
    const res = await fetch(`${API_BASE}/files`);
    if (!res.ok) throw new Error('Failed to fetch files');
    const files = await res.json();

    // Filter only PDF files
    const pdfFiles = files.filter(file => {
      return file.contentType === 'application/pdf' || file.filename.toLowerCase().endsWith('.pdf');
    });

    if (pdfFiles.length === 0) {
      fileListDiv.innerHTML = '<p>No PDF files found.</p>';
      pdfViewer.style.display = 'none';
      return;
    }

    fileListDiv.innerHTML = '';
    pdfFiles.forEach(file => {
      const btn = document.createElement('button');
      btn.textContent = file.filename;
      btn.onclick = () => {
        const url = `${API_BASE}/file/${file._id}`;
        pdfViewer.src = url;
        pdfViewer.style.display = 'block';
        // Scroll to viewer
        pdfViewer.scrollIntoView({ behavior: 'smooth' });
      };
      fileListDiv.appendChild(btn);
    });

    

  } catch (err) {
    fileListDiv.innerHTML = `<p style="color:red;">Error loading files: ${err.message}</p>`;
    pdfViewer.style.display = 'none';
  }
}

// Run on page load
fetchPdfFiles();
