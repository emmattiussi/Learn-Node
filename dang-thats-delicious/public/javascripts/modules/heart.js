import axios from 'axios'
import { $ } from './bling'

function ajaxHeart(e) {
  e.preventDefault()
  axios
    .post(this.action)
    .then(res => {
      const isHearted = this.heart.classList.toggle('heart__button--hearted') //accesses elements within heart form tag with name of heart
      $('.heart-count').textContent = res.data.hearts.length;
      if (isHearted) {
        this.heart.classList.add('heart__button--float')
        setTimeout(() => this.heart.classList.remove('heart__button--float'), 2500) // remove invisible hearts
      }
    })
    .catch(console.error)
}

export default ajaxHeart
