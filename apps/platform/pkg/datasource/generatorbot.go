package datasource

import (
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

type GeneratorBotAPI struct {
	session     *sess.Session
	Params      *ParamsAPI `bot:"params"`
	itemStreams []bundlestore.ItemStream
}

// Save function
func (gba *GeneratorBotAPI) GenerateFile(filename string, params map[string]interface{}, templateString string) error {
	fmt.Println("Generating file: " + filename)
	template, err := templating.NewTemplateWithValidKeysOnly(templateString)
	if err != nil {
		return err
	}

	fileStream := bundlestore.ItemStream{
		FileName: filename,
		Type:     "",
	}

	err = template.Execute(&fileStream.Buffer, params)
	if err != nil {
		return err
	}

	gba.itemStreams = append(gba.itemStreams, fileStream)

	return nil
}
