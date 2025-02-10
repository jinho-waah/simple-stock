import React, { useRef, useEffect } from "react";

interface CanvasProps {
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
  width: number;
  height: number;
}

const Canvas: React.FC<CanvasProps> = ({ draw, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear the canvas
    ctx.clearRect(0, 0, width, height);

    // Call the draw function passed as a prop
    draw(ctx, width, height);
  }, [draw, width, height]);

  return <canvas ref={canvasRef} width={width} height={height} />;
};

export default Canvas;
