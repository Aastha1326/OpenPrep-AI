export const triggerConfetti = () => {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '99999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  const colors = ['#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];
  const particles = [];

  // Generate particles from bottom corners
  const createParticle = (x, y, angle, spread) => {
    const velocity = Math.random() * 15 + 10;
    const radAngle = (angle + (Math.random() * spread - spread / 2)) * (Math.PI / 180);
    return {
      x,
      y,
      vx: Math.cos(radAngle) * velocity,
      vy: Math.sin(radAngle) * velocity,
      r: Math.random() * 5 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: 1,
      rotation: Math.random() * 360,
      rotationSpeed: Math.random() * 10 - 5,
    };
  };

  // Left side burst
  for (let i = 0; i < 75; i++) {
    particles.push(createParticle(0, height, -45, 35));
  }
  // Right side burst
  for (let i = 0; i < 75; i++) {
    particles.push(createParticle(width, height, -135, 35));
  }

  let animationFrameId;
  const update = () => {
    ctx.clearRect(0, 0, width, height);
    let active = false;

    particles.forEach((p) => {
      // Physics updates
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.4; // gravity
      p.vx *= 0.98; // friction
      p.vy *= 0.98;
      p.opacity -= 0.01;
      p.rotation += p.rotationSpeed;

      if (p.opacity > 0 && p.y < height && p.x > 0 && p.x < width) {
        active = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2);
        ctx.restore();
      }
    });

    if (active) {
      animationFrameId = requestAnimationFrame(update);
    } else {
      cancelAnimationFrame(animationFrameId);
      if (document.body.contains(canvas)) {
        document.body.removeChild(canvas);
      }
    }
  };

  update();
};
