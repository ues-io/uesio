package config

var inDevMode = false

func InDevMode() bool {
	return inDevMode
}

func SetDevMode(val bool) {
	inDevMode = val
}
