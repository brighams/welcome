class CartridgeSystem {
  constructor() {
    this.cartridges = new Map()
    this.commandTrie = new Trie()
  }

  register(cartridge) {
    if (!cartridge.name || !cartridge.execute) {
      throw new Error('Cartridge must have name and execute properties')
    }

    this.cartridges.set(cartridge.name, cartridge)
    this.commandTrie.insert(cartridge.name)
  }

  get(name) {
    return this.cartridges.get(name)
  }

  has(name) {
    return this.cartridges.has(name)
  }

  list() {
    return Array.from(this.cartridges.values())
  }

  autocomplete(prefix) {
    return this.commandTrie.search(prefix)
  }

  async execute(name, terminal_api, args = []) {
    const cartridge = this.cartridges.get(name)
    if (!cartridge) {
      return false
    }

    await cartridge.execute(terminal_api, args)
    return true
  }
}
