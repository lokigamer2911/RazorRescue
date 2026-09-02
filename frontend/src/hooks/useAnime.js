import { useEffect, useRef, useCallback } from 'react';
import { animate as animeAnimate, stagger, createTimeline } from 'animejs';

// Animated number counter using anime.js
export function useCountUp(target, duration = 1200, delay = 0) {
  const ref = useRef(null);
  const valueRef = useRef({ val: 0 });

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const controls = animeAnimate(valueRef.current, {
      val: target,
      duration,
      delay,
      ease: 'outExpo',
      onUpdate: () => {
        if (el) el.textContent = Math.round(valueRef.current.val);
      },
    });
    return () => controls.pause();
  }, [target, duration, delay]);

  return ref;
}

// Format currency with animated counter
export function useCountCurrency(target, duration = 1200, delay = 0) {
  const ref = useRef(null);
  const valueRef = useRef({ val: 0 });

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const controls = animeAnimate(valueRef.current, {
      val: target,
      duration,
      delay,
      ease: 'outExpo',
      onUpdate: () => {
        if (el) {
          const num = Math.round(valueRef.current.val);
          if (num < 1000) el.textContent = `₹${num}`;
          else {
            const str = num.toString();
            const last3 = str.slice(-3);
            const rest = str.slice(0, -3);
            el.textContent = rest ? `₹${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}` : `₹${last3}`;
          }
        }
      },
    });
    return () => controls.pause();
  }, [target, duration, delay]);

  return ref;
}

// Stagger reveal for child elements
export function useStaggerReveal(options = {}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const children = containerRef.current.children;
    if (!children.length) return;

    const controls = animeAnimate(children, {
      opacity: [0, 1],
      translateY: [24, 0],
      duration: options.duration || 600,
      delay: stagger(options.stagger || 60, { start: options.start || 0 }),
      ease: 'outExpo',
    });
    return () => controls.pause();
  }, []);

  return containerRef;
}

// Progress bar animation
export function useProgressAnimation(targetPercent, duration = 1500) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const controls = animeAnimate(ref.current, {
      width: `${targetPercent}%`,
      duration,
      ease: 'outExpo',
    });
    return () => controls.pause();
  }, [targetPercent, duration]);

  return ref;
}

// Hover scale effect
export function useHoverScale(scale = 1.02) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const enter = () => {
      animeAnimate(el, { scale, duration: 200, ease: 'outQuad' });
    };
    const leave = () => {
      animeAnimate(el, { scale: 1, duration: 200, ease: 'outQuad' });
    };
    el.addEventListener('mouseenter', enter);
    el.addEventListener('mouseleave', leave);
    return () => {
      el.removeEventListener('mouseenter', enter);
      el.removeEventListener('mouseleave', leave);
    };
  }, [scale]);

  return ref;
}

// Glow pulse on element
export function useGlowPulse(color = 'rgba(14,165,233,0.15)') {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const controls = animeAnimate(ref.current, {
      boxShadow: [
        `0 0 0px ${color}`,
        `0 0 30px ${color}`,
        `0 0 0px ${color}`,
      ],
      duration: 3000,
      loop: true,
      ease: 'easeInOutSine',
    });
    return () => controls.pause();
  }, [color]);

  return ref;
}

// Timeline for sequenced animations
export function useAnimationTimeline() {
  const ref = useRef(null);

  const play = useCallback(() => {
    if (!ref.current) return;
    const children = Array.from(ref.current.querySelectorAll('[data-animate]'));
    const tl = createTimeline();
    children.forEach((el, i) => {
      tl.add(el, {
        opacity: [0, 1],
        translateX: [-20, 0],
        duration: 400,
        ease: 'outExpo',
      }, i * 100);
    });
    return tl;
  }, []);

  return { ref, play };
}
