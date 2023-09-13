import { BundleableBase } from "../metadata/types"

interface Palette {
	primary: string
	secondary: string
	error: string
	warning: string
	info: string
	success: string
	// Allow any key as well, but require a minimum of the above
	[key: string]: string
}

type ThemeState = {
	definition: {
		spacing: number
		palette: Palette
	}
} & BundleableBase

export type { Palette, ThemeState }
