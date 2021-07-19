import { FunctionComponent } from "react"
import BuildPropItem from "../buildpropitem/buildpropitem"
import { definition, builder } from "@uesio/ui"

interface Props extends definition.BaseProps {
	properties: builder.PropDescriptor[]
	propsDef: builder.BuildPropertiesDefinition
	setValue: (path: string, value: definition.DefinitionValue) => void
	getValue: (path: string) => definition.Definition
}

const PropList: FunctionComponent<Props> = ({
	path,
	propsDef,
	context,
	properties,
	setValue,
	getValue,
}) => (
	<>
		{properties.map((descriptor, index) => {
			const newPath = path + '["' + descriptor.name + '"]'
			return (
				<BuildPropItem
					key={newPath}
					path={path}
					propsDef={propsDef}
					descriptor={descriptor}
					index={index}
					context={context}
					getValue={() => getValue(newPath)}
					setValue={(value: string) => setValue(newPath, value)}
				/>
			)
		})}
	</>
)

export default PropList
