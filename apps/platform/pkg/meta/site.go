package meta

type Site struct {
	BuiltIn   `yaml:",inline"`
	Name      string     `json:"uesio/studio.name"`
	Bundle    *Bundle    `json:"uesio/studio.bundle"`
	App       *App       `json:"uesio/studio.app"`
	bundleDef *BundleDef `json:"-"`
	host      string     `json:"-"`
	Domain    string     `json:"-"`
	Subdomain string     `json:"-"`
	Scheme    string     `json:"-"`
	Title     string     `json:"uesio/studio.title"`
	EnableSEO bool       `json:"uesio/studio.enable_seo"`
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

func (s *Site) GetFavicon() string {
	favicon := s.GetAppBundle().Favicon
	if favicon == "" {
		return "uesio/core.favicon"
	}
	return favicon
}

func (s *Site) GetCollection() CollectionableGroup {
	return &SiteCollection{}
}

func (s *Site) GetCollectionName() string {
	return SITE_COLLECTION_NAME
}

func (s *Site) SetField(fieldName string, value any) error {
	return StandardFieldSet(s, fieldName, value)
}

func (s *Site) GetField(fieldName string) (any, error) {
	return StandardFieldGet(s, fieldName)
}

func (s *Site) Loop(iter func(string, any) error) error {
	return StandardItemLoop(s, iter)
}

func (s *Site) Len() int {
	return StandardItemLen(s)
}

func (s *Site) UnmarshalJSON(data []byte) error {
	type alias Site
	return refScanner((*alias)(s), data)
}

// GetHost - return the host associated with this site, which must be set with SetHost()
func (s *Site) GetHost() string {
	return s.host
}

// SetHost - return the host associated with this site, which must be set with SetHost()
func (s *Site) SetHost(host string) {
	s.host = host
}
