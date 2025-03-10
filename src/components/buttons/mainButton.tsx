// components/CustomButton.tsx
"use client";

import React from "react";

interface CustomButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function CustomButton({
  children,
  className,
  onClick,
}: CustomButtonProps) {
  return (
    <button className={`customButton ${className}`} onClick={onClick}>
      <span aria-hidden="true">{children}</span>
      <span></span>
      <span>{children}</span>
      <style jsx>{`
        :global(:root) {
          --bg-color-1: #043a68;
          --bg-color-2: rgb(255, 249, 73);
          --bg-color-3: #ffffff;
          --padding: 1rem 4rem;
          --font-family: monospace;
          --step: 0.5rem;
        }
        /* Activate state on hover or focus-visible */
        .customButton:is(:hover, :focus-visible) {
          --active: 1;
        }
        .customButton {
          --active: 0;
          color: white;
          border-radius: 9999px;
          position: relative;
          cursor: pointer;
          font-family: var(--font-family);
          font-weight: bold;
          border: 0;
          background: transparent;
          min-height: 40px;
        }
        .customButton span:first-of-type {
          padding: 0;
          min-height: 40px;
        }
        .customButton span:not(:first-of-type) {
          position: absolute;
        }
        [aria-hidden] {
          color: transparent;
        }
        .customButton span {
          inset: 0;
          display: grid;
          background: var(--bg);
          place-items: center;
          transition: 0.2s ease;
          border: 2px solid black;
          border-radius: 9999px;
          translate: calc(
              (var(--active) * var(--coefficient, 0)) * (var(--step) * -1)
            )
            calc((var(--active) * var(--coefficient, 0)) * (var(--step) * -1));
        }
        .customButton span:nth-of-type(1) {
          --bg: var(--bg-color-3);
        }
        .customButton span:nth-of-type(2) {
          --coefficient: 1;
          --bg: var(--bg-color-2);
        }
        .customButton span:nth-of-type(3) {
          --coefficient: 2;
          --bg: var(--bg-color-1);
        }
        .customButton:active {
          --active: 0.5;
        }
      `}</style>
    </button>
  );
}
