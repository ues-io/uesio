package file

var assetsPath = ""
var fontsPath = ""

func SetAssetsPath(path string) {
	assetsPath = path
}

func GetAssetsPath() string {
	return assetsPath
}

func SetFontsPath(path string) {
	fontsPath = path
}

func GetFontsPath() string {
	return fontsPath
}
