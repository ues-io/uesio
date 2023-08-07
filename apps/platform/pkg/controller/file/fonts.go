package file

import "fmt"

func GetPreloadFontUrls() []string {
	return []string{
		GetFontURL("roboto/v20/roboto-latin-regular.woff2"),
		GetFontURL("roboto/v20/roboto-latin-300.woff2"),
		GetFontURL("roboto/v20/roboto-latin-500.woff2"),
		GetFontURL("gosha-sans/v1/GoshaSans-Regular.otf"),
		GetFontURL("material-symbols/v1/materialsymbols.woff2"),
	}
}

func GetFontURL(path string) string {
	return fmt.Sprintf(`%s/static/vendor/fonts/%s`, GetAssetsHost(), path)
}
