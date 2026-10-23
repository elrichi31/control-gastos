import type { SVGProps } from "react"

/** Símbolo de Betha: una B hecha de dos gastos, el mayor lleva la moneda (agujero real). */
export function BethaMark({ size = 24, tight = false, ...props }: Omit<SVGProps<SVGSVGElement>, "width" | "height"> & { size?: number; tight?: boolean }) {
  // tight: recorta al trazo (sin margen) para alinear el símbolo con el texto en el lockup; `size` es el alto.
  return (
    <svg width={tight ? (size * 172) / 180 : size} height={size} viewBox={tight ? "46 38 172 180" : "4 0 256 256"} fill="currentColor" aria-hidden="true" focusable="false" {...props}>
      <path
        fillRule="evenodd"
        d="M62 38H152a38 38 0 0 1 0 76H62a16 16 0 0 1-16-16V54a16 16 0 0 1 16-16ZM62 142H180a38 38 0 0 1 0 76H62a16 16 0 0 1-16-16V158a16 16 0 0 1 16-16ZM168 180a12 12 0 1 0 24 0a12 12 0 1 0-24 0Z"
      />
    </svg>
  )
}
