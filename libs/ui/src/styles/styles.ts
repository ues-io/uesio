import { ThemeState } from "../definition/theme"
import { UtilityProps } from "../definition/definition"

import * as colors from "./colors"
import {
	getDefinitionFromVariant,
	parseVariantName,
} from "../component/component"
import { MetadataKey } from "../metadataexports"
import { extendTailwindMerge } from "tailwind-merge"
import { Context } from "../context/context"
import { Class, getSheet, hash, Preset, Twind, twind } from "@twind/core"
import { STYLE_TOKENS } from "../componentexports"
import interpolate from "./interpolate"
import presetAutoprefix from "@twind/preset-autoprefix"
import presetTailwind from "@twind/preset-tailwind"

const twMerge = extendTailwindMerge({
	extend: {
		classGroups: {
			"font-size": ["xxs"],
		},
	},
})

// This converts all our @media queries to @container queries
const presetContainerQueries = () =>
	({
		finalize: (rule) => {
			if (rule.r && rule.r.length > 0 && rule.r[0].startsWith("@media")) {
				rule.r[0] = rule.r[0].replace("@media", "@container")
			}
			return rule
		},
	}) as Preset

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
		spacing: 8,
	},
}

let activeStyles: Twind
let activeThemeData: ThemeState

const setupStyles = (themeData: ThemeState) => {
	if (
		!activeStyles ||
		JSON.stringify(activeThemeData) !== JSON.stringify(themeData)
	) {
		activeStyles?.destroy()
		activeThemeData = themeData
		activeStyles = twind(
			{
				presets: [
					presetAutoprefix(),
					presetTailwind(),
					presetContainerQueries(),
				],
				hash: false,
				theme: {
					extend: {
						colors: {
							primary: themeData.definition.palette.primary,
						},
						fontFamily: {
							sans: ["Roboto", "sans-serif"],
						},
						fontSize: {
							xxs: ["8pt", "16px"],
						},
					},
				},
			},
			getSheet()
		)
	}

	// We need to process the style classes we put on the root element in index.gohtml
	process(undefined, "h-screen overflow-auto hidden contents")
}

export interface StyleDefinition {
	"uesio.styleTokens"?: Record<string, string[]>
}

interface StyleProps {
	context: Context
	definition: StyleDefinition
}

function useStyleTokens<K extends string>(
	defaults: Record<K, Class[]>,
	props: StyleProps
) {
	const { definition, context } = props
	const inlineTokens = definition?.[STYLE_TOKENS] || {}
	return Object.entries(defaults).reduce(
		(classNames, entry: [K, Class[]]) => {
			const [className, defaultClasses] = entry
			classNames[className] = process(
				context,
				defaultClasses,
				inlineTokens[className]
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

function getVariantTokens(
	props: UtilityProps,
	componentType: MetadataKey | undefined
) {
	const variantDefinition = getVariantDefinition(props, componentType)
	if (!variantDefinition) return {}
	return variantDefinition?.[STYLE_TOKENS] as Record<string, string[]>
}

function process(context: Context | undefined, ...classes: Class[]) {
	const output = interpolate(classes, [])
	return activeStyles(
		twMerge(context ? context?.mergeString(output) : output)
	)
}

function useUtilityStyleTokens<K extends string>(
	defaults: Record<K, Class[]>,
	props: UtilityProps,
	defaultVariantComponentType?: MetadataKey
) {
	const variantTokens = getVariantTokens(props, defaultVariantComponentType)
	const inlineTokens = props.styleTokens

	return Object.entries(defaults).reduce(
		(classNames, entry: [K, Class[]]) => {
			const [className, defaultClasses] = entry
			classNames[className] = process(
				props.context,
				defaultClasses,
				variantTokens?.[className],
				props.classes?.[className],
				// A bit weird here... Only apply the passed-in className prop to root styles.
				// Otherwise, it would be applied to every class sent in as defaults.
				className === "root" && props.className,
				inlineTokens?.[className]
			)
			return classNames
		},
		{} as Record<K, string>
	)
}

const mergeClasses = twMerge

function cx(strings: TemplateStringsArray, ...interpolations: Class[]): string

function cx(...input: Class[]): string

function cx(
	strings: TemplateStringsArray | Class,
	...interpolations: Class[]
): string {
	return interpolate(strings, interpolations)
}

export type { StyleProps, ThemeState }

export {
	defaultTheme,
	cx,
	mergeClasses,
	process,
	setupStyles,
	useUtilityStyleTokens,
	useStyleTokens,
	colors,
	hash,
}
