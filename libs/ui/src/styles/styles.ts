import { getURLFromFullName } from "../hooks/fileapi"
import { Theme, colors, Color } from "@material-ui/core"
import { CreateCSSProperties } from "@material-ui/core/styles/withStyles"
import { Context } from "../context/context"

import { CSSProperties } from "@material-ui/styles"
import { PaletteColor } from "@material-ui/core/styles/createPalette"

type ThemeIntention =
	| "primary"
	| "secondary"
	| "error"
	| "warning"
	| "info"
	| "success"
type ThemeHue = keyof typeof colors
type ThemeShade = keyof Color

type BackgroundDefinition =
	| {
			image?: string
			color?: ColorDefinition
	  }
	| undefined

type MarginDefinition = number[] | undefined

type FloatDefinition = "left" | "right" | undefined

type ColorDefinition =
	| string
	| undefined
	| {
			value?: string
			intention?: ThemeIntention
			key?: keyof PaletteColor
			hue?: ThemeHue
			shade?: ThemeShade
	  }

function useStyleProperty<T>(property: T | undefined, defaultValue: T): T {
	return property !== undefined ? property : defaultValue
}

const getBackgroundImage = (
	definition: BackgroundDefinition,
	theme: Theme,
	context: Context
): string | undefined => {
	const image = definition?.image
	return image ? `url("${getURLFromFullName(context, image)}")` : undefined
}

const getBackgroundStyles = (
	definition: BackgroundDefinition,
	theme: Theme,
	context: Context
): CreateCSSProperties => ({
	backgroundColor: getColor(definition?.color, theme, context),
	backgroundImage: getBackgroundImage(definition, theme, context),
	backgroundSize: "cover",
})

const getMarginStyles = (
	definition: MarginDefinition,
	theme: Theme
): CreateCSSProperties => {
	if (!definition) {
		return {}
	}
	if (Array.isArray(definition)) {
		return {
			margin: theme.spacing(
				...(definition as [number, number, number, number])
			),
		}
	}
	return {
		margin: theme.spacing(definition),
	}
}

const getFloatStyles = (definition: FloatDefinition): CreateCSSProperties =>
	!definition
		? {}
		: {
				float: definition,
		  }

const getColor = (
	definition: ColorDefinition,
	theme: Theme,
	context: Context
): undefined | string => {
	if (!definition) return undefined
	if (typeof definition === "string") return context.merge(definition)
	if (definition.value) return context.merge(definition.value)
	if (definition.intention) {
		const intention = theme.palette?.[definition.intention]
		return intention[definition.key || "main"]
	}
	if (definition.hue) {
		const hue = colors?.[definition.hue] as Color
		return hue[definition.shade || 500]
	}
}

export {
	useStyleProperty,
	getBackgroundStyles,
	getMarginStyles,
	getFloatStyles,
	BackgroundDefinition,
	MarginDefinition,
	FloatDefinition,
	CSSProperties,
	getColor,
}
