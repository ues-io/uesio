package jsdialect

import (
	"bytes"
	"errors"
	"io"
	"regexp"
	"strings"
	"sync"

	"github.com/sethvargo/go-password/password"
	"golang.org/x/sync/errgroup"
	"gopkg.in/yaml.v3"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/deploy"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/retrieve"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/templating"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

var passwordGenerator *password.Generator

func init() {
	passwordGenerator, _ = password.NewGenerator(&password.GeneratorInput{
		Symbols: "!@#$%^&*(){}[]",
	})
}

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

type GeneratorBotOptions struct {
	Namespace string                 `bot:"namespace"`
	Name      string                 `bot:"name"`
	Params    map[string]interface{} `bot:"params"`
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

func (gba *GeneratorBotAPI) GetUser() *UserAPI {
	return NewUserAPI(gba.session.GetContextUser())
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

func (gba *GeneratorBotAPI) CreateBundle(options *deploy.CreateBundleOptions) (map[string]interface{}, error) {
	if options == nil {
		return nil, errors.New("you must provide options to the create bundle api")
	}
	ws := gba.session.GetWorkspace()
	if ws == nil {
		return nil, errors.New("you must be in a workspace context to create a bundle in a generator")
	}

	if options.AppName == "" {
		options.AppName = gba.GetAppName()
	}

	if options.WorkspaceName == "" {
		options.WorkspaceName = gba.GetWorkspaceName()
	}

	bundle, err := deploy.CreateBundle(options, gba.connection, gba.session.RemoveWorkspaceContext())
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"major":       bundle.Major,
		"minor":       bundle.Minor,
		"patch":       bundle.Patch,
		"description": bundle.Description,
	}, nil

}

func (gba *GeneratorBotAPI) CreateSite(options *deploy.CreateSiteOptions) (map[string]interface{}, error) {

	if options == nil {
		return nil, errors.New("you must provide options to the create site api")
	}

	if options.AppName == "" {
		options.AppName = gba.GetAppName()
	}

	site, err := deploy.CreateSite(options, gba.connection, gba.session.RemoveWorkspaceContext())
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"id": site.ID,
	}, nil

}

func (gba *GeneratorBotAPI) CreateUser(options *deploy.CreateUserOptions) (map[string]interface{}, error) {

	if options == nil {
		return nil, errors.New("you must provide options to the create user api")
	}
	_, err := deploy.CreateUser(options, gba.connection, gba.session.RemoveWorkspaceContext())
	if err != nil {
		return nil, err
	}
	return map[string]interface{}{}, nil

}

func (gba *GeneratorBotAPI) GeneratePassword() (string, error) {
	return passwordGenerator.Generate(10, 1, 1, false, false)
}

func (gba *GeneratorBotAPI) CallBot(botKey string, params map[string]interface{}) (interface{}, error) {
	return botCall(botKey, params, gba.session, gba.connection)
}

func (gba *GeneratorBotAPI) RunGenerator(namespace, name string, params map[string]interface{}) error {
	return datasource.CallGeneratorBot(gba.create, namespace, name, params, gba.connection, gba.session)
}

func (gba *GeneratorBotAPI) RunGenerators(generators []GeneratorBotOptions) error {
	eg := new(errgroup.Group)
	creates := map[string]*bytes.Buffer{}
	mu := sync.Mutex{}
	for _, generator := range generators {
		eg.Go(func() error {
			return datasource.CallGeneratorBot(func(s string) (io.WriteCloser, error) {
				buf := &bytes.Buffer{}
				mu.Lock()
				creates[s] = buf
				mu.Unlock()
				return retrieve.NopWriterCloser(buf), nil
			}, generator.Namespace, generator.Name, generator.Params, gba.connection, gba.session)
		})
	}
	err := eg.Wait()
	if err != nil {
		return err
	}

	for fileName, buf := range creates {
		w, err := gba.create(fileName)
		if err != nil {
			return err
		}
		_, err = io.Copy(w, buf)
		if err != nil {
			return err
		}
	}

	return nil
}

func (gba *GeneratorBotAPI) RunIntegrationAction(integrationID string, action string, options interface{}) (interface{}, error) {
	return runIntegrationAction(integrationID, action, options, gba.session.RemoveWorkspaceContext(), gba.connection)
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
			mergeValue, hasValue := params[merge]
			if !hasValue {
				return nil
			}
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
			} else {
				newNode := &yaml.Node{}
				err := newNode.Encode(mergeValue)
				if err != nil {
					return err
				}
				*node = *newNode
			}

		}
	}

	return nil

}
