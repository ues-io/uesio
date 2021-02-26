import { getURLFromFullName } from "../hooks/fileapi"
import { Theme, colors, Color } from "@material-ui/core"
import { createUseStyles } from "react-jss"
import {
	CreateCSSProperties,
	CSSProperties,
} from "@material-ui/core/styles/withStyles"
import { Context } from "../context/context"
import { PaletteColor } from "@material-ui/core/styles/createPalette"
import { ThemeState } from "../bands/theme/types"
import { DefinitionMap } from "../definition/definition"
import React from "react"
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
	context: Context
): string | undefined => {
	const image = definition?.image
	return image ? `url("${getURLFromFullName(context, image)}")` : undefined
}

const getBackgroundStyles = (
	definition: BackgroundDefinition,
	theme: ThemeState,
	context: Context
): CSSProperties => ({
	backgroundColor: getColor(definition?.color, theme, context),
	backgroundImage: getBackgroundImage(definition, context),
	backgroundSize: "cover",
})

const getMarginStyles = (
	definition: MarginDefinition,
	theme: ThemeState
): CSSProperties => {
	if (!definition) {
		return {}
	}
	if (Array.isArray(definition)) {
		return {
			margin: getSpacing(
				theme,
				...(definition as [number, number, number, number])
			),
		}
	}
	return {
		margin: getSpacing(theme, definition),
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
	theme: ThemeState,
	context: Context
): undefined | string => {
	if (!definition) return undefined
	let result = ""
	if (typeof definition === "string") {
		result = context.merge(definition)
	} else if (definition.value) {
		result = context.merge(definition.value)
	} else if (definition.intention) {
		result = theme.definition.palette[definition.intention]
	} else if (definition.hue) {
		const hue = colors?.[definition.hue] as Color
		result = hue[definition.shade || 500]
	}
	if (result && isValidColor(result)) return result
}
// https://stackoverflow.com/questions/48484767/javascript-check-if-string-is-valid-css-color
function isValidColor(potientialColor: string): boolean {
	const style = new Option().style
	style.color = potientialColor
	return !!style.color
}

// interface styledDefinition {
// 	definition?: {
// 		"uesio.styles"?: Record<string, Record<string, unknown>>
// 	}
// }

function getSpacing(theme: ThemeState, ...marginCounts: number[]) {
	const spacing = theme.definition.spacing || 8
	return marginCounts.map((count) => `${spacing * count}px`).join(" ")
}

const defaultTheme: ThemeState = {
	name: "default",
	namespace: "system",
	definition: {
		palette: {
			primary: "#1976d2",
			secondary: "#dc004e",
			error: "#f44336",
			warning: "#ff9800",
			info: "#2196f3",
			success: "#4caf50",
		},
		variantOverrides: {},
		spacing: 8,
	},
}

function getUseStyles<T extends { [key: string]: any }>(
	classNames: string[],
	defaultStyling?: Record<
		string,
		((props: T) => CSSProperties) | CSSProperties
	>
): (props: T) => Record<string, string> {
	const createStyleArgs: Record<string, (props: T) => CSSProperties> = {}
	classNames.forEach((className) => {
		createStyleArgs[className] = (props: T): CSSProperties => {
			const defaultValuesFromStyles = defaultStyling?.[className]
			let defaultValues: CSSProperties = {}
			if (typeof defaultValuesFromStyles === "function") {
				defaultValues = defaultValuesFromStyles(props)
			} else if (defaultValuesFromStyles) {
				defaultValues = defaultValuesFromStyles
			}
			const definition = <DefinitionMap>props.definition
			const explicitStyles = definition && definition["uesio.styles"]
			const customExtensions =
				(explicitStyles &&
					(<Record<string, Record<string, unknown>>>explicitStyles)[
						className
					]) ||
				{}
			return { ...defaultValues, ...customExtensions }
		}
	})
	return createUseStyles(createStyleArgs)
}
export {
	defaultTheme,
	useStyleProperty,
	getBackgroundStyles,
	getMarginStyles,
	getFloatStyles,
	BackgroundDefinition,
	MarginDefinition,
	FloatDefinition,
	CSSProperties,
	CreateCSSProperties,
	Theme,
	ThemeState,
	getSpacing,
	getUseStyles,
	getColor,
}
