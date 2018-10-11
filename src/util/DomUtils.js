import _ from 'lodash';

export default {
  removeClasses(element, pattern) {
    let toRemove = [];
    element.classList.forEach(clazz => {
      if(clazz.match(pattern)) {
        toRemove.push(clazz);
      }
    });
    _.each(toRemove, clazz => element.classList.remove(clazz));
  },

  inlineImages(element) {
    return Promise.all(_.map(element.querySelectorAll('img'), imgTag => {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.setAttribute('crossOrigin', 'anonymous')

        img.onload = function () {
          const canvas = document.createElement("canvas")
          canvas.width = img.width
          canvas.height = img.height

          const ctx = canvas.getContext("2d")
          ctx.drawImage(img, 0, 0)

          const dataURL = canvas.toDataURL("image/png")
          imgTag.src = dataURL

          console.log('Image inlined successfully.')

          setTimeout(resolve, 0)
        };

        img.onerror = () => {
          console.warn('Could not inline image. Ignoring ...')
          resolve()
        }

        img.src = imgTag.src
      })
    }))
  }
};