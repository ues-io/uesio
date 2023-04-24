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
import { twMerge } from "tailwind-merge"
import { Context } from "../context/context"
import { tw } from "@twind/core"

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

function useStyleTokens(
	defaults: Record<string, ClassNamesArg[]>,
	props: BaseProps
) {
	const { definition, context } = props
	const tokens = definition?.["uesio.styleTokens"] || {}
	return Object.keys(defaults).reduce(
		(classNames: Record<string, string>, className: string) => {
			classNames[className] = process(
				context,
				defaults[className],
				tokens[className]
			)
			return classNames
		},
		{}
	)
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
			classNames[className] = process(
				props?.context,
				tokens[className],
				css([defaults[className], existing?.[className]])
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

function process(context: Context | undefined, ...classes: ClassNamesArg[]) {
	const output = cx(classes)
	return tw(twMerge(context ? context?.mergeString(output) : output))
}

function useUtilityStyleTokens(
	defaults: Record<string, ClassNamesArg[]>,
	props: UtilityProps,
	defaultVariantComponentType?: MetadataKey
) {
	const tokens = {
		...getVariantTokens(props, defaultVariantComponentType),
		...props.styleTokens,
	}

	return Object.keys(defaults).reduce(
		(classNames: Record<string, string>, className: string) => {
			const classTokens = tokens[className] || []
			classNames[className] = process(
				props.context,
				defaults[className],
				...classTokens,
				props.classes?.[className],
				// A bit weird here... Only apply the passed-in className prop to root styles.
				// Otherwise, it would be applied to every class sent in as defaults.
				className === "root" && props.className
			)
			return classNames
		},
		{} as Record<string, string>
	)
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
			classNames[className] = process(
				props.context,
				classTokens,
				css([
					defaults[className],
					styles?.[className] as CSSInterpolation,
				]),
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
