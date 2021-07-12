import { FunctionComponent } from "react"
import BuildPropItem from "../buildpropitem/buildpropitem"
import { definition, builder } from "@uesio/ui"

interface Props extends definition.BaseProps {
	properties: builder.PropDescriptor[]
	propsDef: builder.BuildPropertiesDefinition
}

const PropList: FunctionComponent<Props> = ({
	path,
	definition: def,
	propsDef,
	context,
	properties,
}) => (
	<>
		{properties.map((descriptor, index) => (
			<BuildPropItem
				key={path + descriptor.name}
				path={path}
				definition={def}
				propsDef={propsDef}
				descriptor={descriptor}
				index={index}
				context={context}
			/>
		))}
	</>
)

export default PropList
