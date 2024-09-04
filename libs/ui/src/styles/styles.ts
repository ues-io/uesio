import { PaletteValue, ThemeState } from "../definition/theme"
import { UtilityProps } from "../definition/definition"

import * as colors from "./colors"
import {
	getDefinitionFromVariant,
	parseVariantName,
} from "../component/component"
import { MetadataKey } from "../metadataexports"
import { extendTailwindMerge } from "tailwind-merge"
import { Context } from "../context/context"
import {
	Class,
	getSheet,
	hash,
	Preset,
	ThemeFunction,
	Twind,
	twind,
} from "@twind/core"
import { STYLE_TOKENS } from "../componentexports"
import interpolate from "./interpolate"
import presetAutoprefix from "@twind/preset-autoprefix"
import presetTailwind from "@twind/preset-tailwind"
import { isStandardColorName } from "./colors"

const twMerge = extendTailwindMerge({
	extend: {
		classGroups: {
			"font-size": ["xxs"],
		},
	},
})

const processThemeColor = (
	themeFunc: ThemeFunction,
	key: string,
	value: PaletteValue
) => {
	// If we're one of the color values
	if (isStandardColorName(value)) {
		return [
			key,
			{
				...(themeFunc("colors." + value) as unknown as object),
				DEFAULT: themeFunc("colors." + value + ".600"),
			},
		]
	}
	return [key, value]
}

const processThemeColors = (
	themeFunc: ThemeFunction,
	themeData: ThemeState
) => {
	const palette = themeData.definition?.palette
	return palette
		? Object.fromEntries(
				Object.entries(palette).map(([key, value]) =>
					processThemeColor(themeFunc, key, value)
				)
			)
		: {}
}

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

let activeStyles: Twind
let activeThemeData: ThemeState

const setupStyles = (context: Context) => {
	const themeData = context.getTheme()
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
						colors: ({ theme }) =>
							processThemeColors(theme, themeData),
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

function getThemeValue(context: Context, key: string) {
	return activeStyles.theme(key)
}

const mergeClasses = twMerge

function cx(...input: Class[]): string {
	return interpolate(input)
}

export type { StyleProps, ThemeState }

export {
	cx,
	mergeClasses,
	process,
	setupStyles,
	useUtilityStyleTokens,
	useStyleTokens,
	getThemeValue,
	colors,
	hash,
}
