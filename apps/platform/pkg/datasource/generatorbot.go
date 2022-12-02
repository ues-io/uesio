package datasource

import (
	"bytes"
	"io"
	"io/ioutil"
	"regexp"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/templating"
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
	session     *sess.Session
	Params      *ParamsAPI `bot:"params"`
	itemStreams bundlestore.ItemStreams
	bot         *meta.Bot
	connection  adapt.Connection
}

func (gba *GeneratorBotAPI) RunGenerator(namespace, name string, params map[string]interface{}) error {
	// Go get that bot
	streams, err := CallGeneratorBot(namespace, name, params, gba.connection, gba.session)
	if err != nil {
		return err
	}
	gba.itemStreams = append(gba.itemStreams, streams...)
	return nil
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
		gba.itemStreams.AddFile(filename, "", strings.NewReader(templateString))
		return nil
	}
	r := bundlestore.GetFileReader(func(data io.Writer) error {
		return mergeTemplate(data, params, templateString)
	})
	gba.itemStreams.AddFile(filename, "", r)
	return nil
}

func (gba *GeneratorBotAPI) GenerateYamlFile(filename string, params map[string]interface{}, templateFile string) error {
	merged, err := gba.MergeYamlTemplate(params, templateFile)
	if err != nil {
		return err
	}

	gba.itemStreams.AddFile(filename, "", strings.NewReader(merged))
	return nil
}

func (gba *GeneratorBotAPI) RepeatString(repeaterInput interface{}, templateString string) (string, error) {
	// This allows the repeater input to be either a string or a slice of strings
	repeater, err := adapt.GetStringSlice(repeaterInput)
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

	// Traverse the node to find merges
	if len(node.Content) > 0 {
		err = mergeNodes(node.Content[0], params, true)
		if err != nil {
			return nil, err
		}
	}

	return node, nil

}

func mergeNodes(node *yaml.Node, params map[string]interface{}, allowYaml bool) error {
	if node == nil || params == nil {
		return nil
	}

	if node.Kind == yaml.MappingNode {
		for i := range node.Content {
			if i%2 != 0 {
				err := mergeNodes(node.Content[i], params, true)
				if err != nil {
					return err
				}
			} else {
				err := mergeNodes(node.Content[i], params, false)
				if err != nil {
					return err
				}
			}
		}
	}

	if node.Kind == yaml.SequenceNode {
		for i := range node.Content {
			err := mergeNodes(node.Content[i], params, false)
			if err != nil {
				return err
			}
		}
	}

	if node.Kind == yaml.ScalarNode {
		re := regexp.MustCompile("\\$\\{(.*?)\\}")
		match := re.FindStringSubmatch(node.Value)
		for _, merge := range match {
			mergeValue := params[merge]
			mergeString, ok := mergeValue.(string)
			if ok {
				if allowYaml {
					if mergeString == "" {
						node.SetString("")
						continue
					}
					newNode, err := mergeYamlString(mergeString, nil)
					if err != nil {
						return err
					}
					// Replace that crap
					*node = *newNode.Content[0]
				} else {
					node.SetString(mergeString)
				}
			}
		}
	}

	return nil

}
