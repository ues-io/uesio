package meta

type License struct {
	BuiltIn      `yaml:",inline"`
	Active       bool    `json:"uesio/studio.active"`
	App          *App    `json:"uesio/studio.app"`
	AppLicensed  *App    `json:"uesio/studio.applicensed"`
	MonthlyPrice float64 `json:"uesio/studio.monthlyprice"`
}

func (l *License) GetCollection() CollectionableGroup {
	return &LicenseCollection{}
}

func (l *License) GetCollectionName() string {
	return LICENSE_COLLECTION_NAME
}

func (l *License) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(l, fieldName, value)
}

func (l *License) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(l, fieldName)
}

func (l *License) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(l, iter)
}

func (l *License) Len() int {
	return StandardItemLen(l)
}
