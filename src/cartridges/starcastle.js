

const isLocalhost = () => {
  const hostname = window.location.hostname;
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]'
  );
}


const starcastle = {
  name: 'starcastle',
  description: 'Play STARKEEPER ONE',


  execute(terminal_api, args) {
    return new Promise(resolve => {
      const terminal = document.getElementById('terminal')
      terminal.style.position = 'relative'

      const overlay = document.createElement('div')
      overlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:100;background:#000;'

      const iframe = document.createElement('iframe')
      if (isLocalhost()) {
        iframe.src = '/starcastle/index.html'
      } else {
        iframe.src = '/starcastle/'
      }
      iframe.style.cssText = 'width:100%;height:100%;border:none;display:block;'


      const close = () => {
        overlay.remove()
        document.removeEventListener('keydown', handle_keydown)
        window.removeEventListener('message', handle_message)
        resolve()
      }

      const handle_keydown = (e) => {
        if (e.key === 'Escape') close()
      }

      const handle_message = (e) => {
        if (e.data?.type === 'starcastle-exit') close()
      }

      document.addEventListener('keydown', handle_keydown)
      window.addEventListener('message', handle_message)

      overlay.appendChild(iframe)
      terminal.appendChild(overlay)
    })
  }
}
