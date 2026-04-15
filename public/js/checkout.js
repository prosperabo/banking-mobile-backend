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
          await window.flutter_inappwebview.callHandler(
            handlerName,
            payload ?? {}
          );
          return true;
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_) {}
      await sleep(50);
    }

    // Fallback
    for (let i = 0; i < 10; i++) {
      try {
        if (window.flutter_inappwebview?.callHandler) {
          await window.flutter_inappwebview.callHandler(
            handlerName,
            payload ?? {}
          );
          return true;
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  const visualBrand = document.querySelector('#brand-display'); // si existe
  const visualLast4 = document.querySelector('.card-number-display'); // sí existe
  const visualStatus = document.querySelector('#status-display'); // si existe

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
        try {
          history.back();
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_) {}
      });

      btnClose?.addEventListener('click', () => {
        try {
          window.close();
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_) {}
      });
    }
  }

  function tryCloseBrowserTab() {
    try {
      window.close();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {}
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
    if (typeof card?.addEventListener === 'function')
      return card.addEventListener('change', cb);
    if (typeof card?.addListener === 'function')
      return card.addListener('change', cb);
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

    const hasError =
      !!(e.error && (e.error.message || e.error)) || !!e.errorMessage;
    const errorMsg =
      (e.error &&
        (e.error.message || (typeof e.error === 'string' ? e.error : ''))) ||
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
      visualBrand.textContent = e.brand
        ? String(e.brand).toUpperCase()
        : 'TARJETA';
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
  // ClipBoard: copiar link de pago ACTUAL
  // =========================
  const copyBtn = document.querySelector('.copy-btn');

  // Verificamos que el botón exista para evitar errores
  if (copyBtn) {
    // PASO CLAVE: Sobrescribimos el 'data-link' con la URL actual del navegador.
    // Esto asegura que se copie el link con el paymentId y monto exactos que se recibieron.
    copyBtn.dataset.link = window.location.href;

    copyBtn.addEventListener('click', async () => {
      // Leemos el link dinámico que acabamos de asignar
      const link = copyBtn.dataset.link;

      try {
        await navigator.clipboard.writeText(link);

        // Feedback visual (clases y texto)
        copyBtn.classList.add('copied');
        const textElement = copyBtn.querySelector('.copy-text');

        // Guardamos el texto original por si acaso, aunque sabemos que es "Copiar enlace"
        if (textElement) textElement.textContent = '¡Copiado!';

        setTimeout(() => {
          copyBtn.classList.remove('copied');
          if (textElement) textElement.textContent = 'Copiar enlace';
        }, 2000);
      } catch (err) {
        console.error('Error al copiar:', err);
        // Opcional: Feedback de error si el navegador bloquea el portapapeles
        // alert('No se pudo copiar automáticamente.');
      }
    });
  }
  // =========================
  // Submit: procesar pago
  // =========================
  form.addEventListener('submit', async event => {
    event.preventDefault();

    if (!submitButton) return;

    setSubmitLoading(true);
    setError('');

    try {
      // 1. Tokenizar tarjeta
      const tokenResp = await card.cardToken();
      const cardTokenID = tokenResp?.id;

      if (!cardTokenID) {
        throw new Error('No se pudo tokenizar la tarjeta. Verifica los datos.');
      }

      // 2. Obtener datos de prevención de fraude del SDK
      let preventionData = null;
      try {
        preventionData = await card.preventionData();
      } catch (pdErr) {
        console.warn('No se pudieron obtener prevention data:', pdErr);
      }

      // 3. Enviar al backend incluyendo prevention_data si está disponible
      const requestBody = { card_token: cardTokenID };
      if (preventionData) {
        requestBody.prevention_data = {
          session_id: preventionData.session_id,
          user_agent: preventionData.user_agent,
        };
      }

      const response = await fetch(
        `${CONFIG.BACKEND_URL}/payments/process/${paymentId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Error procesando pago');
      }

      const paymentResult = data.data ?? data;

      // 4. Verificar si se requiere autenticación 3DS
      if (paymentResult?.pendingAction?.url) {
        show3DSIframe(paymentResult.pendingAction.url);
        return; // El flujo continúa dentro de show3DSIframe
      }

      const paymentStatus = String(paymentResult?.status || '').toUpperCase();

      if (paymentStatus === 'COMPLETED') {
        renderResultUI({
          ok: true,
          title: '¡Pago exitoso!',
          subtitle: 'Tu pago fue procesado correctamente.',
          emoji: '✅',
        });

        const sent = await notifyApp('paymentDone', {
          paymentId,
          result: paymentResult,
        });

        if (!sent) setTimeout(() => tryCloseBrowserTab(), 1200);
        return;
      }

      if (paymentStatus === 'PROCESSING') {
        renderResultUI({
          ok: true,
          title: 'Pago en proceso',
          subtitle: 'Tu pago fue autorizado y está en proceso de acreditación.',
          emoji: '🕒',
        });

        const sent = await notifyApp('paymentProcessing', {
          paymentId,
          result: paymentResult,
        });

        if (!sent) setTimeout(() => tryCloseBrowserTab(), 1200);
        return;
      }

      throw new Error(
        paymentResult?.statusMessage || 'El pago fue rechazado por el banco'
      );
    } catch (error) {
      const msg = error?.message
        ? String(error.message)
        : 'Error procesando pago';

      renderResultUI({
        ok: false,
        title: 'Pago no completado',
        subtitle: msg,
        emoji: '❌',
      });

      await notifyApp('paymentFailed', { paymentId, message: msg });
    }
  });

  // =========================
  // 3DS: mostrar iFrame y escuchar resultado
  // =========================
  function show3DSIframe(url) {
    const container = document.getElementById('3ds-iframe-container');
    if (!container) return;

    container.innerHTML = `<iframe
      title="cybersource3Ds"
      src="${url}"
      data-testid="cybersource3Ds-iframe"
      style="width:100vw;height:100vh;border:none;position:fixed;top:0;left:0;z-index:9999;">
    </iframe>`;
    container.style.display = 'block';

    let resolved = false;

    window.addEventListener('message', async event => {
      if (resolved) return;

      // Validar origen del mensaje contra el dominio del iFrame 3DS
      try {
        if (event.origin !== new URL(url).origin) return;
      } catch {
        return;
      }

      if (!event.data?.paymentId) return;
      resolved = true;

      // Ocultar y limpiar el iFrame
      container.innerHTML = '';
      container.style.display = 'none';

      // Verificar el estado final del pago via backend
      try {
        const verifyRes = await fetch(
          `${CONFIG.BACKEND_URL}/payments/verify/${paymentId}`,
          { method: 'GET', headers: { 'Content-Type': 'application/json' } }
        );
        const verifyData = await verifyRes.json().catch(() => ({}));
        const result = verifyData.data ?? verifyData;
        const ok = result?.status === 'COMPLETED';

        renderResultUI({
          ok,
          title: ok ? '¡Pago Exitoso!' : 'Autenticación 3DS fallida',
          subtitle: ok
            ? 'Finalizando...'
            : result?.statusMessage || 'El pago fue rechazado',
          emoji: ok ? '✅' : '❌',
        });

        if (ok) {
          const sent = await notifyApp('paymentDone', { paymentId, result });
          if (!sent) setTimeout(() => tryCloseBrowserTab(), 1200);
        } else {
          await notifyApp('paymentFailed', {
            paymentId,
            message: result?.statusMessage || 'Autenticación 3DS fallida',
          });
        }
      } catch (err) {
        renderResultUI({
          ok: false,
          title: 'Error al verificar pago',
          subtitle: 'No se pudo confirmar el resultado. Contacta soporte.',
          emoji: '❌',
        });
        await notifyApp('paymentFailed', {
          paymentId,
          message: 'Error verificando estado 3DS',
        });
      }
    });
  }
});
