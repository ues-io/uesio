package meta

// Secret struct
type Secret struct {
	ID        string `yaml:"-" uesio:"uesio.id"`
	Name      string `yaml:"name" uesio:"uesio.name"`
	Namespace string `yaml:"-" uesio:"-"`
	Type      string `yaml:"type,omitempty" uesio:"uesio.type"`
	ManagedBy string `yaml:"managedBy" uesio:"uesio.managedby"`
	Workspace string `yaml:"-" uesio:"uesio.workspaceid"`
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
		"uesio.name": s.Name,
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
