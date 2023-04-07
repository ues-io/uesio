import { CSSProperties } from "react"
import { ThemeState } from "../definition/theme"
import {
	BaseProps,
	DefinitionMap,
	UtilityProps,
} from "../definition/definition"
import { css, cx, CSSInterpolation } from "@emotion/css"
import { mergeDefinitionMaps } from "../component/merge"
import * as colors from "./colors"
import {
	getDefinitionFromVariant,
	parseVariantName,
} from "../component/component"
import { MetadataKey } from "../metadataexports"
import { twMerge } from "tailwind-merge"

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
	definition: ResponsiveDefinition
): CSSProperties | undefined => {
	if (!definition) return undefined
	if (typeof definition === "string") {
		return {
			[styleType]: definition,
		}
	}

	const breakpoints: Record<Breakpoint, number> = {
		xs: 0,
		sm: 600,
		md: 960,
		lg: 1280,
		xl: 1920,
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

const defaultTheme: ThemeState = {
	name: "default",
	namespace: "uesio/core",
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
	const existing = mergeDefinitionMaps(
		{},
		props?.definition?.["uesio.styles"] || {},
		props?.context
	) as Record<string, CSSInterpolation>

	const tokens = props?.definition?.["uesio.styleTokens"] || {}
	return Object.keys(defaults).reduce(
		(classNames: Record<string, string>, className: K) => {
			const classTokens = tokens[className] || []
			classNames[className] = twMerge(
				cx(
					...classTokens,
					css([
						defaults[className],
						existing?.[className],
						{
							label: getClassNameLabel(
								props?.componentType,
								className
							),
						},
					])
				)
			)
			return classNames
		},
		{} as Record<K, string>
	)
}

function getVariantDefinition(
	props: UtilityProps,
	componentType: MetadataKey | undefined
) {
	if (!componentType) return undefined

	const [variantComponentType, variantName] = parseVariantName(
		props.variant,
		componentType
	)

	if (!variantComponentType || !variantName) return undefined

	const variant = props.context.getComponentVariant(
		variantComponentType,
		variantName
	)
	if (!variant) return undefined
	return getDefinitionFromVariant(variant, props.context)
}

function getVariantStyles(
	props: UtilityProps,
	componentType: MetadataKey | undefined
) {
	const variantDefinition = getVariantDefinition(props, componentType)
	if (!variantDefinition) return {}
	return mergeDefinitionMaps(
		{},
		variantDefinition?.["uesio.styles"] as DefinitionMap,
		props.context
	)
}

function getVariantTokens(
	props: UtilityProps,
	componentType: MetadataKey | undefined
) {
	const variantDefinition = getVariantDefinition(props, componentType)
	if (!variantDefinition) return {}
	return variantDefinition?.["uesio.styleTokens"] as Record<string, string[]>
}

function useUtilityStyles<K extends string>(
	defaults: Record<K, CSSInterpolation>,
	props: UtilityProps,
	defaultVariantComponentType?: MetadataKey
) {
	const styles = mergeDefinitionMaps(
		getVariantStyles(props, defaultVariantComponentType),
		props.styles as DefinitionMap,
		props.context
	)

	const tokens = {
		...getVariantTokens(props, defaultVariantComponentType),
		...props.styleTokens,
	}

	return Object.keys(defaults).reduce(
		(classNames: Record<string, string>, className: K) => {
			const classTokens = tokens[className] || []
			classNames[className] = twMerge(
				cx(
					...classTokens,
					css([
						defaults[className],
						styles?.[className] as CSSInterpolation,
					]),
					props.classes?.[className],
					// A bit weird here... Only apply the passed-in className prop to root styles.
					// Otherwise, it would be applied to every class sent in as defaults.
					className === "root" && props.className
				)
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

export type { ResponsiveDefinition, ThemeState }

export {
	defaultTheme,
	getResponsiveStyles,
	cx,
	css,
	useUtilityStyles,
	useStyles,
	colors,
}
