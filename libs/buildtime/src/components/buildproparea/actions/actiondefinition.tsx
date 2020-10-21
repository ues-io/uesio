import { definition, builder } from "@uesio/ui"

interface ActionProps extends definition.BaseProps {
	action?: builder.ActionDescriptor
	definition: definition.DefinitionMap
}

export { ActionProps }
