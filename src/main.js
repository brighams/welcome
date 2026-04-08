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

let currentLine = '';
let prompt = '$';
let inputEnabled = false;

// Boot loader
setTimeout(() => {
    bootLoader();
}, 1000);

async function bootLoader() {
    term.write('starkOS loading');

    let dotCount = 0;
    const dotInterval = setInterval(() => {
        if (dotCount < 3) {
            term.write('.');
            dotCount++;
        } else {
            term.write('\b\b\b   \b\b\b');
            dotCount = 0;
        }
    }, 500);

    setTimeout(() => {
        clearInterval(dotInterval);
        const now = new Date();
        const dateTime = now.toLocaleString();
        term.write('\r\n');
        term.write(`Welcome to starkOS ${dateTime}\r\n`);
        term.write('\r\n');
        term.write(prompt + ' ');
        inputEnabled = true;
    }, 5000);
}

term.onData(e => {
    if (!inputEnabled) return;

    switch (e) {
        case '\r': // Enter
            term.write('\r\n');
            if (currentLine.trim()) {
                handleCommand(currentLine.trim());
            }
            currentLine = '';
            term.write('\r\n');
            term.write(prompt + ' ');
            break;
        case '\u007F': // Backspace
            if (currentLine.length > 0) {
                currentLine = currentLine.slice(0, -1);
                term.write('\b \b');
            }
            break;
        default:
            if (e >= String.fromCharCode(0x20) && e <= String.fromCharCode(0x7E)) {
                currentLine += e;
                term.write(e);
            }
    }
});

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
        'cat': cmdCat
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
    term.write('Type list to see a list of commands\r\n');
}

function cmdList() {
    term.write('Available commands:\r\n')
    term.write('  help       - Display system information\r\n')
    term.write('  list       - Show this list of commands\r\n')
    term.write('  play       - Play the arcade game Starkeeper One\r\n')
    term.write('  ls         - List all keys in localStorage\r\n')
    term.write('  cat <key>  - Display value of localStorage key\r\n')
}

const cmdLs = () => {
    const keys = Object.keys(localStorage)
    if (keys.length === 0) {
        term.write('localStorage is empty\r\n')
    } else {
        for (const key of keys) {
            term.write(`${key}\r\n`)
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

function cmdPlay() {
    term.write('Launching Starkeeper One...\r\n');
    window.open('https://brighams.github.io/StarCastle/', '_blank');
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
