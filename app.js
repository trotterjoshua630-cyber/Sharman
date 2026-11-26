'use strict';

const occasions = {
  birthday: { name: 'День рождения', photo: 'birthday' },
  wedding: { name: 'Свадьба', photo: 'wedding' },
  newborn: { name: 'Выписка', photo: 'newborn' },
  surprise: { name: 'Без повода', photo: 'surprise' },
};
const palettes = { any: 'Цвет на выбор', pink: 'Розовый', blue: 'Голубой', cream: 'Молочный' };
const variants = {
  birthday: { cream: 'birthday-pearl' },
  wedding: { cream: 'wedding' },
  newborn: { blue: 'hero-blue', cream: 'newborn' },
  surprise: { pink: 'hero-heart', blue: 'blue-hearts' },
};
const photos = {
  birthday: [820, 820, 'Салатовые и малиновые шары с персональной надписью'],
  wedding: [600, 800, 'Светлые сердца и прозрачные шары'],
  newborn: [600, 800, 'Облака и светло-голубые шары'],
  surprise: [600, 800, 'Красные фольгированные сердца'],
  'birthday-pearl': [600, 800, 'Светлый шар с надписью Happy Birthday'],
  'hero-blue': [600, 800, 'Голубые шары, облако и полумесяц'],
  'hero-heart': [540, 690, 'Букет из красных и розовых сердец'],
  'blue-hearts': [540, 688, 'Голубые и серебряные сердца'],
};
const preview = document.querySelector('#preview-image');
const selectionSummary = document.querySelector('#selection-summary');
const previewNote = document.querySelector('#preview-note');
const selectedValue = group => document.querySelector(`input[name="${group}"]:checked`).value;

function currentSelection() {
  return { occasion: selectedValue('occasion'), palette: selectedValue('palette'), size: selectedValue('size') };
}

function updatePreview() {
  const { occasion, palette, size } = currentSelection();
  const variant = variants[occasion][palette];
  const photo = variant || occasions[occasion].photo;
  const [width, height, alt] = photos[photo];

  if (preview.dataset.photo !== photo) {
    preview.width = width;
    preview.height = height;
    preview.alt = alt;
    preview.src = `img/${photo}.webp`;
    preview.dataset.photo = photo;
  }
  selectionSummary.textContent = `${occasions[occasion].name} · ${palettes[palette]} · ${size}`;
  if (palette === 'any') {
    previewNote.textContent = 'Фото показывает пример по поводу.';
  } else if (variant) {
    previewNote.textContent = 'Фото показывает близкую гамму. Размер уточним при заказе.';
  } else {
    previewNote.textContent = 'Фото показывает пример по поводу. Выбранный цвет укажем в запросе.';
  }
}

document.querySelector('.builder-controls').addEventListener('change', updatePreview);
document.querySelectorAll('[data-pick]').forEach(link => {
  link.addEventListener('click', () => {
    document.querySelector(`input[name="occasion"][value="${link.dataset.pick}"]`).checked = true;
    updatePreview();
  });
});

const orderDialog = document.querySelector('#order-dialog');
const orderMessage = document.querySelector('#order-message');
const copyResult = document.querySelector('#copy-result');
const whatsappLink = document.querySelector('#whatsapp-link');
// Add the confirmed WhatsApp number in international digit-only format.
const whatsappNumber = '';

function messageFor(action) {
  if (action === 'builder') {
    const { occasion, palette, size } = currentSelection();
    return [
      'Здравствуйте, Sharman! Хочу заказать шары в Ярославле.',
      `Повод: ${occasions[occasion].name}.`,
      `Цвет: ${palettes[palette]}.`,
      `Размер композиции: ${size}.`,
      'Подскажите, пожалуйста, состав и стоимость.',
    ].join('\n');
  }

  if (occasions[action]) {
    return `Здравствуйте, Sharman! Заинтересовала композиция из раздела «${occasions[action].name}». Подскажите, пожалуйста, её стоимость и доступные варианты.`;
  }

  const requests = {
    general: 'Хочу обсудить заказ воздушных шаров в Ярославле.',
    decor: 'Хочу обсудить оформление праздника воздушными шарами.',
    delivery: 'Хочу уточнить условия и стоимость доставки шаров по Ярославлю.',
  };
  return `Здравствуйте, Sharman! ${requests[action]}`;
}

document.querySelectorAll('[data-order]').forEach(link => {
  link.addEventListener('click', event => {
    if (typeof orderDialog.showModal !== 'function') return;
    event.preventDefault();
    const message = messageFor(link.dataset.order);
    orderMessage.value = message;
    whatsappLink.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    copyResult.hidden = true;
    orderDialog.showModal();
  });
});

document.querySelector('#copy-message').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(orderMessage.value);
    copyResult.textContent = 'Сообщение скопировано.';
  } catch {
    orderMessage.select();
    copyResult.textContent = 'Текст выделен. Скопируйте его через меню браузера.';
  }
  copyResult.hidden = false;
});

const requestForm = document.querySelector('#request-form');
const formResult = document.querySelector('#form-result');
requestForm.addEventListener('submit', event => {
  event.preventDefault();
  formResult.hidden = false;
});
requestForm.addEventListener('input', () => { formResult.hidden = true; });
document.querySelector('#submit-demo').disabled = false;

const cookieDialog = document.querySelector('#cookie-dialog');
const cookieOpen = document.querySelector('#cookie-open');
cookieOpen.addEventListener('click', () => {
  cookieDialog.returnValue = '';
  cookieDialog.showModal();
});
cookieDialog.addEventListener('close', () => {
  const states = { allow: 'разрешена в демо', reject: 'отклонена' };
  const state = states[cookieDialog.returnValue];
  if (state) document.querySelector('#cookie-status').textContent = `Аналитика: ${state}.`;
});
cookieOpen.disabled = false;

const pointerMotion = matchMedia('(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)');
document.querySelectorAll('.tile').forEach(tile => {
  const clearMotion = () => {
    tile.style.removeProperty('--move-x');
    tile.style.removeProperty('--move-y');
  };
  tile.addEventListener('pointermove', event => {
    if (!pointerMotion.matches || event.pointerType !== 'mouse') return;
    const rect = tile.getBoundingClientRect();
    tile.style.setProperty('--move-x', `${(0.5 - (event.clientX - rect.left) / rect.width) * 2.6}%`);
    tile.style.setProperty('--move-y', `${(0.5 - (event.clientY - rect.top) / rect.height) * 2.6}%`);
  });
  tile.addEventListener('pointerleave', clearMotion);
  pointerMotion.addEventListener('change', clearMotion);
});
const catalogMotion = matchMedia('(min-width: 760px) and (prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)');
document.querySelectorAll('.catalog-photo').forEach(photo => {
  const resetTilt = () => photo.style.removeProperty('--catalog-tilt');
  const maxAngle = 3;
  const angleAt = (offset, size) => Math.max(-1, Math.min(1, 2 * offset / size - 1)) * maxAngle;

  photo.addEventListener('pointermove', event => {
    if (!catalogMotion.matches || event.pointerType !== 'mouse') return;
    const rect = photo.getBoundingClientRect();
    const x = -angleAt(event.clientY - rect.top, rect.height);
    const y = angleAt(event.clientX - rect.left, rect.width);
    photo.style.setProperty('--catalog-tilt', `perspective(950px) rotateX(${x}deg) rotateY(${y}deg)`);
  });
  photo.addEventListener('pointerleave', resetTilt);
  photo.addEventListener('pointercancel', resetTilt);
  catalogMotion.addEventListener('change', resetTilt);
});
updatePreview();
