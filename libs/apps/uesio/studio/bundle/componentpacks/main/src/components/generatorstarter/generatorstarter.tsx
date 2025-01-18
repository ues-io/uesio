import { definition, wire, api, param } from "@uesio/ui"
import { useRef } from "react"
import {
  GeneratorForm,
  getGenParamValues,
} from "../generatorbutton/generatorbutton"

type GeneratorStarterDefinition = {
  starterTemplate: string
  appWire: string
}

const GeneratorStarter: definition.UC<GeneratorStarterDefinition> = (props) => {
  const { context, definition } = props

  const starterTemplate = context.mergeString(definition.starterTemplate)

  const appWire = api.wire.useWire(definition.appWire, context)

  const [response, error] = api.bot.useCallBot(
    context,
    "uesio/studio",
    "getstarterparams",
    {
      template: starterTemplate,
    },
    !!starterTemplate,
  )

  const params = (response?.params?.params || []) as param.ParamDefinition[]

  const wireRef = useRef<wire.Wire | undefined>()

  if (error || !appWire) return null

  return (
    <GeneratorForm
      generator={"starter"}
      wireRef={wireRef}
      params={params}
      context={context}
      onUpdate={(field, value, record) => {
        const paramValues = getGenParamValues(params, context, record)
        appWire
          .getFirstRecord()
          ?.update("uesio/studio.starter_template_params", paramValues, context)
      }}
    />
  )
}

export default GeneratorStarter
