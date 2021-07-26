import { definition, builder } from "@uesio/ui"
import { ValueAPI } from "../../propertiespaneldefinition"

interface ActionProps extends definition.BaseProps {
	action?: builder.ActionDescriptor
	valueAPI: ValueAPI
}

export { ActionProps }
