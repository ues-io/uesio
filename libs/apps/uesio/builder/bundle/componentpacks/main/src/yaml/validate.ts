import { context, platform } from "@uesio/ui"
import Ajv, { ValidateFunction } from "ajv"
const ajv = new Ajv({ code: { esm: true } })

// let ajv

// interface AjvWindow extends Window {
// 	Ajv: object
// }

let viewDefinitionValidator: ValidateFunction
;(async () => {
	// ajv = (window as unknown as AjvWindow).Ajv
	let viewDefinitionSchema: object
	try {
		viewDefinitionSchema =
			await platform.platform.getStaticAssetAsJSON<object>(
				new context.Context(),
				"/ui/types/metadata/view/viewDefinition.schema.json"
			)
		viewDefinitionValidator = ajv.compile(viewDefinitionSchema)
	} catch (err) {
		console.error(err)
	}
})()

// const validateYamlDoc = (yamlDoc: object, validator: Ajv.ValidateFunction) => {
// 	const validate = ajv.getSchema(schemaId)
// 	if (!validate) {
// 		throw new Error("Schema not found: " + schemaId)
// 	}
// 	return validate(yamlDoc)
// }

const validateViewDefinition = (viewDefinition: object) =>
	viewDefinitionValidator(viewDefinition)

export { validateViewDefinition }
