import {
	PropertyTypeHandler,
	getBaseWireFieldDef,
	getObjectProperty,
} from "../handlerutils"
import {
	FieldValueProperty,
	FieldValuesProperty,
} from "../../properties/componentproperty"
import { getGrouping } from "../../components/property/property"
import { getFieldMetadata } from "../../api/wireapi"

const fieldValueHandler: PropertyTypeHandler = {
	getField: (
		property: FieldValueProperty | FieldValuesProperty,
		context,
		currentValue,
		path
	) => {
		const wireId = property.wireProperty
			? (getObjectProperty(currentValue, property.wireProperty) as string)
			: getGrouping(path, context, property.wirePath)

		const wireField =
			property.fieldProperty &&
			(getObjectProperty(currentValue, property.fieldProperty) as string)

		const fieldMetadata = getFieldMetadata(
			context,
			wireId || "",
			wireField || ""
		)
		const fieldMetadataType = fieldMetadata?.getType() || "TEXT"
		return getBaseWireFieldDef(
			property,
			property.type === "FIELD_VALUES" ? "LIST" : fieldMetadataType,
			{
				selectlist: fieldMetadata?.getSelectMetadata(context),
				subtype:
					property.type === "FIELD_VALUES"
						? fieldMetadataType
						: undefined,
			}
		)
	},
}

export { fieldValueHandler }
