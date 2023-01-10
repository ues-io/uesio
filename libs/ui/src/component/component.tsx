import { forwardRef } from "react"
import { DefinitionMap, UtilityProps, UC } from "../definition/definition"
import { Context, ContextFrame } from "../context/context"
import { getRuntimeLoader, getUtilityLoader } from "./registry"
import NotFound from "../components/notfound"
import { parseKey } from "./path"
import { ComponentVariant } from "../definition/componentvariant"
import ErrorBoundary from "../components/errorboundary"
import { mergeDefinitionMaps } from "./merge"
import { MetadataKey } from "../bands/builder/types"
import { useShould } from "./display"

function additionalContext(context: Context, additional: ContextFrame) {
	if (additional) {
		const frame: ContextFrame = {}
		const workspace = additional.workspace
		const siteadmin = additional.siteadmin
		const fieldMode = additional.fieldMode

		if (workspace) {
			frame.workspace = {
				name: context.mergeString(workspace.name),
				app: context.mergeString(workspace.app),
			}
		}
		if (fieldMode) {
			frame.fieldMode = fieldMode
		}

		if (siteadmin) {
			frame.siteadmin = {
				name: context.mergeString(siteadmin.name),
				app: context.mergeString(siteadmin.app),
			}
		}
		const wire = additional.wire
		if (wire) {
			frame.wire = wire
		}
		return context.addFrame(frame)
	}
	return context
}

function getThemeOverride(
	variant: ComponentVariant,
	context: Context
): DefinitionMap {
	const componentType = variant.component
	const theme = context.getTheme()
	const overrides = theme?.definition?.variantOverrides
	const override = overrides?.[componentType]?.[
		variant.namespace + "." + variant.name
	] as DefinitionMap
	return override
}

function getDefinitionFromVariant(
	variant: ComponentVariant | undefined,
	context: Context
): DefinitionMap {
	if (!variant) return {}
	const def = variant.extends
		? mergeDefinitionMaps(
				getDefinitionFromVariant(
					context.getComponentVariant(
						variant.component,
						variant.extends as MetadataKey
					),
					context
				),
				variant.definition,
				undefined
		  )
		: variant.definition

	const override = getThemeOverride(variant, context)
	return mergeDefinitionMaps(
		def,
		override ? { "uesio.styles": override } : {},
		undefined
	)
}

function mergeContextVariants(
	definition: DefinitionMap | undefined,
	componentType: MetadataKey,
	context: Context
): DefinitionMap | undefined {
	if (!definition) return definition
	const variantName = definition["uesio.variant"] as MetadataKey
	const [namespace] = parseKey(componentType)

	if (!definition) return definition
	const variant = context.getComponentVariant(
		componentType,
		variantName || (`${namespace}.default` as MetadataKey)
	)
	const variantDefinition = getDefinitionFromVariant(variant, context)
	return mergeDefinitionMaps(variantDefinition, definition, undefined)
}

const Component: UC<Record<string, unknown>> = (props) => {
	const { componentType, path } = props
	return (
		<ErrorBoundary {...props}>
			<ComponentInternal
				{...props}
				path={`${path}["${componentType}"]`}
			/>
		</ErrorBoundary>
	)
}

const ComponentInternal: UC<Record<string, unknown>> = (props) => {
	const { componentType, context, definition } = props
	if (definition && !useShould(definition["uesio.display"], context))
		return null
	if (!componentType) return <NotFound {...props} />
	const Loader = getRuntimeLoader(componentType) || NotFound

	const mergedDefinition = mergeContextVariants(
		definition,
		componentType,
		context
	)

	return (
		<Loader
			{...props}
			definition={mergedDefinition || {}}
			context={additionalContext(
				context,
				mergedDefinition?.["uesio.context"] as ContextFrame
			)}
		/>
	)
}

const parseVariantName = (
	fullName: MetadataKey | undefined,
	key: MetadataKey
): [MetadataKey, MetadataKey] => {
	const parts = fullName?.split(":")
	if (parts?.length === 2) {
		return [parts[0] as MetadataKey, parts[1] as MetadataKey]
	}
	if (parts?.length === 1) {
		return [key, parts[0] as MetadataKey]
	}
	const [keyNamespace] = parseKey(key)
	return [key, `${keyNamespace}.default` as MetadataKey]
}

function getVariantStylesDef(
	componentType: MetadataKey,
	variantName: MetadataKey,
	context: Context
) {
	const variant = context.getComponentVariant(componentType, variantName)
	if (!variant) return {}
	const variantDefinition = getDefinitionFromVariant(variant, context)
	return variantDefinition?.["uesio.styles"] as DefinitionMap
}

const getVariantStyleInfo = (props: UtilityProps, key: MetadataKey) => {
	const { variant, context, styles } = props
	const [componentType, variantName] = parseVariantName(variant, key)
	if (!variantName) {
		return styles as DefinitionMap
	}

	const variantStyles = getVariantStylesDef(
		componentType,
		variantName,
		context
	)

	if (!styles) {
		return variantStyles
	}

	return mergeDefinitionMaps(
		variantStyles,
		styles as DefinitionMap,
		undefined
	)
}

interface UtilityPropsPlus extends UtilityProps {
	[x: string]: unknown
}

const getUtility = <T extends UtilityProps = UtilityPropsPlus>(
	key: MetadataKey
) => {
	const returnFunc = forwardRef((props: T, ref) => {
		const Loader = getUtilityLoader(key)
		if (!Loader) throw "Could not load component: " + key
		const styles = getVariantStyleInfo(props, key)
		return (
			<Loader ref={ref} {...props} styles={styles} componentType={key} />
		)
	})
	returnFunc.displayName = key
	return returnFunc
}

export {
	ComponentInternal,
	Component,
	getDefinitionFromVariant,
	additionalContext,
	getUtility,
	parseVariantName,
}
