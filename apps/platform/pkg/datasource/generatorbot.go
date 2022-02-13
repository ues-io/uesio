package datasource

import (
	"bytes"
	"io"
	"io/ioutil"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

func mergeTemplate(file io.Writer, params map[string]interface{}, templateString string) error {
	template, err := templating.NewTemplateWithValidKeysOnly(templateString)
	if err != nil {
		return err
	}
	return template.Execute(file, params)
}

type GeneratorBotAPI struct {
	session     *sess.Session
	Params      *ParamsAPI `bot:"params"`
	itemStreams bundlestore.ItemStreams
	bot         *meta.Bot
}

func (gba *GeneratorBotAPI) GetTemplate(templateFile string) (string, error) {
	// Load in the template text from the bot.
	stream, err := bundle.GetGeneratorBotTemplateStream(templateFile, gba.bot, gba.session)
	if err != nil {
		return "", err
	}
	templateBytes, err := ioutil.ReadAll(stream)
	if err != nil {
		return "", err
	}

	return string(templateBytes), nil
}

func (gba *GeneratorBotAPI) MergeString(params map[string]interface{}, templateString string) (string, error) {
	buffer := &bytes.Buffer{}
	err := mergeTemplate(buffer, params, templateString)
	if err != nil {
		return "", err
	}
	return buffer.String(), nil
}

func (gba *GeneratorBotAPI) MergeTemplate(params map[string]interface{}, templateFile string) (string, error) {
	templateString, err := gba.GetTemplate(templateFile)
	if err != nil {
		return "", err
	}
	return gba.MergeString(params, templateString)
}

func (gba *GeneratorBotAPI) GenerateFile(filename string, params map[string]interface{}, templateFile string) error {
	templateString, err := gba.GetTemplate(templateFile)
	if err != nil {
		return err
	}
	r := bundlestore.GetFileReader(func(data io.Writer) error {
		return mergeTemplate(data, params, templateString)
	})
	gba.itemStreams.AddFile(filename, "", r)
	return nil
}

// GetNamespace function
func (gba *GeneratorBotAPI) GetNamespace() string {
	return gba.session.GetContextAppName()
}
