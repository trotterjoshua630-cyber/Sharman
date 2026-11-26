'use strict';

(() => {
  const mouseMotion = matchMedia('(prefers-reduced-motion: no-preference) and (any-hover: hover) and (any-pointer: fine)');
  const controls = document.querySelectorAll(
    '.button, .text-link, .plain-button, .header-contact, .balloon-toggle, .choices label'
  );
  const padding = 9;
  const properties = ['--rubber-fill', '--rubber-shape', '--rubber-x', '--rubber-y', '--rubber-strength'];

  // Sample the capsule edge in order. The outward normals let each point
  // move independently, while the button's actual hit area stays still.
  function outline(width, height) {
    const radius = Math.min(width, height) / 2;
    const points = [];
    const straightSteps = Math.max(1, Math.ceil((width - 2 * radius) / 4));
    const arcSteps = Math.max(8, Math.ceil(Math.PI * radius / 3));

    for (let step = 0; step <= straightSteps; step += 1) {
      points.push([radius + step / straightSteps * (width - 2 * radius), 0, 0, -1]);
    }
    for (let step = 1; step <= arcSteps; step += 1) {
      const angle = Math.PI * (step / arcSteps - .5);
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      points.push([width - radius + radius * dx, radius + radius * dy, dx, dy]);
    }
    for (let step = 1; step <= straightSteps; step += 1) {
      points.push([width - radius - step / straightSteps * (width - 2 * radius), height, 0, 1]);
    }
    for (let step = 1; step < arcSteps; step += 1) {
      const angle = Math.PI * (step / arcSteps + .5);
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      points.push([radius + radius * dx, radius + radius * dy, dx, dy]);
    }
    return points;
  }

  function bindControl(control) {
    const surface = control.matches('.choices label') ? control.lastElementChild : control;
    let points = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let previousTime = 0;
    let hover = false;
    let pressed = false;
    let strength = 0;
    let velocity = 0;
    let x = 0;
    let y = 0;
    let targetX = 0;
    let targetY = 0;
    let waveAt = 0;
    let impulse = 0;

    function clear() {
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
      hover = false;
      pressed = false;
      strength = 0;
      velocity = 0;
      impulse = 0;
      surface.classList.remove('rubber-live');
      properties.forEach(property => surface.style.removeProperty(property));
    }

    function draw(time) {
      const dt = previousTime ? Math.min((time - previousTime) / 1000, 1 / 30) : 1 / 60;
      previousTime = time;
      const target = hover ? (pressed ? 1.2 : 1) : 0;
      for (let step = 0; step < 2; step += 1) {
        velocity += (230 * (target - strength) - 18 * velocity) * dt / 2;
        strength += velocity * dt / 2;
      }
      const follow = 1 - Math.exp(-26 * dt);
      x += (targetX - x) * follow;
      y += (targetY - y) * follow;

      const age = Math.max(0, (time - waveAt) / 1000);
      const wave = impulse * Math.exp(-6.5 * age);
      const reach = height * .64;
      const dent = Math.min(3.6, height * .08) * strength;
      const vertices = points.map(([edgeX, edgeY, dx, dy]) => {
        const distance = Math.hypot(edgeX - x, edgeY - y);
        const localDent = -dent * Math.exp(-.5 * (distance / reach) ** 2);
        const ripple = 2.7 * wave * Math.sin(age * 30 - distance / 11) * Math.exp(-distance / (height * 1.15));
        const offset = localDent + ripple;
        return `${(padding + edgeX + dx * offset).toFixed(1)}px ${(padding + edgeY + dy * offset).toFixed(1)}px`;
      });
      surface.style.setProperty('--rubber-shape', `polygon(${vertices.join(',')})`);
      surface.style.setProperty('--rubber-x', `${((x + padding) / (width + 2 * padding) * 100).toFixed(2)}%`);
      surface.style.setProperty('--rubber-y', `${((y + padding) / (height + 2 * padding) * 100).toFixed(2)}%`);
      surface.style.setProperty('--rubber-strength', Math.min(1, Math.max(0, strength)).toFixed(2));
      surface.classList.add('rubber-live');

      const following = Math.abs(targetX - x) + Math.abs(targetY - y) > .15;
      const moving = Math.abs(strength - target) > .004 || Math.abs(velocity) > .04 || wave > .01;
      frame = 0;
      if (following || moving) schedule();
      else if (!hover) clear();
      else previousTime = 0;
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(draw);
    }

    function track(event) {
      if (!mouseMotion.matches || event.pointerType !== 'mouse' || control.matches(':disabled')) return;
      const rect = surface.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const nextX = Math.min(rect.width, Math.max(0, event.clientX - rect.left));
      const nextY = Math.min(rect.height, Math.max(0, event.clientY - rect.top));
      const now = performance.now();

      if (!hover || width !== rect.width || height !== rect.height) {
        if (!surface.classList.contains('rubber-live')) {
          const fill = getComputedStyle(surface).backgroundImage;
          surface.style.setProperty('--rubber-fill', fill === 'none'
            ? 'linear-gradient(180deg, var(--puff-top), var(--puff-fill))'
            : fill);
        }
        width = rect.width;
        height = rect.height;
        points = outline(width, height);
        x = nextX;
        y = nextY;
        waveAt = now;
        impulse = 1;
      } else {
        const distance = Math.hypot(nextX - targetX, nextY - targetY);
        if (distance > 2 && now - waveAt > 70) {
          waveAt = now;
          impulse = Math.min(.96, .36 + distance / 22);
        }
      }

      hover = true;
      targetX = nextX;
      targetY = nextY;
      schedule();
    }

    function release(event) {
      if (event.pointerType !== 'mouse' || !hover) return;
      pressed = false;
      impulse = .8;
      waveAt = performance.now();
      schedule();
    }

    control.addEventListener('pointerenter', track);
    control.addEventListener('pointermove', track);
    control.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'mouse' || !hover) return;
      pressed = true;
      impulse = 1;
      waveAt = performance.now();
      schedule();
    });
    control.addEventListener('pointerup', release);
    control.addEventListener('pointercancel', release);
    control.addEventListener('pointerleave', event => {
      if (event.pointerType !== 'mouse' || !hover) return;
      hover = false;
      pressed = false;
      schedule();
    });
    return clear;
  }

  const resets = Array.from(controls, bindControl);
  const reset = () => resets.forEach(clear => clear());
  mouseMotion.addEventListener('change', reset);
  window.addEventListener('resize', reset);
})();


