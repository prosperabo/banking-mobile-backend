document.addEventListener('DOMContentLoaded', () => {
  // =========================
  // Configuración
  // =========================
  const CONFIG = {
    API_KEY: 'ac12a9b5-4bc7-4ec3-8d86-fd5edd2aeb6b',
    BACKEND_URL: 'https://api.mobile.slan.mx/api/v1',
  };

  // =========================
  // Helpers: entorno Flutter vs Browser
  // =========================
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  const isInAppWebView = () => !!window.flutter_inappwebview?.callHandler;

  // flutter_inappwebview recomienda esperar este evento
  let isFlutterReady = false;
  window.addEventListener('flutterInAppWebViewPlatformReady', () => {
    isFlutterReady = true;
  });

  async function notifyApp(handlerName, payload) {
    // Si NO estamos dentro de Flutter, no hay nada que notificar
    if (!isInAppWebView()) return false;

    // Reintenta ~2s esperando "ready"
    for (let i = 0; i < 40; i++) {
      try {
        if (isFlutterReady && window.flutter_inappwebview?.callHandler) {
          await window.flutter_inappwebview.callHandler(handlerName, payload ?? {});
          return true;
        }
      } catch (_) {}
      await sleep(50);
    }

    // Fallback: intenta aunque el ready no haya llegado
    for (let i = 0; i < 10; i++) {
      try {
        if (window.flutter_inappwebview?.callHandler) {
          await window.flutter_inappwebview.callHandler(handlerName, payload ?? {});
          return true;
        }
      } catch (_) {}
      await sleep(80);
    }

    return false;
  }

  // =========================
  // DOM
  // =========================
  const submitButton = document.querySelector('#submit');
  const form = document.querySelector('#payment-form');
  const formSide = document.querySelector('.form-side');

  // Visuales (pueden no existir en tu HTML actual)
  const visualBrand = document.querySelector('#brand-display');             // (no existe en tu HTML pegado)
  const visualLast4 = document.querySelector('.card-number-display');      // sí existe
  const visualStatus = document.querySelector('#status-display');          // (no existe en tu HTML pegado)

  // Params
  const urlParams = new URLSearchParams(window.location.search);
  const paymentId = urlParams.get('paymentId');
  const amount = urlParams.get('amount');

  // =========================
  // UI helpers
  // =========================
  function setSubmitLoading(isLoading) {
    if (!submitButton) return;
    submitButton.disabled = isLoading;
    submitButton.innerHTML = isLoading ? 'Procesando...' : '<span>Reintentar Pago</span>';
  }

  function setSubmitText(text) {
    const span = submitButton?.querySelector('span');
    if (span) span.textContent = text;
    else if (submitButton) submitButton.textContent = text;
  }

  function renderResultUI({ ok, title, subtitle, emoji }) {
    if (!formSide) return;

    // UI simple, no depende del CSS
    const color = ok ? '#27ae60' : '#e74c3c';

    formSide.innerHTML = `
      <div style="
        text-align:center;
        padding: 40px 28px;
        display:flex;
        flex-direction:column;
        justify-content:center;
        height:100%;
        gap:10px;
      ">
        <div style="font-size: 58px; margin-bottom: 10px;">${emoji}</div>
        <h2 style="color: ${color}; margin:0;">${title}</h2>
        <p style="color: #8a8a8a; margin:0;">${subtitle ?? ''}</p>

        <div id="browser-actions" style="margin-top: 18px; display:none; gap:10px; flex-direction:column;">
          <button type="button" id="btn-back" style="
            width:100%; padding:14px; border:none; border-radius:999px;
            font-weight:700; cursor:pointer; background:#2a2a2a; color:#fff;
          ">Volver</button>

          <button type="button" id="btn-close" style="
            width:100%; padding:14px; border:none; border-radius:999px;
            font-weight:700; cursor:pointer; background:#444; color:#fff;
          ">Cerrar pestaña</button>

          <div style="font-size: 12px; color: rgba(255,255,255,0.65); line-height:1.35;">
            Si esta pestaña no se cierra automáticamente, puedes volver atrás o cerrarla manualmente.
          </div>
        </div>
      </div>
    `;

    // Si es navegador normal, mostramos acciones
    if (!isInAppWebView()) {
      const actions = document.querySelector('#browser-actions');
      const btnBack = document.querySelector('#btn-back');
      const btnClose = document.querySelector('#btn-close');

      if (actions) actions.style.display = 'flex';

      btnBack?.addEventListener('click', () => {
        try { history.back(); } catch (_) {}
      });

      btnClose?.addEventListener('click', () => {
        try { window.close(); } catch (_) {}
      });
    }
  }

  function tryCloseBrowserTab() {
    // Solo funciona si la ventana fue abierta por script (window.open)
    try { window.close(); } catch (_) {}
  }

  // =========================
  // Validación inicial
  // =========================
  if (!paymentId) {
    console.error('No se encontró paymentId en la URL');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Enlace inválido';
    }
    renderResultUI({
      ok: false,
      title: 'Enlace inválido',
      subtitle: 'Falta el parámetro paymentId.',
      emoji: '❌',
    });
    return;
  }

  // Mostrar monto en el botón si viene
  if (amount) {
    const parsed = Number(amount);
    if (!Number.isNaN(parsed)) {
      setSubmitText(`Pagar $${parsed.toFixed(2)}`);
    }
  }

  // =========================
  // Inicializar SDK de Clip
  // =========================
  const clip = new ClipSDK(CONFIG.API_KEY);

  const card = clip.element.create('Card', {
    theme: 'light',
    locale: 'es',
    style: {
      base: {
        color: '#1a1a1a',
        fontFamily: "'Nunito Sans', sans-serif",
        fontSize: '16px',
        fontSmoothing: 'antialiased',
        iconColor: '#FF2822',
        '::placeholder': { color: '#aab7c4' },
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a',
      },
    },
  });

  card.mount('checkout');

  // Inicialmente bloquea submit hasta que complete
  if (submitButton) submitButton.disabled = true;

  // =========================
  // Evento change: UI visual
  // =========================
  card.on('change', event => {
    // Marca (si existe el elemento)
    if (visualBrand) {
      visualBrand.textContent = event.brand ? event.brand.toUpperCase() : 'TARJETA';
    }

    // Estado (si existe el elemento)
    if (visualStatus) {
      if (event.complete) {
        visualStatus.textContent = 'LISTO';
        visualStatus.style.color = '#81c784';
      } else if (event.error) {
        visualStatus.textContent = 'ERROR';
        visualStatus.style.color = '#e57373';
      } else {
        visualStatus.textContent = '...';
        visualStatus.style.color = '#fff';
      }
    }

    // Habilitar/deshabilitar botón según complete/error
    if (submitButton) {
      if (event.complete) submitButton.disabled = false;
      else submitButton.disabled = true;
    }

    // Últimos 4 (si el SDK los expone)
    if (visualLast4 && event.last4) {
      visualLast4.textContent = `•••• •••• •••• ${event.last4}`;
    }
  });

  // =========================
  // Submit: procesar pago
  // =========================
  form.addEventListener('submit', async event => {
    event.preventDefault();

    if (!submitButton) return;

    submitButton.disabled = true;
    submitButton.innerHTML = 'Procesando...';

    try {
      const { id: cardTokenID } = await card.cardToken();

      const response = await fetch(`${CONFIG.BACKEND_URL}/payments/process/${paymentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_token: cardTokenID }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Error procesando pago');
      }

      // UI éxito
      renderResultUI({
        ok: true,
        title: '¡Pago Exitoso!',
        subtitle: 'Finalizando...',
        emoji: '✅',
      });

      // 🔥 Notificar a Flutter (Android WebView)
      const sent = await notifyApp('paymentDone', { paymentId, result: data });

      // Si NO estamos en Flutter, intentamos cerrar (si aplica)
      if (!sent) {
        setTimeout(() => tryCloseBrowserTab(), 1200);
      }

    } catch (error) {
      console.error(error);

      // UI error (en web y en flutter)
      renderResultUI({
        ok: false,
        title: 'Pago rechazado',
        subtitle: error?.message ? String(error.message) : 'Error procesando pago',
        emoji: '❌',
      });

      await notifyApp('paymentFailed', {
        paymentId,
        message: error?.message ? String(error.message) : 'Error',
      });

      // Si sigues queriendo reintentar sin recargar, puedes reponer el formulario
      // (por ahora solo dejamos el result UI; si prefieres reintento, dímelo y lo ajusto)
    }
  });
});
