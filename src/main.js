import './style/main.less'

import $ from 'jquery'
import screenfull from 'screenfull'

const longTouchDurationMs = 800;
const longTouchThreshholdPx = 5;
const mouseButtons = {
  left: 0,
  right: 2
};

let activeMouseDown = null;
let canvas = null;
let editorWrapper = null;
let holdTimer = null;
let lastPositions = {};
let longTouchPrimed = false;
let startPositions = {};
let storedTouchStartEvent = null;

function sign(num) {
  if (num < 0) {
    return -1
  } else if (num > 0) {
    return 1
  } else {
    return 0
  }
}

function fakeTouchEvent(type, touch, mouseButton, recordActiveMouseDown = true) {
  console.log(type);
  if (typeof type === 'object') {
    type = {
      touchstart: 'mousedown',
      touchmove: 'mousemove',
      touchend: 'mouseup',
    }[type.type]
  }

  if (type == null) {
    return
  }

  const simulatedEvent = document.createEvent("MouseEvent");
  simulatedEvent.initMouseEvent(type, true, true, window, 1,
    touch.screenX, touch.screenY,
    touch.clientX, touch.clientY, false,
    false, false, false, mouseButton, null)

  touch.target.dispatchEvent(simulatedEvent);
  
  
  var toolbar = document.getElementById('floatingtoolbar');
  // dirty hack for sticky hover on touch suggested here: 
  //    https://stackoverflow.com/questions/17233804/how-to-prevent-sticky-hover-effects-for-buttons-on-touch-devices
  if(touch.target.id === 'finalcanvas' && toolbar && toolbar.matches(':hover')) {
    var toolbar = document.getElementById('floatingtoolbar');
    var toolbarParent = toolbar.parentNode;
    var next = toolbar.nextSibling;
    toolbarParent.removeChild(toolbar);
    setTimeout(function() { toolbarParent.insertBefore(toolbar, next); }, 0);
  }

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

function resetLongTouch() {
  clearTimeout(holdTimer);
  holdTimer = null;
  longTouchPrimed = false;
}

// No multi-touch support (for dragging dialogs etc)
function simpleTouchHandler(event) {
  fakeTouchEvent(event, event.changedTouches[0], mouseButtons.left, false)
}

// The full touch handler with multi-touch pinching and panning support
function touchHandler(event) {
  /*if (event.touches.length <= 1) {
    fakeTouchEvent(event, event.changedTouches[0], mouseButtons.left)
  } else if (activeMouseDown != null) {
    fakeTouchEvent('mouseup', activeMouseDown, mouseButtons.left)
  }*/

  if (event.type === 'touchstart' || event.type === 'touchmove') {
    if (event.type === 'touchmove') {
      if (event.touches.length === 1 && Object.keys(lastPositions).length === 1 && storedTouchStartEvent !== null) {
        // Check if we're exceeding the long touch movement threshhold. If we are, trigger the stored event.
        const dxStart = event.touches[0].screenX - startPositions[event.touches[0].identifier].x;
        const dyStart = event.touches[0].screenY - startPositions[event.touches[0].identifier].y;
        if (Math.abs(dxStart) > longTouchThreshholdPx || Math.abs(dyStart) > longTouchThreshholdPx) {
          fakeTouchEvent(storedTouchStartEvent, storedTouchStartEvent.changedTouches[0], mouseButtons.left, true);
          storedTouchStartEvent = null;
          resetLongTouch();
        }
      }
      else if (event.touches.length === 2 && Object.keys(lastPositions).length === 2) {
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
            deltaY: (factor - 1) * 1000,
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
      
      if (event.touches.length === 1 && activeMouseDown != null) {
        fakeTouchEvent(event, event.changedTouches[0], mouseButtons.left, false);
      }
    }
    else {
      // touchstart
      if (event.touches.length === 1) {
        storedTouchStartEvent = event;
        holdTimer = setTimeout(function() {
          longTouchPrimed = true; }, longTouchDurationMs);
      }
      else {
        storedTouchStartEvent = null;
        resetLongTouch();
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
  } 
  else {
    // touchend or touchcancel
    if (event.type === 'touchend' && longTouchPrimed && event.touches.length === 0) {
      fakeTouchEvent(storedTouchStartEvent, storedTouchStartEvent.changedTouches[0], mouseButtons.right);
      fakeTouchEvent(event, event.changedTouches[0], mouseButtons.right);
    }
    else if (event.touches.length <= 1) {
      if (activeMouseDown == null && storedTouchStartEvent != null) {
        fakeTouchEvent(storedTouchStartEvent, storedTouchStartEvent.changedTouches[0], mouseButtons.left);
      }
      fakeTouchEvent(event, event.changedTouches[0], mouseButtons.left);
    }
    lastPositions = {};
    startPositions = {};
    resetLongTouch();
  }

  event.preventDefault();
}

$(document).ready(() => {
  canvas = document.getElementById('finalcanvas')
  if (canvas != null) {
    editorWrapper = document.getElementById('editor-wrapper')

    canvas.addEventListener("touchstart", touchHandler, true);
    canvas.addEventListener("touchmove", touchHandler, true);
    canvas.addEventListener("touchend", touchHandler, true);
    canvas.addEventListener("touchcancel", touchHandler, true);
    var library = document.getElementById('libraryfolderroot');
    library.addEventListener("touchstart", simpleTouchHandler, true);
    library.addEventListener("touchmove", simpleTouchHandler, true);
    library.addEventListener("touchend", simpleTouchHandler, true);
    library.addEventListener("touchcancel", simpleTouchHandler, true);
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

    // Add a fullscreen toggle button
    const toolbar = document.querySelector('#floatingtoolbar > ul')
    if (toolbar != null) {
      const fullscreenButton = document.createElement('li')
      const fsIcon = document.createElement('img')
      fsIcon.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAD/SURBVGhD7dg9agJBHIbxTaEkCopViE3A3sYTBDyBoBJyiNxEwUMEJYdI5SXEO0Txo018ZsRGZmX/yrCi7wM/cAoH38rVRCl13z2gZlDFORURui9NGabcB/s3msDSK1YI3ZXmC6YOQ/7wm9EQlp4xQ+iuYxtcNGTpT/n3AQ3RkAhpiIZESkNuZkgF7o0Lf8q/d5w1xDWG9bEjVi+You9PSimllFLqamqgvn95FbXwtH+ZvQLWmPtT/rXhHuNH/mRIvxAjpSEaEikN0ZBIachhyBa9DLpw/z1Ze0PovmPuG/2iIRY/sNRE6J5TzENK+DbqwNIjBgjdleYTSqn7LUl2Bci5+aD+MsEAAAAASUVORK5CYII='
      fullscreenButton.appendChild(fsIcon)
      toolbar.appendChild(fullscreenButton)

      fullscreenButton.addEventListener('click', () => {
        screenfull.toggle(document.documentElement)
      })
    }
  }
})
