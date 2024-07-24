package jsdialect

import (
	"bytes"
	"errors"
	"io"
	"regexp"
	"strconv"
	"strings"

	"gopkg.in/yaml.v3"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/deploy"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/templating"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func mergeTemplate(file io.Writer, params map[string]interface{}, templateString string) error {
	template, err := templating.NewTemplateWithValidKeysOnly(templateString)
	if err != nil {
		return err
	}
	return template.Execute(file, params)
}

func NewGeneratorBotAPI(bot *meta.Bot, params map[string]interface{}, create bundlestore.FileCreator, session *sess.Session, connection wire.Connection) *GeneratorBotAPI {
	return &GeneratorBotAPI{
		Params: &ParamsAPI{
			Params: params,
		},
		LogApi:     NewBotLogAPI(bot, session.Context()),
		session:    session,
		create:     create,
		bot:        bot,
		connection: connection,
	}
}

type GeneratorBotAPI struct {
	Params     *ParamsAPI `bot:"params"`
	LogApi     *BotLogAPI `bot:"log"`
	bot        *meta.Bot
	create     bundlestore.FileCreator
	session    *sess.Session
	connection wire.Connection
}

// GetAppName returns the key of the current workspace's app
func (gba *GeneratorBotAPI) GetAppName() string {
	ws := gba.session.GetWorkspace()
	if ws != nil {
		return ws.GetAppFullName()
	}
	return ""
}

func (gba *GeneratorBotAPI) GetSession() *SessionAPI {
	return NewSessionAPI(gba.session)
}

// GetAppName returns the name of the current workspace's app
func (gba *GeneratorBotAPI) GetApp() *AppAPI {
	return gba.GetSession().GetApp(gba.connection)
}

// GetWorkspaceName returns the name of the current workspace
func (gba *GeneratorBotAPI) GetWorkspaceName() string {
	ws := gba.session.GetWorkspace()
	if ws != nil {
		return ws.Name
	}
	return ""
}

// GetName returns the name of the bot
func (gba *GeneratorBotAPI) GetName() string {
	return gba.bot.Name
}

// GetNamespace returns the namespace of the bot
func (gba *GeneratorBotAPI) GetNamespace() string {
	return gba.bot.GetNamespace()
}

func (gba *GeneratorBotAPI) CreateBundle(description string) (map[string]interface{}, error) {
	ws := gba.session.GetWorkspace()
	if ws == nil {
		return nil, errors.New("you must be in a workspace context to create a bundle in a generator")
	}

	return deploy.CreateBundle(&deploy.CreateBundleOptions{
		AppName:       gba.GetAppName(),
		WorkspaceName: gba.GetWorkspaceName(),
		Description:   description,
		ReleaseType:   "patch",
	}, gba.connection, gba.session.RemoveWorkspaceContext())

}

func (gba *GeneratorBotAPI) CallBot(botKey string, params map[string]interface{}) (interface{}, error) {
	return botCall(botKey, params, gba.session, gba.connection)
}

func (gba *GeneratorBotAPI) RunGenerator(namespace, name string, params map[string]interface{}) error {
	return datasource.CallGeneratorBot(gba.create, namespace, name, params, gba.connection, gba.session)
}

func (gba *GeneratorBotAPI) GetTemplate(templateFile string) (string, error) {
	// Load in the template text from the Bot.
	buf := &bytes.Buffer{}
	_, err := bundle.GetItemAttachment(buf, gba.bot, templateFile, gba.session, gba.connection)
	if err != nil {
		return "", err
	}
	return string(buf.Bytes()), nil
}

func (gba *GeneratorBotAPI) MergeYamlString(params map[string]interface{}, templateString string) (string, error) {
	data, err := performYamlMerge(templateString, params)
	if err != nil {
		return "", err
	}
	return data.String(), nil
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
	f, err := gba.create(filename)
	if err != nil {
		return err
	}
	return mergeTemplate(f, params, templateString)
}

func (gba *GeneratorBotAPI) AddFile(filename string, r io.Reader) error {
	f, err := gba.create(filename)
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
	return gba.GenerateStringFile(filename, merged)
}

func (gba *GeneratorBotAPI) GenerateStringFile(filename string, content string) error {
	return gba.AddFile(filename, strings.NewReader(content))
}

func (gba *GeneratorBotAPI) Load(request BotLoadOp) (*wire.Collection, error) {
	return botLoad(request, gba.session, gba.connection)
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
