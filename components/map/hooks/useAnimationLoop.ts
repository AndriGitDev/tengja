import { useEffect, useRef } from "react";

export function useAnimationLoop(
  callback: (time: number, delta: number) => void,
) {
  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef(0);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const loop = (time: number) => {
      const delta = lastTimeRef.current
        ? (time - lastTimeRef.current) / 1000
        : 0.016;
      lastTimeRef.current = time;
      callbackRef.current(time, delta);
      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);
}
