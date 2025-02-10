import { useState } from "react";
import OHLCVChart from "./components/OHLCVChart";
import data from "./data/dataDate.json";
import { OHLCVData } from "./types/StockData";

function App() {
  const [clickedCandle, setClickedCandle] = useState<OHLCVData | null>(null);
  return (
    <>
      <div>
        <h1>OHLCV Chart</h1>
        {clickedCandle && (
          <div>
            Hovered Candle: {clickedCandle.date} {clickedCandle.time} | Open:{" "}
            {clickedCandle.open} | Close: {clickedCandle.close}
          </div>
        )}
        {/* <OHLCVChart data={data} setClickedCandle={setClickedCandle} />
        <OHLCVChart data={data} width={600} height={300} /> */}
        <div style={{ width: 800, height: 400 }}>
          <OHLCVChart
            data={data}
            unit={"day"}
            dark={true}
            setClickedCandle={setClickedCandle}
          />
        </div>
        <div style={{ width: 800, height: 400 }}>
          <OHLCVChart
            data={data}
            unit={"day"}
            setClickedCandle={setClickedCandle}
          />
        </div>
      </div>
    </>
  );
}

export default App;
