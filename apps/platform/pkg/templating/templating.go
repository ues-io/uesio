package templating

import (
	"bytes"
	"errors"
	"strings"
	"text/template"
)

// TemplateFunc type
type TemplateFunc func(map[string]interface{}, string) (interface{}, error)

const defaultTemplateKey = "__default__"

// NewRequireKey function returns a template that requires keys and throws an error if they don't exist
func NewRequiredKey(templateString string) (*template.Template, error) {
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
	return NewWithFuncs(templateString, templateFunc, nil)
}

// NewWithFuncs function
func NewWithFuncs(templateString string, defaultTemplateFunc TemplateFunc, templateFuncs map[string]TemplateFunc) (*template.Template, error) {
	if templateString == "" {
		return nil, nil
	}
	// Default template
	// This basically transforms a string such as ${uesio.name} to {{ index . "uesio.name" }}
	// The second format is understood by Go's built-in templating language.
	templateFuncMap := template.FuncMap{
		defaultTemplateKey: defaultTemplateFunc,
	}

	replaceStrings := []string{"${", "{{ " + defaultTemplateKey + " . \"", "}", "\" }}"}
	for key := range templateFuncs {
		replaceStrings = append(replaceStrings, "$"+key+"{", "{{ "+key+" . \"")
		templateFuncMap[key] = templateFuncs[key]
	}
	templateText := strings.NewReplacer(replaceStrings...).Replace(templateString)

	return template.New("").Funcs(templateFuncMap).Parse(templateText)

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
