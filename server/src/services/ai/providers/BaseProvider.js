import { AIError } from '../errors/AIError.js';

export class BaseProvider {
  constructor(name) {
    if (new.target === BaseProvider) {
      throw new Error('BaseProvider is an abstract class and cannot be instantiated directly.');
    }
    this.name = name;
  }

  isAvailable() {
    return false;
  }

  async generateText() {
    throw new AIError(`generateText method not implemented on provider '${this.name}'`, {
      provider: this.name,
    });
  }

  async generateStructured(params) {
    const result = await this.generateText(params);
    return result;
  }
}
