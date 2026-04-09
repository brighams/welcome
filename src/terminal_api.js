class TerminalAPI {
  constructor(term) {
    this.term = term
    this._inputEnabled = false
    this._currentLine = ''
    this._onInputCallback = null
  }

  get cols() {
    return this.term.cols
  }

  get rows() {
    return this.term.rows
  }

  write(text) {
    this.term.write(text)
  }

  writeln(text) {
    this.term.write(text + '\r\n')
  }

  plot(x, y, char, color = null) {
    if (color) {
      const r = parseInt(color.slice(1, 3), 16)
      const g = parseInt(color.slice(3, 5), 16)
      const b = parseInt(color.slice(5, 7), 16)
      this.term.write(`\x1b[${y + 1};${x + 1}H\x1b[38;2;${r};${g};${b}m${char}`)
    } else {
      this.term.write(`\x1b[${y + 1};${x + 1}H${char}`)
    }
  }

  clear() {
    this.term.reset()
  }

  reset() {
    this.term.reset()
  }

  async read() {
    return new Promise(resolve => {
      this._onInputCallback = resolve
      this._inputEnabled = true
    })
  }

  enableInput() {
    this._inputEnabled = true
  }

  disableInput() {
    this._inputEnabled = false
  }

  get inputEnabled() {
    return this._inputEnabled
  }

  set inputEnabled(value) {
    this._inputEnabled = value
  }

  _handleInput(line) {
    if (this._onInputCallback) {
      const callback = this._onInputCallback
      this._onInputCallback = null
      callback(line)
    }
  }

  get currentLine() {
    return this._currentLine
  }

  set currentLine(value) {
    this._currentLine = value
  }
}
