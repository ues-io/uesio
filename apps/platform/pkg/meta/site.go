package meta

type Site struct {
	ID          string  `uesio:"uesio/core.id"`
	UniqueKey   string  `yaml:"-" uesio:"uesio/core.uniquekey"`
	Name        string  `uesio:"uesio/studio.name"`
	Bundle      *Bundle `uesio:"uesio/studio.bundle"`
	App         *App    `uesio:"uesio/studio.app"`
	bundleDef   *BundleDef
	itemMeta    *ItemMeta `yaml:"-" uesio:"-"`
	CreatedBy   *User     `yaml:"-" uesio:"uesio/core.createdby"`
	Owner       *User     `yaml:"-" uesio:"uesio/core.owner"`
	UpdatedBy   *User     `yaml:"-" uesio:"uesio/core.updatedby"`
	UpdatedAt   int64     `yaml:"-" uesio:"uesio/core.updatedat"`
	CreatedAt   int64     `yaml:"-" uesio:"uesio/core.createdat"`
	Domain      string
	Subdomain   string
	Permissions *PermissionSet `uesio:"-"`
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
	var sc SiteCollection
	return &sc
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
