// Main JavaScript file
console.log('Welcome page loaded');

const term = new Terminal({
    cursorBlink: true,
    fontSize: 18,
    fontFamily: 'Roboto Mono, monospace',
    theme: {
        foreground: '#39ff14'
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
    const commands = {
        'boot-loader': bootLoader
    };

    if (commands[cmd]) {
        commands[cmd]();
    } else {
        term.write(`Command not found: ${cmd}\r\n`);
    }
}
