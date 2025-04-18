import { getAppBasePath } from "./paths"

const alphabet = "abcdefghijklmnopqrstuvwxyz"

function getRandomLowercaseAlphabetLetter() {
  const randomIndex = Math.floor(Math.random() * alphabet.length)
  return alphabet[randomIndex]
}

export function getUniqueAppName() {
  const randomLetters = Array.from(
    { length: 8 },
    getRandomLowercaseAlphabetLetter,
  ).join("")
  return `tests_e2e_${randomLetters}`
}

export function deleteApp(appName: string) {
  cy.visitRoute(`${getAppBasePath(appName)}/settings`)
  cy.clickButton("delete-app")
  cy.clickButton("confirm-delete-app")
}
