const JSDOMEnvironment = require('jest-environment-jsdom').default;

class JSDOMEnvironmentWithFetch extends JSDOMEnvironment {
  async setup() {
    await super.setup();
    // Copy Node's native fetch globals into jsdom window
    if (typeof fetch !== 'undefined') {
      this.global.fetch = fetch;
    }
    if (typeof Response !== 'undefined') {
      this.global.Response = Response;
    }
    if (typeof Request !== 'undefined') {
      this.global.Request = Request;
    }
    if (typeof Headers !== 'undefined') {
      this.global.Headers = Headers;
    }
  }
}

module.exports = JSDOMEnvironmentWithFetch;
