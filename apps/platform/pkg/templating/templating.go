package templating

import (
	"bytes"
	"errors"
	"regexp"
	"strings"
	"text/template"
)

const defaultTemplateKey = "__default__"

// NewRequireKey function returns a template that requires keys and throws an error if they don't exist
func NewTemplateWithValidKeysOnly(templateString string) (*template.Template, error) {
	return NewWithFunc(templateString, func(m map[string]interface{}, key string) (interface{}, error) {
		val, ok := m[key]
		if !ok {
			return nil, errors.New("missing key " + key)
		}
		return val, nil
	})
}

// NewWithFunc function
func NewWithFunc(templateString string, templateFunc interface{}) (*template.Template, error) {
	return NewWithFuncs(templateString, templateFunc, nil)
}

func ExtractKeys(templateString string) []string {
	cursor := 0
	keys := []string{}
	len := len(templateString)
	for cursor < len {
		if templateString[cursor] == '$' && cursor+3 < len && templateString[cursor+1] == '{' {
			cursor += 2
			startIndex := cursor
			for cursor < len && templateString[cursor] != '}' {
				cursor++
			}
			if cursor < len {
				keys = append(keys, templateString[startIndex:cursor])
			}
		}
		cursor++
	}
	return keys
}

// NewWithFuncs function
func NewWithFuncs(templateString string, defaultTemplateFunc interface{}, templateFuncs map[string]interface{}) (*template.Template, error) {
	if templateString == "" {
		return nil, nil
	}
	// Default template
	// This basically transforms a string such as ${uesio.name} to {{ index . "uesio.name" }}
	// The second format is understood by Go's built-in templating language.
	templateFuncMap := template.FuncMap{
		defaultTemplateKey: defaultTemplateFunc,
	}

	validKeys := []string{
		defaultTemplateKey,
	}
	for key := range templateFuncs {
		validKeys = append(validKeys, key)
		templateFuncMap[key] = templateFuncs[key]
	}

	final := MergeTemplate(templateString, validKeys, func(mergeFunc string, mergeValue string) string {
		if mergeFunc == "" {
			mergeFunc = defaultTemplateKey
		}
		return "{{ " + mergeFunc + " . \"" + mergeValue + "\" }}"
	})

	return template.New("").Funcs(templateFuncMap).Parse(final)

}

func MergeTemplate(templateString string, validFuncKeys []string, templateFunc func(mergeFunc string, mergeValue string) string) string {
	re := regexp.MustCompile("\\$(" + strings.Join(validFuncKeys, "|") + "|)\\{(.*?)\\}")
	return re.ReplaceAllStringFunc(templateString, func(s string) string {
		parts := strings.SplitN(s, "{", 2)
		mergeFunc := strings.TrimPrefix(parts[0], "$")
		mergeValue := strings.TrimSuffix(parts[1], "}")
		return templateFunc(mergeFunc, mergeValue)
	})
}

// Execute function
func Execute(tmpl *template.Template, data interface{}) (string, error) {
	if tmpl != nil {
		var tpl bytes.Buffer
		err := tmpl.Execute(&tpl, data)
		if err != nil {
			return "", err
		}
		return tpl.String(), nil
	}

	return "", nil

}
