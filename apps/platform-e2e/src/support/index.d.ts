declare namespace Cypress {
  interface Chainable {
    loginWithAppAndWorkspace(
      appName: string,
      workspaceName: string,
    ): Chainable<void>
    loginWithAppAnd2Workspaces(
      appName: string,
      workspace1Name: string,
      workspace2Name: string,
    ): Chainable<void>
    login(): Chainable<void>
    visitRoute(route: string): Chainable<void>
    getByIdFragment(
      elementType: string,
      id: string,
      timeout?: number,
    ): Chainable
    setReferenceField(idFragment: string, value: string): Chainable<void>
    typeInInput(inputIdFragment: string, value: string): Chainable<void>
    typeInTextArea(inputIdFragment: string, value: string): Chainable<void>
    clearInput(inputIdFragment: string): Chainable<void>
    getInput(inputIdFragment: string): Chainable<void>
    clickButton(idFragment: string): Chainable<void>
    clickButtonIfExists(idFragment: string): Chainable<void>
    hasExpectedTableField(
      tableIdFragment: string,
      rowNumber: number,
      expectName: string,
      expectNamespace: string,
      expectType: string,
      expectLabel: string,
    ): Chainable<void>
    getComponentState(componentId: string): Chainable<void>
    getRoute(): Chainable<void>
    getWireState(viewId: string, wireName: string): Chainable<void>
    hotkey(hotkey: string): Chainable<void>
    changeSelectValue(
      selectElementIdFragment: string,
      value: string,
    ): Chainable<void>
    //   drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
    //   dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
    //   visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
  }
}
