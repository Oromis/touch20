import './style/main.less'

import $ from 'jquery'

let activeMouseDown = null

let canvas = null
let editorWrapper = null

function sign(num) {
  if (num < 0) {
    return -1
  } else if (num > 0) {
    return 1
  } else {
    return 0
  }
}

function fakeTouchEvent(type, touch, recordActiveMouseDown = true) {
  if (typeof type === 'object') {
    type = {
      touchstart: 'mousedown',
      touchmove: 'mousemove',
      touchend: 'mouseup',
    }[event.type]
  }

  if (type == null) {
    return
  }

  const simulatedEvent = document.createEvent("MouseEvent");
  simulatedEvent.initMouseEvent(type, true, true, window, 1,
    touch.screenX, touch.screenY,
    touch.clientX, touch.clientY, false,
    false, false, false, 0/*left*/, null)

  touch.target.dispatchEvent(simulatedEvent)

  if (recordActiveMouseDown) {
    if (type === 'mousedown') {
      activeMouseDown = {
        screenX: touch.screenX,
        screenY: touch.screenY,
        clientX: touch.clientX,
        clientY: touch.clientY,
        target: touch.target,
      }
    } else if (type === 'mouseup') {
      activeMouseDown = null
    }
  }
}

let lastPositions = {}
let startPositions = {}

// No multi-touch support (for dragging dialogs etc)
function simpleTouchHandler(event) {
  fakeTouchEvent(event, event.changedTouches[0], false)
}

// The full touch handler with multi-touch pinching and panning support
function touchHandler(event) {
  if (event.touches.length <= 1) {
    fakeTouchEvent(event, event.changedTouches[0])
  } else if (activeMouseDown != null) {
    fakeTouchEvent('mouseup', activeMouseDown)
  }

  if (event.type === 'touchstart' || event.type === 'touchmove') {
    if (event.type === 'touchmove') {
      if (event.touches.length === 2 && Object.keys(lastPositions).length === 2) {
        // Two-finger touch move
        const dx1Start = event.touches[0].screenX - startPositions[event.touches[0].identifier].x
        const dx2Start = event.touches[1].screenX - startPositions[event.touches[1].identifier].x
        const dy1Start = event.touches[0].screenY - startPositions[event.touches[0].identifier].y
        const dy2Start = event.touches[1].screenY - startPositions[event.touches[1].identifier].y

        if (Math.abs(sign(dx1Start) - sign(dx2Start)) === 2 || Math.abs(sign(dy1Start) - sign(dy2Start)) === 2) {
          // Fingers move in opposite directions => zoom gesture
          const lastDistX = Math.abs(lastPositions[event.touches[0].identifier].x -
            lastPositions[event.touches[1].identifier].x)
          const lastDistY = Math.abs(lastPositions[event.touches[0].identifier].y -
            lastPositions[event.touches[1].identifier].y)
          const lastDist = Math.sqrt(lastDistX * lastDistX + lastDistY * lastDistY)

          const newDistX = Math.abs(event.touches[0].screenX - event.touches[1].screenX)
          const newDistY = Math.abs(event.touches[0].screenY - event.touches[1].screenY)
          const newDist = Math.sqrt(newDistX * newDistX + newDistY * newDistY)

          const factor = newDist / lastDist
          console.log(`Zoom factor: ${factor}`)

          const evt = new WheelEvent('mousewheel', {
            deltaY: (factor - 1) * -1000,
            altKey: true,
            bubbles: true,
            cancelable: true,
            x: event.x,
            y: event.y,
            layerX: event.layerX,
            layerY: event.layerY,
            clientX: event.clientX,
            clientY: event.clientY,
            screenX: event.screenX,
            screenY: event.screenY,
          })
          canvas.dispatchEvent(evt)
        } else {
          // Fingers move in the same direct => pan gesture
          const dx1 = event.touches[0].screenX - lastPositions[event.touches[0].identifier].x
          const dx2 = event.touches[1].screenX - lastPositions[event.touches[1].identifier].x
          const dy1 = event.touches[0].screenY - lastPositions[event.touches[0].identifier].y
          const dy2 = event.touches[1].screenY - lastPositions[event.touches[1].identifier].y

          const dx = (dx1 + dx2) / 2
          const dy = (dy1 + dy2) / 2

          editorWrapper.scrollLeft -= dx
          editorWrapper.scrollTop -= dy
        }
      }
    }

    // Take note of the last positions
    lastPositions = {}
    for (const touch of event.touches) {
      lastPositions[touch.identifier] = {
        x: touch.screenX,
        y: touch.screenY,
      }

      if (startPositions[touch.identifier] == null) {
        startPositions[touch.identifier] = {
          x: touch.screenX,
          y: touch.screenY,
        }
      }
    }
  } else {
    // touchend or touchcancel
    lastPositions = {}
    startPositions = {}
  }

  event.preventDefault()
}

$(document).ready(() => {
  canvas = document.getElementById('upperCanvas')
  if (canvas != null) {
    editorWrapper = document.getElementById('editor-wrapper')

    canvas.addEventListener("touchstart", touchHandler, true);
    canvas.addEventListener("touchmove", touchHandler, true);
    canvas.addEventListener("touchend", touchHandler, true);
    canvas.addEventListener("touchcancel", touchHandler, true);
    canvas.addEventListener('mousewheel', e => console.log(e))

    // Once a second, see whether a new dialog was opened. If that is the case,
    // then we'll add touch listeners to it as well to make it draggable.
    setInterval(() => {
      document.querySelectorAll('.ui-dialog').forEach(dialog => {
        if (dialog.getAttribute('data-touch20') == null) {
          dialog.setAttribute('data-touch20', 'true')
          dialog.querySelectorAll('.ui-dialog-titlebar').forEach(titlebar => {
            titlebar.addEventListener("touchstart", simpleTouchHandler, true);
            titlebar.addEventListener("touchmove", simpleTouchHandler, true);
            titlebar.addEventListener("touchend", simpleTouchHandler, true);
            titlebar.addEventListener("touchcancel", simpleTouchHandler, true);
          })
        }
      })
    }, 1000)
  }
})
