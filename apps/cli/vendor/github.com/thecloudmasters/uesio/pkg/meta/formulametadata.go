package meta

type FormulaMetadata struct {
	Expression string `yaml:"expression,omitempty" json:"uesio/studio.expression"`
	ReturnType string `yaml:"returntype,omitempty" json:"uesio/studio.returntype"`
}
