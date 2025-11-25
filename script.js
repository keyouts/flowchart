   const canvas = document.getElementById('canvas');

    // Connection canvas
    const connectionCanvas = document.createElement('canvas');
    connectionCanvas.id = 'connectionCanvas';
    connectionCanvas.className = 'connection';
    canvas.appendChild(connectionCanvas);

    const buttons = document.querySelectorAll('.toolbar button');
    const uploadBtn = document.getElementById('uploadMedia');
    const mediaInput = document.getElementById('mediaInput');

    let mode = 'add';
    let bubbles = [];
    let connections = [];
    let selectedBubble = null;

    // Mode switching with visual feedback
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        mode = btn.id.replace('Mode', '').toLowerCase();
      });
    });

    // Add bubble on canvas click
    canvas.addEventListener('mousedown', (e) => {
      if (mode === 'add' && e.target === canvas) {
        const bubble = createBubble('New', e.clientX - 50, e.clientY - 25);
        bubbles.push(bubble);
        saveToStorage();
      }
    });

    // Upload Media button logic
    uploadBtn.addEventListener('click', () => {
      mediaInput.value = ''; // allow re-uploading the same file
      mediaInput.click();
    });

    mediaInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function(ev) {
        let bubble;
        if (file.type.startsWith('image/')) {
          bubble = createMediaBubble(ev.target.result, 'img');
        } else if (file.type.startsWith('video/')) {
          bubble = createMediaBubble(ev.target.result, 'video');
        }
        if (bubble) {
          bubbles.push(bubble);
          saveToStorage();
        }
      };
      reader.readAsDataURL(file);
    });

    function createBubble(text, x, y, id = Date.now()) {
      const div = document.createElement('div');
      div.className = 'bubble';
      div.innerText = text;
      div.style.left = x + 'px';
      div.style.top = y + 'px';
      div.dataset.id = String(id);
      div.dataset.type = 'text';
      canvas.appendChild(div);

      makeDraggable(div);

      div.addEventListener('dblclick', () => {
        if (mode === 'edit') {
          div.contentEditable = true;
          div.focus();
        }
      });

      div.addEventListener('blur', () => {
        div.contentEditable = false;
        saveToStorage();
      });

      div.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = div.dataset.id;

        if (mode === 'connect') {
          if (!selectedBubble) {
            selectedBubble = div;
          } else {
            const id1 = selectedBubble.dataset.id;
            const id2 = id;
            const exists = connections.find(c =>
              (c.from === id1 && c.to === id2) || (c.from === id2 && c.to === id1)
            );
            if (exists) {
              connections = connections.filter(c =>
                !(c.from === id1 && c.to === id2 || c.from === id2 && c.to === id1)
              );
            } else {
              connections.push({ from: id1, to: id2 });
            }
            selectedBubble = null;
            drawConnections();
            saveToStorage();
          }
        } else if (mode === 'delete') {
          bubbles = bubbles.filter(b => b.dataset.id !== id);
          connections = connections.filter(c => c.from !== id && c.to !== id);
          div.remove();
          drawConnections();
          saveToStorage();
        }
      });

      return div;
    }

    // Create bubble with media (image or video)
    function createMediaBubble(src, type, x = 100, y = 100, id = Date.now()) {
      const div = document.createElement('div');
      div.className = 'bubble';
      div.style.left = x + 'px';
      div.style.top = y + 'px';
      div.dataset.id = String(id);
      div.dataset.type = type; // 'img' or 'video'
      div.dataset.src = src;

      let mediaEl;
      if (type === 'img') {
        mediaEl = document.createElement('img');
        mediaEl.src = src;
        mediaEl.alt = 'Uploaded image';
      } else if (type === 'video') {
        mediaEl = document.createElement('video');
        mediaEl.src = src;
        mediaEl.controls = true;
      }

      div.appendChild(mediaEl);
      canvas.appendChild(div);

      makeDraggable(div);

      div.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = div.dataset.id;

        if (mode === 'connect') {
          if (!selectedBubble) {
            selectedBubble = div;
          } else {
            const id1 = selectedBubble.dataset.id;
            const id2 = id;
            const exists = connections.find(c =>
              (c.from === id1 && c.to === id2) || (c.from === id2 && c.to === id1)
            );
            if (exists) {
              connections = connections.filter(c =>
                !(c.from === id1 && c.to === id2 || c.from === id2 && c.to === id1)
              );
            } else {
              connections.push({ from: id1, to: id2 });
            }
            selectedBubble = null;
            drawConnections();
            saveToStorage();
          }
        } else if (mode === 'delete') {
          bubbles = bubbles.filter(b => b.dataset.id !== id);
          connections = connections.filter(c => c.from !== id && c.to !== id);
          div.remove();
          drawConnections();
          saveToStorage();
        }
      });

      return div;
    }

    function makeDraggable(el) {
      let offsetX, offsetY;
      el.onmousedown = function(e) {
        offsetX = e.clientX - el.offsetLeft;
        offsetY = e.clientY - el.offsetTop;
        document.onmousemove = function(e) {
          el.style.left = (e.clientX - offsetX) + 'px';
          el.style.top = (e.clientY - offsetY) + 'px';
          drawConnections();
        };
        document.onmouseup = function() {
          document.onmousemove = null;
          document.onmouseup = null;
          saveToStorage();
        };
      };
    }

    function drawConnections() {
      connectionCanvas.width = canvas.offsetWidth;
      connectionCanvas.height = canvas.offsetHeight;
      const ctx = connectionCanvas.getContext('2d');
      ctx.clearRect(0, 0, connectionCanvas.width, connectionCanvas.height);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;

      connections.forEach(conn => {
        const from = bubbles.find(b => b.dataset.id === conn.from);
        const to = bubbles.find(b => b.dataset.id === conn.to);
        if (from && to) {
          const x1 = from.offsetLeft + from.offsetWidth / 2;
          const y1 = from.offsetTop + from.offsetHeight / 2;
          const x2 = to.offsetLeft + to.offsetWidth / 2;
          const y2 = to.offsetTop + to.offsetHeight / 2;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      });
    }

    function saveToStorage() {
      const data = {
        bubbles: bubbles.map(b => {
          const type = b.dataset.type || 'text';
          if (type === 'text') {
            return {
              id: b.dataset.id,
              type,
              text: b.innerText,
              x: b.offsetLeft,
              y: b.offsetTop
            };
          } else {
            return {
              id: b.dataset.id,
              type,           // 'img' or 'video'
              src: b.dataset.src,
              x: b.offsetLeft,
              y: b.offsetTop
            };
          }
        }),
        connections
      };
      localStorage.setItem('flowchart', JSON.stringify(data));
    }

    function loadFromStorage() {
      const raw = localStorage.getItem('flowchart');
      if (!raw) return;

      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        return; // corrupt data, do nothing
      }

      if (data && Array.isArray(data.bubbles)) {
        data.bubbles.forEach(b => {
          // Migration safeguard: old entries had no 'type' -> treat as text
          if (!b.type) b.type = 'text';

          let bubble;
          if (b.type === 'text') {
            bubble = createBubble(b.text || 'New', b.x ?? 100, b.y ?? 100, b.id);
          } else if (b.type === 'img' || b.type === 'video') {
            bubble = createMediaBubble(b.src, b.type, b.x ?? 100, b.y ?? 100, b.id);
          }
          if (bubble) bubbles.push(bubble);
        });
        connections = Array.isArray(data.connections) ? data.connections : [];
        drawConnections();
      }
    }

    loadFromStorage();

