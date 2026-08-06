CREATE TABLE IF NOT EXISTS car_fluids (
  id INT AUTO_INCREMENT PRIMARY KEY,
  brand VARCHAR(60) NOT NULL,
  model VARCHAR(60) NOT NULL,
  year_from INT DEFAULT 0,
  year_to   INT DEFAULT 9999,
  oil_viscosity  VARCHAR(20),
  oil_type       VARCHAR(30),
  oil_spec       VARCHAR(120),
  oil_motul      VARCHAR(100),
  brake_fluid    VARCHAR(20),
  coolant_type   VARCHAR(80),
  coolant_mix    VARCHAR(60),
  INDEX idx_brand_model (brand, model)
);

INSERT INTO car_fluids
  (brand, model, year_from, year_to, oil_viscosity, oil_type, oil_spec, oil_motul, brake_fluid, coolant_type, coolant_mix)
VALUES
-- SEAT
('SEAT','Ibiza',      2008,2017,'5W-30','Sintético','VW 504/507, ACEA C3','Motul 8100 X-cess 5W-30',       'DOT 4','G12+ / G13 (violeta/lila)','50/50 agua-anticongelante'),
('SEAT','Ibiza',      2017,9999,'5W-30','Sintético','VW 508/509, ACEA C2','Motul 8100 Eco-nergy 5W-30',    'DOT 4','G13 (violeta/lila)','50/50 agua-anticongelante'),
('SEAT','León',       2005,2012,'5W-30','Sintético','VW 504/507, ACEA C3','Motul 8100 X-cess 5W-30',       'DOT 4','G12+ (rosa/rojo)','50/50 agua-anticongelante'),
('SEAT','León',       2012,9999,'5W-30','Sintético','VW 504/507, ACEA C3','Motul 8100 X-cess 5W-30',       'DOT 4','G13 (violeta/lila)','50/50 agua-anticongelante'),
('SEAT','Arona',      2017,9999,'5W-30','Sintético','VW 508/509, ACEA C2','Motul 8100 Eco-nergy 5W-30',    'DOT 4','G13 (violeta/lila)','50/50 agua-anticongelante'),
('SEAT','Ateca',      2016,9999,'5W-30','Sintético','VW 504/507, ACEA C3','Motul 8100 X-cess 5W-30',       'DOT 4','G13 (violeta/lila)','50/50 agua-anticongelante'),
('SEAT','Tarraco',    2018,9999,'5W-30','Sintético','VW 504/507, ACEA C3','Motul 8100 X-cess 5W-30',       'DOT 4','G13 (violeta/lila)','50/50 agua-anticongelante'),
-- Volkswagen
('Volkswagen','Polo', 2009,2017,'5W-30','Sintético','VW 504/507, ACEA C3','Motul 8100 X-cess 5W-30',       'DOT 4','G12+ / G13 (violeta/lila)','50/50 agua-anticongelante'),
('Volkswagen','Polo', 2017,9999,'5W-30','Sintético','VW 508/509, ACEA C2','Motul 8100 Eco-nergy 5W-30',    'DOT 4','G13 (violeta/lila)','50/50 agua-anticongelante'),
('Volkswagen','Golf', 2003,2012,'5W-30','Sintético','VW 504/507, ACEA C3','Motul 8100 X-cess 5W-30',       'DOT 4','G12+ (rosa/rojo)','50/50 agua-anticongelante'),
('Volkswagen','Golf', 2012,9999,'5W-30','Sintético','VW 504/507, ACEA C3','Motul 8100 X-cess 5W-30',       'DOT 4','G13 (violeta/lila)','50/50 agua-anticongelante'),
('Volkswagen','Tiguan',2007,2016,'5W-30','Sintético','VW 504/507, ACEA C3','Motul 8100 X-cess 5W-30',      'DOT 4','G12+ / G13','50/50 agua-anticongelante'),
('Volkswagen','Tiguan',2016,9999,'5W-30','Sintético','VW 504/507, ACEA C3','Motul 8100 X-cess 5W-30',      'DOT 4','G13 (violeta/lila)','50/50 agua-anticongelante'),
('Volkswagen','Passat',2010,9999,'5W-30','Sintético','VW 504/507, ACEA C3','Motul 8100 X-cess 5W-30',      'DOT 4','G13 (violeta/lila)','50/50 agua-anticongelante'),
('Volkswagen','T-Roc', 2017,9999,'5W-30','Sintético','VW 508/509, ACEA C2','Motul 8100 Eco-nergy 5W-30',  'DOT 4','G13 (violeta/lila)','50/50 agua-anticongelante'),
-- Audi
('Audi','A3',         2003,2012,'5W-30','Sintético','VW 504/507, ACEA C3','Motul 8100 X-cess 5W-30',       'DOT 4','G12+ (rosa/rojo)','50/50 agua-anticongelante'),
('Audi','A3',         2012,9999,'5W-30','Sintético','VW 504/507, ACEA C3','Motul 8100 X-cess 5W-30',       'DOT 4','G13 (violeta/lila)','50/50 agua-anticongelante'),
('Audi','A4',         2007,9999,'5W-30','Sintético','VW 504/507, ACEA C3','Motul 8100 X-cess 5W-30',       'DOT 4','G13 (violeta/lila)','50/50 agua-anticongelante'),
('Audi','A6',         2011,9999,'5W-30','Sintético','VW 504/507, ACEA C3','Motul 8100 X-cess 5W-30',       'DOT 4','G13 (violeta/lila)','50/50 agua-anticongelante'),
('Audi','Q3',         2011,9999,'5W-30','Sintético','VW 504/507, ACEA C3','Motul 8100 X-cess 5W-30',       'DOT 4','G13 (violeta/lila)','50/50 agua-anticongelante'),
('Audi','Q5',         2008,9999,'5W-30','Sintético','VW 504/507, ACEA C3','Motul 8100 X-cess 5W-30',       'DOT 4','G13 (violeta/lila)','50/50 agua-anticongelante'),
-- Skoda
('Skoda','Fabia',     2007,9999,'5W-30','Sintético','VW 504/507, ACEA C3','Motul 8100 X-cess 5W-30',       'DOT 4','G13 (violeta/lila)','50/50 agua-anticongelante'),
('Skoda','Octavia',   2004,9999,'5W-30','Sintético','VW 504/507, ACEA C3','Motul 8100 X-cess 5W-30',       'DOT 4','G13 (violeta/lila)','50/50 agua-anticongelante'),
('Skoda','Karoq',     2017,9999,'5W-30','Sintético','VW 504/507, ACEA C3','Motul 8100 X-cess 5W-30',       'DOT 4','G13 (violeta/lila)','50/50 agua-anticongelante'),
('Skoda','Kodiaq',    2016,9999,'5W-30','Sintético','VW 504/507, ACEA C3','Motul 8100 X-cess 5W-30',       'DOT 4','G13 (violeta/lila)','50/50 agua-anticongelante'),
-- Renault
('Renault','Clio',    2012,2019,'5W-40','Sintético','RN0700/RN0710, ACEA A3/B4','Motul 8100 X-cess 5W-40', 'DOT 4','GLACEOL RX Type D (azul)','50/50 agua-anticongelante'),
('Renault','Clio',    2019,9999,'0W-20','Sintético','RN0720, ACEA C5','Motul 8100 Eco-lite 0W-20',         'DOT 4','GLACEOL RX Type D (azul)','50/50 agua-anticongelante'),
('Renault','Mégane',  2008,2016,'5W-40','Sintético','RN0700/RN0710, ACEA A3/B4','Motul 8100 X-cess 5W-40','DOT 4','GLACEOL RX Type D (azul)','50/50 agua-anticongelante'),
('Renault','Mégane',  2016,9999,'5W-30','Sintético','RN0700/RN0710, ACEA C3','Motul 8100 X-cess 5W-30',   'DOT 4','GLACEOL RX Type D (azul)','50/50 agua-anticongelante'),
('Renault','Kadjar',  2015,9999,'5W-30','Sintético','RN0700/RN0710, ACEA C3','Motul 8100 X-cess 5W-30',   'DOT 4','GLACEOL RX Type D (azul)','50/50 agua-anticongelante'),
('Renault','Captur',  2013,9999,'5W-40','Sintético','RN0700/RN0710','Motul 8100 X-cess 5W-40',            'DOT 4','GLACEOL RX Type D (azul)','50/50 agua-anticongelante'),
('Renault','Arkana',  2021,9999,'0W-20','Sintético','RN0720, ACEA C5','Motul 8100 Eco-lite 0W-20',         'DOT 4','GLACEOL RX Type D (azul)','50/50 agua-anticongelante'),
-- Dacia
('Dacia','Sandero',   2012,9999,'5W-40','Sintético','RN0700/RN0710, ACEA A3/B4','Motul 8100 X-cess 5W-40','DOT 4','GLACEOL RX Type D (azul)','50/50 agua-anticongelante'),
('Dacia','Duster',    2010,9999,'5W-40','Sintético','RN0700/RN0710, ACEA A3/B4','Motul 8100 X-cess 5W-40','DOT 4','GLACEOL RX Type D (azul)','50/50 agua-anticongelante'),
('Dacia','Logan',     2004,9999,'5W-40','Sintético','ACEA A3/B4','Motul 8100 X-cess 5W-40',               'DOT 4','GLACEOL RX Type D (azul)','50/50 agua-anticongelante'),
-- Peugeot
('Peugeot','208',     2012,9999,'5W-30','Sintético','PSA B71 2290, ACEA C2','Motul 8100 Eco-nergy 5W-30',  'DOT 4','OAT (rojo/rosa)','50/50 agua-anticongelante'),
('Peugeot','308',     2013,9999,'5W-30','Sintético','PSA B71 2290, ACEA C2','Motul 8100 Eco-nergy 5W-30',  'DOT 4','OAT (rojo/rosa)','50/50 agua-anticongelante'),
('Peugeot','2008',    2013,9999,'5W-30','Sintético','PSA B71 2290, ACEA C2','Motul 8100 Eco-nergy 5W-30',  'DOT 4','OAT (rojo/rosa)','50/50 agua-anticongelante'),
('Peugeot','3008',    2009,9999,'5W-30','Sintético','PSA B71 2290, ACEA C2','Motul 8100 Eco-nergy 5W-30',  'DOT 4','OAT (rojo/rosa)','50/50 agua-anticongelante'),
('Peugeot','5008',    2009,9999,'5W-30','Sintético','PSA B71 2290, ACEA C2','Motul 8100 Eco-nergy 5W-30',  'DOT 4','OAT (rojo/rosa)','50/50 agua-anticongelante'),
-- Citroën
('Citroën','C3',      2009,9999,'5W-30','Sintético','PSA B71 2290, ACEA C2','Motul 8100 Eco-nergy 5W-30',  'DOT 4','OAT (rojo/rosa)','50/50 agua-anticongelante'),
('Citroën','C4',      2010,9999,'5W-30','Sintético','PSA B71 2290, ACEA C2','Motul 8100 Eco-nergy 5W-30',  'DOT 4','OAT (rojo/rosa)','50/50 agua-anticongelante'),
('Citroën','C5 Aircross',2018,9999,'5W-30','Sintético','PSA B71 2290, ACEA C2','Motul 8100 Eco-nergy 5W-30','DOT 4','OAT (rojo/rosa)','50/50 agua-anticongelante'),
('Citroën','Berlingo', 2008,9999,'5W-30','Sintético','PSA B71 2290, ACEA C2','Motul 8100 Eco-nergy 5W-30', 'DOT 4','OAT (rojo/rosa)','50/50 agua-anticongelante'),
-- Toyota
('Toyota','Yaris',    2011,2020,'0W-20','Sintético','ILSAC GF-5, ACEA A1/B1','Motul 8100 Eco-lite 0W-20',  'DOT 3','Toyota SLLC (rosa)','50/50 agua-anticongelante'),
('Toyota','Yaris',    2020,9999,'0W-16','Sintético','ILSAC GF-6B, Toyota WS','Motul 8100 Eco-lite 0W-16',  'DOT 3','Toyota SLLC (rosa)','50/50 agua-anticongelante'),
('Toyota','Corolla',  2019,9999,'0W-20','Sintético','ACEA C5, Toyota WS','Motul 8100 Eco-lite 0W-20',      'DOT 3','Toyota SLLC (rosa)','50/50 agua-anticongelante'),
('Toyota','Auris',    2012,2019,'0W-20','Sintético','ILSAC GF-5, ACEA A1/B1','Motul 8100 Eco-lite 0W-20',  'DOT 3','Toyota SLLC (rosa)','50/50 agua-anticongelante'),
('Toyota','RAV4',     2013,9999,'0W-20','Sintético','ILSAC GF-5, ACEA C5','Motul 8100 Eco-lite 0W-20',     'DOT 3','Toyota SLLC (rosa)','50/50 agua-anticongelante'),
('Toyota','C-HR',     2016,9999,'0W-20','Sintético','ILSAC GF-5, ACEA C5','Motul 8100 Eco-lite 0W-20',     'DOT 3','Toyota SLLC (rosa)','50/50 agua-anticongelante'),
('Toyota','Camry',    2019,9999,'0W-20','Sintético','Toyota WS, ACEA C5','Motul 8100 Eco-lite 0W-20',       'DOT 3','Toyota SLLC (rosa)','50/50 agua-anticongelante'),
-- Ford
('Ford','Fiesta',     2008,2017,'5W-30','Sintético','Ford WSS-M2C913-D, ACEA A5/B5','Motul 8100 Eco-nergy 5W-30','DOT 4','OAT amarillo (Ford)','50/50 agua-anticongelante'),
('Ford','Fiesta',     2017,9999,'5W-30','Sintético','Ford WSS-M2C917-A, ACEA A1/B1','Motul 8100 Eco-nergy 5W-30','DOT 4','OAT amarillo (Ford)','50/50 agua-anticongelante'),
('Ford','Focus',      2011,2018,'5W-30','Sintético','Ford WSS-M2C913-D, ACEA A5/B5','Motul 8100 Eco-nergy 5W-30','DOT 4','OAT amarillo (Ford)','50/50 agua-anticongelante'),
('Ford','Focus',      2018,9999,'5W-30','Sintético','Ford WSS-M2C947-B, ACEA C2','Motul 8100 Eco-nergy 5W-30',  'DOT 4','OAT amarillo (Ford)','50/50 agua-anticongelante'),
('Ford','Kuga',       2012,9999,'5W-30','Sintético','Ford WSS-M2C913-D, ACEA A5/B5','Motul 8100 Eco-nergy 5W-30','DOT 4','OAT amarillo (Ford)','50/50 agua-anticongelante'),
('Ford','Mondeo',     2007,2022,'5W-30','Sintético','Ford WSS-M2C913-D, ACEA A5/B5','Motul 8100 Eco-nergy 5W-30','DOT 4','OAT amarillo (Ford)','50/50 agua-anticongelante'),
('Ford','Puma',       2019,9999,'0W-20','Sintético','Ford WSS-M2C960-A, ACEA C5','Motul 8100 Eco-lite 0W-20',   'DOT 4','OAT amarillo (Ford)','50/50 agua-anticongelante'),
-- Opel
('Opel','Corsa',      2006,2019,'5W-30','Sintético','GM dexos2, ACEA C3','Motul 8100 X-cess 5W-30',         'DOT 4','OAT violeta (GM DEX-COOL)','50/50 agua-anticongelante'),
('Opel','Corsa',      2019,9999,'5W-30','Sintético','PSA B71 2290, ACEA C2','Motul 8100 Eco-nergy 5W-30',   'DOT 4','OAT (rojo/rosa)','50/50 agua-anticongelante'),
('Opel','Astra',      2009,2021,'5W-30','Sintético','GM dexos2, ACEA C3','Motul 8100 X-cess 5W-30',         'DOT 4','OAT violeta (GM DEX-COOL)','50/50 agua-anticongelante'),
('Opel','Insignia',   2008,9999,'5W-30','Sintético','GM dexos2, ACEA C3','Motul 8100 X-cess 5W-30',         'DOT 4','OAT violeta (GM DEX-COOL)','50/50 agua-anticongelante'),
('Opel','Mokka',      2012,9999,'5W-30','Sintético','GM dexos2, ACEA C3','Motul 8100 X-cess 5W-30',         'DOT 4','OAT violeta (GM DEX-COOL)','50/50 agua-anticongelante'),
('Opel','Grandland',  2017,9999,'5W-30','Sintético','PSA B71 2290, ACEA C2','Motul 8100 Eco-nergy 5W-30',   'DOT 4','OAT (rojo/rosa)','50/50 agua-anticongelante'),
('Opel','Crossland',  2017,9999,'5W-30','Sintético','PSA B71 2290, ACEA C2','Motul 8100 Eco-nergy 5W-30',   'DOT 4','OAT (rojo/rosa)','50/50 agua-anticongelante'),
-- BMW
('BMW','Serie 1',     2011,9999,'5W-30','Sintético','BMW Longlife-04, ACEA C3','Motul 8100 X-clean EFE 5W-30','DOT 4','BMW NBC (azul turquesa)','50/50 agua-anticongelante'),
('BMW','Serie 2',     2014,9999,'5W-30','Sintético','BMW Longlife-04, ACEA C3','Motul 8100 X-clean EFE 5W-30','DOT 4','BMW NBC (azul turquesa)','50/50 agua-anticongelante'),
('BMW','Serie 3',     2005,9999,'5W-30','Sintético','BMW Longlife-04, ACEA C3','Motul 8100 X-clean EFE 5W-30','DOT 4','BMW NBC (azul turquesa)','50/50 agua-anticongelante'),
('BMW','Serie 5',     2010,9999,'5W-30','Sintético','BMW Longlife-04, ACEA C3','Motul 8100 X-clean EFE 5W-30','DOT 4','BMW NBC (azul turquesa)','50/50 agua-anticongelante'),
('BMW','X1',          2009,9999,'5W-30','Sintético','BMW Longlife-04, ACEA C3','Motul 8100 X-clean EFE 5W-30','DOT 4','BMW NBC (azul turquesa)','50/50 agua-anticongelante'),
('BMW','X3',          2010,9999,'5W-30','Sintético','BMW Longlife-04, ACEA C3','Motul 8100 X-clean EFE 5W-30','DOT 4','BMW NBC (azul turquesa)','50/50 agua-anticongelante'),
('BMW','X5',          2006,9999,'5W-30','Sintético','BMW Longlife-04, ACEA C3','Motul 8100 X-clean EFE 5W-30','DOT 4','BMW NBC (azul turquesa)','50/50 agua-anticongelante'),
-- Mercedes
('Mercedes','Clase A',2012,9999,'5W-30','Sintético','MB 229.51, ACEA C3','Motul 8100 X-clean+ 5W-30',       'DOT 4 Plus','MB 325.0 (lila/violeta)','50/50 agua-anticongelante'),
('Mercedes','Clase B',2011,9999,'5W-30','Sintético','MB 229.51, ACEA C3','Motul 8100 X-clean+ 5W-30',       'DOT 4 Plus','MB 325.0 (lila/violeta)','50/50 agua-anticongelante'),
('Mercedes','Clase C',2007,9999,'5W-30','Sintético','MB 229.51, ACEA C3','Motul 8100 X-clean+ 5W-30',       'DOT 4 Plus','MB 325.0 (lila/violeta)','50/50 agua-anticongelante'),
('Mercedes','Clase E',2009,9999,'5W-30','Sintético','MB 229.51, ACEA C3','Motul 8100 X-clean+ 5W-30',       'DOT 4 Plus','MB 325.0 (lila/violeta)','50/50 agua-anticongelante'),
('Mercedes','GLA',    2013,9999,'5W-30','Sintético','MB 229.51, ACEA C3','Motul 8100 X-clean+ 5W-30',       'DOT 4 Plus','MB 325.0 (lila/violeta)','50/50 agua-anticongelante'),
('Mercedes','GLC',    2015,9999,'5W-30','Sintético','MB 229.51, ACEA C3','Motul 8100 X-clean+ 5W-30',       'DOT 4 Plus','MB 325.0 (lila/violeta)','50/50 agua-anticongelante'),
-- Hyundai
('Hyundai','i20',     2014,9999,'5W-30','Sintético','ACEA C3, API SN','Motul 8100 X-cess 5W-30',            'DOT 4','HOAT azul (Hyundai)','50/50 agua-anticongelante'),
('Hyundai','i30',     2011,9999,'5W-30','Sintético','ACEA C3, API SN','Motul 8100 X-cess 5W-30',            'DOT 4','HOAT azul (Hyundai)','50/50 agua-anticongelante'),
('Hyundai','Tucson',  2015,9999,'5W-30','Sintético','ACEA C3, API SN','Motul 8100 X-cess 5W-30',            'DOT 4','HOAT azul (Hyundai)','50/50 agua-anticongelante'),
('Hyundai','Kona',    2017,9999,'5W-30','Sintético','ACEA C3, API SN','Motul 8100 X-cess 5W-30',            'DOT 4','HOAT azul (Hyundai)','50/50 agua-anticongelante'),
('Hyundai','Santa Fe',2012,9999,'5W-30','Sintético','ACEA C3, API SN','Motul 8100 X-cess 5W-30',            'DOT 4','HOAT azul (Hyundai)','50/50 agua-anticongelante'),
-- Kia
('Kia','Picanto',     2011,9999,'5W-30','Sintético','ACEA C3, API SN','Motul 8100 X-cess 5W-30',            'DOT 4','HOAT azul (Kia)','50/50 agua-anticongelante'),
('Kia','Ceed',        2012,9999,'5W-30','Sintético','ACEA C3, API SN','Motul 8100 X-cess 5W-30',            'DOT 4','HOAT azul (Kia)','50/50 agua-anticongelante'),
('Kia','Sportage',    2010,9999,'5W-30','Sintético','ACEA C3, API SN','Motul 8100 X-cess 5W-30',            'DOT 4','HOAT azul (Kia)','50/50 agua-anticongelante'),
('Kia','Stonic',      2017,9999,'5W-30','Sintético','ACEA C3, API SN','Motul 8100 X-cess 5W-30',            'DOT 4','HOAT azul (Kia)','50/50 agua-anticongelante'),
('Kia','Niro',        2016,9999,'0W-20','Sintético','ACEA C5, API SP','Motul 8100 Eco-lite 0W-20',           'DOT 4','HOAT azul (Kia)','50/50 agua-anticongelante'),
-- Nissan
('Nissan','Micra',    2010,9999,'5W-30','Sintético','RN0700, ACEA C3','Motul 8100 X-cess 5W-30',             'DOT 4','HOAT azul (Nissan)','50/50 agua-anticongelante'),
('Nissan','Qashqai',  2013,9999,'5W-30','Sintético','ACEA C3, API SN','Motul 8100 X-cess 5W-30',            'DOT 4','HOAT azul (Nissan)','50/50 agua-anticongelante'),
('Nissan','Juke',     2010,9999,'5W-30','Sintético','ACEA C3, API SN','Motul 8100 X-cess 5W-30',            'DOT 4','HOAT azul (Nissan)','50/50 agua-anticongelante'),
('Nissan','X-Trail',  2013,9999,'5W-30','Sintético','ACEA C3, API SN','Motul 8100 X-cess 5W-30',            'DOT 4','HOAT azul (Nissan)','50/50 agua-anticongelante'),
-- Fiat
('Fiat','500',        2007,9999,'5W-40','Sintético','Fiat 9.55535-S1, ACEA A3/B4','Motul 8100 X-cess 5W-40','DOT 4','PARAFLU UP (azul)','50/50 agua-anticongelante'),
('Fiat','Tipo',       2015,9999,'5W-40','Sintético','Fiat 9.55535-S1, ACEA A3/B4','Motul 8100 X-cess 5W-40','DOT 4','PARAFLU UP (azul)','50/50 agua-anticongelante'),
('Fiat','Panda',      2012,9999,'5W-40','Sintético','Fiat 9.55535-S1, ACEA A3/B4','Motul 8100 X-cess 5W-40','DOT 4','PARAFLU UP (azul)','50/50 agua-anticongelante'),
-- Mazda
('Mazda','3',         2013,9999,'5W-30','Sintético','Mazda Original, ACEA A5/B5','Motul 8100 Eco-nergy 5W-30','DOT 3/4','FL-22 (verde)','50/50 agua-anticongelante'),
('Mazda','CX-5',      2012,9999,'5W-30','Sintético','Mazda Original, ACEA A5/B5','Motul 8100 Eco-nergy 5W-30','DOT 3/4','FL-22 (verde)','50/50 agua-anticongelante'),
('Mazda','6',         2012,9999,'5W-30','Sintético','Mazda Original, ACEA A5/B5','Motul 8100 Eco-nergy 5W-30','DOT 3/4','FL-22 (verde)','50/50 agua-anticongelante'),
-- Honda
('Honda','Civic',     2011,9999,'5W-30','Sintético','Honda HTO-06, ACEA A1/B1','Motul 8100 Eco-nergy 5W-30', 'DOT 3','Honda Ultra Cool (azul)','50/50 agua-anticongelante'),
('Honda','CR-V',      2012,9999,'5W-30','Sintético','Honda HTO-06, ACEA A1/B1','Motul 8100 Eco-nergy 5W-30', 'DOT 3','Honda Ultra Cool (azul)','50/50 agua-anticongelante'),
('Honda','HR-V',      2015,9999,'0W-20','Sintético','Honda HTO-06, ILSAC GF-5','Motul 8100 Eco-lite 0W-20', 'DOT 3','Honda Ultra Cool (azul)','50/50 agua-anticongelante'),
-- Volvo
('Volvo','V40',       2012,2019,'5W-30','Sintético','Volvo VCC-RBS0-2AE, ACEA A5/B5','Motul 8100 Eco-nergy 5W-30','DOT 4','Volvo Coolant (violeta)','50/50 agua-anticongelante'),
('Volvo','XC40',      2017,9999,'5W-30','Sintético','Volvo VCC-RBS0-2AE, ACEA C3','Motul 8100 X-cess 5W-30',  'DOT 4','Volvo Coolant (violeta)','50/50 agua-anticongelante'),
('Volvo','XC60',      2008,9999,'5W-30','Sintético','Volvo VCC-RBS0-2AE, ACEA C3','Motul 8100 X-cess 5W-30',  'DOT 4','Volvo Coolant (violeta)','50/50 agua-anticongelante'),
('Volvo','V60',       2010,9999,'5W-30','Sintético','Volvo VCC-RBS0-2AE, ACEA C3','Motul 8100 X-cess 5W-30',  'DOT 4','Volvo Coolant (violeta)','50/50 agua-anticongelante'),
-- MINI
('MINI','Cooper',     2006,9999,'5W-30','Sintético','BMW Longlife-04, ACEA C3','Motul 8100 X-clean EFE 5W-30','DOT 4','BMW NBC (azul turquesa)','50/50 agua-anticongelante'),
('MINI','Countryman', 2010,9999,'5W-30','Sintético','BMW Longlife-04, ACEA C3','Motul 8100 X-clean EFE 5W-30','DOT 4','BMW NBC (azul turquesa)','50/50 agua-anticongelante'),
-- Alfa Romeo
('Alfa Romeo','Giulietta',2010,9999,'5W-40','Sintético','Fiat 9.55535-S1, ACEA A3/B4','Motul 8100 X-cess 5W-40','DOT 4','PARAFLU UP (azul)','50/50 agua-anticongelante'),
('Alfa Romeo','Stelvio',  2016,9999,'5W-30','Sintético','FCA MS.90032, ACEA C3','Motul 8100 X-clean+ 5W-30',  'DOT 4','PARAFLU UP (azul)','50/50 agua-anticongelante'),
-- Suzuki
('Suzuki','Swift',    2010,9999,'5W-30','Sintético','ACEA A5/B5, API SN','Motul 8100 Eco-nergy 5W-30',       'DOT 4','OAT azul-verde','50/50 agua-anticongelante'),
('Suzuki','Vitara',   2015,9999,'5W-30','Sintético','ACEA A5/B5, API SN','Motul 8100 Eco-nergy 5W-30',       'DOT 4','OAT azul-verde','50/50 agua-anticongelante'),
-- Jeep / FCA
('Jeep','Renegade',   2014,9999,'5W-40','Sintético','Fiat 9.55535-S1, ACEA A3/B4','Motul 8100 X-cess 5W-40', 'DOT 4','PARAFLU UP (azul)','50/50 agua-anticongelante'),
('Jeep','Compass',    2017,9999,'5W-40','Sintético','FCA MS.90032, ACEA A3/B4','Motul 8100 X-cess 5W-40',    'DOT 4','PARAFLU UP (azul)','50/50 agua-anticongelante'),
-- Lexus
('Lexus','CT',        2010,9999,'0W-20','Sintético','ILSAC GF-5, Toyota WS','Motul 8100 Eco-lite 0W-20',     'DOT 3','Toyota SLLC (rosa)','50/50 agua-anticongelante'),
('Lexus','IS',        2013,9999,'0W-20','Sintético','ILSAC GF-5, Toyota WS','Motul 8100 Eco-lite 0W-20',     'DOT 3','Toyota SLLC (rosa)','50/50 agua-anticongelante'),
('Lexus','UX',        2018,9999,'0W-20','Sintético','Toyota WS, ACEA C5','Motul 8100 Eco-lite 0W-20',        'DOT 3','Toyota SLLC (rosa)','50/50 agua-anticongelante'),
-- Subaru
('Subaru','Forester', 2013,9999,'5W-30','Sintético','ACEA A3/B4, API SM','Motul 8100 X-cess 5W-30',          'DOT 3','Subaru Super Coolant (azul)','50/50 agua-anticongelante'),
('Subaru','Outback',  2014,9999,'5W-30','Sintético','ACEA A3/B4, API SM','Motul 8100 X-cess 5W-30',          'DOT 3','Subaru Super Coolant (azul)','50/50 agua-anticongelante'),
-- Mitsubishi
('Mitsubishi','ASX',       2010,9999,'5W-30','Sintético','ACEA A3/B4, API SN','Motul 8100 X-cess 5W-30','DOT 4','HOAT azul','50/50 agua-anticongelante'),
('Mitsubishi','Outlander', 2012,9999,'5W-30','Sintético','ACEA A3/B4, API SN','Motul 8100 X-cess 5W-30','DOT 4','HOAT azul','50/50 agua-anticongelante'),
('Mitsubishi','Eclipse Cross',2017,9999,'5W-30','Sintético','ACEA A3/B4, API SN','Motul 8100 X-cess 5W-30','DOT 4','HOAT azul','50/50 agua-anticongelante');
