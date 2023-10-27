package meta

type Site struct {
	BuiltIn   `yaml:",inline"`
	Name      string     `json:"uesio/studio.name"`
	Bundle    *Bundle    `json:"uesio/studio.bundle"`
	App       *App       `json:"uesio/studio.app"`
	bundleDef *BundleDef `json:"-"`
	Domain    string
	Subdomain string
	Title     string `json:"uesio/studio.title"`
	EnableSEO bool   `json:"uesio/studio.enable_seo"`
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
	return SITE_COLLECTION_NAME
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

func (s *Site) UnmarshalJSON(data []byte) error {
	type alias Site
	return refScanner((*alias)(s), data)
}
