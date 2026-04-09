const ls = {
  name: 'ls',
  description: 'List all keys in localStorage',

  async execute(terminal_api, args) {
    const keys = Object.keys(localStorage)
    if (keys.length === 0) {
      terminal_api.write('localStorage is empty\r\n')
    } else {
      for (const key of keys) {
        const value = localStorage.getItem(key)
        const length = value ? value.length : 0
        const paddedKey = key.padEnd(20, ' ')
        terminal_api.write(`${paddedKey} ${length}\r\n`)
      }
    }

    if (window.keyTrie) {
      window.keyTrie.clear()
      for (const key of keys) {
        window.keyTrie.insert(key)
      }
    }
  }
}

const cat = {
  name: 'cat',
  description: 'Display value of localStorage key',

  async execute(terminal_api, args) {
    if (args.length === 0) {
      terminal_api.write('cat: missing key argument\r\n')
      terminal_api.write('Usage: cat <key>\r\n')
      return
    }

    const key = args[0]
    const value = localStorage.getItem(key)

    if (value === null) {
      terminal_api.write(`cat: ${key}: key not found\r\n`)
    } else {
      terminal_api.write(`${value}\r\n`)
    }
  }
}
