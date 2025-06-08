const API_BASE = 'http://localhost:5000';
const filesDiv = document.getElementById('files');

fetch(`${API_BASE}/files`)
  .then(res => res.json())
  .then(files => {
    filesDiv.innerHTML = '';
    files.forEach(file => {
      const ext = file.filename.split('.').pop().toLowerCase();
      const url = `${API_BASE}/file/${file._id}`;
      if (ext === 'pdf') {
        const iframe = document.createElement('iframe');
        iframe.src = url;
        filesDiv.appendChild(iframe);
      } else if (['jpg', 'jpeg', 'png'].includes(ext)) {
        const img = document.createElement('img');
        img.src = url;
        filesDiv.appendChild(img);
      }
    });
  })
  .catch(err => {
    filesDiv.innerText = 'Failed to load files.';
    console.error(err);
  });
