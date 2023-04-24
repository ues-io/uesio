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
import { useMemo } from "react"

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

function useStyleTokens(
	defaults: Record<string, ClassNamesArg[]>,
	props: BaseProps
) {
	const { definition, context } = props
	const tokens = definition?.["uesio.styleTokens"] || {}
	return Object.entries(defaults).reduce(
		(classNames: Record<string, string>, entry) => {
			const [className, defaultClasses] = entry
			classNames[className] = process(
				context,
				defaultClasses,
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
	return useMemo(() => {
		const existingStyleTokens = props?.definition?.[TOKENS_PROPERTY]
		let existing = props?.definition?.[STYLES_PROPERTY]
		if (existing) {
			existing = mergeDefinitionMaps(
				{},
				existing,
				props?.context
			) as Record<string, CSSInterpolation>
		}

		const tokens = existingStyleTokens || {}
		return Object.entries(defaults).reduce(
			(
				classNames: Record<string, string>,
				entry: [K, CSSInterpolation]
			) => {
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		props?.definition?.[STYLES_PROPERTY],
		props?.definition?.[TOKENS_PROPERTY],
	])
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

function useUtilityStyleTokens(
	defaults: Record<string, ClassNamesArg[]>,
	props: UtilityProps,
	defaultVariantComponentType?: MetadataKey
) {
	return useMemo(() => {
		const tokens = {
			...getVariantTokens(props, defaultVariantComponentType),
			...props.styleTokens,
		}
		return Object.entries(defaults).reduce(
			(classNames: Record<string, string>, entry) => {
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
			{} as Record<string, string>
		)
		// Don't need to include defaults here as it shouldn't ever change
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		defaultVariantComponentType,
		props.className,
		props.variant,
		props.styles,
		props.styleTokens,
	])
}

function useUtilityStyles<K extends string>(
	defaults: Record<K, CSSInterpolation>,
	props: UtilityProps,
	defaultVariantComponentType?: MetadataKey
) {
	return useMemo(() => {
		const variantStyles = getVariantStyles(
			props,
			defaultVariantComponentType
		)
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
			(
				classNames: Record<string, string>,
				entry: [K, CSSInterpolation]
			) => {
				const [className, defaultClasses] = entry
				const classTokens = tokens[className] || []
				classNames[className] = process(
					props.context,
					classTokens,
					css([
						defaultClasses,
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [defaultVariantComponentType, props.styles, props.styleTokens, defaults])
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
