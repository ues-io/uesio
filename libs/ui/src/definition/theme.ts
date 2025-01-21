import { BundleableBase } from "../metadata/types"

type PaletteValue = string

type Palette = Record<string, PaletteValue>

type ThemeState = {
  definition?: {
    spacing?: number
    palette?: Palette
  }
  isScoped?: boolean
} & BundleableBase

export type { Palette, ThemeState, PaletteValue }
