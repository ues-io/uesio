import { FC } from "react"
import { UC, UtilityProps } from "../definition/definition"
import { ComponentSignalDescriptor } from "../definition/signal"
import { MetadataKey } from "../metadata/types"

type Registry<T> = Record<string, T>
const registry: Registry<UC> = {}
const utilityRegistry: Registry<FC<UtilityProps>> = {}
const componentSignalsRegistry: Registry<Registry<ComponentSignalDescriptor>> =
  {}

const addToRegistry = <T>(registry: Registry<T>, key: string, item: T) => {
  registry[key] = item
}

const registerSignals = (
  key: MetadataKey,
  signals: Registry<ComponentSignalDescriptor>,
) => {
  addToRegistry(componentSignalsRegistry, key, signals)
}

const register = (key: MetadataKey, componentType: UC) => {
  addToRegistry<UC>(registry, key, componentType)
  componentType.signals && registerSignals(key, componentType.signals)
}

const registerUtilityComponent = (
  key: MetadataKey,
  componentType: FC<UtilityProps>,
) => {
  addToRegistry(utilityRegistry, key, componentType)
}

const getRuntimeLoader = (key: MetadataKey) => registry[key]

const getUtilityLoader = (key: MetadataKey) => utilityRegistry[key]

const getSignal = (key: string, signal: string) =>
  componentSignalsRegistry[key]?.[signal]

export {
  register,
  registerUtilityComponent,
  getRuntimeLoader,
  getUtilityLoader,
  getSignal,
}
