// Main JavaScript file
console.log('Welcome page loaded');

const term = new Terminal({
    cursorBlink: true,
    fontSize: 18,
    fontFamily: 'Roboto Mono, monospace',
    theme: {
        foreground: '#39ff14',
        cursor: '#87CEEB'
    }
});

term.open(document.getElementById('terminal'));

let currentLine = ''
let prompt = '$'
let inputEnabled = false
let pendingUrl = null
let commandHistory = JSON.parse(localStorage.getItem('commandHistory') || '[]')
let historyIndex = -1
let debugMode = false
let matrixIntervalId = null
let isPaused = false

const commandTrie = new Trie()
const keyTrie = new Trie()

const commandNames = ['boot-loader', 'help', 'list', 'play', 'ls', 'cat', 'github', 'clear', 'reboot']
for (const cmd of commandNames) {
  commandTrie.insert(cmd)
}

const reloadKeyTrie = () => {
  keyTrie.clear()
  const keys = Object.keys(localStorage)
  for (const key of keys) {
    keyTrie.insert(key)
  }
}

reloadKeyTrie()

// Boot loader
setTimeout(() => {
    bootLoader();
}, 1000);

async function bootLoader() {
    term.write('............starkOS loading.....')

    const cols = term.cols
    const rows = term.rows
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?'

    let dotCount = 0
    const dotInterval = setInterval(() => {
        if (dotCount < 3) {
            term.write('.')
            dotCount++
        } else {
            term.write('\b\b\b   \b\b\b')
            dotCount = 0
        }
    }, 500)

    let frameCount = 0
    const message = 'HIRE ME'
    const letterSpacing = 1
    const messageWidth = (message.length * 8) + ((message.length - 1) * letterSpacing)
    const messageHeight = 8
    const startRow = Math.floor((rows - messageHeight) / 2)
    const startCol = Math.floor((cols - messageWidth) / 2)

    const drawFrame = () => {
        const showMessage = frameCount % 4 === 0

        if (showMessage) {
            for (let row = 3; row < rows - 2; row++) {
                for (let col = 2; col < cols - 2; col++) {
                    const randomChar = chars[Math.floor(Math.random() * chars.length)]
                    term.write(`\x1b[${row + 1};${col + 1}H\x1b[38;2;100;100;100m${randomChar}`)
                }
            }

            for (let i = 0; i < message.length; i++) {
                const letter = message[i]
                const letterData = pixelFont[letter]
                if (letterData) {
                    for (let y = 0; y < 8; y++) {
                        for (let x = 0; x < 8; x++) {
                            if (letterData[y][x] === 1) {
                                const row = startRow + y
                                const col = startCol + (i * (8 + letterSpacing)) + x
                                if (row >= 3 && row < rows - 2 && col >= 2 && col < cols - 2) {
                                    const randomChar = chars[Math.floor(Math.random() * chars.length)]
                                    term.write(`\x1b[${row + 1};${col + 1}H\x1b[38;2;0;0;0m${randomChar}`)
                                }
                            }
                        }
                    }
                }
            }
        } else {
            for (let row = 3; row < rows - 2; row++) {
                for (let col = 2; col < cols - 2; col++) {
                    const randomChar = chars[Math.floor(Math.random() * chars.length)]
                    const randomColor = neonColors[Math.floor(Math.random() * neonColors.length)]
                    term.write(`\x1b[${row + 1};${col + 1}H\x1b[38;2;${parseInt(randomColor.slice(1, 3), 16)};${parseInt(randomColor.slice(3, 5), 16)};${parseInt(randomColor.slice(5, 7), 16)}m${randomChar}`)
                }
            }
        }

        term.write(`\x1b[1;50HFrame: ${frameCount}`)
        term.write('\x1b[1;1H')
    }

    debugMode = true
    isPaused = false
    window.advanceFrame = () => {
        frameCount++
        drawFrame()
    }

    matrixIntervalId = setInterval(() => {
        frameCount++
        drawFrame()
    }, 100)

    setTimeout(() => {
        clearInterval(dotInterval)
        if (matrixIntervalId) {
            clearInterval(matrixIntervalId)
        }
        debugMode = false
        isPaused = false
        window.advanceFrame = null
        term.reset()
        const now = new Date()
        const dateTime = now.toLocaleString()
        term.write(`Welcome to starkOS ${dateTime}\r\n`)
        term.write('\r\n')
        cmdHelp()
        term.write('\r\n')
        term.write(prompt + ' ')
        inputEnabled = true
    }, 5000)
}

term.onData(e => {
    if (debugMode) {
        if (e === ' ') {
            if (!isPaused) {
                if (matrixIntervalId) {
                    clearInterval(matrixIntervalId)
                    matrixIntervalId = null
                }
                isPaused = true
            } else {
                if (window.advanceFrame) {
                    window.advanceFrame()
                }
            }
            return
        } else if (e === '\r') {
            if (isPaused) {
                matrixIntervalId = setInterval(() => {
                    if (window.advanceFrame) {
                        window.advanceFrame()
                    }
                }, 100)
                isPaused = false
            }
            return
        }
    }

    if (!inputEnabled) return

    switch (e) {
        case '\r': // Enter
            term.write('\r\n')
            if (pendingUrl) {
                const response = currentLine.trim().toLowerCase()
                if (response === 'y' || response === 'yes') {
                    window.open(pendingUrl, '_blank')
                    term.write('Opening...\r\n')
                } else {
                    term.write('Cancelled\r\n')
                }
                pendingUrl = null
                currentLine = ''
                term.write('\r\n')
                term.write(prompt + ' ')
            } else {
                if (currentLine.trim()) {
                    commandHistory.unshift(currentLine.trim())
                    if (commandHistory.length > 10) {
                        commandHistory.pop()
                    }
                    localStorage.setItem('commandHistory', JSON.stringify(commandHistory))
                    reloadKeyTrie()
                    handleCommand(currentLine.trim())
                }
                currentLine = ''
                historyIndex = -1
                term.write('\r\n')
                term.write(prompt + ' ')
            }
            break
        case '\u007F': // Backspace
            if (currentLine.length > 0) {
                currentLine = currentLine.slice(0, -1)
                term.write('\b \b')
            }
            break
        case '\t': // Tab
            if (!pendingUrl && currentLine.length > 0) {
                const parts = currentLine.split(' ')
                let matches = []
                let searchText = ''

                if (parts.length === 1) {
                    searchText = parts[0]
                    matches = commandTrie.search(searchText)
                } else if (parts.length === 2 && parts[0] === 'cat') {
                    searchText = parts[1]
                    matches = keyTrie.search(searchText)
                }

                if (matches.length === 1) {
                    term.write('\r' + prompt + ' ' + ' '.repeat(currentLine.length) + '\r' + prompt + ' ')
                    if (parts.length === 1) {
                        currentLine = matches[0]
                    } else {
                        currentLine = parts[0] + ' ' + matches[0]
                    }
                    term.write(currentLine)
                } else if (matches.length > 1) {
                    term.write('\r\n')
                    for (const match of matches) {
                        term.write(`${match}  `)
                    }
                    term.write('\r\n')
                    term.write(prompt + ' ' + currentLine)
                }
            }
            break
        case '\x1b[A': // Up arrow
            if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
                historyIndex++
                term.write('\r' + prompt + ' ' + ' '.repeat(currentLine.length) + '\r' + prompt + ' ')
                currentLine = commandHistory[historyIndex]
                term.write(currentLine)
            }
            break
        case '\x1b[B': // Down arrow
            if (historyIndex > 0) {
                historyIndex--
                term.write('\r' + prompt + ' ' + ' '.repeat(currentLine.length) + '\r' + prompt + ' ')
                currentLine = commandHistory[historyIndex]
                term.write(currentLine)
            } else if (historyIndex === 0) {
                historyIndex = -1
                term.write('\r' + prompt + ' ' + ' '.repeat(currentLine.length) + '\r' + prompt + ' ')
                currentLine = ''
            }
            break
        default:
            if (e >= String.fromCharCode(0x20) && e <= String.fromCharCode(0x7E)) {
                currentLine += e
                term.write(e)
            }
    }
})

function handleCommand(cmd) {
    const parts = cmd.split(' ')
    const command = parts[0]
    const args = parts.slice(1)

    const commands = {
        'boot-loader': bootLoader,
        'help': cmdHelp,
        'list': cmdList,
        'play': cmdPlay,
        'ls': cmdLs,
        'cat': cmdCat,
        'github': cmdGithub,
        'clear': cmdClear,
        'reboot': cmdReboot
    }

    if (commands[command]) {
        commands[command](args)
    } else {
        term.write(`Command not found: ${cmd}\r\n`)
        term.write(`  type help: ${cmd}\r\n`)
    }
}

function cmdHelp() {
    term.write('StarkOS System III bootrev0.32AA\r\n');
    term.write('16K RAM\r\n');
    term.write('32K ROM\r\n');
    term.write('SUPERVISOR: OFF\r\n');
    term.write('\r\n');
    term.write('Type `list` to see available commands\r\n');
}

function cmdList() {
    term.write('Available commands:\r\n')
    term.write('  help       - Display system information\r\n')
    term.write('  list       - Show this list of commands\r\n')
    term.write('  play       - Play the arcade game Starkeeper One\r\n')
    term.write('  ls         - List all keys in localStorage\r\n')
    term.write('  cat <key>  - Display value of localStorage key\r\n')
    term.write('  github     - Open GitHub profile\r\n')
    term.write('  clear      - Clear the terminal\r\n')
    term.write('  reboot     - Reboot the system\r\n')
}

const cmdClear = () => {
    term.reset()
    term.write(prompt + ' ')
}

const cmdReboot = () => {
    inputEnabled = false
    term.reset()
    bootLoader()
}

const cmdLs = () => {
    const keys = Object.keys(localStorage)
    if (keys.length === 0) {
        term.write('localStorage is empty\r\n')
    } else {
        for (const key of keys) {
            const value = localStorage.getItem(key)
            const length = value ? value.length : 0
            const paddedKey = key.padEnd(20, ' ')
            term.write(`${paddedKey} ${length}\r\n`)
        }
    }
}

const cmdCat = (args) => {
    if (args.length === 0) {
        term.write('cat: missing key argument\r\n')
        term.write('Usage: cat <key>\r\n')
        return
    }

    const key = args[0]
    const value = localStorage.getItem(key)

    if (value === null) {
        term.write(`cat: ${key}: key not found\r\n`)
    } else {
        term.write(`${value}\r\n`)
    }
}

const openUrl = (url) => {
    pendingUrl = url
    term.write('...opening new window (y)? ')
}

function cmdPlay() {
    openUrl('https://brighams.github.io/StarCastle/')
}

const cmdGithub = () => {
    openUrl('https://github.com/brighams')
}

// Scrolling text manager
class ScrollingText {
    constructor(element, message, maxChars, speed, color, direction) {
        this.element = element;
        this.message = message;
        this.maxChars = maxChars;
        this.position = 0;
        this.direction = direction || 'left';

        // Apply color and width
        this.element.style.color = color;
        this.element.style.width = maxChars + 'ch';

        this.interval = setInterval(() => this.update(), speed);
    }

    update() {
        let displayText;

        switch(this.direction) {
            case 'left':
                displayText = (this.message + '     ').substring(this.position, this.position + this.maxChars);
                this.position++;
                if (this.position > this.message.length + 5) {
                    this.position = 0;
                }
                break;
            case 'right':
                displayText = (this.message + '     ').substring(this.position, this.position + this.maxChars);
                this.position--;
                if (this.position < 0) {
                    this.position = this.message.length + 5;
                }
                break;
            case 'up':
            case 'down':
                // For vertical scrolling, display one character at a time
                displayText = this.message.charAt(this.position % this.message.length);
                this.position += (this.direction === 'down' ? 1 : -1);
                if (this.position < 0) this.position = this.message.length - 1;
                if (this.position >= this.message.length) this.position = 0;
                break;
        }

        this.element.textContent = displayText;
    }

    stop() {
        clearInterval(this.interval);
    }
}

// Initialize scrolling text instances from HTML data attributes
document.querySelectorAll('.scrolling-container').forEach(element => {
    const message = element.getAttribute('data-message');
    const color = element.getAttribute('data-color');
    const maxChars = parseInt(element.getAttribute('data-max-chars')) || 20;
    const speed = parseInt(element.getAttribute('data-speed')) || 200;
    const direction = element.getAttribute('data-direction') || 'left';

    new ScrollingText(element, message, maxChars, speed, color, direction);
});
