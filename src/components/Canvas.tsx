import React, { useRef, useEffect, useState } from "react";

const Canvas = () => {
  const canvasRef = useRef(null);

  // 상태 관리
  const [intervalType, setIntervalType] = useState("minute");
  const [data, setData] = useState([]);
  const [labels, setLabels] = useState([]);

  // 데이터 및 레이블 생성 함수
  const generateDataAndLabels = (interval) => {
    const now = new Date();
    let data = [];
    let labels = [];

    if (interval === "minute") {
      data = Array.from({ length: 60 }, () => Math.floor(Math.random() * 100));
      labels = Array.from({ length: 60 }, (_, i) => `${i}:00`);
    } else if (interval === "hour") {
      data = Array.from({ length: 24 }, () => Math.floor(Math.random() * 100));
      labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    } else if (["day", "week", "month"].includes(interval)) {
      for (let i = -11; i <= 0; i++) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
        data.push(Math.floor(Math.random() * 100));
        labels.push(monthDate.toLocaleString("default", { month: "short" }));
      }
    } else if (interval === "year") {
      for (let i = -4; i <= 0; i++) {
        data.push(Math.floor(Math.random() * 100));
        labels.push((now.getFullYear() + i).toString());
      }
    }

    return { data, labels };
  };

  // 차트를 캔버스에 그리기
  const drawChart = (ctx, data, labels) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Y축 최대값 계산
    const yMax = Math.max(...data);
    const barWidth = width / data.length;

    // Y축 그리드 및 레이블
    for (let i = 0; i <= yMax; i += Math.ceil(yMax / 5)) {
      const yPos = height - (i / yMax) * height;
      ctx.beginPath();
      ctx.moveTo(0, yPos);
      ctx.lineTo(width, yPos);
      ctx.strokeStyle = "#ddd";
      ctx.stroke();

      // Y축 레이블
      ctx.fillStyle = "#000";
      ctx.font = "12px Arial";
      ctx.textAlign = "right";
      ctx.fillText(i.toString(), width - 10, yPos + 5);
    }

    // X축 그리드 및 레이블
    labels.forEach((label, index) => {
      const xPos = index * barWidth;

      // 세로선 그리기
      ctx.beginPath();
      ctx.moveTo(xPos, 0);
      ctx.lineTo(xPos, height);
      ctx.strokeStyle = "#ddd";
      ctx.stroke();

      // X축 레이블 추가
      ctx.fillStyle = "#000";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.fillText(label, xPos + barWidth / 2, height + 15);
    });

    // 막대그래프 그리기
    data.forEach((value, index) => {
      const xPos = index * barWidth;
      const barHeight = (value / yMax) * height;

      // 막대 그리기
      ctx.fillStyle = "#4CAF50";
      ctx.fillRect(xPos + barWidth * 0.2, height - barHeight, barWidth * 0.6, barHeight);

      // 막대 위에 값 표시
      ctx.fillStyle = "#000";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.fillText(value.toString(), xPos + barWidth / 2, height - barHeight - 10);
    });
  };

  useEffect(() => {
    // 데이터 생성 및 상태 업데이트
    const { data: newData, labels: newLabels } = generateDataAndLabels(intervalType);
    setData(newData);
    setLabels(newLabels);

    // 차트 그리기
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // 캔버스 크기 설정
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    drawChart(ctx, newData, newLabels);
  }, [intervalType]);

  return (
    <div>
      <canvas ref={canvasRef} style={{ border: "1px solid #000", width: "800px", height: "400px" }} />
      
      {/* 간격 변경 */}
      <div>
        <label>Set Interval:</label>
        <select onChange={(e) => setIntervalType(e.target.value)} value={intervalType}>
          <option value="minute">1 Minute</option>
          <option value="hour">1 Hour</option>
          <option value="day">1 Day</option>
          <option value="week">1 Week</option>
          <option value="month">1 Month</option>
          <option value="year">1 Year</option>
        </select>
      </div>
    </div>
  );
};

export default Canvas;
