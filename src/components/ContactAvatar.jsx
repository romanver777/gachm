import { useState } from "react";

export default function ContactAvatar({ avatar, letter, size = 40 }) {
  const [imgFailed, setImgFailed] = useState(false);

  if (avatar && !imgFailed) {
    return (
      <img
        src={avatar}
        alt=""
        onError={() => setImgFailed(true)}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#c5d9ff",
        color: "#1a1a1a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.4,
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {letter || "?"}
    </div>
  );
}
