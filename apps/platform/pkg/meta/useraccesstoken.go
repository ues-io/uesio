package meta

import "errors"

func NewUserAccessToken(key string) (*UserAccessToken, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for User Access Token: " + key)
	}
	return &UserAccessToken{
		Name:      name,
		Namespace: namespace,
	}, nil
}

type UserAccessToken struct {
	ID         string            `yaml:"-" uesio:"studio.id"`
	Name       string            `yaml:"name" uesio:"studio.name"`
	Namespace  string            `yaml:"-" uesio:"-"`
	Type       string            `yaml:"type" uesio:"studio.type"`
	Collection string            `yaml:"collection" uesio:"studio.collection"`
	Conditions []*TokenCondition `yaml:"conditions"`
	Token      string            `yaml:"token"`
	Workspace  string            `yaml:"-" uesio:"studio.workspaceid"`
	itemMeta   *ItemMeta         `yaml:"-" uesio:"-"`
	CreatedBy  *User             `yaml:"-" uesio:"studio.createdby"`
	UpdatedBy  *User             `yaml:"-" uesio:"studio.updatedby"`
	UpdatedAt  int64             `yaml:"-" uesio:"studio.updatedat"`
	CreatedAt  int64             `yaml:"-" uesio:"studio.createdat"`
}

// GetCollectionName function
func (uat *UserAccessToken) GetCollectionName() string {
	return uat.GetBundleGroup().GetName()
}

// GetCollection function
func (uat *UserAccessToken) GetCollection() CollectionableGroup {
	var uatc UserAccessTokenCollection
	return &uatc
}

// GetConditions function
func (uat *UserAccessToken) GetConditions() map[string]string {
	return map[string]string{
		"studio.name": uat.Name,
	}
}

// GetBundleGroup function
func (uat *UserAccessToken) GetBundleGroup() BundleableGroup {
	var uatc UserAccessTokenCollection
	return &uatc
}

// GetKey function
func (uat *UserAccessToken) GetKey() string {
	return uat.Namespace + "." + uat.Name
}

// GetPath function
func (uat *UserAccessToken) GetPath() string {
	return uat.GetKey() + ".yaml"
}

// GetPermChecker function
func (uat *UserAccessToken) GetPermChecker() *PermissionSet {
	return nil
}

// SetField function
func (uat *UserAccessToken) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(uat, fieldName, value)
}

// GetField function
func (uat *UserAccessToken) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(uat, fieldName)
}

// GetNamespace function
func (uat *UserAccessToken) GetNamespace() string {
	return uat.Namespace
}

// SetNamespace function
func (uat *UserAccessToken) SetNamespace(namespace string) {
	uat.Namespace = namespace
}

// SetWorkspace function
func (uat *UserAccessToken) SetWorkspace(workspace string) {
	uat.Workspace = workspace
}

// Loop function
func (uat *UserAccessToken) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(uat, iter)
}

// GetItemMeta function
func (uat *UserAccessToken) GetItemMeta() *ItemMeta {
	return uat.itemMeta
}

// SetItemMeta function
func (uat *UserAccessToken) SetItemMeta(itemMeta *ItemMeta) {
	uat.itemMeta = itemMeta
}
