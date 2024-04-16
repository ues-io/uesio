import { checkboxHandler } from "./handlers/checkbox"
import { collectionFieldHandler } from "./handlers/collectionfield"
import { collectionFieldsHandler } from "./handlers/collectionfields"
import { componentIdHandler } from "./handlers/componentid"
import { conditionHandler } from "./handlers/condition"
import { dateHandler } from "./handlers/date"
import { fieldHandler, fieldsHandler } from "./handlers/field"
import { fieldMetadataHandler } from "./handlers/fieldmetadata"
import { fieldValueHandler } from "./handlers/fieldvalue"
import { PropertyTypeHandler } from "./handlerutils"
import { keyHandler } from "./handlers/key"
import { listHandler } from "./handlers/list"
import { mapHandler } from "./handlers/map"
import { metadataHandler } from "./handlers/metadata"
import { namespaceHandler } from "./handlers/namespace"
import { numberHandler } from "./handlers/number"
import { paramHandler } from "./handlers/param"
import { selectHandler } from "./handlers/select"
import { structHandler } from "./handlers/struct"
import { textHandler } from "./handlers/text"
import { textareaHandler } from "./handlers/textarea"
import { wireHandler, wiresHandler } from "./handlers/wire"

const propertyTypeHandlers: Record<string, PropertyTypeHandler> = {
	SELECT: selectHandler,
	PARAM: paramHandler,
	KEY: keyHandler,
	WIRE: wireHandler,
	WIRES: wiresHandler,
	NAMESPACE: namespaceHandler,
	FIELD: fieldHandler,
	FIELDS: fieldsHandler,
	FIELD_VALUE: fieldValueHandler,
	FIELD_VALUES: fieldValueHandler,
	FIELD_METADATA: fieldMetadataHandler,
	MAP: mapHandler,
	PARAMS: mapHandler,
	STRUCT: structHandler,
	LIST: listHandler,
	COMPONENT_ID: componentIdHandler,
	TEXT_AREA: textareaHandler,
	NUMBER: numberHandler,
	CHECKBOX: checkboxHandler,
	DATE: dateHandler,
	CONDITION: conditionHandler,
	COLLECTION_FIELD: collectionFieldHandler,
	COLLECTION_FIELDS: collectionFieldsHandler,
	METADATA: metadataHandler,
	MULTIMETADATA: metadataHandler,
	ICON: textHandler,
	TEXT: textHandler,
}

export default propertyTypeHandlers
