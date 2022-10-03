import { forwardRef, FunctionComponent } from "react"
import {
	DefinitionMap,
	BaseProps,
	UtilityPropsPlus,
	UtilityProps,
} from "../definition/definition"
import { Context, ContextFrame } from "../context/context"
import {
	getBuildtimeLoader,
	getRuntimeLoader,
	getUtilityLoader,
} from "./registry"
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
				name: context.merge(workspace.name),
				app: context.merge(workspace.app),
			}
		}
		if (fieldMode) {
			frame.fieldMode = fieldMode
		}

		if (siteadmin) {
			frame.siteadmin = {
				name: context.merge(siteadmin.name),
				app: context.merge(siteadmin.app),
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

const Component: FunctionComponent<BaseProps> = (props) => {
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
						variant.extends
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
	componentType: string,
	context: Context
): DefinitionMap | undefined {
	if (!definition) return definition
	const variantName = definition["uesio.variant"] as string
	const [namespace] = parseKey(componentType)

	if (!definition) return definition
	const variant = context.getComponentVariant(
		componentType,
		variantName || `${namespace}.default`
	)
	const variantDefinition = getDefinitionFromVariant(variant, context)
	return mergeDefinitionMaps(variantDefinition, definition, undefined)
}

const ComponentInternal: FunctionComponent<BaseProps> = (props) => {
	const { componentType, context, definition } = props
	if (definition && !useShould(definition["uesio.display"], context))
		return null
	if (!componentType) return <NotFound {...props} />
	const isBuildMode = !!context.getBuildMode()
	const RuntimeLoader = getRuntimeLoader(componentType) || NotFound
	const BuildTimeLoader = isBuildMode
		? getBuildtimeLoader(componentType)
		: undefined
	const Loader =
		isBuildMode && BuildTimeLoader ? BuildTimeLoader : RuntimeLoader

	const mergedDefinition = mergeContextVariants(
		definition,
		componentType,
		context
	)

	if (isBuildMode && !BuildTimeLoader) {
		return (
			<BuildWrapper {...props}>
				<RuntimeLoader
					{...props}
					definition={mergedDefinition}
					context={additionalContext(
						context,
						mergedDefinition?.["uesio.context"] as ContextFrame
					)}
				/>
			</BuildWrapper>
		)
	}

	return (
		<Loader
			{...props}
			definition={mergedDefinition}
			context={additionalContext(
				context,
				mergedDefinition?.["uesio.context"] as ContextFrame
			)}
		/>
	)
}

const getVariantInfo = (
	fullName: MetadataKey | undefined,
	key: string
): [string, string] => {
	const parts = fullName?.split(".")
	if (parts?.length === 4) {
		return [`${parts[0]}.${parts[1]}`, `${parts[2]}.${parts[3]}`]
	}
	if (parts?.length === 2) {
		return [key, `${parts[0]}.${parts[1]}`]
	}
	const [keyNamespace] = parseKey(key)
	return [key, `${keyNamespace}.default`]
}

function getVariantStylesDef(
	componentType: string,
	variantName: string,
	context: Context
) {
	const variant = context.getComponentVariant(componentType, variantName)
	if (!variant) return {}
	const variantDefinition = getDefinitionFromVariant(variant, context)
	return variantDefinition?.["uesio.styles"] as DefinitionMap
}

const getVariantStyleInfo = (props: UtilityProps, key: string) => {
	const { variant, context, styles } = props
	const [componentType, variantName] = getVariantInfo(variant, key)
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

const getUtility = <T extends UtilityPropsPlus>(key: MetadataKey) => {
	const returnFunc = forwardRef((props: T, ref) => {
		const Loader = getUtilityLoader(key) || NotFound
		const styles = getVariantStyleInfo(props, key)
		return (
			<Loader ref={ref} {...props} styles={styles} componentType={key} />
		)
	})
	returnFunc.displayName = key
	return returnFunc
}
const BuildWrapper = getUtility("uesio/studio.buildwrapper")

export {
	ComponentInternal,
	Component,
	getDefinitionFromVariant,
	additionalContext,
	getUtility,
}
