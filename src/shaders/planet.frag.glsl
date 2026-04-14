uniform vec3 uBaseColor;
uniform vec3 uSecondaryColor;
uniform float uTemperature;
uniform float uTime;
uniform float uCloudDensity;
uniform float uSurfaceType;
uniform float uSeed;
uniform float uWaterRatio;
uniform float uRoughness;
uniform float uRadius;
uniform float uMass;
uniform float uDensity;
uniform float uAge;
uniform sampler2D uSurfaceTexture;
uniform float uTextureBlend;  // 0=full procedural, 1=full texture

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;

// ━━━ Noise ━━━
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}

float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);
  const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(
    i.z+vec4(0.,i1.z,i2.z,1.))
    +i.y+vec4(0.,i1.y,i2.y,1.))
    +i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857;
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
  vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);
  m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}

// Very smooth FBM — low frequency multiplier for soft shapes
float fbmSoft(vec3 p, int oct) {
  float v=0., a=0.55, f=1.;
  for(int i=0;i<8;i++){
    if(i>=oct) break;
    v+=a*snoise(p*f);
    f*=1.7; // lower = smoother, bigger shapes
    a*=0.42;
  }
  return v;
}

// Standard FBM for detail
float fbm(vec3 p, int oct) {
  float v=0., a=0.5, f=1.;
  for(int i=0;i<8;i++){
    if(i>=oct) break;
    v+=a*snoise(p*f);
    f*=2.0;
    a*=0.5;
  }
  return v;
}

// Domain warp — single pass, smooth
float warp1(vec3 p, float strength) {
  vec3 q = vec3(
    fbmSoft(p, 4),
    fbmSoft(p + vec3(5.2,1.3,2.8), 4),
    fbmSoft(p + vec3(1.7,9.2,3.4), 4)
  );
  return fbmSoft(p + strength * q, 5);
}

// Domain warp — double pass, very fluid
float warp2(vec3 p, float strength) {
  vec3 q = vec3(
    fbmSoft(p, 4),
    fbmSoft(p + vec3(5.2,1.3,2.8), 4),
    fbmSoft(p + vec3(1.7,9.2,3.4), 4)
  );
  vec3 r = vec3(
    fbmSoft(p + strength*q + vec3(1.7,9.2,0.0), 4),
    fbmSoft(p + strength*q + vec3(8.3,2.8,4.1), 4),
    fbmSoft(p + strength*q + vec3(3.1,6.5,1.3), 4)
  );
  return fbmSoft(p + strength * r, 5);
}

vec3 blend(vec3 a, vec3 b, float t) {
  return mix(a, b, smoothstep(0.,1.,t));
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ROCKY — data-driven surface
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
vec3 rockySurface(vec3 pos) {
  vec3 sp = pos + vec3(uSeed*3.1, uSeed*7.7, uSeed*11.3);

  // Data-driven terrain character:
  // - High density (>5) = metallic/iron world, smooth, dark
  // - Low density (<3) = porous/icy, lighter
  // - Old systems (>6 Gyr) = more weathered, smoother
  // - Young systems (<2 Gyr) = more volcanic, rough
  float densityFactor = clamp((uDensity - 3.0) / 4.0, 0.0, 1.0);   // 0=light, 1=dense
  float ageFactor = clamp(uAge / 8.0, 0.0, 1.0);                     // 0=young, 1=old
  float sizeFactor = clamp(uRadius / 2.0, 0.0, 1.0);                 // 0=small, 1=large

  // Terrain scale: bigger planets = broader features
  float terrainScale = 1.0 + (1.0 - sizeFactor) * 0.8;

  // Large-scale terrain via domain warping
  float terrain = warp2(sp * terrainScale, 2.5 + sizeFactor);
  float detail = fbmSoft(sp * (2.0 + terrainScale), 4);

  // Color: dense planets are darker/more metallic, light ones are sandy
  vec3 darkTone = uSecondaryColor * (0.4 + densityFactor * 0.2);
  vec3 midTone = uBaseColor;
  vec3 lightTone = mix(uBaseColor * 1.2, vec3(0.6, 0.55, 0.50), 0.3);

  vec3 color = blend(darkTone, midTone, terrain * 0.5 + 0.5);
  color = blend(color, lightTone, detail * 0.25 + 0.35);

  // Subtle elevation shading (not harsh spots)
  float elevation = terrain * 0.5 + 0.5;
  color *= 0.88 + elevation * 0.12;

  // Craters: only on small, old, low-atmosphere worlds
  // Bigger planets have geology that erases craters
  float craterChance = (1.0 - sizeFactor) * ageFactor * (1.0 - clamp(uTemperature / 800.0, 0.0, 0.8));
  if (craterChance > 0.1) {
    float craterNoise = snoise(sp * (2.0 + fract(uSeed*3.3)) + vec3(uSeed*5.0));
    // Soft, wide craters — not binary spots
    float craters = smoothstep(0.3, 0.6, craterNoise) * craterChance;
    color *= 1.0 - craters * 0.08;
    // Crater rims catch light
    float rim = smoothstep(0.55, 0.65, craterNoise) * craterChance;
    color += rim * lightTone * 0.03;
  }

  // Volcanic features driven by temperature
  if (uTemperature > 500.0) {
    float heatFactor = clamp((uTemperature - 500.0) / 1000.0, 0.0, 1.0);
    float lavaPattern = warp1(sp * 1.8 + uTime * 0.002, 2.0);
    float lavaVeins = smoothstep(-0.05, 0.12, lavaPattern);
    vec3 lavaGlow = mix(vec3(0.7, 0.15, 0.02), vec3(1.0, 0.45, 0.08), lavaVeins * 0.4);
    // Hotter = more lava coverage, cooler = just hints
    color = mix(color, color * 0.4, heatFactor * 0.4);
    color += lavaGlow * lavaVeins * heatFactor * 0.5;
  }

  // Iron-rich coloring for very dense planets (>5.5 g/cm³)
  if (uDensity > 5.5) {
    float ironFactor = clamp((uDensity - 5.5) / 2.0, 0.0, 0.4);
    color = mix(color, color * vec3(0.85, 0.75, 0.70), ironFactor);
  }

  return color;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// WATER / EARTH-LIKE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
vec3 waterSurface(vec3 pos) {
  // Each planet has completely different offset
  vec3 sp = pos + vec3(uSeed*17.31, uSeed*31.97, uSeed*7.13);

  // ── CONTINENT SHAPES ──
  // Key: use LOW frequency, HIGH warp for big organic continent shapes
  float continentScale = 0.6 + fract(uSeed*3.7) * 0.5; // 0.6-1.1 — big shapes
  float continentField = warp2(sp * continentScale, 4.0);

  // Sea level from water ratio — higher = more ocean
  float seaLevel = -0.15 + uWaterRatio * 0.55;

  // Smooth land/ocean transition
  float rawLand = continentField - seaLevel;
  float landMask = smoothstep(-0.04, 0.08, rawLand);
  float elevation = smoothstep(0.0, 0.5, rawLand); // 0=coast, 1=mountain peak

  // ── OCEAN ──
  vec3 abyssOcean  = vec3(0.005, 0.015, 0.06);
  vec3 deepOcean   = vec3(0.01,  0.04,  0.14);
  vec3 midOcean    = vec3(0.025, 0.09,  0.24);
  vec3 shallowSea  = vec3(0.04,  0.16,  0.32);
  vec3 coastalSea  = vec3(0.06,  0.22,  0.34);

  float depth = 1.0 - smoothstep(seaLevel - 0.35, seaLevel, continentField);
  vec3 ocean = mix(abyssOcean, deepOcean, smoothstep(0.0, 0.3, depth));
  ocean = mix(ocean, midOcean, smoothstep(0.3, 0.55, depth));
  ocean = mix(ocean, shallowSea, smoothstep(0.55, 0.8, depth));
  ocean = mix(ocean, coastalSea, smoothstep(0.85, 1.0, depth));

  // Subtle ocean current patterns (very low amplitude)
  float currents = fbmSoft(sp * 1.5 + vec3(uTime*0.002, 0.0, uTime*0.001), 3);
  ocean += currents * 0.008;

  // ── LAND BIOMES ──
  float lat = abs(pos.y); // 0=equator, 1=pole
  float biomeShift = fract(uSeed * 11.3) * 0.25;

  // Moisture map — seed-unique, determines wet vs dry regions
  float moisture = fbmSoft(sp * 0.8 + vec3(uSeed*23.1, 0.0, uSeed*9.7), 4) * 0.5 + 0.5;

  // Biome detail — very gentle variation within each biome
  float biomeDetail = fbmSoft(sp * 2.0, 3) * 0.5 + 0.5;

  // Color palette
  vec3 jungle       = vec3(0.04, 0.20, 0.03);
  vec3 tropForest   = vec3(0.07, 0.26, 0.06);
  vec3 savanna      = vec3(0.40, 0.42, 0.18);
  vec3 grassland    = vec3(0.22, 0.35, 0.12);
  vec3 tempForest   = vec3(0.10, 0.24, 0.07);
  vec3 steppe       = vec3(0.42, 0.40, 0.22);
  vec3 desert       = vec3(0.72, 0.60, 0.38);
  vec3 redDesert    = vec3(0.62, 0.38, 0.22);
  vec3 tundra       = vec3(0.48, 0.50, 0.44);
  vec3 boreal       = vec3(0.12, 0.22, 0.10);
  vec3 mountain     = vec3(0.38, 0.34, 0.28);
  vec3 highMount    = vec3(0.52, 0.50, 0.46);
  vec3 snow         = vec3(0.86, 0.89, 0.93);
  vec3 beach        = vec3(0.72, 0.66, 0.50);

  // Tropical band (equator)
  float tropicalZone = 1.0 - smoothstep(0.18 + biomeShift, 0.35 + biomeShift, lat);
  vec3 tropicalWet = mix(jungle, tropForest, biomeDetail);
  vec3 tropicalDry = mix(savanna, desert, smoothstep(0.5, 0.8, biomeDetail));
  vec3 tropical = mix(tropicalWet, tropicalDry, smoothstep(0.35, 0.65, moisture));

  // Temperate band
  float temperateZone = smoothstep(0.15, 0.30, lat) * (1.0 - smoothstep(0.55, 0.70, lat));
  vec3 tempWet = mix(tempForest, grassland, biomeDetail * 0.6);
  vec3 tempDry = mix(steppe, mix(desert, redDesert, fract(uSeed*7.1)), smoothstep(0.4, 0.7, biomeDetail));
  vec3 temperate = mix(tempWet, tempDry, smoothstep(0.35, 0.65, moisture));

  // Polar / boreal band
  float polarZone = smoothstep(0.50, 0.70, lat);
  vec3 polar = mix(boreal, tundra, smoothstep(0.3, 0.6, moisture));
  polar = mix(polar, snow, smoothstep(0.75, 0.90, lat));

  // Combine biome zones — smooth weighted blend
  vec3 land = tropical * tropicalZone + temperate * temperateZone + polar * polarZone;
  // Normalize in case zones don't perfectly sum to 1
  float zoneSum = tropicalZone + temperateZone + polarZone;
  if (zoneSum > 0.01) land /= zoneSum;

  // ── Elevation overlays ──
  land = mix(land, mountain, smoothstep(0.35, 0.55, elevation));
  land = mix(land, highMount, smoothstep(0.55, 0.70, elevation));
  float snowLine = 0.65 - lat * 0.3; // snow lower at poles
  land = mix(land, snow, smoothstep(snowLine, snowLine + 0.12, elevation));

  // ── Beach at coastline ──
  float beachMask = smoothstep(0.0, 0.03, landMask) * (1.0 - smoothstep(0.03, 0.08, landMask));
  land = mix(land, beach, beachMask * 0.5);

  // ── Ice caps ── (size varies greatly with seed)
  float iceCapLat = 0.62 + fract(uSeed * 19.3) * 0.30; // 0.62 to 0.92
  float iceCap = smoothstep(iceCapLat, iceCapLat + 0.10, lat);
  land = mix(land, snow, iceCap);
  ocean = mix(ocean, vec3(0.45, 0.58, 0.72), iceCap * 0.4);

  // ── Final land/ocean blend ──
  vec3 color = mix(ocean, land, landMask);

  // If temperature > 400K, this "water world" is more of a steam world
  if (uTemperature > 400.0) {
    float steamFactor = clamp((uTemperature - 400.0) / 300.0, 0.0, 0.6);
    vec3 steamyLand = mix(land, vec3(0.5, 0.35, 0.2), 0.5);
    color = mix(color, steamyLand, steamFactor * landMask);
    color = mix(color, vec3(0.15, 0.10, 0.08), steamFactor * (1.0 - landMask) * 0.5);
  }

  return color;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GAS GIANT — data-driven bands and storms
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
vec3 gasSurface(vec3 pos) {
  vec3 sp = pos + vec3(uSeed*5.3, uSeed*11.1, uSeed*3.7);

  float latitude = pos.y;

  // Data-driven parameters:
  // - Larger radius = more bands, faster rotation = more turbulence
  // - Higher mass = deeper atmosphere, more contrast
  // - Higher temp = more chaotic, fewer defined bands
  float massFactor = clamp(uMass / 500.0, 0.0, 1.0);
  float sizeFactor = clamp(uRadius / 15.0, 0.0, 1.0);
  float chaos = clamp(uTemperature / 2000.0, 0.0, 1.0);

  // Band count scales with size: bigger = more bands
  float bandFreq = 10.0 + sizeFactor * 15.0 + fract(uSeed * 7.3) * 6.0;

  // Band warping: hotter = more chaotic
  float warpStrength = 2.0 + chaos * 2.0;
  float bandWarp = warp2(sp * 1.0 + vec3(uTime * (0.003 + chaos * 0.004), 0.0, 0.0), warpStrength);
  float bands = sin(latitude * bandFreq + bandWarp * 3.0) * 0.5 + 0.5;
  float fineBands = sin(latitude * bandFreq * 2.5 + bandWarp * 2.0) * 0.3 + 0.5;

  // Turbulence: more massive = deeper swirls
  float turb = warp2(sp * (1.2 + massFactor * 0.5) + vec3(uTime * 0.005, 0.0, 0.0), 3.0 + massFactor);

  // Color palette
  float hue = fract(uSeed * 0.37);
  vec3 col1 = uBaseColor;
  vec3 col2 = uSecondaryColor;
  vec3 col3 = mix(uBaseColor * 1.3, vec3(0.9, 0.8, 0.6), hue * 0.5);
  vec3 col4 = mix(uSecondaryColor * 0.5, vec3(0.3, 0.2, 0.15), (1.0 - hue) * 0.5);
  vec3 col5 = mix(vec3(0.8, 0.5, 0.3), vec3(0.4, 0.3, 0.5), hue);

  // Band contrast: more massive = stronger bands
  float bandContrast = 0.3 + massFactor * 0.2;
  vec3 color = blend(col1, col2, bands);
  color = blend(color, col3, fineBands * bandContrast);
  color = blend(color, col4, smoothstep(-0.2, 0.2, turb) * 0.3);
  color = blend(color, col5, smoothstep(0.2, 0.5, turb) * 0.15);

  // Great storm: larger planets = bigger storms
  float stormX = fract(uSeed * 13.7) * 6.283;
  float stormY = fract(uSeed * 23.1) * 0.6 - 0.3;
  float stormSize = (0.15 + fract(uSeed * 41.3) * 0.2) * (0.7 + sizeFactor * 0.5);
  vec2 stormCenter = vec2(stormX, stormY);
  vec2 stormPos = vec2(atan(pos.z, pos.x), pos.y);
  float stormDist = length(stormPos - stormCenter);

  float stormAngle = atan(stormPos.y - stormCenter.y, stormPos.x - stormCenter.x);
  float spiral = sin(stormAngle * 3.0 - stormDist * 15.0 + uTime * 0.1) * 0.5 + 0.5;
  float stormMask = smoothstep(stormSize, stormSize * 0.3, stormDist);

  color = mix(color, col4 * 0.7, stormMask * 0.6);
  color = mix(color, col5, stormMask * spiral * 0.25);

  // Hot jupiter thermal glow
  if (uTemperature > 1000.0) {
    float heatGlow = clamp((uTemperature - 1000.0) / 1500.0, 0.0, 0.5);
    float heatPattern = smoothstep(-0.1, 0.1, warp1(sp * 1.5, 2.0));
    vec3 thermalColor = vec3(0.9, 0.25, 0.03);
    color = mix(color, color * 0.4, heatGlow * 0.3);
    color += thermalColor * heatPattern * heatGlow * 0.3;
  }

  return color;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LAVA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
vec3 lavaSurface(vec3 pos) {
  vec3 sp = pos + vec3(uSeed*9.1, uSeed*3.3, uSeed*17.7);

  float cracks = warp2(sp * 1.8, 3.5);
  float flow = fbmSoft(sp * 2.5 + uTime * 0.008, 5);
  float detail = fbmSoft(sp * 4.0, 4);

  vec3 darkCrust  = vec3(0.04, 0.02, 0.01);
  vec3 warmCrust  = vec3(0.12, 0.05, 0.02);
  vec3 hotLava    = vec3(1.0, 0.28, 0.02);
  vec3 brightLava = vec3(1.0, 0.55, 0.10);
  vec3 whiteLava  = vec3(1.0, 0.82, 0.45);

  float lavaFlow = smoothstep(-0.08, 0.15, cracks);
  float intensity = smoothstep(0.1, 0.5, flow);

  vec3 color = blend(darkCrust, warmCrust, detail * 0.5 + 0.3);
  color = blend(color, hotLava, lavaFlow * 0.75);
  color = blend(color, brightLava, lavaFlow * intensity * 0.55);
  color = blend(color, whiteLava, lavaFlow * intensity * smoothstep(0.6, 0.85, flow) * 0.25);

  color += hotLava * lavaFlow * 0.08;

  return color;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ICE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
vec3 iceSurface(vec3 pos) {
  vec3 sp = pos + vec3(uSeed*11.7, uSeed*5.9, uSeed*19.3);

  float marble = warp2(sp * 1.5, 3.0);
  float detail = fbmSoft(sp * 3.0, 5);

  vec3 deepIce = vec3(0.22, 0.42, 0.65);
  vec3 ice     = vec3(0.58, 0.73, 0.86);
  vec3 frost   = vec3(0.84, 0.89, 0.94);
  vec3 blueVein= vec3(0.30, 0.50, 0.80);

  vec3 color = blend(deepIce, ice, marble*0.5+0.5);
  color = blend(color, frost, detail*0.4+0.3);

  float veins = abs(sin((marble + detail*0.2) * 5.0));
  color = blend(color, blueVein, veins * 0.1);

  float cracks = 1.0 - smoothstep(0.0, 0.04, abs(snoise(sp * 6.0)));
  color = mix(color, deepIce * 0.5, cracks * 0.25);

  return color;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
void main() {
  vec3 pos = normalize(vPosition) * 2.0;

  // Procedural surface
  vec3 proceduralColor;
  if      (uSurfaceType < 0.5) proceduralColor = rockySurface(pos);
  else if (uSurfaceType < 1.5) proceduralColor = waterSurface(pos);
  else if (uSurfaceType < 2.5) proceduralColor = gasSurface(pos);
  else if (uSurfaceType < 3.5) proceduralColor = lavaSurface(pos);
  else                          proceduralColor = iceSurface(pos);

  // Sample real texture with seed-based UV offset for uniqueness
  vec2 texUV = vUv;
  texUV.x = fract(texUV.x + uSeed * 0.37);
  texUV.y = fract(texUV.y + uSeed * 0.13);
  vec3 textureColor = texture2D(uSurfaceTexture, texUV).rgb;

  // Texture as base, procedural as color tint overlay
  // At blend=0: full procedural, blend=1: full texture
  vec3 surfaceColor = mix(proceduralColor, textureColor, uTextureBlend);
  // Add procedural variation as subtle color shift on top
  surfaceColor *= 0.75 + 0.5 * (proceduralColor * 0.5 + 0.5);

  // ── Clouds (only for water, rocky, ice — skip gas giants and lava) ──
  if (uCloudDensity > 0.01 && uSurfaceType < 1.5) {
    vec3 cp = pos + vec3(uSeed*3.3, uSeed*7.7, uSeed*1.1);
    float c1 = fbmSoft(cp * 1.8 + vec3(uTime*0.008, uTime*0.004, 0.0), 4);
    float c2 = fbmSoft(cp * 3.5 + vec3(-uTime*0.005, uTime*0.007, 0.0), 3);
    float clouds = smoothstep(0.1, 0.5, c1) * uCloudDensity;
    clouds += smoothstep(0.2, 0.55, c2) * uCloudDensity * 0.2;
    clouds = min(clouds, 0.7);

    vec3 cloudCol = vec3(0.94, 0.95, 0.97);
    if (uTemperature > 1000.0) cloudCol = mix(cloudCol, vec3(0.9,0.7,0.4), 0.5);

    surfaceColor *= 1.0 - clouds * 0.12; // shadow
    surfaceColor = mix(surfaceColor, cloudCol, clouds);
  }

  // ── Thermal emission (clamped to prevent bloom instability) ──
  if (uTemperature > 1500.0) {
    float glow = clamp((uTemperature-1500.0)/2000.0, 0.0, 0.3);
    surfaceColor += vec3(1.0, 0.3, 0.05) * glow * 0.5;
  }

  // ── Lighting (clean, no orange artifacts) ──
  vec3 L = normalize(vec3(1.0, 0.3, 0.8));
  float NdotL = dot(vNormal, L);
  float diff = smoothstep(-0.1, 1.0, NdotL);

  // Simple ambient + diffuse
  vec3 lit = surfaceColor * (0.06 + diff * 0.94);

  // SSS for gas giants
  lit += step(1.5, uSurfaceType) * step(uSurfaceType, 2.5) *
         pow(max(0.0, -NdotL + 0.3), 2.0) * 0.04 * uBaseColor;

  // View direction & rim
  vec3 V = normalize(cameraPosition - vPosition);
  float rim = 1.0 - max(dot(V, vNormal), 0.0);

  // Specular for water
  vec3 H = normalize(L + V);
  float spec = pow(max(dot(vNormal, H), 0.0), 150.0);
  lit += spec * 0.15 * vec3(1.0, 0.97, 0.94) * step(0.5, uSurfaceType) * step(uSurfaceType, 1.5);

  // ── Atmospheric halo — visible on all planets with atmosphere ──
  float rimGlow = pow(rim, 2.5);
  float rimTight = pow(rim, 5.0);

  // Halo color based on planet type
  vec3 haloColor;
  if (uSurfaceType < 1.5) {
    haloColor = vec3(0.3, 0.5, 0.95); // blue for rocky/water
  } else if (uSurfaceType < 2.5) {
    haloColor = uBaseColor * 0.8;      // gas giant: tinted by atmosphere
  } else if (uSurfaceType < 3.5) {
    haloColor = vec3(0.8, 0.3, 0.1);   // lava: orange glow
  } else {
    haloColor = vec3(0.4, 0.6, 0.9);   // ice: pale blue
  }

  // Halo on lit side (stronger) + subtle on dark side
  float litFactor = smoothstep(-0.2, 0.3, NdotL);
  lit += rimGlow * haloColor * 0.15 * (0.3 + litFactor * 0.7);
  lit += rimTight * haloColor * 0.08; // tight bright edge

  // Night side
  float night = smoothstep(0.0, -0.25, NdotL);
  lit += night * surfaceColor * 0.005;

  // Lava glow on night side
  lit += step(2.5, uSurfaceType) * step(uSurfaceType, 3.5) * surfaceColor * night * 0.4;

  // Clamp output
  gl_FragColor = vec4(min(lit, vec3(1.2)), 1.0);
}
