package templating

import (
	"bytes"
	"errors"
	"strings"
	"text/template"
)

// TemplateFunc type
type TemplateFunc func(map[string]interface{}, string) (interface{}, error)

// New function
func New(templateString string) (*template.Template, error) {
	return NewWithFunc(templateString, func(m map[string]interface{}, key string) (interface{}, error) {
		val, ok := m[key]
		if !ok {
			return nil, errors.New("missing key " + key)
		}
		return val, nil
	})
}

// NewWithFunc function
func NewWithFunc(templateString string, templateFunc TemplateFunc) (*template.Template, error) {
	if templateString != "" {
		// This basically transforms a string such as ${uesio.name} to {{ index . "uesio.name" }}
		// The second format is understood by Go's built-in templating language.
		templateText := strings.ReplaceAll(templateString, "${", "{{ lookup . \"")
		templateText = strings.ReplaceAll(templateText, "}", "\" }}")
		return template.New("newidtemplate").Funcs(template.FuncMap{
			"lookup": templateFunc,
		}).Parse(templateText)
	}

	return nil, nil
}

// Execute function
func Execute(tmpl *template.Template, change map[string]interface{}) (string, error) {
	if tmpl != nil {
		var tpl bytes.Buffer
		err := tmpl.Execute(&tpl, change)
		if err != nil {
			return "", err
		}
		return tpl.String(), nil
	}

	return "", nil

}
