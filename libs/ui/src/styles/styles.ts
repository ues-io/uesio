import { ThemeState } from "../definition/theme"
import {
	BaseProps,
	DefinitionMap,
	UtilityProps,
} from "../definition/definition"
import { css, cx, CSSInterpolation, ClassNamesArg } from "@emotion/css"
import { mergeDefinitionMaps } from "../component/merge"
import * as colors from "./colors"
import {
	getDefinitionFromVariant,
	parseVariantName,
} from "../component/component"
import { MetadataKey } from "../metadataexports"
import { extendTailwindMerge } from "tailwind-merge"
import { Context } from "../context/context"
import { tw } from "@twind/core"

const twMerge = extendTailwindMerge({
	classGroups: {
		"font-size": ["xxs"],
	},
})

const STYLES_PROPERTY = "uesio.styles"
const TOKENS_PROPERTY = "uesio.styleTokens"

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

function useStyleTokens<K extends string>(
	defaults: Record<K, ClassNamesArg[]>,
	props: BaseProps
) {
	const { definition, context } = props
	const tokens = definition?.["uesio.styleTokens"] || {}
	return Object.entries(defaults).reduce(
		(classNames, entry: [K, ClassNamesArg[]]) => {
			const [className, defaultClasses] = entry
			classNames[className] = process(
				context,
				defaultClasses,
				tokens[className]
			)
			return classNames
		},
		{} as Record<K, string>
	)
}

function useStyles<K extends string>(
	defaults: Record<K, CSSInterpolation>,
	props: BaseProps | null
) {
	const existingStyleTokens = props?.definition?.[TOKENS_PROPERTY]
	let existing = props?.definition?.[STYLES_PROPERTY]
	if (existing) {
		existing = mergeDefinitionMaps({}, existing, props?.context) as Record<
			string,
			CSSInterpolation
		>
	}

	const tokens = existingStyleTokens || {}
	return Object.entries(defaults).reduce(
		(classNames: Record<string, string>, entry: [K, CSSInterpolation]) => {
			const [className, defaultClasses] = entry
			const existingStylesForClass = existing?.[
				className
			] as CSSInterpolation[]
			classNames[className] = process(
				props?.context,
				tokens[className],
				existingStylesForClass
					? css(defaultClasses, existingStylesForClass)
					: css(defaultClasses)
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
		variantDefinition?.[STYLES_PROPERTY] as DefinitionMap,
		props.context
	)
}

function getVariantTokens(
	props: UtilityProps,
	componentType: MetadataKey | undefined
) {
	const variantDefinition = getVariantDefinition(props, componentType)
	if (!variantDefinition) return {}
	return variantDefinition?.[TOKENS_PROPERTY] as Record<string, string[]>
}

function process(context: Context | undefined, ...classes: ClassNamesArg[]) {
	const output = cx(classes)
	return tw(twMerge(context ? context?.mergeString(output) : output))
}

function useUtilityStyleTokens<K extends string>(
	defaults: Record<K, ClassNamesArg[]>,
	props: UtilityProps,
	defaultVariantComponentType?: MetadataKey
) {
	const tokens = {
		...getVariantTokens(props, defaultVariantComponentType),
		...props.styleTokens,
	}
	return Object.entries(defaults).reduce(
		(classNames, entry: [K, ClassNamesArg[]]) => {
			const [className, defaultClasses] = entry
			const classTokens = tokens[className] || []
			classNames[className] = process(
				props.context,
				defaultClasses,
				...classTokens,
				props.classes?.[className],
				// A bit weird here... Only apply the passed-in className prop to root styles.
				// Otherwise, it would be applied to every class sent in as defaults.
				className === "root" && props.className
			)
			return classNames
		},
		{} as Record<K, string>
	)
}

function useUtilityStyles<K extends string>(
	defaults: Record<K, CSSInterpolation>,
	props: UtilityProps,
	defaultVariantComponentType?: MetadataKey
) {
	const variantStyles = getVariantStyles(props, defaultVariantComponentType)
	const inlineStyles = props.styles as DefinitionMap
	let styles: DefinitionMap
	if (!inlineStyles || !Object.keys(inlineStyles).length) {
		styles = variantStyles
	} else {
		styles = mergeDefinitionMaps(
			getVariantStyles(props, defaultVariantComponentType),
			props.styles as DefinitionMap,
			props.context
		)
	}

	const tokens = {
		...getVariantTokens(props, defaultVariantComponentType),
		...props.styleTokens,
	}

	return Object.entries(defaults).reduce(
		(classNames: Record<string, string>, entry: [K, CSSInterpolation]) => {
			const [className, defaultClasses] = entry
			const classTokens = tokens[className] || []
			classNames[className] = process(
				props.context,
				classTokens,
				css([defaultClasses, styles?.[className] as CSSInterpolation]),
				props.classes?.[className],
				// A bit weird here... Only apply the passed-in className prop to root styles.
				// Otherwise, it would be applied to every class sent in as defaults.
				className === "root" && props.className
			)
			return classNames
		},
		{} as Record<K, string>
	)
}

export type { ThemeState }

export {
	defaultTheme,
	cx,
	process,
	useUtilityStyleTokens,
	useUtilityStyles,
	useStyleTokens,
	useStyles,
	colors,
}
