import React, { useRef, useEffect, useState } from "react";

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
  width?: number; // Optional width
  height?: number; // Optional height
}

const OHLCVChart: React.FC<OHLCVChartProps> = ({
  data,
  width = 800,
  height = 400,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // State to manage the visible range of data
  const [visibleRange, setVisibleRange] = useState({
    start: 0,
    end: Math.min(30, data.length), // Default to showing the first 30 candles
  });

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size dynamically based on props
    canvas.width = width;
    canvas.height = height;

    // Draw chart
    const drawChart = (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number
    ) => {
      ctx.clearRect(0, 0, width, height);

      const margin = { top: 10, right: 50, bottom: 40, left: 10 };
      const chartWidth = width - margin.left - margin.right;
      const chartHeight = height - margin.top - margin.bottom;

      // Get visible data based on the range
      const visibleData = data.slice(visibleRange.start, visibleRange.end);

      const minPrice = Math.min(...visibleData.map((d) => d.low));
      const maxPrice = Math.max(...visibleData.map((d) => d.high));

      // 캔들 너비를 데이터 개수에 따라 정확히 계산 (빈 공간 제거)
      const candleWidth = chartWidth / visibleData.length;

      const xScale = (index: number) => candleWidth * index + margin.left;
      const yScale = (price: number) =>
        chartHeight -
        ((price - minPrice) / (maxPrice - minPrice)) * chartHeight +
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
      ctx.fillStyle = "#000";
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

      // Draw X-axis labels (date and time)
      visibleData.forEach((d, i) => {
        const x = xScale(i);
        if (i % Math.ceil(visibleData.length / 10) === 0) {
          ctx.fillStyle = "#000";
          ctx.fillText(`${d.date} ${d.time}`, x, chartHeight + margin.top + 20);
        }
      });

      // Draw candlesticks
      visibleData.forEach((d, i) => {
        const x = xScale(i);
        const openY = yScale(d.open);
        const closeY = yScale(d.close);
        const highY = yScale(d.high);
        const lowY = yScale(d.low);

        // High-low line
        ctx.beginPath();
        ctx.moveTo(x + candleWidth / 2, highY); // 중앙선
        ctx.lineTo(x + candleWidth / 2, lowY); // 중앙선
        ctx.strokeStyle = "black";
        ctx.stroke();

        // Candlestick body
        ctx.fillStyle = d.open > d.close ? "red" : "green";
        ctx.fillRect(
          x,
          Math.min(openY, closeY),
          candleWidth,
          Math.abs(openY - closeY)
        );
      });
    };

    drawChart(ctx, width, height);

    // Handle mouse wheel for zooming
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      let { start, end } = visibleRange;

      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const mouseXInCanvas = event.clientX - rect.left;

      const marginLeft = 10; // margin.left
      const chartWidth = width - marginLeft - 50; // width에서 margin.left와 margin.right를 제외한 차트 너비
      const mouseXInChart = mouseXInCanvas - marginLeft; // 마우스 X 좌표에서 차트 시작점(margin.left)을 뺌

      // 마우스가 차트 영역 외부에 있는 경우 무시
      if (mouseXInChart < 0 || mouseXInChart > chartWidth) return;

      // 마우스 위치를 데이터 인덱스로 변환
      const mouseIndex = Math.floor(
        mouseXInChart / (end - start)
        // (mouseXInChart / chartWidth) * (end - start) + start
      );
      console.log(mouseXInChart);
      const delta = Math.sign(event.deltaY);

      if (delta > 0) {
        // 확대 (줌 인)
        start = Math.max(0, start - 1);
        end = Math.min(data.length, end + 1);
      } else if (delta < 0 && end - start > 2) {
        // 축소 (줌 아웃)
        const leftSize = mouseIndex - start;
        const rightSize = end - mouseIndex;

        let leftZoom = 0;
        let rightZoom = 0;

        // 마우스 위치가 좌우 비대칭일 경우 조정
        if (leftSize > rightSize && rightSize !== 0) {
          leftZoom = Math.ceil(leftSize / rightSize);
          rightZoom = 1;
        } else if (rightSize > leftSize && leftSize !== 0) {
          leftZoom = 1;
          rightZoom = Math.ceil(rightSize / leftSize);
        } else if (rightSize === 0) {
          leftZoom = 1;
          rightZoom = 0;
        } else if (leftSize === 0) {
          leftZoom = 0;
          rightZoom = 1;
        } else {
          leftZoom = 1;
          rightZoom = 1;
        }

        // 마우스를 기준으로 확대 비율 조정 (점진적으로 중앙으로 이동)
        const shift = Math.floor((rightSize - leftSize) * 0.2);
        start = Math.max(0, start + leftZoom - shift);
        end = Math.min(data.length, end - rightZoom - shift);
      }

      setVisibleRange({ start, end });
    };

    containerRef.current?.addEventListener("wheel", handleWheel);

    return () => {
      containerRef.current?.removeEventListener("wheel", handleWheel);
    };
  }, [data, visibleRange, width, height]);

  return (
    <div
      ref={containerRef}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <canvas ref={canvasRef}></canvas>
    </div>
  );
};

export default OHLCVChart;
