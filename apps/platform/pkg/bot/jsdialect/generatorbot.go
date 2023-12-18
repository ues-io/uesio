package jsdialect

import (
	"bytes"
	"errors"
	"io"
	"regexp"
	"strconv"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/templating"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
	"gopkg.in/yaml.v3"
)

func mergeTemplate(file io.Writer, params map[string]interface{}, templateString string) error {
	template, err := templating.NewTemplateWithValidKeysOnly(templateString)
	if err != nil {
		return err
	}
	return template.Execute(file, params)
}

type GeneratorBotAPI struct {
	Session    *sess.Session
	Params     *ParamsAPI `bot:"params"`
	Create     bundlestore.FileCreator
	Bot        *meta.Bot
	Connection wire.Connection
	LogApi     *BotLogAPI `bot:"log"`
}

func (gba *GeneratorBotAPI) CallBot(botKey string, params map[string]interface{}) (interface{}, error) {
	return botCall(botKey, params, gba.Session, gba.Connection)
}

func (gba *GeneratorBotAPI) RunGenerator(namespace, name string, params map[string]interface{}) error {
	return datasource.CallGeneratorBot(gba.Create, namespace, name, params, gba.Connection, gba.Session)
}

func (gba *GeneratorBotAPI) GetTemplate(templateFile string) (string, error) {
	// Load in the template text from the Bot.
	buf := &bytes.Buffer{}
	_, err := bundle.GetItemAttachment(buf, gba.Bot, templateFile, gba.Session)
	if err != nil {
		return "", err
	}
	return string(buf.Bytes()), nil
}

func (gba *GeneratorBotAPI) MergeString(params map[string]interface{}, templateString string) (string, error) {
	buffer := &bytes.Buffer{}
	err := mergeTemplate(buffer, params, templateString)
	if err != nil {
		return "", err
	}
	return buffer.String(), nil
}

func (gba *GeneratorBotAPI) MergeYamlString(params map[string]interface{}, templateString string) (string, error) {
	data, err := performYamlMerge(templateString, params)
	if err != nil {
		return "", err
	}
	return data.String(), nil
}

func (gba *GeneratorBotAPI) MergeTemplate(params map[string]interface{}, templateFile string) (string, error) {
	templateString, err := gba.GetTemplate(templateFile)
	if err != nil {
		return "", err
	}
	return gba.MergeString(params, templateString)
}

func (gba *GeneratorBotAPI) MergeYamlTemplate(params map[string]interface{}, templateFile string) (string, error) {
	templateString, err := gba.GetTemplate(templateFile)
	if err != nil {
		return "", err
	}
	return gba.MergeYamlString(params, templateString)
}

func (gba *GeneratorBotAPI) GenerateFile(filename string, params map[string]interface{}, templateFile string) error {
	templateString, err := gba.GetTemplate(templateFile)
	if err != nil {
		return err
	}
	// Don't do the merge if we don't have params
	if params == nil || len(params) == 0 {
		gba.AddFile(filename, strings.NewReader(templateString))
		return nil
	}
	f, err := gba.Create(filename)
	if err != nil {
		return err
	}
	return mergeTemplate(f, params, templateString)
}

func (gba *GeneratorBotAPI) AddFile(filename string, r io.Reader) error {
	f, err := gba.Create(filename)
	if err != nil {
		return err
	}
	_, err = io.Copy(f, r)
	if err != nil {
		return err
	}
	return nil
}

func (gba *GeneratorBotAPI) GenerateYamlFile(filename string, params map[string]interface{}, templateFile string) error {
	merged, err := gba.MergeYamlTemplate(params, templateFile)
	if err != nil {
		return err
	}
	return gba.AddFile(filename, strings.NewReader(merged))
}

func (gba *GeneratorBotAPI) RepeatString(repeaterInput interface{}, templateString string) (string, error) {
	// This allows the repeater input to be either a string or a slice of strings
	repeater, err := wire.GetStringSlice(repeaterInput)
	if err != nil {
		return "", err
	}

	mergedStrings := []string{}
	for _, key := range repeater {
		result, err := gba.MergeString(map[string]interface{}{
			"key":   key,
			"start": "${",
			"end":   "}",
		}, templateString)
		if err != nil {
			return "", err
		}
		mergedStrings = append(mergedStrings, result)
	}
	return strings.Join(mergedStrings, ""), nil
}

func (gba *GeneratorBotAPI) Load(request BotLoadOp) (*wire.Collection, error) {
	return botLoad(request, gba.Session, gba.Connection)
}

func performYamlMerge(templateString string, params map[string]interface{}) (*bytes.Buffer, error) {
	node, err := mergeYamlString(templateString, params)
	if err != nil {
		return nil, err
	}

	data := &bytes.Buffer{}
	encoder := yaml.NewEncoder(data)
	encoder.SetIndent(2)
	err = encoder.Encode(node)
	if err != nil {
		return nil, err
	}

	return data, nil
}

func mergeYamlString(templateString string, params map[string]interface{}) (*yaml.Node, error) {
	node := &yaml.Node{}
	// First parse the yaml file
	err := yaml.Unmarshal([]byte(templateString), node)
	if err != nil {
		return nil, err
	}

	err = mergeNode(node, params)
	if err != nil {
		return nil, err
	}

	return node, nil

}

func mergeNode(node *yaml.Node, params map[string]interface{}) error {
	if node == nil || params == nil {
		return nil
	}

	if node.Kind == yaml.DocumentNode {
		return mergeNode(node.Content[0], params)
	}

	if node.Kind == yaml.SequenceNode || node.Kind == yaml.MappingNode {
		for i := range node.Content {
			err := mergeNode(node.Content[i], params)
			if err != nil {
				return err
			}
		}
	}

	if node.Kind == yaml.ScalarNode {
		re := regexp.MustCompile("\\$\\{(.*?)\\}")
		match := re.FindStringSubmatch(node.Value)
		if len(match) == 2 {
			matchExpression := match[0] //${mymerge}
			merge := match[1]           // mymerge
			mergeValue := params[merge]
			mergeString, ok := mergeValue.(string)
			if ok {

				newNode, err := mergeYamlString(mergeString, nil)
				if err != nil {
					return err
				}

				if newNode.Content == nil || len(newNode.Content) == 0 {
					node.SetString("")
					return nil
				}

				contentNode := newNode.Content[0]

				// If newNode is a scalar we can just merge it in to the template
				if contentNode.Kind == yaml.ScalarNode {
					node.SetString(strings.Replace(node.Value, matchExpression, contentNode.Value, 1))
					return nil
				}

				// If newNode is not a scalar, then we have to be sure it was the
				// entire merge.
				if matchExpression != node.Value {
					return errors.New("cannot merge a sequence or map into a multipart template: " + matchExpression + " : " + node.Value)
				}

				// Replace that crap
				*node = *contentNode
			}

			mergeNumber, ok := mergeValue.(int64)
			if ok {
				node.Value = strconv.FormatInt(mergeNumber, 10)
				node.Tag = "!!int"
			}

		}
	}

	return nil

}
