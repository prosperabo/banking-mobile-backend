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
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const isInAppWebView = () => !!window.flutter_inappwebview?.callHandler;

  let isFlutterReady = false;
  window.addEventListener('flutterInAppWebViewPlatformReady', () => {
    isFlutterReady = true;
  });

  async function notifyApp(handlerName, payload) {
    if (!isInAppWebView()) return false;

    // Espera a “ready” hasta ~2s
    for (let i = 0; i < 40; i++) {
      try {
        if (isFlutterReady && window.flutter_inappwebview?.callHandler) {
          await window.flutter_inappwebview.callHandler(handlerName, payload ?? {});
          return true;
        }
      } catch (_) {}
      await sleep(50);
    }

    // Fallback
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
  const errorBox = document.querySelector('#card-error');

  // Visuales (opcionales)
  const visualBrand = document.querySelector('#brand-display');        // si existe
  const visualLast4 = document.querySelector('.card-number-display'); // sí existe
  const visualStatus = document.querySelector('#status-display');      // si existe

  // Params
  const urlParams = new URLSearchParams(window.location.search);
  const paymentId = urlParams.get('paymentId');
  const amount = urlParams.get('amount');

  // =========================
  // UI helpers
  // =========================
  function setError(text) {
    if (!errorBox) return;
    errorBox.textContent = text || '';
  }

  function setSubmitText(text) {
    const span = submitButton?.querySelector('span');
    if (span) span.textContent = text;
    else if (submitButton) submitButton.textContent = text;
  }

  function setSubmitEnabled(enabled) {
    if (!submitButton) return;
    submitButton.disabled = !enabled;
  }

  function setSubmitLoading(isLoading) {
    if (!submitButton) return;
    submitButton.disabled = true;
    submitButton.innerHTML = isLoading
      ? 'Procesando...'
      : `<span>Reintentar Pago</span>`;
  }

  function renderResultUI({ ok, title, subtitle, emoji }) {
    if (!formSide) return;

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

          <div style="font-size: 12px; color: rgba(0,0,0,0.55); line-height:1.35;">
            Si esta pestaña no se cierra automáticamente, puedes volver atrás o cerrarla manualmente.
          </div>
        </div>
      </div>
    `;

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
    try { window.close(); } catch (_) {}
  }

  // =========================
  // Validación inicial
  // =========================
  if (!paymentId) {
    console.error('No se encontró paymentId en la URL');
    setSubmitEnabled(false);
    if (submitButton) submitButton.textContent = 'Enlace inválido';
    renderResultUI({
      ok: false,
      title: 'Enlace inválido',
      subtitle: 'Falta el parámetro paymentId.',
      emoji: '❌',
    });
    return;
  }

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

  // ✅ Arranca deshabilitado, pero con fallback
  setSubmitEnabled(false);
  setError('');

  // =========================
  // Bind de eventos (compat: on / addEventListener / addListener)
  // =========================
  let gotAnyCardEvent = false;

  function bindCardEvent(cb) {
    if (typeof card?.on === 'function') return card.on('change', cb);
    if (typeof card?.addEventListener === 'function') return card.addEventListener('change', cb);
    if (typeof card?.addListener === 'function') return card.addListener('change', cb);
    // Si el SDK cambió y no hay forma de escuchar cambios, usaremos fallback (botón habilitado)
  }

  function normalizeEvent(e) {
    // algunos SDKs envían e.detail
    return e?.detail ?? e ?? {};
  }

  function updateButtonFromCardEvent(raw) {
    gotAnyCardEvent = true;
    const e = normalizeEvent(raw);

    // DEBUG: mira qué trae realmente tu SDK en producción
    // console.log('[CLIP change]', e);

    const hasError = !!(e.error && (e.error.message || e.error)) || !!e.errorMessage;
    const errorMsg =
      (e.error && (e.error.message || (typeof e.error === 'string' ? e.error : ''))) ||
      e.errorMessage ||
      '';

    // ✅ “complete” puede llamarse distinto según versión
    const isComplete =
      e.complete === true ||
      e.isComplete === true ||
      e.valid === true ||
      e.isValid === true;

    // fallback suave: si NO hay error y el usuario ya empezó a escribir, dejamos pagar
    // (si está incompleto, card.cardToken() fallará y mostraremos el error)
    const userStarted =
      e.empty === false || e.touched === true || e.brand || e.last4;

    if (visualBrand) {
      visualBrand.textContent = e.brand ? String(e.brand).toUpperCase() : 'TARJETA';
    }

    if (visualStatus) {
      if (hasError) {
        visualStatus.textContent = 'ERROR';
        visualStatus.style.color = '#e57373';
      } else if (isComplete) {
        visualStatus.textContent = 'LISTO';
        visualStatus.style.color = '#81c784';
      } else {
        visualStatus.textContent = '...';
        visualStatus.style.color = '#fff';
      }
    }

    if (visualLast4 && e.last4) {
      visualLast4.textContent = `•••• •••• •••• ${e.last4}`;
    }

    if (hasError) {
      setError(errorMsg || 'Revisa los datos de la tarjeta.');
      setSubmitEnabled(false);
      return;
    }

    setError('');
    // habilita si está completo, o si ya empezó y no hay error (fallback)
    setSubmitEnabled(isComplete || !!userStarted);
  }

  bindCardEvent(updateButtonFromCardEvent);

  // ✅ Watchdog: si por alguna razón nunca llegan eventos en Android/alguna versión,
  // habilitamos el botón después de un ratito y validamos al submit.
  setTimeout(() => {
    if (!gotAnyCardEvent) {
      setSubmitEnabled(true);
      setError(''); // opcional: podrías poner “Completa los datos antes de pagar”.
    }
  }, 1200);

  // =========================
  // Submit: procesar pago
  // =========================
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!submitButton) return;

    setSubmitLoading(true);
    setError('');

    try {
      const tokenResp = await card.cardToken();
      const cardTokenID = tokenResp?.id;

      if (!cardTokenID) {
        throw new Error('No se pudo tokenizar la tarjeta. Verifica los datos.');
      }

      const response = await fetch(
        `${CONFIG.BACKEND_URL}/payments/process/${paymentId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ card_token: cardTokenID }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Error procesando pago');
      }

      renderResultUI({
        ok: true,
        title: '¡Pago Exitoso!',
        subtitle: 'Finalizando...',
        emoji: '✅',
      });

      // Notificar a Flutter
      const sent = await notifyApp('paymentDone', { paymentId, result: data });

      // Si es navegador normal, intenta cerrar (solo funcionará si fue abierto por script)
      if (!sent) setTimeout(() => tryCloseBrowserTab(), 1200);

    } catch (error) {
      console.error(error);

      const msg = error?.message ? String(error.message) : 'Error procesando pago';
      setError(msg);

      renderResultUI({
        ok: false,
        title: 'Pago no completado',
        subtitle: msg,
        emoji: '❌',
      });

      await notifyApp('paymentFailed', { paymentId, message: msg });

      // En web: deja reintentar recargando (o puedes reconstruir el form)
      // Aquí, como ya renderizamos result UI, si quieres “reintentar” sin recargar,
      // dímelo y te lo dejo con botón que restaura el formulario.
    }
  });
});
