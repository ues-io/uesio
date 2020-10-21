import React, { ReactElement, Fragment } from "react"
import BuildPropItem from "../buildpropitem/buildpropitem"
import { definition, builder } from "@uesio/ui"

interface Props extends definition.BaseProps {
	properties: builder.PropDescriptor[]
	definition: definition.DefinitionMap
}

function PropList(props: Props): ReactElement | null {
	const properties = props.properties

	return (
		<Fragment>
			{properties.map(
				(descriptor: builder.PropDescriptor, index: number) => {
					return (
						<BuildPropItem
							key={index}
							{...{
								path: props.path,
								definition: props.definition,
								descriptor: descriptor,
								index,
								componentType: "",
								context: props.context,
							}}
						></BuildPropItem>
					)
				}
			)}
		</Fragment>
	)
}

export default PropList
