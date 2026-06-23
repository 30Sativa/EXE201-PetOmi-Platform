import { PawPrint } from "lucide-react"

/**
 * Lớp nền trang trí động: 3 blob gradient trôi nhẹ + vài dấu chân thú bay lên.
 * Hoàn toàn `pointer-events: none` nên không cản tương tác.
 * Tôn trọng prefers-reduced-motion qua CSS (.po-blob / .po-paw bị tắt animation).
 */

const blobs = [
  {
    className: "left-[-6%] top-[8%] size-[320px]",
    color: "var(--po-color-primary-soft)",
    delay: "0s",
  },
  {
    className: "right-[-8%] top-[26%] size-[380px]",
    color: "var(--po-color-accent-soft)",
    delay: "-4s",
  },
  {
    className: "left-[34%] bottom-[6%] size-[300px]",
    color: "var(--po-color-warning-soft)",
    delay: "-8s",
  },
]

// Dấu chân: vị trí ngang %, size, độ trễ, thời lượng, góc xoay
const paws = [
  { left: "8%", size: 22, delay: "0s", dur: "11s", rot: "-18deg" },
  { left: "22%", size: 16, delay: "-3s", dur: "13s", rot: "12deg" },
  { left: "44%", size: 26, delay: "-6s", dur: "10s", rot: "-8deg" },
  { left: "63%", size: 18, delay: "-1.5s", dur: "14s", rot: "20deg" },
  { left: "80%", size: 24, delay: "-7.5s", dur: "12s", rot: "-14deg" },
  { left: "92%", size: 15, delay: "-4.5s", dur: "15s", rot: "10deg" },
]

export default function AnimatedBackground() {
  return (
    <div className="po-bg-decor" aria-hidden="true">
      {blobs.map((blob, i) => (
        <span
          key={i}
          className={`po-blob ${blob.className}`}
          style={{ background: blob.color, animationDelay: blob.delay }}
        />
      ))}
      {paws.map((paw, i) => (
        <span
          key={i}
          className="po-paw"
          style={{
            left: paw.left,
            animationDelay: paw.delay,
            animationDuration: paw.dur,
            ["--paw-rot" as string]: paw.rot,
          }}
        >
          <PawPrint style={{ width: paw.size, height: paw.size }} />
        </span>
      ))}
    </div>
  )
}
