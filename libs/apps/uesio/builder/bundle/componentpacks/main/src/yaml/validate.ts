import { context, platform } from "@uesio/ui"
import Ajv, { ValidateFunction } from "ajv"
const ajv = new Ajv({ code: { esm: true } } as Ajv.Options)

let viewDefinitionValidator: ValidateFunction

const loadViewDefinitionSchema = async () => {
  let viewDefinitionSchema: object
  try {
    viewDefinitionSchema = await platform.platform.getStaticAssetAsJSON<object>(
      new context.Context(),
      "/ui/types/metadata/view/viewDefinition.schema.json",
    )
    viewDefinitionValidator = ajv.compile(viewDefinitionSchema)
  } catch (err) {
    console.error(err)
  }
}

;(async () => {
  // Wait until we have a static assets host defined, then we can load the view definition schema
  const interval = setInterval(() => {
    if (platform.platform.getStaticAssetsPath() !== undefined) {
      clearInterval(interval)
      loadViewDefinitionSchema()
    }
  }, 100)
})()

export type ValidationResult = {
  errors?: Ajv.ErrorObject[] | null
  valid: boolean
}

const validateViewDefinition = (viewDefinition: object): ValidationResult => {
  // If the view definition validator hasn't loaded yet, just let it go through.
  // We should'nt be bombing the page here.
  if (!viewDefinitionValidator) {
    return {
      valid: true,
    }
  }
  const result = viewDefinitionValidator(viewDefinition) as boolean
  return {
    errors: viewDefinitionValidator.errors,
    valid: result,
  }
}

export { validateViewDefinition }
