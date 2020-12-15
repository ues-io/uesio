import { shade } from "polished"
import { getURLFromFullName } from "../hooks/fileapi"
import { Theme } from "@material-ui/core"
import { CreateCSSProperties } from "@material-ui/core/styles/withStyles"
import { Context } from "../context/context"

import { CSSProperties } from "@material-ui/styles"

const THEME_COLORS = {
	primary: "primary",
	secondary: "secondary",
	error: "error",
	warning: "warning",
	info: "info",
	success: "success",
}

type ThemeColor = keyof typeof THEME_COLORS

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
	!definition ? {} : { float: definition }

const getColor = ({
	color,
	shadePercentage,
	theme,
}: {
	color?: string
	shadePercentage?: number | string
	theme?: Theme
}) => {
	let computedColor = null

	// map the color (primary, etc.) with the color defined in the theme
	if (color && THEME_COLORS?.[color as ThemeColor] && theme) {
		computedColor = theme.palette?.[color as ThemeColor]?.main
	}

	// apply the shade if necessary
	if (shadePercentage && (computedColor || color)) {
		computedColor = shade(
			shadePercentage,
			(computedColor || color) as string
		)
	}

	return computedColor
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
