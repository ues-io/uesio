package datasource

import (
	"fmt"
	"io/ioutil"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

type GeneratorBotAPI struct {
	session     *sess.Session
	Params      *ParamsAPI `bot:"params"`
	itemStreams []bundlestore.ItemStream
	bot         *meta.Bot
}

// GenerateFile function
func (gba *GeneratorBotAPI) GenerateFile(filename string, params map[string]interface{}, templateFile string) error {
	fmt.Println("Generating file: " + filename)
	// Load in the template text from the bot.
	stream, err := bundle.GetGeneratorBotTemplateStream(templateFile, gba.bot, gba.session)
	if err != nil {
		return err
	}
	templateBytes, err := ioutil.ReadAll(stream)
	if err != nil {
		return err
	}
	template, err := templating.NewTemplateWithValidKeysOnly(string(templateBytes))
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

// GetNamespace function
func (gba *GeneratorBotAPI) GetNamespace() string {
	return gba.session.GetWorkspaceApp()
}
