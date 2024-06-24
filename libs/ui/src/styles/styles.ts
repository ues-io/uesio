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
import { tw, cx, Class, hash } from "@twind/core"
import { STYLE_TOKENS } from "../componentexports"
import interpolate from "./interpolate"

const twMerge = extendTailwindMerge({
	extend: {
		classGroups: {
			"font-size": ["xxs"],
		},
	},
})

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
	return tw(twMerge(context ? context?.mergeString(output) : output))
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

export type { StyleProps, ThemeState }

export {
	defaultTheme,
	cx,
	mergeClasses,
	process,
	useUtilityStyleTokens,
	useStyleTokens,
	colors,
	hash,
}
