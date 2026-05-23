'use client'
import { useEffect, useRef } from 'react'

/**
 * WebGL aurora/plasma shader ported from the Cadence Aura template.
 * Original teal/cyan palette swapped to DevSenses violet (primary 258 90% 66%).
 * Mouse-warped fbm noise field with additive blending.
 */
export function HeroAurora() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const canvas: HTMLCanvasElement = cv

    const glx = canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
    })
    if (!glx) return
    const gl: WebGLRenderingContext = glx

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let mx = 0.5,
      my = 0.5,
      tmx = 0.5,
      tmy = 0.5
    let raf = 0
    let running = true

    function resize() {
      if (!canvas) return
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      const parent = canvas.parentElement
      const W = parent?.clientWidth ?? window.innerWidth
      const H = parent?.clientHeight ?? window.innerHeight
      canvas.width = W * dpr
      canvas.height = H * dpr
      canvas.style.width = W + 'px'
      canvas.style.height = H + 'px'
      gl.viewport(0, 0, canvas.width, canvas.height)
    }

    const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0,1);}`

    // Same shader as Cadence — violet palette in c1/c2/c3.
    const FRAG = `
precision highp float;
uniform float u_t;
uniform vec2 u_r;
uniform vec2 u_m;

vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 perm(vec4 x){return mod289(((x*34.)+1.)*x);}
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);
  const vec4 D=vec4(0,.5,1,2);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.-g;
  vec3 i1=min(g,l.zxy);
  vec3 i2=max(g,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=perm(perm(perm(i.z+vec4(0,i1.z,i2.z,1))+i.y+vec4(0,i1.y,i2.y,1))+i.x+vec4(0,i1.x,i2.x,1));
  float n_=1./7.;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;
  vec4 s1=floor(b1)*2.+1.;
  vec4 sh=-step(h,vec4(0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=1.79284291400159-.85373472095314*vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);
  m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}

float fbm(vec3 p){
  float v=0.,a=.5;
  for(int i=0;i<5;i++){
    v+=a*snoise(p);
    p*=2.1;
    a*=.48;
  }
  return v;
}

void main(){
  vec2 uv=(gl_FragCoord.xy)/u_r;
  vec2 p=uv*2.-1.;
  p.x*=u_r.x/u_r.y;

  vec2 mp=u_m*2.-1.;
  mp.x*=u_r.x/u_r.y;
  float md=length(p-mp);
  float mInfluence=smoothstep(1.5,0.,md)*0.6;
  p+=normalize(p-mp+.001)*mInfluence*0.45;

  float t=u_t*0.25;

  float n1=fbm(vec3(p*1.2+vec2(t*0.4,t*0.3),t*0.2));
  float n2=fbm(vec3(p*2.5+vec2(-t*0.6,t*0.5),t*0.35+5.));
  float n3=fbm(vec3(p*1.8+mp*0.5,t*0.5+10.));
  float wave=sin(length(p)*4.0-t*2.0)*0.5+0.5;
  float n4=fbm(vec3(p*0.8+vec2(t*0.2,-t*0.15),t*0.1+20.))*wave;

  float n=n1*0.55+n2*0.3+n3*mInfluence*1.5+n4*0.35;

  // Violet palette (replaces Cadence teal)
  vec3 c1=vec3(0.357,0.129,0.714); // violet-700
  vec3 c2=vec3(0.545,0.361,0.965); // violet-500
  vec3 c3=vec3(0.769,0.710,0.992); // violet-300

  float intensity=smoothstep(-0.2,0.8,n);
  vec3 col=mix(c1,c2,intensity);
  col=mix(col,c3,smoothstep(0.5,1.0,intensity)*0.6);

  float glow=exp(-md*md*2.5)*0.5;
  col+=c3*glow;

  float vig=1.-smoothstep(0.4,1.5,length(uv*2.-1.));

  float alpha=intensity*0.32*vig+glow*0.7*vig;

  float centerGlow=exp(-dot(p,p)*0.6)*0.12;
  alpha+=centerGlow;

  gl_FragColor=vec4(col,alpha);
}
    `

    function compile(type: number, src: string) {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(s))
      }
      return s
    }

    const prog = gl.createProgram()!
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const pLoc = gl.getAttribLocation(prog, 'p')
    gl.enableVertexAttribArray(pLoc)
    gl.vertexAttribPointer(pLoc, 2, gl.FLOAT, false, 0, 0)

    const u_t = gl.getUniformLocation(prog, 'u_t')
    const u_r = gl.getUniformLocation(prog, 'u_r')
    const u_m = gl.getUniformLocation(prog, 'u_m')

    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect()
      tmx = (e.clientX - r.left) / r.width
      tmy = 1.0 - (e.clientY - r.top) / r.height
    }

    resize()
    window.addEventListener('resize', resize)
    const parent = canvas.parentElement
    parent?.addEventListener('mousemove', onMove)

    function frame(t: number) {
      if (!running) {
        raf = 0
        return
      }
      raf = requestAnimationFrame(frame)
      mx += (tmx - mx) * 0.22
      my += (tmy - my) * 0.22

      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE)
      gl.useProgram(prog)
      gl.uniform1f(u_t!, t * 0.001)
      gl.uniform2f(u_r!, canvas.width, canvas.height)
      gl.uniform2f(u_m!, mx, my)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }

    if (!reduceMotion) {
      raf = requestAnimationFrame(frame)
    } else {
      // Render a single static frame so the canvas has some content
      frame(0)
      raf = 0
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          running = entry.isIntersecting
          if (running && !raf && !reduceMotion) raf = requestAnimationFrame(frame)
        }
      },
      { threshold: 0 },
    )
    io.observe(canvas)

    const onVis = () => {
      running = document.visibilityState === 'visible'
      if (running && !raf && !reduceMotion) raf = requestAnimationFrame(frame)
    }
    document.addEventListener('visibilitychange', onVis)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      parent?.removeEventListener('mousemove', onMove)
      document.removeEventListener('visibilitychange', onVis)
      io.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  )
}
