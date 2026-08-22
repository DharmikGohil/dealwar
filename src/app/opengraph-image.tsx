import { ImageResponse } from "next/og";

export const alt = "DealWar — Companies compete. Customers collect.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 62, background: "#f4f0e6", color: "#11100e", border: "18px solid #11100e", fontFamily: "Arial Black, Arial, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 27, fontWeight: 900 }}><span>DEAL/WAR<span style={{ color: "#ff4f1f" }}>.</span></span><span style={{ padding: "10px 16px", background: "#caff2f", border: "3px solid #11100e" }}>LIVE VALUE LEADERBOARD</span></div>
      <div style={{ display: "flex", flexDirection: "column", fontSize: 102, lineHeight: .83, letterSpacing: -7, fontWeight: 900, textTransform: "uppercase" }}><span>Companies</span><span style={{ color: "#ff4f1f" }}>compete.</span><span>Customers collect.</span></div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, fontWeight: 800 }}><span>Verified offers. Real inventory.</span><span>RANK = CUSTOMER VALUE</span></div>
    </div>,
    size,
  );
}
