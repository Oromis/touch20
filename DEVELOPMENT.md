To see all events attached to the main game canvas:

```
canvas = document.getElementById('finalcanvas')
for (let key of Object.keys(getEventListeners(canvas))) {
    canvas.addEventListener(key, e => console.log(key, e))
}
``` 
