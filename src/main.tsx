import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Althius brand: always dark by default
document.documentElement.classList.add("dark");

// Limpa dados de seed fake que possam ter sido gravados em sessões anteriores
const fakeKeys = ["apollo_cities", "apollo_funnels"];
fakeKeys.forEach((k) => {
  const raw = localStorage.getItem(k);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    const isSeedData = Array.isArray(data) && data.every(
      (d: { createdAt?: string }) => d.createdAt && new Date(d.createdAt) < new Date("2026-01-01")
    );
    if (isSeedData) localStorage.removeItem(k);
  } catch {
    localStorage.removeItem(k);
  }
});

createRoot(document.getElementById("root")!).render(<App />);
