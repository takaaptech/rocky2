export default class ViewController {
  constructor() {
    this.controllers = {};
  }

  register(controller) {
    this.controllers[controller.type] = controller.view;
  }

  unRegister(type) {
    if (this.controllers[type]) {
      delete this.controllers[type];
    }
  }

  reset() {
    this.controllers = {};
  }

  getView(type) {
    return this.controllers[type];
  }
}
