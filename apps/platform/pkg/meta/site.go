package meta

// Site struct
type Site struct {
	ID        string  `uesio:"uesio.id"`
	Name      string  `uesio:"uesio.name"`
	Bundle    *Bundle `uesio:"uesio.bundle"`
	AppID     string  `uesio:"uesio.appid"`
	bundleDef *BundleDef
	itemMeta  *ItemMeta `yaml:"-" uesio:"-"`
	CreatedBy *User     `uesio:"uesio.createdby"`
	UpdatedBy *User     `uesio:"uesio.updatedby"`
	UpdatedAt float64   `uesio:"uesio.updatedat"`
	CreatedAt float64   `uesio:"uesio.createdat"`
}

func (s *Site) GetFullName() string {
	return s.Name + "_" + s.AppID
}

// SetAppBundle function
func (s *Site) SetAppBundle(bundleDef *BundleDef) {
	s.bundleDef = bundleDef
}

// GetAppBundle function
func (s *Site) GetAppBundle() *BundleDef {
	return s.bundleDef
}

// GetCollectionName function
func (s *Site) GetCollectionName() string {
	return s.GetCollection().GetName()
}

// GetCollection function
func (s *Site) GetCollection() CollectionableGroup {
	var sc SiteCollection
	return &sc
}

// SetField function
func (s *Site) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(s, fieldName, value)
}

// GetField function
func (s *Site) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(s, fieldName)
}

// Loop function
func (s *Site) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(s, iter)
}

// GetItemMeta function
func (s *Site) GetItemMeta() *ItemMeta {
	return s.itemMeta
}

// SetItemMeta function
func (s *Site) SetItemMeta(itemMeta *ItemMeta) {
	s.itemMeta = itemMeta
}
