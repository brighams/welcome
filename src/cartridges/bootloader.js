const bootloader = {
  name: 'boot-loader',
  description: 'Boot the system and run the shell',

  async execute(terminal_api, args) {
    terminal_api.write('...starkOS loading')

    const cols = terminal_api.cols
    const rows = terminal_api.rows
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?'

    let dotCount = 0
    const dotInterval = setInterval(() => {
      if (dotCount < 3) {
        terminal_api.write('.')
        dotCount++
      } else {
        terminal_api.write('\b\b\b   \b\b\b')
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

    const draw_frame = () => {
      for (let row = 3; row < rows - 2; row++) {
        for (let col = 2; col < cols - 2; col++) {
          const randomChar = chars[Math.floor(Math.random() * chars.length)]
          const randomColor = neonDimColors[Math.floor(Math.random() * neonDimColors.length)]
          terminal_api.plot(col, row, randomChar, randomColor)
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
                  terminal_api.plot(col, row, randomChar, '#000000')
                }
              }
            }
          }
        }
      }

      terminal_api.write(`\x1b[1;50HFrame: ${frameCount}`)
      terminal_api.write('\x1b[1;1H')
    }

    let debug_mode = true
    let is_paused = false
    let animation_complete = false
    const animation_start_time = Date.now()
    const animation_duration = 5000
    let remaining_time = animation_duration

    window.advanceFrame = () => {
      frameCount++
      draw_frame()
    }

    const matrix_interval_id = setInterval(() => {
      frameCount++
      draw_frame()
    }, 100)

    const end_animation = () => {
      clearInterval(dotInterval)
      clearInterval(matrix_interval_id)
      debug_mode = false
      is_paused = false
      animation_complete = false
      window.advanceFrame = null
      terminal_api._debugInputHandler = null

      setTimeout(() => {
        let clearRow = 3
        const collapseInterval = setInterval(() => {
          if (clearRow < rows - 2) {
            for (let col = 2; col < cols - 2; col++) {
              terminal_api.write(`\x1b[${clearRow + 1};${col + 1}H `)
            }
            clearRow++
          } else {
            clearInterval(collapseInterval)
            terminal_api.reset()
            const now = new Date()
            const dateTime = now.toLocaleString()
            terminal_api.write(`Welcome to starkOS ${dateTime}\r\n`)
            terminal_api.write('\r\n')
            show_help()
            terminal_api.write('\r\n')
            terminal_api.write('$ ')
            terminal_api.inputEnabled = true
          }
        }, 30)
      }, 1000)
    }

    const animation_timeout_id = setTimeout(() => {
      animation_complete = true
      if (!is_paused) {
        end_animation()
      }
    }, animation_duration)

    const handle_debug_input = e => {
      if (e === ' ') {
        if (!is_paused) {
          clearInterval(matrix_interval_id)
          clearTimeout(animation_timeout_id)
          remaining_time = animation_duration - (Date.now() - animation_start_time)
          is_paused = true
        } else {
          if (window.advanceFrame) {
            window.advanceFrame()
          }
        }
        return true
      } else if (e === '\r') {
        if (is_paused) {
          if (animation_complete) {
            end_animation()
          } else {
            setInterval(() => {
              if (window.advanceFrame) {
                window.advanceFrame()
              }
            }, 100)
            setTimeout(() => {
              animation_complete = true
              if (!is_paused) {
                end_animation()
              }
            }, remaining_time)
            is_paused = false
          }
        }
        return true
      }
      return false
    }

    terminal_api._debugInputHandler = debug_mode ? handle_debug_input : null
  }
}

const show_help = () => {
  const terminal_api = window.terminalAPI
  terminal_api.write('StarkOS System III bootrev0.32AA\r\n')
  terminal_api.write('16K RAM\r\n')
  terminal_api.write('32K ROM\r\n')
  terminal_api.write('SUPERVISOR: OFF\r\n')
  terminal_api.write('\r\n')
  terminal_api.write('Type `list` to see available commands\r\n')
}

const list_commands = () => {
  const terminal_api = window.terminalAPI
  const cartridges = window.cartridgeSystem.list()

  terminal_api.write('Available commands:\r\n')
  for (const cartridge of cartridges) {
    const name = cartridge.name.padEnd(15, ' ')
    terminal_api.write(`  ${name} - ${cartridge.description}\r\n`)
  }
}

const clear_terminal = () => {
  const terminal_api = window.terminalAPI
  terminal_api.reset()
}

const reboot_system = () => {
  const terminal_api = window.terminalAPI
  terminal_api.inputEnabled = false
  terminal_api.reset()
  window.cartridgeSystem.execute('boot-loader', terminal_api)
}

const help_cartridge = {
  name: 'help',
  description: 'Display system information',
  execute: async (terminal_api, args) => {
    show_help()
  }
}

const list_cartridge = {
  name: 'list',
  description: 'Show available commands',
  execute: async (terminal_api, args) => {
    list_commands()
  }
}

const clear_cartridge = {
  name: 'clear',
  description: 'Clear the terminal',
  execute: async (terminal_api, args) => {
    clear_terminal()
  }
}

const reboot_cartridge = {
  name: 'reboot',
  description: 'Reboot the system',
  execute: async (terminal_api, args) => {
    reboot_system()
  }
}
