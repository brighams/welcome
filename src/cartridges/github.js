const github = {
  name: 'github',
  description: 'Open GitHub profile',

  async execute(terminal_api, args) {
    const url = 'https://github.com/brighams'

    if (window.musicPlaying && window.audio) {
      window.audio.pause()
      window.musicPlaying = false
    }

    window.pendingUrl = url
    terminal_api.write('...opening new window (y)? ')
  }
}
