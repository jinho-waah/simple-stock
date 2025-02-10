import React, { useRef, useEffect, useState } from "react";
import formatTime from "../utils/formatTime";

interface OHLCVData {
  date: string;
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface OHLCVChartProps {
  data: OHLCVData[];
  unit: "minute" | "hour" | "day" | "week" | "month";
  dark?: boolean;
  setClickedCandle?: (candle: OHLCVData | null) => void;
}

const OHLCVChart: React.FC<OHLCVChartProps> = ({
  data,
  unit,
  dark = false,
  setClickedCandle,
}) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // State to manage the visible range of data
  const [visibleRange, setVisibleRange] = useState({
    start: Math.max(0, data.length - 30),
    end: data.length, // Default to showing the first 30 candles
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState<number | null>(null);

  useEffect(() => {
    // Use ResizeObserver to track container size
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setDimensions({ width, height });
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size dynamically based on props
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    ctx.fillStyle = dark ? "#202020" : "#FFF";
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    const margin = { top: 10, right: 50, bottom: 40, left: 10 };

    // Draw chart
    const drawChart = (ctx: CanvasRenderingContext2D) => {
      ctx.fillStyle = dark ? "#202020" : "#FFFFFF";
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      const chartWidth = dimensions.width - margin.left - margin.right;
      const chartHeight = dimensions.height - margin.top - margin.bottom;

      // Split chart height for price and volume
      const priceChartHeight = chartHeight * 0.9; // Top 70% for price chart
      const volumeChartHeight = chartHeight * 0.1; // Bottom 30% for volume

      // Get visible data based on the range
      const visibleData = data.slice(visibleRange.start, visibleRange.end);

      const minPrice = Math.min(...visibleData.map((d) => d.low));
      const maxPrice = Math.max(...visibleData.map((d) => d.high));
      const maxVolume = Math.max(...visibleData.map((d) => d.volume));

      const gap = 2;
      const candleWidth =
        (chartWidth - gap * (visibleData.length - 1)) / visibleData.length;

      const xScale = (index: number) =>
        index * (candleWidth + gap) + margin.left;

      const yScalePrice = (price: number) =>
        priceChartHeight -
        ((price - minPrice) / (maxPrice - minPrice)) * priceChartHeight +
        margin.top;

      const yScaleVolume = (volume: number) =>
        volumeChartHeight -
        (volume / maxVolume) * volumeChartHeight +
        priceChartHeight +
        margin.top;

      // Draw axes
      ctx.strokeStyle = "#ccc";

      // Draw X-axis (bottom)
      ctx.beginPath();
      ctx.moveTo(margin.left, chartHeight + margin.top);
      ctx.lineTo(chartWidth + margin.left, chartHeight + margin.top);
      ctx.stroke();

      // Draw Y-axis (right)
      ctx.beginPath();
      ctx.moveTo(chartWidth + margin.left, margin.top);
      ctx.lineTo(chartWidth + margin.left, chartHeight + margin.top);
      ctx.stroke();

      // Draw Y-axis labels (price values)
      ctx.fillStyle = dark ? "#fff" : "#000";
      ctx.font = "10px Arial";
      const priceSteps = 5; // Number of steps on the Y-axis
      for (let i = 0; i <= priceSteps; i++) {
        const price = minPrice + ((maxPrice - minPrice) / priceSteps) * i; // Calculate price at step
        const yPos =
          chartHeight -
          ((price - minPrice) / (maxPrice - minPrice)) * chartHeight +
          margin.top;

        ctx.fillText(price.toFixed(2), chartWidth + margin.left + 5, yPos + 3); // Align text to right of Y-axis
        ctx.beginPath();
        ctx.moveTo(margin.left, yPos);
        ctx.lineTo(chartWidth + margin.left, yPos); // Horizontal grid line
        ctx.strokeStyle = "#eee";
        ctx.stroke();
      }

      // Draw X-axis labels (date and time) with a minimum spacing of 50px between vertical lines
      const minSpacing = 75; // Minimum pixel spacing between vertical grid lines
      let lastX = -Infinity; // Track the last drawn X-coordinate

      visibleData.forEach((d, i) => {
        const x = xScale(i) + candleWidth / 2; // Center of the candle (assume candleWidth is defined)

        // Only draw the label and grid line if the current position is at least `minSpacing` away from the last
        if (x - lastX >= minSpacing) {
          // Draw vertical grid line
          ctx.beginPath();
          ctx.moveTo(x, margin.top);
          ctx.lineTo(x, chartHeight + margin.top);
          ctx.strokeStyle = "#eee";
          ctx.stroke();

          // Draw label, ensuring it's centered below the vertical line
          ctx.fillStyle = dark ? "#fff" : "#000";
          ctx.textAlign = "center"; // Align text to the center of the X coordinate
          ctx.fillText(
            `${formatTime(d.date, d.time, unit)}`,
            x,
            chartHeight + margin.top + 20
          );

          // Update the last drawn X-coordinate
          lastX = x;
        }
      });

      // Draw candlesticks
      visibleData.forEach((d, i) => {
        const x = xScale(i);
        const openY = yScalePrice(d.open);
        const closeY = yScalePrice(d.close);
        const highY = yScalePrice(d.high);
        const lowY = yScalePrice(d.low);

        // Determine if the candle is bullish or bearish
        const isBullish = d.close > d.open;

        // Set colors for bullish and bearish candles
        const candleColor = isBullish ? "green" : "red";

        // High-low line
        ctx.beginPath();
        ctx.moveTo(x + candleWidth / 2, highY);
        ctx.lineTo(x + candleWidth / 2, lowY);
        ctx.strokeStyle = candleColor; // Match the color of the candlestick body
        ctx.stroke();

        // Candlestick body
        ctx.fillStyle = candleColor;
        ctx.fillRect(
          x,
          Math.min(openY, closeY),
          candleWidth,
          Math.abs(openY - closeY)
        );
      });

      visibleData.forEach((d, i) => {
        const x = xScale(i);
        const volumeYStart = yScaleVolume(0); // Bottom of the volume chart
        const volumeYEnd = yScaleVolume(d.volume); // Top of the volume bar

        ctx.fillStyle =
          d.open > d.close
            ? "rgba(255, 0, 0, 0.5)" // Red with transparency
            : "rgba(0, 255, 0, 0.5)"; // Green with transparency
        ctx.fillRect(x, volumeYEnd, candleWidth, volumeYStart - volumeYEnd);
      });
    };

    drawChart(ctx);

    // Handle mouse wheel for zooming
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      let { start, end } = visibleRange;

      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const mouseXInCanvas = event.clientX - rect.left;

      const marginLeft = 10;
      const chartWidth = dimensions.width - marginLeft - 50;
      const mouseXInChart = mouseXInCanvas - marginLeft;

      if (mouseXInChart < 0 || mouseXInChart > chartWidth) return;

      const visibleDataCount = end - start;
      const mouseIndex =
        Math.floor((mouseXInChart / chartWidth) * visibleDataCount) + start;

      const zoomFactor = 0.5;
      const delta = Math.sign(event.deltaY);

      if (delta < 0 && visibleDataCount > 1) {
        // Zoom In, but prevent having less than one candle
        const leftZoomAmount = Math.max(
          1,
          Math.ceil((mouseIndex - start) * zoomFactor)
        );
        const rightZoomAmount = Math.max(
          1,
          Math.ceil((end - mouseIndex) * zoomFactor)
        );

        start = Math.max(0, mouseIndex - leftZoomAmount);
        end = Math.max(mouseIndex + rightZoomAmount, start + 2);
        if (end - start < 1) {
          end = start + 1;
        }
        // Ensure at least one candle remains visible
        if (end - start < 1) {
          end = start + 1;
        }
      } else if (delta > 0 && end - start < data.length) {
        // Zoom Out
        const leftExpandAmount = Math.max(
          1,
          Math.ceil((mouseIndex - start) * zoomFactor)
        );
        const rightExpandAmount = Math.max(
          1,
          Math.ceil((end - mouseIndex) * zoomFactor)
        );

        start = Math.max(0, start - leftExpandAmount);
        end = Math.min(data.length, end + rightExpandAmount);
      }

      if (start < 0) start = 0;
      if (end > data.length) end = data.length;

      setVisibleRange({ start, end });
    };

    const handleMouseDown = (event: MouseEvent) => {
      setIsDragging(true);
      setDragStartX(event.clientX); // Record the starting X position of the drag
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging || dragStartX === null) return;

      // Calculate drag distance in pixels
      const dragDistance = event.clientX - dragStartX;

      // Convert drag distance to data index shift
      const chartWidth = dimensions.width - 60; // Exclude margins
      const visibleDataCount = visibleRange.end - visibleRange.start;
      const candleWidthWithGap = chartWidth / visibleDataCount;
      const indexShift = Math.round(dragDistance / candleWidthWithGap);

      if (indexShift !== 0) {
        setVisibleRange((prevRange) => {
          let newStart = prevRange.start - indexShift;
          let newEnd = prevRange.end - indexShift;

          // Ensure the range stays within bounds
          if (newStart < 0) {
            newEnd += Math.abs(newStart);
            newStart = 0;
          }
          if (newEnd > data.length) {
            newStart -= newEnd - data.length;
            newEnd = data.length;
          }

          return { start: newStart, end: newEnd };
        });

        // Update drag start position to avoid cumulative shifts
        setDragStartX(event.clientX);
      }
    };

    const handleMouseClick = (event: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const mouseXInCanvas = event.clientX - rect.left;

      const marginLeft = 10;
      const chartWidth = dimensions.width - marginLeft - 50;

      if (
        mouseXInCanvas < marginLeft ||
        mouseXInCanvas > chartWidth + marginLeft
      ) {
        return; // Ignore clicks outside the chart area
      }

      const visibleDataCount = visibleRange.end - visibleRange.start;
      const candleWidthWithGap = chartWidth / visibleDataCount;
      const clickedIndex =
        Math.floor((mouseXInCanvas - marginLeft) / candleWidthWithGap) +
        visibleRange.start;

      if (
        clickedIndex >= visibleRange.start &&
        clickedIndex < visibleRange.end
      ) {
        const clickedCandle = data[clickedIndex];

        // Safely call setClickedCandle if it is defined
        if (setClickedCandle) {
          setClickedCandle(clickedCandle);
        }
      }
    };

    const handleMouseUpOrLeave = () => {
      setIsDragging(false);
      setDragStartX(null);
    };

    containerRef.current?.addEventListener("mousedown", handleMouseDown);
    containerRef.current?.addEventListener("mouseup", handleMouseUpOrLeave);
    containerRef.current?.addEventListener("mousemove", handleMouseMove);
    containerRef.current?.addEventListener("wheel", handleWheel);
    containerRef.current?.addEventListener("click", handleMouseClick);

    return () => {
      containerRef.current?.removeEventListener("mousedown", handleMouseDown);
      containerRef.current?.removeEventListener("mousemove", handleMouseMove);
      containerRef.current?.removeEventListener(
        "mouseup",
        handleMouseUpOrLeave
      );
      containerRef.current?.removeEventListener("wheel", handleWheel);
      containerRef.current?.removeEventListener("click", handleMouseClick);
    };
  }, [
    data,
    visibleRange,
    isDragging,
    dragStartX,
    setClickedCandle,
    dimensions.width,
    dimensions.height,
  ]);

  return (
    <div
      ref={containerRef}
      style={{
        width: `100%`,
        height: `100%`,
      }}
    >
      <canvas ref={canvasRef}></canvas>
    </div>
  );
};

export default OHLCVChart;
