import React, { ReactElement } from "react"
import { definition, builder, hooks } from "@uesio/ui"
import TextProp from "./textprop"
import SelectProp from "./selectprop"
import KeyProp from "./keyprop"
import WireProp from "./wireprop"
import WiresProp from "./wiresprop"
import MetadataProp from "./metadataprop"
import NumberProp from "./numberprop"
import BooleanProp from "./booleanprop"

interface Props extends definition.BaseProps {
	definition: definition.DefinitionMap
	descriptor: builder.PropDescriptor
}

function getPropHandler(type?: string) {
	switch (type) {
		case "METADATA":
			return MetadataProp
		case "SELECT":
			return SelectProp
		case "KEY":
			return KeyProp
		case "WIRE":
			return WireProp
		case "WIRES":
			return WiresProp
		case "NUMBER":
			return NumberProp
		case "BOOLEAN":
			return BooleanProp
		default:
			return TextProp
	}
}

function BuildPropItem(props: Props): ReactElement {
	const { definition, descriptor, path } = props

	const uesio = hooks.useUesio(props)

	const getValue = (): definition.Definition => {
		if (
			descriptor.type === "METADATA" &&
			descriptor.metadataType === "VIEW"
		) {
			if (definition) {
				const name = definition["name"] as string
				const namespace = definition["namespace"] as string

				return namespace + "." + name
			}
		} else {
			return definition ? definition[descriptor.name] : ""
		}
	}

	const setValue = (value: string): void => {
		uesio.view.setDefinition(path + '["' + descriptor.name + '"]', value)
	}

	const PropHandler = getPropHandler(descriptor.type)

	return <PropHandler getValue={getValue} setValue={setValue} {...props} />
}

export default BuildPropItem
