document.addEventListener('DOMContentLoaded', () => {
  // =========================
  // Configuración
  // =========================
  const CONFIG = {
    API_KEY: 'ac12a9b5-4bc7-4ec3-8d86-fd5edd2aeb6b',
    BACKEND_URL: 'https://api.mobile.slan.mx/api/v1',
  };

  console.log('[CHECKOUT] DOM listo');
  console.log('[CHECKOUT] Config cargada', {
    backendUrl: CONFIG.BACKEND_URL,
  });

  // =========================
  // Helpers: entorno Flutter vs Browser
  // =========================
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const isInAppWebView = () => !!window.flutter_inappwebview?.callHandler;

  let isFlutterReady = false;
  window.addEventListener('flutterInAppWebViewPlatformReady', () => {
    isFlutterReady = true;
    console.log('[CHECKOUT] Flutter InAppWebView listo');
  });

  async function notifyApp(handlerName, payload) {
    console.log('[CHECKOUT] Intentando notificar a Flutter', {
      handlerName,
      payload,
      isInAppWebView: isInAppWebView(),
      isFlutterReady,
    });

    if (!isInAppWebView()) {
      console.log('[CHECKOUT] No está dentro de InAppWebView, no se notifica');
      return false;
    }

    // Espera a “ready” hasta ~2s
    for (let i = 0; i < 40; i++) {
      try {
        if (isFlutterReady && window.flutter_inappwebview?.callHandler) {
          await window.flutter_inappwebview.callHandler(
            handlerName,
            payload ?? {}
          );
          console.log('[CHECKOUT] Flutter notificado correctamente', {
            handlerName,
            mode: 'ready-loop',
          });
          return true;
        }
      } catch (err) {
        console.warn('[CHECKOUT] Falló notifyApp en ready-loop', err);
      }
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
          console.log('[CHECKOUT] Flutter notificado correctamente', {
            handlerName,
            mode: 'fallback-loop',
          });
          return true;
        }
      } catch (err) {
        console.warn('[CHECKOUT] Falló notifyApp en fallback-loop', err);
      }
      await sleep(80);
    }

    console.warn('[CHECKOUT] No se pudo notificar a Flutter', { handlerName });
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
  const visualBrand = document.querySelector('#brand-display');
  const visualLast4 = document.querySelector('.card-number-display');
  const visualStatus = document.querySelector('#status-display');

  // Params
  const urlParams = new URLSearchParams(window.location.search);
  const paymentId = urlParams.get('paymentId');
  const amount = urlParams.get('amount');

  console.log('[CHECKOUT] Parámetros detectados', {
    paymentId,
    amount,
    inAppWebView: isInAppWebView(),
  });

  // =========================
  // UI helpers
  // =========================
  function setError(text) {
    if (!errorBox) return;
    errorBox.textContent = text || '';
    if (text) {
      console.warn('[CHECKOUT] Error mostrado al usuario:', text);
    }
  }

  function setSubmitText(text) {
    const span = submitButton?.querySelector('span');
    if (span) span.textContent = text;
    else if (submitButton) submitButton.textContent = text;
  }

  function setSubmitEnabled(enabled) {
    if (!submitButton) return;
    submitButton.disabled = !enabled;
    console.log('[CHECKOUT] Botón submit', enabled ? 'habilitado' : 'deshabilitado');
  }

  function setSubmitLoading(isLoading) {
    if (!submitButton) return;
    submitButton.disabled = true;
    submitButton.innerHTML = isLoading
      ? 'Procesando...'
      : `<span>Reintentar Pago</span>`;

    console.log('[CHECKOUT] Estado loading del submit', { isLoading });
  }

  function renderResultUI({ ok, title, subtitle, emoji }) {
    if (!formSide) return;

    console.log('[CHECKOUT] Renderizando resultado', {
      ok,
      title,
      subtitle,
      emoji,
    });

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
        console.log('[CHECKOUT] Usuario presionó Volver en navegador');
        try {
          history.back();
        } catch (_) {}
      });

      btnClose?.addEventListener('click', () => {
        console.log('[CHECKOUT] Usuario presionó Cerrar pestaña en navegador');
        try {
          window.close();
        } catch (_) {}
      });
    }
  }

  function tryCloseBrowserTab() {
    console.log('[CHECKOUT] Intentando cerrar pestaña');
    try {
      window.close();
    } catch (_) {}
  }

  // =========================
  // Validación inicial
  // =========================
  if (!paymentId) {
    console.error('[CHECKOUT] No se encontró paymentId en la URL');
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
      console.log('[CHECKOUT] Monto mostrado en botón', parsed.toFixed(2));
    }
  }

  // =========================
  // Inicializar SDK de Clip
  // =========================
  console.log('[CHECKOUT] Inicializando ClipSDK');

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
  console.log('[CHECKOUT] Card de Clip montada en #checkout');

  // ✅ Arranca deshabilitado, pero con fallback
  setSubmitEnabled(false);
  setError('');

  // =========================
  // Bind de eventos (compat: on / addEventListener / addListener)
  // =========================
  let gotAnyCardEvent = false;

  function bindCardEvent(cb) {
    if (typeof card?.on === 'function') {
      console.log('[CHECKOUT] Bind usando card.on');
      return card.on('change', cb);
    }
    if (typeof card?.addEventListener === 'function') {
      console.log('[CHECKOUT] Bind usando card.addEventListener');
      return card.addEventListener('change', cb);
    }
    if (typeof card?.addListener === 'function') {
      console.log('[CHECKOUT] Bind usando card.addListener');
      return card.addListener('change', cb);
    }

    console.warn('[CHECKOUT] No se encontró método de bind para eventos de card');
  }

  function normalizeEvent(e) {
    return e?.detail ?? e ?? {};
  }

  function updateButtonFromCardEvent(raw) {
    gotAnyCardEvent = true;
    const e = normalizeEvent(raw);

    console.log('[CHECKOUT] Evento de card detectado', e);

    const hasError =
      !!(e.error && (e.error.message || e.error)) || !!e.errorMessage;
    const errorMsg =
      (e.error &&
        (e.error.message || (typeof e.error === 'string' ? e.error : ''))) ||
      e.errorMessage ||
      '';

    const isComplete =
      e.complete === true ||
      e.isComplete === true ||
      e.valid === true ||
      e.isValid === true;

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
    setSubmitEnabled(isComplete || !!userStarted);
  }

  bindCardEvent(updateButtonFromCardEvent);

  setTimeout(() => {
    if (!gotAnyCardEvent) {
      console.warn('[CHECKOUT] No llegaron eventos de card, activando fallback');
      setSubmitEnabled(true);
      setError('');
    }
  }, 1200);

  // =========================
  // ClipBoard: copiar link de pago ACTUAL
  // =========================
  const copyBtn = document.querySelector('.copy-btn');

  if (copyBtn) {
    copyBtn.dataset.link = window.location.href;
    console.log('[CHECKOUT] Botón copiar listo', {
      link: copyBtn.dataset.link,
    });

    copyBtn.addEventListener('click', async () => {
      const link = copyBtn.dataset.link;

      try {
        await navigator.clipboard.writeText(link);
        console.log('[CHECKOUT] Link copiado correctamente', { link });

        copyBtn.classList.add('copied');
        const textElement = copyBtn.querySelector('.copy-text');

        if (textElement) textElement.textContent = '¡Copiado!';

        setTimeout(() => {
          copyBtn.classList.remove('copied');
          if (textElement) textElement.textContent = 'Copiar enlace';
        }, 2000);
      } catch (err) {
        console.error('[CHECKOUT] Error al copiar:', err);
      }
    });
  }

  if (!form || !submitButton) {
    console.error('[CHECKOUT] No se encontró el formulario o el botón submit');
    return;
  }

  // =========================
  // Submit: procesar pago
  // =========================
  form.addEventListener('submit', async event => {
    event.preventDefault();
    console.log('[CHECKOUT] Submit de pago iniciado', { paymentId });

    if (!submitButton) return;

    setSubmitLoading(true);
    setError('');

    try {
      // 1. Tokenizar tarjeta
      console.log('[CHECKOUT] Tokenizando tarjeta...');
      const tokenResp = await card.cardToken();
      const cardTokenID = tokenResp?.id;

      console.log('[CHECKOUT] Respuesta tokenización', tokenResp);

      if (!cardTokenID) {
        throw new Error('No se pudo tokenizar la tarjeta. Verifica los datos.');
      }

      console.log('[CHECKOUT] Token obtenido correctamente', { cardTokenID });

      // 2. Obtener datos de prevención de fraude del SDK
      let preventionData = null;
      try {
        preventionData = await card.preventionData();
        console.log('[CHECKOUT] Prevention data obtenida', preventionData);
      } catch (pdErr) {
        console.warn('[CHECKOUT] No se pudieron obtener prevention data:', pdErr);
      }

      // 3. Enviar al backend incluyendo prevention_data si está disponible
      const requestBody = { card_token: cardTokenID };
      if (preventionData) {
        requestBody.prevention_data = {
          session_id: preventionData.session_id,
          user_agent: preventionData.user_agent,
        };
      }

      console.log('[CHECKOUT] Enviando pago al backend', {
        endpoint: `${CONFIG.BACKEND_URL}/payments/process/${paymentId}`,
        requestBody,
      });

      const response = await fetch(
        `${CONFIG.BACKEND_URL}/payments/process/${paymentId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json().catch(() => ({}));

      console.log('[CHECKOUT] Respuesta backend /process', {
        httpStatus: response.status,
        ok: response.ok,
        data,
      });

      if (!response.ok) {
        throw new Error(data.message || 'Error procesando pago');
      }

      const paymentResult = data.data ?? data;
      console.log('[CHECKOUT] paymentResult normalizado', paymentResult);

      // 4. Verificar si se requiere autenticación 3DS
      if (paymentResult?.pendingAction?.url) {
        console.log('[CHECKOUT] Pago requiere 3DS', {
          url: paymentResult.pendingAction.url,
        });
        show3DSIframe(paymentResult.pendingAction.url);
        return;
      }

      const paymentStatus = String(paymentResult?.status || '').toUpperCase();
      console.log('[CHECKOUT] Estado final recibido', {
        paymentStatus,
        statusMessage: paymentResult?.statusMessage,
      });

      if (paymentStatus === 'COMPLETED') {
        console.log('[CHECKOUT] Pago COMPLETED, mostrando éxito');

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

        console.log('[CHECKOUT] Resultado notifyApp(paymentDone)', { sent });

        if (!sent) setTimeout(() => tryCloseBrowserTab(), 1200);
        return;
      }

      if (paymentStatus === 'PROCESSING') {
        console.log('[CHECKOUT] Pago PROCESSING, mostrando en proceso');

        renderResultUI({
          ok: true,
          title: 'Pago en proceso',
          subtitle: 'Tu pago fue autorizado y está en proceso de acreditación.',
          emoji: '🕒',
        });

        const sent = await notifyApp('paymentDone', {
          paymentId,
          result: paymentResult,
        });

        console.log('[CHECKOUT] Resultado notifyApp(paymentDone)', { sent });

        if (!sent) setTimeout(() => tryCloseBrowserTab(), 1200);
        return;
      }

      console.warn('[CHECKOUT] Estado no exitoso recibido', {
        paymentStatus,
        statusMessage: paymentResult?.statusMessage,
      });

      throw new Error(
        paymentResult?.statusMessage || 'El pago fue rechazado por el banco'
      );
    } catch (error) {
      const msg = error?.message
        ? String(error.message)
        : 'Error procesando pago';

      console.error('[CHECKOUT] Error en submit de pago', error);

      renderResultUI({
        ok: false,
        title: 'Pago no completado',
        subtitle: msg,
        emoji: '❌',
      });

      const sent = await notifyApp('paymentFailed', { paymentId, message: msg });
      console.log('[CHECKOUT] Resultado notifyApp(paymentFailed)', { sent, msg });
    }
  });

  // =========================
  // 3DS: mostrar iFrame y escuchar resultado
  // =========================
  function show3DSIframe(url) {
    const container = document.getElementById('3ds-iframe-container');
    if (!container) {
      console.error('[CHECKOUT] No existe #3ds-iframe-container');
      return;
    }

    console.log('[CHECKOUT] Mostrando iframe 3DS', { url });

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

      console.log('[CHECKOUT] Mensaje recibido desde 3DS', {
        origin: event.origin,
        data: event.data,
      });

      try {
        if (event.origin !== new URL(url).origin) {
          console.warn('[CHECKOUT] Mensaje 3DS ignorado por origin distinto', {
            expected: new URL(url).origin,
            received: event.origin,
          });
          return;
        }
      } catch (err) {
        console.error('[CHECKOUT] Error validando origin 3DS', err);
        return;
      }

      if (!event.data?.paymentId) {
        console.warn('[CHECKOUT] Mensaje 3DS ignorado porque no trae paymentId');
        return;
      }

      resolved = true;
      console.log('[CHECKOUT] Mensaje 3DS válido, verificando pago final');

      container.innerHTML = '';
      container.style.display = 'none';

      try {
        const verifyUrl = `${CONFIG.BACKEND_URL}/payments/verify/${paymentId}`;
        console.log('[CHECKOUT] Consultando verify', { verifyUrl });

        const verifyRes = await fetch(verifyUrl, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        const verifyData = await verifyRes.json().catch(() => ({}));
        console.log('[CHECKOUT] Respuesta backend /verify', {
          httpStatus: verifyRes.status,
          ok: verifyRes.ok,
          verifyData,
        });

        const result = verifyData.data ?? verifyData;
        const ok = result?.status === 'COMPLETED';

        console.log('[CHECKOUT] Resultado final 3DS', {
          status: result?.status,
          statusMessage: result?.statusMessage,
          ok,
        });

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
          console.log('[CHECKOUT] Resultado notifyApp(paymentDone) desde 3DS', {
            sent,
          });
          if (!sent) setTimeout(() => tryCloseBrowserTab(), 1200);
        } else {
          const sent = await notifyApp('paymentFailed', {
            paymentId,
            message: result?.statusMessage || 'Autenticación 3DS fallida',
          });

          console.log('[CHECKOUT] Resultado notifyApp(paymentFailed) desde 3DS', {
            sent,
          });
        }
      } catch (err) {
        console.error('[CHECKOUT] Error verificando pago 3DS', err);

        renderResultUI({
          ok: false,
          title: 'Error al verificar pago',
          subtitle: 'No se pudo confirmar el resultado. Contacta soporte.',
          emoji: '❌',
        });

        const sent = await notifyApp('paymentFailed', {
          paymentId,
          message: 'Error verificando estado 3DS',
        });

        console.log('[CHECKOUT] Resultado notifyApp(paymentFailed) por error 3DS', {
          sent,
        });
      }
    });
  }
});