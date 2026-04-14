-- ============================================
-- ExoTerra Database Schema
-- ============================================

-- Tabla principal: Exoplanetas
CREATE TABLE exoplanets (
  id BIGSERIAL PRIMARY KEY,

  -- Identificación
  pl_name TEXT NOT NULL UNIQUE,          -- Nombre del planeta
  hostname TEXT NOT NULL,                 -- Nombre de la estrella host
  sys_name TEXT,                          -- Nombre del sistema

  -- Propiedades físicas del planeta
  pl_masse FLOAT,                        -- Masa (Earth masses)
  pl_rade FLOAT,                         -- Radio (Earth radii)
  pl_dens FLOAT,                         -- Densidad (g/cm³)
  pl_bmasse FLOAT,                       -- Masa (Jupiter masses)
  pl_bmassj FLOAT,                       -- Masa best (Jupiter masses)
  pl_radj FLOAT,                         -- Radio (Jupiter radii)

  -- Parámetros orbitales
  pl_orbper FLOAT,                       -- Período orbital (días)
  pl_orbsmax FLOAT,                      -- Semi-eje mayor (AU)
  pl_orbeccen FLOAT,                     -- Excentricidad orbital
  pl_orbincl FLOAT,                      -- Inclinación orbital (grados)

  -- Temperatura y atmósfera
  pl_eqt FLOAT,                          -- Temperatura de equilibrio (K)
  pl_insol FLOAT,                        -- Insolación (Earth flux)

  -- Descubrimiento
  discoverymethod TEXT,                   -- Método de descubrimiento
  disc_year INT,                          -- Año de descubrimiento
  disc_facility TEXT,                     -- Instalación de descubrimiento

  -- Propiedades de la estrella host
  st_spectype TEXT,                       -- Tipo espectral
  st_teff FLOAT,                         -- Temperatura efectiva (K)
  st_rad FLOAT,                          -- Radio estelar (Solar radii)
  st_mass FLOAT,                         -- Masa estelar (Solar masses)
  st_lum FLOAT,                          -- Luminosidad (log Solar)
  st_age FLOAT,                          -- Edad (Gyr)
  st_met FLOAT,                          -- Metalicidad [Fe/H]

  -- Posición
  ra FLOAT,                              -- Ascensión recta (grados)
  dec FLOAT,                             -- Declinación (grados)
  sy_dist FLOAT,                         -- Distancia (parsecs)

  -- Campos calculados por ExoTerra
  habitability_score FLOAT DEFAULT 0,    -- Score 0-100
  planet_type TEXT,                       -- rocky, gas_giant, ice_giant, super_earth, etc.
  in_habitable_zone BOOLEAN DEFAULT FALSE,
  has_atmosphere_likely BOOLEAN DEFAULT FALSE,

  -- Campos para visualización procedural
  visual_surface_type TEXT,              -- water, rocky, lava, ice, gas
  visual_atmosphere_density FLOAT,       -- 0-1
  visual_atmosphere_color TEXT,          -- hex color inferido
  visual_has_rings BOOLEAN DEFAULT FALSE,
  visual_has_clouds BOOLEAN DEFAULT FALSE,
  visual_cloud_density FLOAT DEFAULT 0,  -- 0-1
  visual_num_moons INT DEFAULT 0,

  -- Metadata
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_exoplanets_habitability ON exoplanets(habitability_score DESC);
CREATE INDEX idx_exoplanets_type ON exoplanets(planet_type);
CREATE INDEX idx_exoplanets_hz ON exoplanets(in_habitable_zone);
CREATE INDEX idx_exoplanets_eqt ON exoplanets(pl_eqt);
CREATE INDEX idx_exoplanets_masse ON exoplanets(pl_masse);
CREATE INDEX idx_exoplanets_rade ON exoplanets(pl_rade);
CREATE INDEX idx_exoplanets_disc_year ON exoplanets(disc_year);

-- Habilitar Row Level Security
ALTER TABLE exoplanets ENABLE ROW LEVEL SECURITY;

-- Política: lectura pública
CREATE POLICY "Exoplanets are viewable by everyone"
  ON exoplanets FOR SELECT
  USING (true);

-- ============================================
-- Función para calcular habitability score
-- ============================================
CREATE OR REPLACE FUNCTION calculate_habitability_score(
  p_eqt FLOAT,        -- Temperatura equilibrio
  p_rade FLOAT,        -- Radio terrestre
  p_masse FLOAT,       -- Masa terrestre
  p_insol FLOAT,       -- Insolación
  p_st_spectype TEXT   -- Tipo espectral estrella
) RETURNS FLOAT AS $$
DECLARE
  score FLOAT := 0;
  temp_score FLOAT := 0;
  radius_score FLOAT := 0;
  mass_score FLOAT := 0;
  hz_score FLOAT := 0;
  star_score FLOAT := 0;
BEGIN
  -- Temperatura (25%) - ideal 255-310K (like Earth ~288K)
  IF p_eqt IS NOT NULL THEN
    IF p_eqt BETWEEN 200 AND 350 THEN
      temp_score := 100 - (ABS(p_eqt - 288) / 62.0) * 100;
      temp_score := GREATEST(temp_score, 0);
    ELSIF p_eqt BETWEEN 150 AND 400 THEN
      temp_score := 20;
    ELSE
      temp_score := 0;
    END IF;
  END IF;

  -- Radio (20%) - ideal 0.5-1.5 Earth radii
  IF p_rade IS NOT NULL THEN
    IF p_rade BETWEEN 0.5 AND 1.5 THEN
      radius_score := 100 - (ABS(p_rade - 1.0) / 0.5) * 50;
    ELSIF p_rade BETWEEN 0.3 AND 2.5 THEN
      radius_score := 30;
    ELSIF p_rade < 5 THEN
      radius_score := 10;
    ELSE
      radius_score := 0;
    END IF;
  END IF;

  -- Masa (15%) - ideal 0.5-5 Earth masses
  IF p_masse IS NOT NULL THEN
    IF p_masse BETWEEN 0.5 AND 5 THEN
      mass_score := 100 - (ABS(p_masse - 1.0) / 4.0) * 60;
      mass_score := GREATEST(mass_score, 40);
    ELSIF p_masse BETWEEN 0.1 AND 10 THEN
      mass_score := 20;
    ELSE
      mass_score := 0;
    END IF;
  END IF;

  -- Zona habitable via insolación (25%) - ideal 0.25-2.0 Earth flux
  IF p_insol IS NOT NULL THEN
    IF p_insol BETWEEN 0.25 AND 2.0 THEN
      hz_score := 100 - (ABS(p_insol - 1.0) / 1.0) * 50;
      hz_score := GREATEST(hz_score, 50);
    ELSIF p_insol BETWEEN 0.1 AND 4.0 THEN
      hz_score := 20;
    ELSE
      hz_score := 0;
    END IF;
  END IF;

  -- Tipo de estrella (15%) - G y K son ideales
  IF p_st_spectype IS NOT NULL THEN
    IF p_st_spectype LIKE 'G%' THEN
      star_score := 100;
    ELSIF p_st_spectype LIKE 'K%' THEN
      star_score := 90;
    ELSIF p_st_spectype LIKE 'F%' THEN
      star_score := 60;
    ELSIF p_st_spectype LIKE 'M%' THEN
      star_score := 40;
    ELSE
      star_score := 10;
    END IF;
  END IF;

  score := (temp_score * 0.25) + (radius_score * 0.20) + (mass_score * 0.15) + (hz_score * 0.25) + (star_score * 0.15);

  RETURN ROUND(score::numeric, 2);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Función para inferir tipo de planeta
-- ============================================
CREATE OR REPLACE FUNCTION infer_planet_type(
  p_rade FLOAT,
  p_masse FLOAT,
  p_eqt FLOAT
) RETURNS TEXT AS $$
BEGIN
  IF p_rade IS NULL AND p_masse IS NULL THEN
    RETURN 'unknown';
  END IF;

  -- Gas giant: radius > 6 Earth radii or mass > 50 Earth masses
  IF (p_rade IS NOT NULL AND p_rade > 6) OR (p_masse IS NOT NULL AND p_masse > 50) THEN
    IF p_eqt IS NOT NULL AND p_eqt > 1000 THEN
      RETURN 'hot_jupiter';
    END IF;
    RETURN 'gas_giant';
  END IF;

  -- Ice giant: radius 3-6 or mass 10-50
  IF (p_rade IS NOT NULL AND p_rade BETWEEN 3 AND 6) OR (p_masse IS NOT NULL AND p_masse BETWEEN 10 AND 50) THEN
    IF p_eqt IS NOT NULL AND p_eqt < 200 THEN
      RETURN 'ice_giant';
    END IF;
    RETURN 'mini_neptune';
  END IF;

  -- Super Earth: radius 1.5-3 or mass 2-10
  IF (p_rade IS NOT NULL AND p_rade BETWEEN 1.5 AND 3) OR (p_masse IS NOT NULL AND p_masse BETWEEN 2 AND 10) THEN
    RETURN 'super_earth';
  END IF;

  -- Rocky: radius < 1.5 and mass < 2
  IF (p_rade IS NOT NULL AND p_rade < 1.5) THEN
    IF p_eqt IS NOT NULL AND p_eqt > 800 THEN
      RETURN 'lava_world';
    ELSIF p_eqt IS NOT NULL AND p_eqt < 150 THEN
      RETURN 'frozen_rocky';
    END IF;
    RETURN 'rocky';
  END IF;

  RETURN 'unknown';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Función para inferir propiedades visuales
-- ============================================
CREATE OR REPLACE FUNCTION infer_visual_properties()
RETURNS TRIGGER AS $$
BEGIN
  -- Tipo de planeta
  NEW.planet_type := infer_planet_type(NEW.pl_rade, NEW.pl_masse, NEW.pl_eqt);

  -- Habitability score
  NEW.habitability_score := calculate_habitability_score(
    NEW.pl_eqt, NEW.pl_rade, NEW.pl_masse, NEW.pl_insol, NEW.st_spectype
  );

  -- Zona habitable
  NEW.in_habitable_zone := (NEW.pl_insol IS NOT NULL AND NEW.pl_insol BETWEEN 0.25 AND 2.0);

  -- Superficie visual
  NEW.visual_surface_type := CASE NEW.planet_type
    WHEN 'gas_giant' THEN 'gas'
    WHEN 'hot_jupiter' THEN 'gas'
    WHEN 'ice_giant' THEN 'ice'
    WHEN 'mini_neptune' THEN 'gas'
    WHEN 'lava_world' THEN 'lava'
    WHEN 'frozen_rocky' THEN 'ice'
    WHEN 'rocky' THEN CASE
      WHEN NEW.pl_eqt BETWEEN 250 AND 320 AND NEW.in_habitable_zone THEN 'water'
      ELSE 'rocky'
    END
    WHEN 'super_earth' THEN CASE
      WHEN NEW.pl_eqt BETWEEN 250 AND 320 AND NEW.in_habitable_zone THEN 'water'
      ELSE 'rocky'
    END
    ELSE 'rocky'
  END;

  -- Atmósfera
  NEW.has_atmosphere_likely := NEW.planet_type NOT IN ('frozen_rocky', 'unknown')
    AND (NEW.pl_masse IS NULL OR NEW.pl_masse > 0.1);

  NEW.visual_atmosphere_density := CASE NEW.planet_type
    WHEN 'gas_giant' THEN 0.95
    WHEN 'hot_jupiter' THEN 0.9
    WHEN 'ice_giant' THEN 0.85
    WHEN 'mini_neptune' THEN 0.8
    WHEN 'super_earth' THEN 0.5
    WHEN 'rocky' THEN 0.3
    WHEN 'lava_world' THEN 0.4
    WHEN 'frozen_rocky' THEN 0.05
    ELSE 0.2
  END;

  -- Color de atmósfera basado en temperatura y tipo
  NEW.visual_atmosphere_color := CASE
    WHEN NEW.pl_eqt > 1500 THEN '#FF4500'   -- Naranja incandescente
    WHEN NEW.pl_eqt > 1000 THEN '#FF6B35'   -- Naranja
    WHEN NEW.pl_eqt > 700 THEN '#CD853F'    -- Marrón dorado
    WHEN NEW.planet_type IN ('gas_giant', 'hot_jupiter') THEN '#DAA520'  -- Dorado (Jupiter-like)
    WHEN NEW.planet_type IN ('ice_giant') THEN '#4169E1'   -- Azul (Neptune-like)
    WHEN NEW.planet_type IN ('mini_neptune') THEN '#5F9EA0' -- Cyan
    WHEN NEW.visual_surface_type = 'water' THEN '#87CEEB'  -- Azul cielo (Earth-like)
    WHEN NEW.pl_eqt < 150 THEN '#B0C4DE'    -- Azul helado
    ELSE '#C0C0C0'                            -- Gris neutro
  END;

  -- Anillos: gas giants tienen ~20% chance, ice giants ~30%
  NEW.visual_has_rings := CASE
    WHEN NEW.planet_type = 'gas_giant' THEN (hashtext(NEW.pl_name) % 5 = 0)
    WHEN NEW.planet_type = 'ice_giant' THEN (hashtext(NEW.pl_name) % 3 = 0)
    WHEN NEW.planet_type = 'hot_jupiter' THEN FALSE
    ELSE FALSE
  END;

  -- Nubes
  NEW.visual_has_clouds := NEW.has_atmosphere_likely AND NEW.visual_atmosphere_density > 0.2;
  NEW.visual_cloud_density := CASE
    WHEN NOT NEW.visual_has_clouds THEN 0
    WHEN NEW.planet_type IN ('gas_giant', 'hot_jupiter') THEN 0.8
    WHEN NEW.planet_type IN ('ice_giant', 'mini_neptune') THEN 0.7
    WHEN NEW.visual_surface_type = 'water' THEN 0.6
    ELSE NEW.visual_atmosphere_density * 0.5
  END;

  -- Lunas: basado en masa del planeta (más masivo = más lunas probables)
  NEW.visual_num_moons := CASE
    WHEN NEW.planet_type = 'gas_giant' THEN LEAST(ABS(hashtext(NEW.pl_name) % 5) + 2, 6)
    WHEN NEW.planet_type = 'hot_jupiter' THEN 0  -- Muy cerca de estrella
    WHEN NEW.planet_type = 'ice_giant' THEN LEAST(ABS(hashtext(NEW.pl_name) % 3) + 1, 4)
    WHEN NEW.planet_type = 'super_earth' THEN ABS(hashtext(NEW.pl_name) % 2)
    WHEN NEW.planet_type = 'rocky' THEN CASE WHEN ABS(hashtext(NEW.pl_name) % 4) = 0 THEN 1 ELSE 0 END
    ELSE 0
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular automáticamente al insertar/actualizar
CREATE TRIGGER trg_infer_visual_properties
  BEFORE INSERT OR UPDATE ON exoplanets
  FOR EACH ROW
  EXECUTE FUNCTION infer_visual_properties();
