uniform vec3 uRingColor;
uniform float uOpacity;
uniform float uTime;

varying vec2 vUv;

float hash(float n) { return fract(sin(n) * 43758.5453123); }

void main() {
  float dist = length(vUv - 0.5) * 2.0;

  // Ring bands
  float bands = sin(dist * 60.0) * 0.5 + 0.5;
  bands *= sin(dist * 30.0 + 1.0) * 0.3 + 0.7;

  // Gap in rings (Cassini-like division)
  float gap = smoothstep(0.48, 0.50, dist) * (1.0 - smoothstep(0.52, 0.54, dist));
  bands *= 1.0 - gap * 0.7;

  // Fade at edges
  float inner = smoothstep(0.25, 0.35, dist);
  float outer = 1.0 - smoothstep(0.85, 1.0, dist);
  float alpha = inner * outer * bands * uOpacity;

  gl_FragColor = vec4(uRingColor, alpha);
}
