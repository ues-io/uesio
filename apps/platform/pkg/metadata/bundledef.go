package metadata

// BundleDefDep type
type BundleDefDep struct {
	Version      string                 `yaml:"version,omitempty"`
	Dependencies BundleDefDependencyMap `yaml:"dependencies,omitempty"`
}

// BundleDef type
type BundleDef struct {
	Name         string                 `yaml:"name"`
	Dependencies BundleDefDependencyMap `yaml:"dependencies,omitempty"`
}

// BundleDefDependencyMap type
type BundleDefDependencyMap map[string]BundleDefDep
