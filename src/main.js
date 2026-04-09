console.log('Welcome page loaded')

const term = new Terminal({
  cursorBlink: true,
  fontSize: 18,
  fontFamily: 'Roboto Mono, monospace',
  theme: {
    foreground: '#39ff14',
    cursor: '#87CEEB'
  }
})

term.open(document.getElementById('terminal'))

const terminal_api = new TerminalAPI(term)
window.terminalAPI = terminal_api

const cartridge_system = new CartridgeSystem()
window.cartridgeSystem = cartridge_system

cartridge_system.register(bootloader)
cartridge_system.register(help_cartridge)
cartridge_system.register(list_cartridge)
cartridge_system.register(clear_cartridge)
cartridge_system.register(reboot_cartridge)
cartridge_system.register(github)
cartridge_system.register(starcastle)
cartridge_system.register(music)
cartridge_system.register(ls)
cartridge_system.register(cat)

let command_history = JSON.parse(localStorage.getItem('commandHistory') || '[]')
let history_index = -1
let pending_url = null
window.pendingUrl = null
window.musicPlaying = false
window.audio = null

const key_trie = new Trie()
window.keyTrie = key_trie

const reload_key_trie = () => {
  key_trie.clear()
  const keys = Object.keys(localStorage)
  for (const key of keys) {
    key_trie.insert(key)
  }
}

reload_key_trie()

term.onData(async e => {
  if (terminal_api._debugInputHandler) {
    const handled = terminal_api._debugInputHandler(e)
    if (handled) return
  }

  if (!terminal_api.inputEnabled) return

  switch (e) {
    case '\r':
      term.write('\r\n')
      if (window.pendingUrl) {
        const response = terminal_api.currentLine.trim().toLowerCase()
        if (response === 'y' || response === 'yes') {
          window.open(window.pendingUrl, '_blank')
          term.write('Opening...\r\n')
        } else {
          term.write('Cancelled\r\n')
        }
        window.pendingUrl = null
        terminal_api.currentLine = ''
        term.write('\r\n')
        term.write('$ ')
      } else {
        const line = terminal_api.currentLine.trim()
        terminal_api.currentLine = ''
        history_index = -1

        if (line) {
          command_history.unshift(line)
          if (command_history.length > 10) {
            command_history.pop()
          }
          localStorage.setItem('commandHistory', JSON.stringify(command_history))
          reload_key_trie()

          const parts = line.split(' ')
          const command = parts[0]
          const args = parts.slice(1)

          const executed = await cartridge_system.execute(command, terminal_api, args)
          if (!executed) {
            term.write(`Command not found: ${line}\r\n`)
            term.write(`  type list\r\n`)
          }
        }
        term.write('\r\n')
        if (terminal_api.inputEnabled) {
          term.write('$ ')
        }
      }
      break
    case '\u007F':
      if (terminal_api.currentLine.length > 0) {
        terminal_api.currentLine = terminal_api.currentLine.slice(0, -1)
        term.write('\b \b')
      }
      break
    case '\t':
      if (!window.pendingUrl && terminal_api.currentLine.length > 0) {
        const parts = terminal_api.currentLine.split(' ')
        let matches = []
        let searchText = ''

        if (parts.length === 1) {
          searchText = parts[0]
          matches = cartridge_system.autocomplete(searchText)
        } else if (parts.length === 2 && parts[0] === 'cat') {
          searchText = parts[1]
          matches = key_trie.search(searchText)
        }

        if (matches.length === 1) {
          term.write('\r$ ' + ' '.repeat(terminal_api.currentLine.length) + '\r$ ')
          if (parts.length === 1) {
            terminal_api.currentLine = matches[0]
          } else {
            terminal_api.currentLine = parts[0] + ' ' + matches[0]
          }
          term.write(terminal_api.currentLine)
        } else if (matches.length > 1) {
          term.write('\r\n')
          for (const match of matches) {
            term.write(`${match}  `)
          }
          term.write('\r\n')
          term.write('$ ' + terminal_api.currentLine)
        }
      }
      break
    case '\x1b[A':
      if (command_history.length > 0 && history_index < command_history.length - 1) {
        history_index++
        term.write('\r$ ' + ' '.repeat(terminal_api.currentLine.length) + '\r$ ')
        terminal_api.currentLine = command_history[history_index]
        term.write(terminal_api.currentLine)
      }
      break
    case '\x1b[B':
      if (history_index > 0) {
        history_index--
        term.write('\r$ ' + ' '.repeat(terminal_api.currentLine.length) + '\r$ ')
        terminal_api.currentLine = command_history[history_index]
        term.write(terminal_api.currentLine)
      } else if (history_index === 0) {
        history_index = -1
        term.write('\r$ ' + ' '.repeat(terminal_api.currentLine.length) + '\r$ ')
        terminal_api.currentLine = ''
      }
      break
    default:
      if (e >= String.fromCharCode(0x20) && e <= String.fromCharCode(0x7E)) {
        terminal_api.currentLine += e
        term.write(e)
      }
  }
})

setTimeout(() => {
  cartridge_system.execute('boot-loader', terminal_api)
}, 1000)

class ScrollingText {
  constructor(element, message, maxChars, speed, color, direction) {
    this.element = element
    this.message = message
    this.maxChars = maxChars
    this.position = 0
    this.direction = direction || 'left'

    this.element.style.color = color
    this.element.style.width = maxChars + 'ch'

    this.interval = setInterval(() => this.update(), speed)
  }

  update() {
    let displayText

    switch(this.direction) {
      case 'left':
        displayText = (this.message + '     ').substring(this.position, this.position + this.maxChars)
        this.position++
        if (this.position > this.message.length + 5) {
          this.position = 0
        }
        break
      case 'right':
        displayText = (this.message + '     ').substring(this.position, this.position + this.maxChars)
        this.position--
        if (this.position < 0) {
          this.position = this.message.length + 5
        }
        break
      case 'up':
      case 'down':
        displayText = this.message.charAt(this.position % this.message.length)
        this.position += (this.direction === 'down' ? 1 : -1)
        if (this.position < 0) this.position = this.message.length - 1
        if (this.position >= this.message.length) this.position = 0
        break
    }

    this.element.textContent = displayText
  }

  stop() {
    clearInterval(this.interval)
  }
}

document.querySelectorAll('.scrolling-container').forEach(element => {
  const message = element.getAttribute('data-message')
  const color = element.getAttribute('data-color')
  const maxChars = parseInt(element.getAttribute('data-max-chars')) || 20
  const speed = parseInt(element.getAttribute('data-speed')) || 200
  const direction = element.getAttribute('data-direction') || 'left'

  new ScrollingText(element, message, maxChars, speed, color, direction)
})
