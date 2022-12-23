package meta

type LicenseTemplate struct {
	App          *App    `json:"uesio/studio.app"`
	MonthlyPrice float64 `json:"uesio/studio.monthlyprice"`
	AutoCreate   bool    `json:"uesio/studio.autocreate"`
	BuiltIn
}

func (lt *LicenseTemplate) GetCollectionName() string {
	return lt.GetCollection().GetName()
}

func (lt *LicenseTemplate) GetCollection() CollectionableGroup {
	return &LicenseTemplateCollection{}
}

func (lt *LicenseTemplate) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(lt, fieldName, value)
}

func (lt *LicenseTemplate) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(lt, fieldName)
}

func (lt *LicenseTemplate) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(lt, iter)
}

func (lt *LicenseTemplate) Len() int {
	return StandardItemLen(lt)
}
