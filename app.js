(() => {
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  const elements = {
    messageInput: $('#messageInput'),
    timeInput: $('#timeInput'),
    captureArea: $('#captureArea'),
    messageRow: $('#messageRow'),
    messageBubble: $('#messageBubble'),
    messageText: $('#messageText'),
    messageTime: $('#messageTime'),
    downloadBtn: $('#downloadBtn'),
    copyBtn: $('#copyBtn'),
    resetBtn: $('#resetBtn'),
    themeToggle: $('#themeToggle'),
    maxWidthInput: $('#maxWidthInput'),
    maxWidthValue: $('#maxWidthValue'),
    sizeBadge: $('#sizeBadge'),
    statusText: $('#statusText')
  };

  const defaults = {
    message: 'اصلا مش اول مره اخد منك انت عارف واخد منك حاجات كتيررر',
    time: '2:42 AM',
    direction: 'incoming',
    textDir: 'auto',
    theme: 'dark',
    maxWidth: 760
  };

  const saved = safeParse(localStorage.getItem('wa-renderer-settings'));
  const state = { ...defaults, ...(saved || {}) };

  function safeParse(value) {
    try { return JSON.parse(value); } catch { return null; }
  }

  function persist() {
    localStorage.setItem('wa-renderer-settings', JSON.stringify(state));
  }

  function setStatus(message, isError = false) {
    elements.statusText.textContent = message;
    elements.statusText.style.color = isError ? '#ff7b7b' : '';
    clearTimeout(setStatus.timer);
    setStatus.timer = setTimeout(() => {
      elements.statusText.textContent = '';
      elements.statusText.style.color = '';
    }, 2600);
  }

  function render() {
    const cleanMessage = state.message.length ? state.message : ' ';
    elements.messageInput.value = state.message;
    elements.timeInput.value = state.time;
    elements.messageText.textContent = cleanMessage;
    elements.messageTime.textContent = state.time.trim() || currentTime();
    elements.messageBubble.dir = state.textDir;
    elements.messageBubble.style.setProperty('--bubble-max', `${state.maxWidth}px`);
    elements.maxWidthInput.value = state.maxWidth;
    elements.maxWidthValue.textContent = `${state.maxWidth}px`;

    elements.messageRow.classList.toggle('incoming', state.direction === 'incoming');
    elements.messageRow.classList.toggle('outgoing', state.direction === 'outgoing');

    elements.captureArea.classList.toggle('theme-dark', state.theme === 'dark');
    elements.captureArea.classList.toggle('theme-light', state.theme === 'light');
    elements.themeToggle.textContent = state.theme === 'dark' ? '☀' : '☾';

    $$('[data-direction]').forEach(btn => btn.classList.toggle('active', btn.dataset.direction === state.direction));
    $$('[data-textdir]').forEach(btn => btn.classList.toggle('active', btn.dataset.textdir === state.textDir));

    requestAnimationFrame(updateSizeBadge);
    persist();
  }

  function currentTime() {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric', minute: '2-digit', hour12: true
    }).format(new Date());
  }

  function updateSizeBadge() {
    const rect = elements.captureArea.getBoundingClientRect();
    elements.sizeBadge.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)} px`;
  }

  function detectDirection(text) {
    if (state.textDir === 'rtl' || state.textDir === 'ltr') return state.textDir;
    const rtl = /[\u0590-\u08FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
    const ltr = /[A-Za-z\u00C0-\u02AF]/;
    for (const char of text) {
      if (rtl.test(char)) return 'rtl';
      if (ltr.test(char)) return 'ltr';
    }
    return 'rtl';
  }

  function splitLongToken(ctx, token, maxWidth) {
    const parts = [];
    let part = '';
    for (const char of token) {
      const test = part + char;
      if (part && ctx.measureText(test).width > maxWidth) {
        parts.push(part);
        part = char;
      } else {
        part = test;
      }
    }
    if (part) parts.push(part);
    return parts;
  }

  function wrapParagraph(ctx, paragraph, maxWidth) {
    if (!paragraph) return [''];
    const words = paragraph.split(/(\s+)/).filter(Boolean);
    const lines = [];
    let line = '';

    for (const word of words) {
      const candidate = line + word;
      if (!line || ctx.measureText(candidate).width <= maxWidth) {
        line = candidate;
        continue;
      }

      lines.push(line.trimEnd());
      line = word.trimStart();

      if (ctx.measureText(line).width > maxWidth) {
        const chunks = splitLongToken(ctx, line, maxWidth);
        lines.push(...chunks.slice(0, -1));
        line = chunks.at(-1) || '';
      }
    }

    lines.push(line.trimEnd());
    return lines;
  }

  function roundedRect(ctx, x, y, width, height, radii) {
    const r = typeof radii === 'number'
      ? { tl: radii, tr: radii, br: radii, bl: radii }
      : radii;
    ctx.beginPath();
    ctx.moveTo(x + r.tl, y);
    ctx.lineTo(x + width - r.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r.tr);
    ctx.lineTo(x + width, y + height - r.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r.br, y + height);
    ctx.lineTo(x + r.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r.bl);
    ctx.lineTo(x, y + r.tl);
    ctx.quadraticCurveTo(x, y, x + r.tl, y);
    ctx.closePath();
  }

  function drawPattern(ctx, width, height, stroke) {
    ctx.save();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.12;
    const tile = 110;

    for (let y = -tile; y < height + tile; y += tile) {
      for (let x = -tile; x < width + tile; x += tile) {
        ctx.beginPath();
        ctx.arc(x + 26, y + 26, 8, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x + 64, y + 18);
        ctx.lineTo(x + 84, y + 18);
        ctx.lineTo(x + 91, y + 28);
        ctx.lineTo(x + 81, y + 40);
        ctx.lineTo(x + 66, y + 34);
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x + 18, y + 76);
        ctx.quadraticCurveTo(x + 32, y + 59, x + 45, y + 76);
        ctx.quadraticCurveTo(x + 32, y + 92, x + 18, y + 76);
        ctx.stroke();

        ctx.beginPath();
        ctx.rect(x + 68, y + 72, 24, 16);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function buildCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const exportScale = Math.max(2, dpr);
    const message = state.message || ' ';
    const time = state.time.trim() || currentTime();
    const direction = detectDirection(message);

    const measureCanvas = document.createElement('canvas');
    const m = measureCanvas.getContext('2d');

    const fontSize = 31;
    const lineHeight = 52;
    const timeSize = 16;
    const bubblePadX = 17;
    const bubblePadTop = 10;
    const bubblePadBottom = 12;
    const capturePad = 28;
    const tailSize = 10;
    const gapTime = 14;
    const minBubbleWidth = 84;
    const maxTextWidth = Math.max(180, state.maxWidth - bubblePadX * 2);
    const fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';

    m.font = `400 ${fontSize}px ${fontFamily}`;
    m.textBaseline = 'alphabetic';

    const paragraphs = message.replace(/\r\n/g, '\n').split('\n');
    const lines = paragraphs.flatMap(p => wrapParagraph(m, p, maxTextWidth));
    if (!lines.length) lines.push(' ');

    m.font = `400 ${timeSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif`;
    const timeWidth = Math.ceil(m.measureText(time).width);
    m.font = `400 ${fontSize}px ${fontFamily}`;

    const lineWidths = lines.map(line => Math.ceil(m.measureText(line || ' ').width));
    let lastWidth = lineWidths.at(-1) || 0;
    const timeFitsLastLine = lastWidth + gapTime + timeWidth <= maxTextWidth;
    const contentWidth = Math.min(
      maxTextWidth,
      Math.max(...lineWidths, timeFitsLastLine ? lastWidth + gapTime + timeWidth : timeWidth)
    );
    const bubbleWidth = Math.max(minBubbleWidth, Math.ceil(contentWidth + bubblePadX * 2));
    const textBlockHeight = lines.length * lineHeight;
    const extraTimeLine = timeFitsLastLine ? 0 : Math.ceil(timeSize * 1.55);
    const bubbleHeight = Math.ceil(bubblePadTop + textBlockHeight + extraTimeLine + bubblePadBottom);
    const canvasWidth = Math.ceil(capturePad * 2 + bubbleWidth + tailSize);
    const canvasHeight = Math.ceil(capturePad * 2 + bubbleHeight);

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth * exportScale;
    canvas.height = canvasHeight * exportScale;
    const ctx = canvas.getContext('2d');
    ctx.scale(exportScale, exportScale);

    const palette = state.theme === 'dark'
      ? { bg: '#0b141a', bubbleIn: '#202c33', bubbleOut: '#005c4b', text: '#e9edef', time: '#8696a0', pattern: '#8696a0' }
      : { bg: '#efeae2', bubbleIn: '#ffffff', bubbleOut: '#d9fdd3', text: '#111b21', time: '#667781', pattern: '#667781' };

    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    drawPattern(ctx, canvasWidth, canvasHeight, palette.pattern);

    const isOutgoing = state.direction === 'outgoing';
    const bubbleX = isOutgoing ? capturePad : capturePad + tailSize;
    const bubbleY = capturePad;
    const bubbleColor = isOutgoing ? palette.bubbleOut : palette.bubbleIn;

    ctx.fillStyle = bubbleColor;
    roundedRect(ctx, bubbleX, bubbleY, bubbleWidth, bubbleHeight, isOutgoing
      ? { tl: 9, tr: 3, br: 9, bl: 9 }
      : { tl: 3, tr: 9, br: 9, bl: 9 });
    ctx.fill();

    ctx.beginPath();
    if (isOutgoing) {
      ctx.moveTo(bubbleX + bubbleWidth - 1, bubbleY);
      ctx.lineTo(bubbleX + bubbleWidth + tailSize, bubbleY);
      ctx.lineTo(bubbleX + bubbleWidth, bubbleY + 12);
    } else {
      ctx.moveTo(bubbleX + 1, bubbleY);
      ctx.lineTo(bubbleX - tailSize, bubbleY);
      ctx.lineTo(bubbleX, bubbleY + 12);
    }
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = palette.text;
    ctx.font = `400 ${fontSize}px ${fontFamily}`;
    ctx.textBaseline = 'alphabetic';
    ctx.direction = direction;
    ctx.textAlign = direction === 'rtl' ? 'right' : 'left';
    const textX = direction === 'rtl'
      ? bubbleX + bubbleWidth - bubblePadX
      : bubbleX + bubblePadX;
    let baselineY = bubbleY + bubblePadTop + fontSize + 3;

    for (const line of lines) {
      ctx.fillText(line || ' ', textX, baselineY);
      baselineY += lineHeight;
    }

    ctx.fillStyle = palette.time;
    ctx.font = `400 ${timeSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif`;
    ctx.direction = 'ltr';
    ctx.textAlign = 'left';

    let timeX;
    let timeY;
    if (timeFitsLastLine) {
      const lastLineWidth = lineWidths.at(-1) || 0;
      if (direction === 'rtl') {
        const lastLineLeft = bubbleX + bubbleWidth - bubblePadX - lastLineWidth;
        timeX = Math.max(bubbleX + bubblePadX, lastLineLeft - gapTime - timeWidth);
      } else {
        timeX = Math.min(bubbleX + bubbleWidth - bubblePadX - timeWidth, bubbleX + bubblePadX + lastLineWidth + gapTime);
      }
      timeY = bubbleY + bubblePadTop + (lines.length - 1) * lineHeight + fontSize + 2;
    } else {
      timeX = bubbleX + bubbleWidth - bubblePadX - timeWidth;
      timeY = bubbleY + bubbleHeight - bubblePadBottom;
    }
    ctx.fillText(time, timeX, timeY);

    return canvas;
  }

  async function downloadPng() {
    try {
      setStatus('جاري تجهيز الصورة...');
      await document.fonts.ready;
      const canvas = buildCanvas();
      const link = document.createElement('a');
      link.download = `whatsapp-message-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setStatus('تم تنزيل الصورة ✓');
    } catch (error) {
      console.error(error);
      setStatus(error.message || 'تعذر إنشاء الصورة.', true);
    }
  }

  async function copyPng() {
    try {
      if (!navigator.clipboard || typeof ClipboardItem === 'undefined') {
        throw new Error('نسخ الصور غير مدعوم في هذا المتصفح. استخدم تنزيل PNG.');
      }
      setStatus('جاري نسخ الصورة...');
      await document.fonts.ready;
      const canvas = buildCanvas();
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(value => value ? resolve(value) : reject(new Error('تعذر إنشاء الصورة.')), 'image/png');
      });
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setStatus('تم نسخ الصورة ✓');
    } catch (error) {
      console.error(error);
      setStatus(error.message || 'تعذر نسخ الصورة.', true);
    }
  }

  elements.messageInput.addEventListener('input', (event) => {
    state.message = event.target.value;
    render();
  });

  elements.timeInput.addEventListener('input', (event) => {
    state.time = event.target.value;
    render();
  });

  $$('[data-direction]').forEach(button => button.addEventListener('click', () => {
    state.direction = button.dataset.direction;
    render();
  }));

  $$('[data-textdir]').forEach(button => button.addEventListener('click', () => {
    state.textDir = button.dataset.textdir;
    render();
  }));

  elements.maxWidthInput.addEventListener('input', (event) => {
    state.maxWidth = Number(event.target.value);
    render();
  });

  elements.themeToggle.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    render();
  });

  elements.downloadBtn.addEventListener('click', downloadPng);
  elements.copyBtn.addEventListener('click', copyPng);

  elements.resetBtn.addEventListener('click', () => {
    Object.assign(state, defaults);
    render();
    setStatus('تمت إعادة الضبط');
  });

  const resizeObserver = new ResizeObserver(updateSizeBadge);
  resizeObserver.observe(elements.captureArea);
  window.addEventListener('resize', updateSizeBadge);

  render();
})();
