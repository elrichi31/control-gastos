import type { SVGProps } from "react"

/** Símbolo de Betha: una B hecha de dos gastos, el mayor lleva la moneda (agujero real). */
export function BethaMark({ size = 24, ...props }: Omit<SVGProps<SVGSVGElement>, "width" | "height"> & { size?: number | string }) {
  return (
    <svg width={size} height={size} viewBox="4 0 256 256" fill="currentColor" aria-hidden="true" focusable="false" {...props}>
      <path
        fillRule="evenodd"
        d="M62 38H152a38 38 0 0 1 0 76H62a16 16 0 0 1-16-16V54a16 16 0 0 1 16-16ZM62 142H180a38 38 0 0 1 0 76H62a16 16 0 0 1-16-16V158a16 16 0 0 1 16-16ZM168 180a12 12 0 1 0 24 0a12 12 0 1 0-24 0Z"
      />
    </svg>
  )
}
