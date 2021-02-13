package meta

import "errors"

// Secret struct
type Secret struct {
	ID        string `yaml:"-" uesio:"studio.id"`
	Name      string `yaml:"name" uesio:"studio.name"`
	Namespace string `yaml:"-" uesio:"-"`
	Store     string `yaml:"store,omitempty" uesio:"studio.store"`
	ManagedBy string `yaml:"managedBy" uesio:"studio.managedby"`
	Workspace string `yaml:"-" uesio:"studio.workspaceid"`
}

// NewSecret function
func NewSecret(key string) (*Secret, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for ConfigValue: " + key)
	}
	return &Secret{
		Name:      name,
		Namespace: namespace,
	}, nil
}

// GetCollectionName function
func (s *Secret) GetCollectionName() string {
	return s.GetBundleGroup().GetName()
}

// GetCollection function
func (s *Secret) GetCollection() CollectionableGroup {
	var sc SecretCollection
	return &sc
}

// GetConditions function
func (s *Secret) GetConditions() map[string]string {
	return map[string]string{
		"studio.name": s.Name,
	}
}

// GetBundleGroup function
func (s *Secret) GetBundleGroup() BundleableGroup {
	var sc SecretCollection
	return &sc
}

// GetKey function
func (s *Secret) GetKey() string {
	return s.Namespace + "." + s.Name
}

// GetPath function
func (s *Secret) GetPath() string {
	return s.GetKey() + ".yaml"
}

// GetPermChecker function
func (s *Secret) GetPermChecker() *PermissionSet {
	return nil
}

// SetField function
func (s *Secret) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(s, fieldName, value)
}

// GetField function
func (s *Secret) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(s, fieldName)
}

// GetNamespace function
func (s *Secret) GetNamespace() string {
	return s.Namespace
}

// SetNamespace function
func (s *Secret) SetNamespace(namespace string) {
	s.Namespace = namespace
}

// SetWorkspace function
func (s *Secret) SetWorkspace(workspace string) {
	s.Workspace = workspace
}

// Loop function
func (s *Secret) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(s, iter)
}
