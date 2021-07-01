import { definition, builder } from "@uesio/ui"

interface PropRendererProps extends definition.BaseProps {
	descriptor: builder.PropDescriptor
	propsDef: builder.BuildPropertiesDefinition
	setValue: (value: definition.DefinitionValue) => void
	getValue: () => definition.Definition
}

export { PropRendererProps }
