const music = {
  name: 'music',
  description: 'Play relaxing background music',

  async execute(terminal_api, args) {
    if (!window.audio) {
      window.audio = new Audio('./public/sound/orbit-d0d-main-version-29627-02-39.mp3')
      window.audio.loop = true
      window.audio.volume = 0.5
    }

    if (window.musicPlaying) {
      window.audio.pause()
      window.musicPlaying = false
      terminal_api.write('Music stopped\r\n')
    } else {
      try {
        await window.audio.play()
        window.musicPlaying = true
        terminal_api.write('Music playing\r\n')
      } catch (error) {
        terminal_api.write('Failed to play music\r\n')
      }
    }
  }
}
