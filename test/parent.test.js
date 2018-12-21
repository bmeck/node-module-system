describe('parent should not be Node builtin Module', () => {
  function createModuleSystem() {
    const { createModuleSystem } = require('../lib/index.js');
    // create a module system that only has modules that
    // export themselves
    const cache = new Map();
    return createModuleSystem(
      (referrer, specifier) => specifier,
      (resolved) => cache.get(resolved),
      (newModule, resolved) => {
        newModule.exports = newModule;
      }
    );
  }
  test('runMain child should be instance of virtual Module', () => {
    const VirtualModule = createModuleSystem();
    const main = VirtualModule.runMain('root');
    const child = main.require('child');
    expect(child).toBeInstanceOf(VirtualModule);
    expect(child.parent).toBe(main);
  });
  test('free root child should be instance of virtual Module', () => {
    const VirtualModule = createModuleSystem();
    const main = new VirtualModule('root', null);
    const child = main.require('child');
    expect(child).toBeInstanceOf(VirtualModule);
    expect(child.parent).toBe(main);
  });
});
