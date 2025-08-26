const canvas = document.getElementById('canvas');
const buttons = document.querySelectorAll('.toolbar button');

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

function createBubble(text, x, y, id = Date.now()) {
  const div = document.createElement('div');
  div.className = 'bubble';
  div.innerText = text;
  div.style.left = x + 'px';
  div.style.top = y + 'px';
  div.dataset.id = id;
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
  document.querySelectorAll('.connection').forEach(line => line.remove());
  connections.forEach(conn => {
    const from = bubbles.find(b => b.dataset.id === conn.from);
    const to = bubbles.find(b => b.dataset.id === conn.to);
    if (from && to) {
      const line = document.createElement('canvas');
      line.className = 'connection';
      line.width = canvas.offsetWidth;
      line.height = canvas.offsetHeight;
      const ctx = line.getContext('2d');
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      const x1 = from.offsetLeft + from.offsetWidth / 2;
      const y1 = from.offsetTop + from.offsetHeight / 2;
      const x2 = to.offsetLeft + to.offsetWidth / 2;
      const y2 = to.offsetTop + to.offsetHeight / 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      canvas.appendChild(line);
    }
  });
}

function saveToStorage() {
  const data = {
    bubbles: bubbles.map(b => ({
      id: b.dataset.id,
      text: b.innerText,
      x: b.offsetLeft,
      y: b.offsetTop
    })),
    connections
  };
  localStorage.setItem('flowchart', JSON.stringify(data));
}

function loadFromStorage() {
  const data = JSON.parse(localStorage.getItem('flowchart'));
  if (data) {
    data.bubbles.forEach(b => {
      const bubble = createBubble(b.text, b.x, b.y, b.id);
      bubbles.push(bubble);
    });
    connections = data.connections;
    drawConnections();
  }
}

loadFromStorage();