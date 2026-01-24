document.addEventListener('DOMContentLoaded', () => {
  // Configuración
  const CONFIG = {
    API_KEY: 'ac12a9b5-4bc7-4ec3-8d86-fd5edd2aeb6b',
    BACKEND_URL: 'https://api.mobile.slan.mx/api/v1',
  };

  // Elementos del DOM
  const submitButton = document.querySelector('#submit');
  const form = document.querySelector('#payment-form');

  // Elementos Visuales (Tarjeta Roja)
  const visualBrand = document.querySelector('#brand-display');
  const visualLast4 = document.querySelector('.card-number-display');
  const visualStatus = document.querySelector('#status-display');

  // Obtener params
  const urlParams = new URLSearchParams(window.location.search);
  const paymentId = urlParams.get('paymentId');
  const amount = urlParams.get('amount');

  // Validación inicial
  if (!paymentId) {
    console.error('No se encontró paymentId en la URL');
    submitButton.disabled = true;
    submitButton.textContent = 'Enlace inválido';
    return;
  }

  // Si hay monto, podrías mostrarlo en el botón
  if (amount) {
    // Busca el span dentro del botón para agregarle el precio
    const btnText = submitButton.querySelector('span');
    if (btnText)
      btnText.textContent = `Pagar $${parseFloat(amount).toFixed(2)}`;
  }

  // Inicializar SDK de Clip
  const clip = new ClipSDK(CONFIG.API_KEY);

  // Crear elemento Card
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

  // === EVENTO: Actualizar tarjeta visual al escribir ===
  card.on('change', event => {
    // 1. Detectar Marca (Visa, MC, Amex)
    if (event.brand) {
      visualBrand.textContent = event.brand.toUpperCase();
    } else {
      visualBrand.textContent = 'TARJETA';
    }

    // 2. Estado (Completo/Incompleto)
    if (event.complete) {
      visualStatus.textContent = 'LISTO';
      visualStatus.style.color = '#81c784'; // Verde suave
      submitButton.disabled = false;
    } else if (event.error) {
      visualStatus.textContent = 'ERROR';
      visualStatus.style.color = '#e57373'; // Rojo suave
      submitButton.disabled = true;
    } else {
      visualStatus.textContent = '...';
      visualStatus.style.color = '#fff';
      submitButton.disabled = true;
    }

    // 3. Últimos 4 dígitos (si el SDK los expone en el evento change, varía por versión)
    // Nota: Clip protege el número completo, pero a veces da los last4
    if (event.last4) {
      visualLast4.textContent = `•••• •••• •••• ${event.last4}`;
    }
  });

  // Manejar el envío
  form.addEventListener('submit', async event => {
    event.preventDefault();

    submitButton.disabled = true;
    submitButton.innerHTML = `Procesando...`;

    try {
      const { id: cardTokenID } = await card.cardToken();

      const response = await fetch(
        `${CONFIG.BACKEND_URL}/payments/process/${paymentId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ card_token: cardTokenID }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error procesando pago');
      }

      // Éxito UI
      const formSide = document.querySelector('.form-side');
      formSide.innerHTML = `
          <div style="text-align:center; padding: 40px; display:flex; flex-direction:column; justify-content:center; height:100%;">
            <div style="font-size: 60px; margin-bottom: 20px;">✅</div>
            <h2 style="color: #27ae60; margin:0;">¡Pago Exitoso!</h2>
            <p style="color: #585858;">Redireccionando...</p>
          </div>
        `;

      setTimeout(() => {
        window.close();
      }, 2000);
    } catch (error) {
      console.error(error);
      submitButton.disabled = false;
      submitButton.innerHTML = `<span>Reintentar Pago</span>`;
      alert('Error: ' + error.message);
    }
  });
});
