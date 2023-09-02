package meta

type BundleDefDep struct {
	Version string `yaml:"version,omitempty" json:"version"`
}

type AppSettings struct {
	LoginRoute    string `yaml:"loginRoute,omitempty" json:"uesio/studio.loginroute"`
	HomeRoute     string `yaml:"homeRoute,omitempty" json:"uesio/studio.homeroute"`
	DefaultTheme  string `yaml:"defaultTheme,omitempty" json:"uesio/studio.defaulttheme"`
	PublicProfile string `yaml:"publicProfile,omitempty" json:"uesio/studio.publicprofile"`
	Favicon       string `yaml:"favicon,omitempty" json:"uesio/studio.favicon"`
}

type BundleDef struct {
	Name         string `yaml:"name"`
	AppSettings  `yaml:",inline"`
	Dependencies BundleDefDependencyMap `yaml:"dependencies,omitempty"`
	Licenses     map[string]*License    `yaml:"-"`
}

type BundleDefDependencyMap map[string]BundleDefDep
