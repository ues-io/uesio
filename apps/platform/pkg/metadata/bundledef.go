package metadata

// BundleDefDep type
type BundleDefDep struct {
	Version      string                 `yaml:"version,omitempty"`
	Dependencies BundleDefDependencyMap `yaml:"dependencies,omitempty"`
}

// BundleDef type
type BundleDef struct {
	Name           string                 `yaml:"name"`
	LoginRoute     string                 `yaml:"loginRoute"`
	DefaultProfile string                 `yaml:"defaultProfile"`
	PublicProfile  string                 `yaml:"publicProfile"`
	Dependencies   BundleDefDependencyMap `yaml:"dependencies,omitempty"`
}

// BundleDefDependencyMap type
type BundleDefDependencyMap map[string]BundleDefDep
