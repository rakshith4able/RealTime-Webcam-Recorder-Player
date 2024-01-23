import React from "react";
import LiveVideoCapture from "./components/LiveVideoCapture";
import MpdList from "./components/MpdList";

export default function App() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
      <LiveVideoCapture />
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <MpdList />
      </div>
    </div>
  );
}
