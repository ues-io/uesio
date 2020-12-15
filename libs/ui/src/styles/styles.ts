import { getURLFromFullName } from "../hooks/fileapi"
import { Theme, PaletteColorOptions, Color } from "@material-ui/core"
import { CreateCSSProperties } from "@material-ui/core/styles/withStyles"
import { Context } from "../context/context"

import { CSSProperties } from "@material-ui/styles"
import * as MaterialUIColors from "@material-ui/core/colors"

type ThemeColor =
	| "primary"
	| "secondary"
	| "error"
	| "warning"
	| "info"
	| "success"

type BackgroundDefinition =
	| {
			image?: string
			color: string
	  }
	| undefined

type MarginDefinition = number[] | undefined

type FloatDefinition = "left" | "right" | undefined

function useStyleProperty<T>(property: T | undefined, defaultValue: T): T {
	return property !== undefined ? property : defaultValue
}

const getBackgroundImage = (
	definition: BackgroundDefinition,
	context: Context
): string | undefined => {
	const image = definition?.image
	return image ? `url("${getURLFromFullName(context, image)}")` : undefined
}

const getBackgroundStyles = (
	definition: BackgroundDefinition,
	context: Context
): CreateCSSProperties => {
	const color =
		definition?.color && context
			? context.merge(definition?.color)
			: definition?.color
	return {
		backgroundColor: color,
		backgroundImage: getBackgroundImage(definition, context),
		backgroundSize: "cover",
	}
}

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

const getColor = ({
	colorFormat,
	colorHue,
	shade,
	themeColor,
	theme,
}: {
	colorFormat?: string
	colorHue?: string
	shade?: number | string
	themeColor?: ThemeColor
	theme?: Theme
}) => {
	// the color is formatted (rgb, rgba, hexadecimal)
	if (colorFormat) {
		return colorFormat
	}

	// match the color theme (primary, etc.) with the color defined in the theme
	if (themeColor && theme) {
		const themePaletteColor =
			theme.palette?.[themeColor as ThemeColor]?.main
		return themePaletteColor
	}

	// generate the color based on the hue and shade

	// @ts-ignore
	if (shade && colorHue && MaterialUIColors?.[colorHue]) {
		// @ts-ignore
		const hue = MaterialUIColors?.[colorHue]
		return hue?.[shade as keyof Color]
	}
}

export {
	useStyleProperty,
	getBackgroundStyles,
	getMarginStyles,
	getFloatStyles,
	ThemeColor,
	BackgroundDefinition,
	MarginDefinition,
	FloatDefinition,
	CSSProperties,
	getColor,
}
