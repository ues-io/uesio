package metadata

type BundleYamlDep struct {
	Version      string                  `yaml:"version,omitempty"`
	Dependencies BundleYamlDependencyMap `yaml:"dependencies,omitempty"`
}
type BundleYaml struct {
	Name         string                  `yaml:"name"`
	Dependencies BundleYamlDependencyMap `yaml:"dependencies,omitempty"`
}

type BundleYamlDependencyMap map[string]BundleYamlDep
