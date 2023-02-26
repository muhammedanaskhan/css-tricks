
class Mouse {
    constructor(canvas) {
      this.pos = new Vector(-1000, -1000)
      this.radius = 40
  
      canvas.onmousemove = e => this.pos.setXY(e.clientX, e.clientY)
      canvas.ontouchmove = e => this.pos.setXY(e.touches[0].clientX, e.touches[0].clientY)
      canvas.ontouchcancel = () => this.pos.setXY(-1000, -1000)
      canvas.ontouchend = () => this.pos.setXY(-1000, -1000)
    }
  }
  
  class Dot {
    constructor(x, y) {
      this.pos = new Vector(x, y)
      this.oldPos = new Vector(x, y)
  
      this.friction = 0.97
      this.gravity = new Vector(0, 0.6)
      this.mass = 1
  
      this.pinned = false
  
      this.lightImg = document.querySelector('#light-img')
      this.lightSize = 15
    }
  
    update(mouse) {
      if (this.pinned) return
      
      let vel = Vector.sub(this.pos, this.oldPos)
  
      this.oldPos.setXY(this.pos.x, this.pos.y)
  
      vel.mult(this.friction)
      vel.add(this.gravity)
  
      let { x: dx, y: dy } = Vector.sub(mouse.pos, this.pos)
      const dist = Math.sqrt(dx * dx + dy * dy)
  
      const direction = new Vector(dx / dist, dy / dist)
  
      const force = Math.max((mouse.radius - dist) / mouse.radius, 0)
      
      if (force > 0.6) this.pos.setXY(mouse.pos.x, mouse.pos.y)
      else {
        this.pos.add(vel)
        this.pos.add(direction.mult(force))
      }
    }
  
    drawLight(ctx) {
      ctx.drawImage(
        this.lightImg,
        this.pos.x - this.lightSize / 2, this.pos.y - this.lightSize / 2, this.lightSize, this.lightSize
      )
    }
  
    draw(ctx) {
      ctx.fillStyle = '#aaa'
      ctx.fillRect(this.pos.x - this.mass, this.pos.y - this.mass, this.mass * 2, this.mass * 2)
    }
  }
  
  class Stick {
    constructor(p1, p2) {
      this.startPoint = p1
      this.endPoint = p2
      
      this.length = this.startPoint.pos.dist(this.endPoint.pos)
      this.tension = 0.3
    }
  
    update() {
      const dx = this.endPoint.pos.x - this.startPoint.pos.x
      const dy = this.endPoint.pos.y - this.startPoint.pos.y
  
      const dist = Math.sqrt(dx * dx + dy * dy)
      const diff = (dist - this.length) / dist
  
      const offsetX = diff * dx * this.tension
      const offsetY = diff * dy * this.tension
  
      const m = this.startPoint.mass + this.endPoint.mass
      const m1 = this.endPoint.mass / m
      const m2 = this.startPoint.mass / m
  
      if (!this.startPoint.pinned) {
        this.startPoint.pos.x += offsetX * m1
        this.startPoint.pos.y += offsetY * m1
      }
      if (!this.endPoint.pinned) {
        this.endPoint.pos.x -= offsetX * m2
        this.endPoint.pos.y -= offsetY * m2
      }
    }
  
    draw(ctx) {
      ctx.beginPath()
      ctx.strokeStyle = '#999'
      ctx.moveTo(this.startPoint.pos.x, this.startPoint.pos.y)
      ctx.lineTo(this.endPoint.pos.x, this.endPoint.pos.y)
      ctx.stroke()
      ctx.closePath()
    }
  }
  
  class Rope {
    constructor(config) {
      this.x = config.x
      this.y = config.y
      this.segments = config.segments || 10
      this.gap = config.gap || 15
      this.color = config.color || 'gray'
  
      this.dots = []
      this.sticks = []
  
      this.iterations = 10
  
      this.create()
    }
  
    pin(index) {
      this.dots[index].pinned = true
    }
  
    create() {
      for (let i = 0; i < this.segments; i++) {
        this.dots.push(new Dot(this.x, this.y + i * this.gap))
      }
      for (let i = 0; i < this.segments - 1; i++) {
        this.sticks.push(new Stick(this.dots[i], this.dots[i + 1]))
      }
    }
    
    update(mouse) {
      this.dots.forEach(dot => {
        dot.update(mouse)
      })
      for (let i = 0; i < this.iterations; i++) {
        this.sticks.forEach(stick => {
          stick.update()
        })
      }
    }
  
    draw(ctx) {
      this.dots.forEach(dot => {
        dot.draw(ctx)
      })
      this.sticks.forEach(stick => {
        stick.draw(ctx)
      })
      this.dots[this.dots.length - 1].drawLight(ctx)
    }
  }
  
  class App {
    static width = innerWidth
    static height = innerHeight
    static dpr = devicePixelRatio > 1 ? 2 : 1
    static interval = 1000 / 60
  
    constructor() {
      this.canvas = document.querySelector('canvas')
      this.ctx = this.canvas.getContext('2d')
  
      this.mouse = new Mouse(this.canvas)
  
      this.resize()
      window.addEventListener('resize', this.resize.bind(this))
  
      this.createRopes()
    }
  
    createRopes() {
      this.ropes = []
  
      const TOTAL = App.width * 0.06
      for (let i = 0; i < TOTAL + 1; i++) {
        const x = randomNumBetween(App.width * 0.3, App.width * 0.7)
        const y = 0
        const gap = randomNumBetween(App.height * 0.05, App.height * 0.08)
        const segments = 10
        const rope = new Rope({ x, y, gap, segments })
        rope.pin(0)
  
        this.ropes.push(rope)
      }
    }
  
    resize() {
      App.width = innerWidth
      App.height = innerHeight
  
      this.canvas.style.width = '100%'
      this.canvas.style.height = '100%'
      this.canvas.width = App.width * App.dpr
      this.canvas.height = App.height * App.dpr
      this.ctx.scale(App.dpr, App.dpr)
  
      this.createRopes()
    }
  
    render() {
      let now, delta
      let then = Date.now()
  
      const frame = () => {
        requestAnimationFrame(frame)
        now = Date.now()
        delta = now - then
        if (delta < App.interval) return
        then = now - (delta % App.interval)
        this.ctx.clearRect(0, 0, App.width, App.height)
  
        // draw here
        this.ropes.forEach(rope => {
          rope.update(this.mouse)
          rope.draw(this.ctx)
        })
      }
      requestAnimationFrame(frame)
    }
  }
  
  function randomNumBetween(min, max) {
    return Math.random() * (max - min) + min
  }
  
  window.addEventListener('load', () => {
    const app = new App()
    app.render()
  })
  
  
  
  
  
  
  export default class Vector {
    constructor(x, y) {
      this.x = x || 0
      this.y = y || 0
    }
    static add(v1, v2) {
      return new Vector(v1.x + v2.x, v1.y + v2.y)
    }
    static sub(v1, v2) {
      return new Vector(v1.x - v2.x, v1.y - v2.y)
    }
    add(x, y) {
      if (arguments.length === 1) {
        this.x += x.x
        this.y += x.y
      } else if (arguments.length === 2) {
        this.x += x
        this.y += y
      }
      return this
    }
    sub(x, y) {
      if (arguments.length === 1) {
        this.x -= x.x
        this.y -= x.y
      } else if (arguments.length === 2) {
        this.x -= x
        this.y -= y
      }
      return this
    }
    mult(v) {
      if (typeof v === 'number') {
        this.x *= v
        this.y *= v
      } else {
        this.x *= v.x
        this.y *= v.y
      }
      return this
    }
    setXY(x, y) {
      this.x = x
      this.y = y
      return this
    }
    dist(v) {
      const dx = this.x - v.x
      const dy = this.y - v.y
      return Math.sqrt(dx * dx + dy * dy)
    }
  }