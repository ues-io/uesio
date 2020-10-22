package metadata

// SiteCollection slice
type SiteCollection []Site

// GetName function
func (s *SiteCollection) GetName() string {
	return "sites"
}
