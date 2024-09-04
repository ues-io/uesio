import { Context } from "../context/context"
import { getThemeValue } from "./styles"

const ACCENT_COLORS = [
	"red",
	"orange",
	"yellow",
	"lime",
	"green",
	"emerald",
	"teal",
	"cyan",
	"sky",
	"blue",
	"indigo",
	"violet",
	"purple",
	"fuchsia",
	"pink",
	"rose",
] as const

const BASE_COLORS = ["slate", "grey", "zinc", "neutral", "stone"] as const

const MEDIUM_SHADES = [400, 500, 600, 700, 800] as const

type AccentColor = (typeof ACCENT_COLORS)[number]
type BaseColor = (typeof BASE_COLORS)[number]

function isStandardColorName(x: string) {
	return (
		ACCENT_COLORS.includes(x as AccentColor) ||
		BASE_COLORS.includes(x as BaseColor)
	)
}

const getRandomHue = () =>
	ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)]

const getRandomShade = () =>
	MEDIUM_SHADES[Math.floor(Math.random() * MEDIUM_SHADES.length)]

const getRandomColor = (context: Context) =>
	getThemeValue(
		context,
		`colors.${getRandomHue()}.${getRandomShade()}`
	) as string

export { ACCENT_COLORS, MEDIUM_SHADES, getRandomColor, isStandardColorName }
