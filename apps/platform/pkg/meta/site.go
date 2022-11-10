package meta

type Site struct {
	ID          string     `json:"uesio/core.id"`
	UniqueKey   string     `json:"uesio/core.uniquekey"`
	Name        string     `json:"uesio/studio.name"`
	Bundle      *Bundle    `json:"uesio/studio.bundle"`
	App         *App       `json:"uesio/studio.app"`
	bundleDef   *BundleDef `json:"-"`
	itemMeta    *ItemMeta  `json:"-"`
	CreatedBy   *User      `json:"uesio/core.createdby"`
	Owner       *User      `json:"uesio/core.owner"`
	UpdatedBy   *User      `json:"uesio/core.updatedby"`
	UpdatedAt   int64      `json:"uesio/core.updatedat"`
	CreatedAt   int64      `json:"uesio/core.createdat"`
	Domain      string
	Subdomain   string
	Permissions *PermissionSet `json:"-"`
}

func (s *Site) GetFullName() string {
	return s.Name + ":" + s.GetAppFullName()
}

func (s *Site) GetAppFullName() string {
	if s.App != nil {
		return s.App.UniqueKey
	}
	return ""
}

func (s *Site) SetAppBundle(bundleDef *BundleDef) {
	s.bundleDef = bundleDef
}

func (s *Site) GetAppBundle() *BundleDef {
	return s.bundleDef
}

func (s *Site) GetCollectionName() string {
	return s.GetCollection().GetName()
}

func (s *Site) GetCollection() CollectionableGroup {
	return &SiteCollection{}
}

func (s *Site) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(s, fieldName, value)
}

func (s *Site) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(s, fieldName)
}

func (s *Site) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(s, iter)
}

func (s *Site) Len() int {
	return StandardItemLen(s)
}

func (s *Site) GetItemMeta() *ItemMeta {
	return s.itemMeta
}

func (s *Site) SetItemMeta(itemMeta *ItemMeta) {
	s.itemMeta = itemMeta
}
