uniform vec3 uAtmosphereColor;
uniform float uDensity;
uniform float uTime;

varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  vec3 viewDir = normalize(cameraPosition - vPosition);
  float fresnel = dot(viewDir, vNormal);

  // Very tight glow only at the extreme edge
  float glow = pow(1.0 - fresnel, 1.8);
  glow *= glow; // sharpen further

  // Sun-facing brightness
  vec3 lightDir = normalize(vec3(1.0, 0.3, 0.8));
  float sunSide = dot(vNormal, lightDir) * 0.5 + 0.5;

  vec3 color = uAtmosphereColor * (0.7 + sunSide * 0.5);

  float alpha = glow * uDensity * 0.4;
  alpha = min(alpha, 0.25);

  gl_FragColor = vec4(color, alpha);
}
