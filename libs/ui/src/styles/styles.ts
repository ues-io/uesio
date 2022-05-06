import { getURLFromFullName } from "../hooks/fileapi"
import { Context } from "../context/context"
import { CSSProperties } from "react"
import { ThemeState } from "../definition/theme"
import {
	BaseProps,
	DefinitionMap,
	UtilityProps,
} from "../definition/definition"
import { css, cx, CSSInterpolation } from "@emotion/css"
import { mergeDefinitionMaps } from "../component/component"

type ResponsiveDefinition =
	| string
	| {
			xs?: string
			sm?: string
			md?: string
			lg?: string
			xl?: string
	  }
	| undefined

type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl"
const getResponsiveStyles = (
	styleType: string,
	definition: ResponsiveDefinition,
	context: Context
): CSSProperties | undefined => {
	if (!definition) return undefined
	if (typeof definition === "string") {
		return {
			[styleType]: definition,
		}
	}

	const offset = context.getMediaOffset() || 0

	const breakpoints: Record<Breakpoint, number> = {
		xs: 0 + offset,
		sm: 600 + offset,
		md: 960 + offset,
		lg: 1280 + offset,
		xl: 1920 + offset,
	}

	return Object.keys(breakpoints).reduce(
		(props: Record<string, unknown>, breakpoint: Breakpoint) => {
			if (definition[breakpoint]) {
				props[`@media (min-width: ${breakpoints[breakpoint]}px)`] = {
					[styleType]: definition[breakpoint],
				}
			}
			return props
		},
		{}
	)
}

type ThemeIntention =
	| "primary"
	| "secondary"
	| "error"
	| "warning"
	| "info"
	| "success"

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

const getFloatStyles = (definition: FloatDefinition): CSSProperties =>
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
	}
	if (result && isValidColor(result)) return result
}
// https://stackoverflow.com/questions/48484767/javascript-check-if-string-is-valid-css-color
function isValidColor(potientialColor: string): boolean {
	const style = new Option().style
	style.color = potientialColor
	return !!style.color
}

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

function useStyles<K extends string>(
	defaults: Record<K, CSSInterpolation>,
	props: BaseProps | null
) {
	return mergeStyles(
		defaults,
		mergeDefinitionMaps(
			{},
			props?.definition?.["uesio.styles"] as DefinitionMap,
			props?.context
		),
		props?.componentType
	)
}

function useStyle<K extends string>(
	className: K,
	defaults: CSSInterpolation,
	props: BaseProps | null
) {
	return useStyles(
		{
			[className]: defaults,
		},
		props
	)
}

function useUtilityStyles<K extends string>(
	defaults: Record<K, CSSInterpolation>,
	props: UtilityProps | null
) {
	const styles = mergeDefinitionMaps(
		{},
		props?.styles as DefinitionMap,
		props?.context
	)
	return Object.keys(defaults).reduce(
		(classNames: Record<string, string>, className: K) => {
			classNames[className] = cx(
				css([
					defaults[className],
					styles?.[className],
					{
						label: getClassNameLabel(
							props?.componentType,
							className
						),
					},
				]),
				props?.classes?.[className],
				// A bit weird here... Only apply the passed-in className prop to root styles.
				// Otherwise, it would be applied to every class sent in as defaults.
				className === "root" && props?.className
			)
			return classNames
		},
		{} as Record<K, string>
	)
}

function getClassNameLabel(
	componentType: string | undefined,
	className: string
) {
	//  "/" or "." bring terror to the DOM
	const componentLabel = componentType?.replace(/\/|\./g, "-") || "unknown"
	return `${componentLabel}-${className}`
}

function mergeStyles<K extends string>(
	defaults: Record<K, CSSInterpolation>,
	existing: Record<string, CSSInterpolation> | undefined,
	componentType: string | undefined
) {
	return Object.keys(defaults).reduce(
		(classNames: Record<string, string>, className: K) => {
			classNames[className] = css([
				defaults[className],
				existing?.[className],
				{
					label: getClassNameLabel(componentType, className),
				},
			])
			return classNames
		},
		{} as Record<K, string>
	)
}

export {
	defaultTheme,
	useStyleProperty,
	getBackgroundStyles,
	getMarginStyles,
	getFloatStyles,
	BackgroundDefinition,
	ResponsiveDefinition,
	MarginDefinition,
	FloatDefinition,
	CSSProperties,
	ThemeState,
	getSpacing,
	getColor,
	getResponsiveStyles,
	cx,
	css,
	useUtilityStyles,
	useStyles,
	useStyle,
}
