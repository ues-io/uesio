package meta

func NewWorkspaceUser(namespace, userID, profileID string) (*WorkspaceUser, error) {
	return NewBaseWorkspaceUser(namespace, userID, profileID), nil
}

func NewBaseWorkspaceUser(namespace, userID, profileID string) *WorkspaceUser {
	return &WorkspaceUser{
		//BundleableBase: NewBase(namespace, ""),
		User:    &userID,    //    &User{BuiltIn: BuiltIn{ID: userID}},
		Profile: &profileID, //&Profile{BuiltIn: BuiltIn{ID: profileID}},
	}
}

type WorkspaceUser struct {
	BuiltIn `yaml:",inline"`
	//BundleableBase `yaml:"-"` //This is intentional, don't show the name
	User    *string `json:"uesio/studio.user"`
	Profile *string `json:"uesio/studio.profile"`
}

type WorkspaceUserWrapper WorkspaceUser

func (w *WorkspaceUser) GetCollectionName() string {
	return WORKSPACEUSER_COLLECTION_NAME
}

func (w *WorkspaceUser) GetBundleFolderName() string {
	return WORKSPACEUSER_FOLDER_NAME
}

func (w *WorkspaceUser) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(w, fieldName, value)
}

func (w *WorkspaceUser) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(w, fieldName)
}

func (w *WorkspaceUser) Loop(iter func(string, interface{}) error) error {
	itemMeta := w.GetItemMeta()
	for _, fieldName := range ROUTE_ASSIGNMENT_FIELDS {
		if itemMeta != nil && !itemMeta.IsValidField(fieldName) {
			continue
		}
		val, err := w.GetField(fieldName)
		if err != nil {
			return err
		}
		err = iter(fieldName, val)
		if err != nil {
			return err
		}
	}
	return nil
}

func (w *WorkspaceUser) Len() int {
	return StandardItemLen(w)
}

// func (w *WorkspaceUser) UnmarshalYAML(node *yaml.Node) error {
// 	err := validateNodeName(node, w.Name)
// 	if err != nil {
// 		return err
// 	}
// 	return node.Decode((*WorkspaceUserWrapper)(w))
// }

func (w *WorkspaceUser) MarshalYAML() (interface{}, error) {
	//w.Profile = GetLocalizedKey(w.Profile, w.Namespace)
	return (*WorkspaceUserWrapper)(w), nil
}
