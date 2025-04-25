package meta

type LicenseTemplate struct {
	BuiltIn      `yaml:",inline"`
	App          *App    `json:"uesio/studio.app"`
	MonthlyPrice float64 `json:"uesio/studio.monthlyprice"`
	AutoCreate   bool    `json:"uesio/studio.autocreate"`
}

func (lt *LicenseTemplate) GetCollection() CollectionableGroup {
	return &LicenseTemplateCollection{}
}

func (lt *LicenseTemplate) GetCollectionName() string {
	return LICENSETEMPLATE_COLLECTION_NAME
}

func (lt *LicenseTemplate) SetField(fieldName string, value any) error {
	return StandardFieldSet(lt, fieldName, value)
}

func (lt *LicenseTemplate) GetField(fieldName string) (any, error) {
	return StandardFieldGet(lt, fieldName)
}

func (lt *LicenseTemplate) Loop(iter func(string, any) error) error {
	return StandardItemLoop(lt, iter)
}

func (lt *LicenseTemplate) Len() int {
	return StandardItemLen(lt)
}

func (lt *LicenseTemplate) UnmarshalJSON(data []byte) error {
	type alias LicenseTemplate
	return refScanner((*alias)(lt), data)
}
