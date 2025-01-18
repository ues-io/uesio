// TODO: We need to load this from the server rather than hard-coding it here too!
const METADATA = {
  AUTHSOURCE: "authsources",
  BOT: "bots",
  COLLECTION: "collections",
  COMPONENT: "components",
  COMPONENTPACK: "componentpacks",
  COMPONENTVARIANT: "componentvariants",
  CONFIGVALUE: "configvalues",
  CREDENTIALS: "credentials",
  FEATUREFLAG: "featureflags",
  FIELD: "fields",
  FILE: "files",
  FILESOURCE: "filesources",
  INTEGRATION: "integrations",
  INTEGRATIONACTION: "integrationactions",
  INTEGRATIONTYPE: "integrationtypes",
  LABEL: "labels",
  PERMISSIONSET: "permissionsets",
  PROFILE: "profiles",
  RECORDCHALLENGETOKEN: "recordchallengetokens",
  ROUTE: "routes",
  SECRET: "secrets",
  SELECTLIST: "selectlists",
  SIGNUPMETHOD: "signupmethods",
  THEME: "themes",
  USERACCESSTOKEN: "useraccesstokens",
  VIEW: "views",
}
type MetadataType = keyof typeof METADATA

type Namespace = `${string}/${string}` | ""
// MetadataKey can either be fully qualified (with namespace) or local (just a string)
type MetadataKey = `${Namespace}.${string}` | string

type BundleableBase = {
  namespace: Namespace
  name: string
}

interface Bundleable {
  namespace: Namespace
  name: string
}

interface Keyable {
  namespace?: Namespace
  name: string
}

type MetadataListResponse = {
  metadataType: MetadataType
  namespace: Namespace
  grouping?: string
  metadata: Record<string, boolean>
}

export type {
  Keyable,
  Bundleable,
  BundleableBase,
  MetadataKey,
  MetadataType,
  MetadataListResponse,
  Namespace,
}

export { METADATA }
