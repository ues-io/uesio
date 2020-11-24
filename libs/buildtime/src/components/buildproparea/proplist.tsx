import React, { FunctionComponent, Fragment } from "react"
import BuildPropItem from "../buildpropitem/buildpropitem"
import { definition, builder } from "@uesio/ui"

interface Props extends definition.BaseProps {
	properties: builder.PropDescriptor[]
	definition: definition.DefinitionMap
}

const PropList: FunctionComponent<Props> = (props) => {
	const { path, definition: def, context, properties } = props

	return (
		<Fragment>
			{properties.map(
				(descriptor: builder.PropDescriptor, index: number) => (
					<BuildPropItem
						key={index}
						path={path}
						definition={def}
						descriptor={descriptor}
						index={index}
						componentType=""
						context={context}
					/>
				)
			)}
		</Fragment>
	)
}

export default PropList
