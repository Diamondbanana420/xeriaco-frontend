import { useEffect, useRef, useState } from "react";

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  color: string;
}

export function GalaxyBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const animationRef = useRef<number>();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      initStars();
    };

    const initStars = () => {
      const numStars = Math.floor((width * height) / 4000);
      starsRef.current = [];

      const colors = [
        "255, 255, 255",
        "200, 220, 255",
        "255, 240, 230",
        "180, 200, 255",
      ];

      for (let i = 0; i < numStars; i++) {
        starsRef.current.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 1.5 + 0.3,
          opacity: Math.random() * 0.5 + 0.2,
          twinkleSpeed: Math.random() * 0.002 + 0.001,
          twinkleOffset: Math.random() * Math.PI * 2,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    // Draw spiral galaxy arms - extremely soft
    const drawSpiralGalaxy = (time: number) => {
      const centerX = width / 2;
      const centerY = height / 2;
      const maxRadius = Math.max(width, height) * 1.2;
      
      // Rotation: 90 seconds per full rotation
      const rotation = prefersReducedMotion ? 0 : (time / 90000) * Math.PI * 2;
      
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rotation);

      // Draw multiple spiral arms with extreme softness
      const numArms = 2;
      const armColors = [
        { r: 168, g: 85, b: 247 },  // Purple
        { r: 100, g: 200, b: 255 }, // Cyan-ish
      ];

      for (let arm = 0; arm < numArms; arm++) {
        const baseAngle = (arm / numArms) * Math.PI * 2;
        const color = armColors[arm % armColors.length];

        // Multiple passes for softness - each progressively more transparent
        for (let pass = 0; pass < 5; pass++) {
          const passOpacity = 0.008 - pass * 0.0012;
          const passWidth = 150 + pass * 80;

          ctx.beginPath();
          
          // Logarithmic spiral
          for (let t = 0; t < 1200; t += 2) {
            const angle = baseAngle + t * 0.008;
            const radius = Math.pow(t, 1.1) * 0.8;
            
            if (radius > maxRadius) break;

            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius * 0.5; // Flatten for galaxy tilt

            if (t === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }

          ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${passOpacity})`;
          ctx.lineWidth = passWidth;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.stroke();
        }
      }

      // Central galaxy core glow - very soft
      for (let i = 5; i > 0; i--) {
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 200 * i);
        gradient.addColorStop(0, `rgba(200, 180, 255, ${0.015 / i})`);
        gradient.addColorStop(0.5, `rgba(150, 130, 200, ${0.008 / i})`);
        gradient.addColorStop(1, "rgba(100, 80, 150, 0)");

        ctx.beginPath();
        ctx.ellipse(0, 0, 200 * i, 100 * i, 0, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      ctx.restore();
    };

    // Draw ambient nebula clouds
    const drawNebulaField = (time: number) => {
      const clouds = [
        { x: width * 0.2, y: height * 0.3, r: 400, color: "168, 85, 247", speed: 120000 },
        { x: width * 0.8, y: height * 0.7, r: 350, color: "100, 180, 255", speed: -100000 },
        { x: width * 0.5, y: height * 0.8, r: 300, color: "200, 100, 180", speed: 80000 },
      ];

      clouds.forEach((cloud) => {
        const drift = prefersReducedMotion ? 0 : Math.sin(time / cloud.speed) * 30;
        
        for (let layer = 4; layer > 0; layer--) {
          const gradient = ctx.createRadialGradient(
            cloud.x + drift, cloud.y,
            0,
            cloud.x + drift, cloud.y,
            cloud.r * layer * 0.5
          );
          gradient.addColorStop(0, `rgba(${cloud.color}, ${0.012 / layer})`);
          gradient.addColorStop(0.6, `rgba(${cloud.color}, ${0.004 / layer})`);
          gradient.addColorStop(1, `rgba(${cloud.color}, 0)`);

          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);
        }
      });
    };

    // Draw stars with gentle twinkle
    const drawStars = (time: number) => {
      starsRef.current.forEach((star) => {
        const twinkle = prefersReducedMotion 
          ? 1 
          : 0.5 + Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.5;
        const opacity = star.opacity * twinkle;

        // Soft glow
        const gradient = ctx.createRadialGradient(
          star.x, star.y, 0,
          star.x, star.y, star.size * 3
        );
        gradient.addColorStop(0, `rgba(${star.color}, ${opacity})`);
        gradient.addColorStop(0.5, `rgba(${star.color}, ${opacity * 0.2})`);
        gradient.addColorStop(1, `rgba(${star.color}, 0)`);

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      });
    };

    let startTime = Date.now();

    const animate = () => {
      const time = Date.now() - startTime;

      // Deep space background
      ctx.fillStyle = "rgb(8, 10, 20)";
      ctx.fillRect(0, 0, width, height);

      // Layer 1: Nebula clouds (furthest back)
      drawNebulaField(time);

      // Layer 2: Spiral galaxy arms
      drawSpiralGalaxy(time);

      // Layer 3: Stars (front)
      drawStars(time);

      // Infinite edge fade - no hard boundaries
      const edgeFade = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, Math.max(width, height)
      );
      edgeFade.addColorStop(0, "rgba(8, 10, 20, 0)");
      edgeFade.addColorStop(0.85, "rgba(8, 10, 20, 0)");
      edgeFade.addColorStop(1, "rgba(8, 10, 20, 0.3)");
      ctx.fillStyle = edgeFade;
      ctx.fillRect(0, 0, width, height);

      animationRef.current = requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener("resize", resize);
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [prefersReducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10"
      style={{ background: "rgb(8, 10, 20)" }}
    />
  );
}
