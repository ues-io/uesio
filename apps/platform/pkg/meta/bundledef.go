package meta

type BundleDefDep struct {
	Version      string                 `yaml:"version,omitempty"`
	Dependencies BundleDefDependencyMap `yaml:"dependencies,omitempty"`
}

type BundleDef struct {
	Name          string                 `yaml:"name"`
	LoginRoute    string                 `yaml:"loginRoute,omitempty"`
	HomeRoute     string                 `yaml:"homeRoute,omitempty"`
	DefaultTheme  string                 `yaml:"defaultTheme,omitempty"`
	PublicProfile string                 `yaml:"publicProfile,omitempty"`
	Dependencies  BundleDefDependencyMap `yaml:"dependencies,omitempty"`
	Licenses      map[string]*License    `yaml:"-"`
}

type BundleDefDependencyMap map[string]BundleDefDep
