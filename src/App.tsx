import OHLCVChart from "./components/OHLCVChart";
import data from "./data/dataDate.json";

function App() {
  return (
    <>
      <div>
        <h1>OHLCV Chart</h1>
        <OHLCVChart data={data} />
        <OHLCVChart data={data} width={600} height={300} />
      </div>
    </>
  );
}

export default App;
