package meta

type LicensePricingTemplate struct {
	BuiltIn         `yaml:",inline"`
	App             *App             `json:"uesio/studio.app"`
	LicenseTemplate *LicenseTemplate `json:"uesio/studio.licensetemplate"`
	Price           float64          `json:"uesio/studio.price"`
	MetadataType    string           `json:"uesio/studio.metadatatype"`
	ActionType      string           `json:"uesio/studio.actiontype"`
	MetadataName    string           `json:"uesio/studio.metadataname"`
}

func (lt *LicensePricingTemplate) GetCollection() CollectionableGroup {
	return &LicensePricingTemplateCollection{}
}

func (lt *LicensePricingTemplate) GetCollectionName() string {
	return LICENSEPRICINGTEMPLATE_COLLECTION_NAME
}

func (lt *LicensePricingTemplate) SetField(fieldName string, value any) error {
	return StandardFieldSet(lt, fieldName, value)
}

func (lt *LicensePricingTemplate) GetField(fieldName string) (any, error) {
	return StandardFieldGet(lt, fieldName)
}

func (lt *LicensePricingTemplate) Loop(iter func(string, any) error) error {
	return StandardItemLoop(lt, iter)
}

func (lt *LicensePricingTemplate) Len() int {
	return StandardItemLen(lt)
}

func (lt *LicensePricingTemplate) UnmarshalJSON(data []byte) error {
	type alias LicensePricingTemplate
	return refScanner((*alias)(lt), data)
}
