import { BundleDependencyDefMap, SiteState } from "../bands/site"
import { getSiteBundleAssetVersion, setStaticAssetsPath } from "./platform"

const PackUpdatedAt = `${123456789}`
const UesioAppVersion = "/abcd1234"

const getSiteBundleAssetVersionTests = [
  {
    name: "[custom app] use Site dependencies to get the requested pack URL",
    namespace: "ben/mosaic",
    site: {
      app: "zach/foo",
      version: "v0.0.2",
      dependencies: {
        "uesio/io": {
          version: "v0.0.1",
        },
        "ben/mosaic": {
          version: "v1.2.1",
        },
      } as BundleDependencyDefMap,
    },
    staticAssetsPath: UesioAppVersion,
    expected: "/v1.2.1",
  },
  {
    name: "[custom app] use pack's modstamp if no Site dependencies are found",
    namespace: "ben/mosaic",
    site: {
      app: "zach/foo",
      version: "v0.0.2",
      dependencies: {} as BundleDependencyDefMap,
    },
    staticAssetsPath: UesioAppVersion,
    expected: `/${PackUpdatedAt}`,
  },
  {
    name: "[custom app] use site version if the pack is in the app",
    namespace: "zach/foo",
    site: {
      app: "zach/foo",
      version: "v0.2.4",
      dependencies: {} as BundleDependencyDefMap,
    },
    staticAssetsPath: UesioAppVersion,
    expected: "/v0.2.4",
  },
  {
    name: "[custom app] substitute Uesio static assets path, if provided, for system bundle pack loads only",
    namespace: "uesio/io",
    site: {
      app: "zach/foo",
      version: "v0.2.4",
      dependencies: {} as BundleDependencyDefMap,
    },
    staticAssetsPath: UesioAppVersion,
    expected: UesioAppVersion,
  },
  {
    name: "[custom app] use the correct dependency for non-system-bundle Uesio pack loads",
    namespace: "uesio/extras",
    site: {
      app: "uesio/www",
      version: "v0.0.8",
      dependencies: {
        "uesio/io": {
          version: "v0.0.1",
        },
        "uesio/extras": {
          version: "v1.2.1",
        },
      } as BundleDependencyDefMap,
    },
    staticAssetsPath: UesioAppVersion,
    expected: "/v1.2.1",
  },
  {
    name: "[system app] use the Uesio App git sha if the request is for a system namespace bundle",
    namespace: "uesio/io",
    site: {
      app: "uesio/studio",
      version: "v0.0.1",
      dependencies: {
        "uesio/io": {
          version: "v0.0.1",
        },
        "uesio/core": {
          version: "v0.0.1",
        },
      } as BundleDependencyDefMap,
    },
    staticAssetsPath: UesioAppVersion,
    expected: UesioAppVersion,
  },
  {
    name: "[system app] prefer the pack modstamp if the request is for a system namespace bundle but we have no UESIO_BUILD_VERSION (local dev)",
    namespace: "uesio/io",
    site: {
      app: "uesio/studio",
      version: "v0.0.1",
      dependencies: {
        "uesio/io": {
          version: "v0.0.1",
        },
        "uesio/core": {
          version: "v0.0.1",
        },
      } as BundleDependencyDefMap,
    },
    staticAssetsPath: "",
    expected: `/${PackUpdatedAt}`,
  },
]

describe("platform: getSiteBundleAssetVersion", () => {
  getSiteBundleAssetVersionTests.forEach((def) => {
    test(def.name, () => {
      setStaticAssetsPath(def.staticAssetsPath)
      const siteObj = Object.assign(
        {
          domain: "ues.io",
          subdomain: "foo",
          name: "prod",
        },
        def.site,
      )
      const actual = getSiteBundleAssetVersion(
        siteObj as SiteState,
        def.namespace,
        PackUpdatedAt,
      )
      setStaticAssetsPath(undefined)

      expect(actual).toEqual(def.expected)
    })
  })
})
