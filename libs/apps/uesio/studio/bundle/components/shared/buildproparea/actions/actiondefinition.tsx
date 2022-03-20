import { definition, builder } from "@uesio/ui"

interface ActionProps extends definition.BaseProps {
	action?: builder.ActionDescriptor
	valueAPI: builder.ValueAPI
	propsDef: builder.BuildPropertiesDefinition
}

export { ActionProps }
