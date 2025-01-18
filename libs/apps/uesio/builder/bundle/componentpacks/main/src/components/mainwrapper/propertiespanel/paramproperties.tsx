import { definition } from "@uesio/ui"
import PropertiesForm from "../../../helpers/propertiesform"
import { useSelectedPath } from "../../../api/stateapi"
import { ComponentProperty } from "../../../properties/componentproperty"

const paramProperties: ComponentProperty[] = [
  {
    name: "name",
    label: "Name",
    required: true,
    type: "KEY",
  },
  {
    name: "label",
    label: "Label",
    type: "TEXT",
  },
  {
    name: "required",
    label: "Required",
    required: true,
    type: "CHECKBOX",
  },
  {
    name: "type",
    label: "Parameter Type",
    required: true,
    type: "SELECT",
    options: [
      { value: "RECORD", label: "Record ID" },
      { value: "TEXT", label: "Text" },
      { value: "CHECKBOX", label: "Checkbox" },
      { value: "NUMBER", label: "Number" },
      { value: "SELECT", label: "Select List" },
    ],
  },
  {
    name: "collection",
    label: "Collection",
    type: "METADATA",
    metadata: {
      type: "COLLECTION",
    },
    displayConditions: [{ field: "type", value: "RECORD" }],
  },
  {
    name: "selectList",
    label: "Select List",
    type: "METADATA",
    metadata: {
      type: "SELECTLIST",
    },
    displayConditions: [{ field: "type", value: "SELECT" }],
  },
]

const ParamProperties: definition.UtilityComponent = (props) => {
  const { context } = props
  const path = useSelectedPath(context)

  return (
    <PropertiesForm
      title={"Param Properties"}
      id={path.combine()}
      context={context}
      properties={paramProperties}
      path={path}
    />
  )
}

ParamProperties.displayName = "ParamProperties"

export default ParamProperties
