package metadata

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/reqs"
)

// NewProfile function
func NewProfile(key string) (*Profile, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for Profile")
	}
	return &Profile{
		Name:      name,
		Namespace: namespace,
	}, nil
}

// Profile struct
type Profile struct {
	Name              string          `yaml:"name" uesio:"uesio.name"`
	Namespace         string          `yaml:"-" uesio:"-"`
	PermissionSetRefs []string        `yaml:"permissionSets" uesio:"-"`
	PermissionSets    []PermissionSet `yaml:"-" uesio:"-"`
	Workspace         string          `yaml:"-" uesio:"uesio.workspaceid"`
}

// GetCollectionName function
func (p *Profile) GetCollectionName() string {
	return p.GetBundleGroup().GetName()
}

// GetCollection function
func (p *Profile) GetCollection() CollectionableGroup {
	var pc ProfileCollection
	return &pc
}

// GetConditions function
func (p *Profile) GetConditions() ([]reqs.LoadRequestCondition, error) {
	return []reqs.LoadRequestCondition{
		{
			Field: "uesio.name",
			Value: p.Name,
		},
	}, nil
}

// GetBundleGroup function
func (p *Profile) GetBundleGroup() BundleableGroup {
	var pc ProfileCollection
	return &pc
}

// GetKey function
func (p *Profile) GetKey() string {
	return p.Namespace + "." + p.Name
}

// GetPermChecker function
func (p *Profile) GetPermChecker() *PermissionSet {
	return nil
}

// GetNamespace function
func (p *Profile) GetNamespace() string {
	return p.Namespace
}

// SetNamespace function
func (p *Profile) SetNamespace(namespace string) {
	p.Namespace = namespace
}

// SetWorkspace function
func (p *Profile) SetWorkspace(workspace string) {
	p.Workspace = workspace
}

// HasPermission method
func (p *Profile) HasPermission(check *PermissionSet) bool {
	return p.FlattenPermissions().HasPermission(check)
}

// FlattenPermissions returns an inclusive permissionset
// of all permissions for that profile
func (p *Profile) FlattenPermissions() *PermissionSet {
	return FlattenPermissions(p.PermissionSets)
}
