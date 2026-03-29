// База марок та моделей автомобілів (найпопулярніші в Україні)
export const CAR_BRANDS = [
  {
    brand: 'Toyota',
    models: ['Camry', 'Corolla', 'RAV4', 'Land Cruiser', 'Prius', 'Highlander', 'Yaris', 'Avensis', 'Auris', 'C-HR'],
  },
  {
    brand: 'Volkswagen',
    models: ['Golf', 'Passat', 'Tiguan', 'Polo', 'Jetta', 'Touareg', 'Caddy', 'T-Roc', 'Arteon', 'Touran'],
  },
  {
    brand: 'BMW',
    models: ['3 Series', '5 Series', 'X5', 'X3', '1 Series', '7 Series', 'X1', '2 Series', 'X6', 'M3'],
  },
  {
    brand: 'Mercedes-Benz',
    models: ['C-Class', 'E-Class', 'GLC', 'S-Class', 'A-Class', 'GLE', 'B-Class', 'CLA', 'GLB', 'GLA'],
  },
  {
    brand: 'Hyundai',
    models: ['Tucson', 'Elantra', 'Santa Fe', 'i30', 'Accent', 'Creta', 'Sonata', 'Kona', 'ix35', 'IONIQ'],
  },
  {
    brand: 'Kia',
    models: ['Sportage', 'Cerato', 'Rio', 'Ceed', 'Sorento', 'Soul', 'Stinger', 'Niro', 'Picanto', 'Telluride'],
  },
  {
    brand: 'Skoda',
    models: ['Octavia', 'Fabia', 'Superb', 'Kodiaq', 'Rapid', 'Karoq', 'Scala', 'Kamiq', 'Enyaq', 'Yeti'],
  },
  {
    brand: 'Audi',
    models: ['A4', 'A6', 'Q5', 'A3', 'Q3', 'A5', 'Q7', 'A1', 'A7', 'e-tron'],
  },
  {
    brand: 'Ford',
    models: ['Focus', 'Mondeo', 'Kuga', 'EcoSport', 'Edge', 'Puma', 'Mustang', 'Explorer', 'Ranger', 'Fusion'],
  },
  {
    brand: 'Renault',
    models: ['Logan', 'Duster', 'Sandero', 'Megane', 'Captur', 'Koleos', 'Clio', 'Scenic', 'Fluence', 'Kadjar'],
  },
  {
    brand: 'Opel',
    models: ['Astra', 'Corsa', 'Insignia', 'Mokka', 'Crossland', 'Grandland', 'Meriva', 'Zafira', 'Vectra', 'Omega'],
  },
  {
    brand: 'Mazda',
    models: ['CX-5', 'Mazda 3', 'Mazda 6', 'CX-30', 'MX-5', 'Mazda 2', 'CX-3', 'CX-9', 'BT-50', 'CX-60'],
  },
  {
    brand: 'Nissan',
    models: ['Qashqai', 'X-Trail', 'Juke', 'Note', 'Micra', 'Leaf', 'Pathfinder', 'Navara', 'Ariya', 'Kicks'],
  },
  {
    brand: 'Honda',
    models: ['Civic', 'Accord', 'CR-V', 'HR-V', 'Jazz', 'Pilot', 'Fit', 'Ridgeline', 'Passport', 'BR-V'],
  },
  {
    brand: 'Mitsubishi',
    models: ['Outlander', 'ASX', 'L200', 'Eclipse Cross', 'Pajero', 'Colt', 'Lancer', 'Galant', 'Space Star'],
  },
  {
    brand: 'Subaru',
    models: ['Forester', 'Outback', 'Impreza', 'Legacy', 'XV', 'BRZ', 'WRX', 'Crosstrek', 'Ascent'],
  },
  {
    brand: 'Peugeot',
    models: ['208', '308', '2008', '3008', '5008', '508', '107', '207', '4007', 'Partner'],
  },
  {
    brand: 'Citroen',
    models: ['C3', 'C4', 'C5 Aircross', 'Berlingo', 'C4 Cactus', 'C3 Aircross', 'C5', 'SpaceTourer', 'Jumpy'],
  },
  {
    brand: 'Fiat',
    models: ['Punto', 'Bravo', 'Tipo', '500', 'Doblo', 'Stilo', 'Croma', 'Linea', 'Sedici', 'Panda'],
  },
  {
    brand: 'Chevrolet',
    models: ['Lacetti', 'Aveo', 'Cruze', 'Captiva', 'Epica', 'Spark', 'Malibu', 'Equinox', 'Trailblazer'],
  },
  {
    brand: 'Suzuki',
    models: ['SX4', 'Vitara', 'Swift', 'Jimny', 'Grand Vitara', 'Baleno', 'Ignis', 'Splash', 'Across'],
  },
  {
    brand: 'Volvo',
    models: ['XC60', 'XC90', 'S60', 'V60', 'XC40', 'S90', 'V90', 'C40', 'V40', 'V70'],
  },
  {
    brand: 'Seat',
    models: ['Ibiza', 'Leon', 'Ateca', 'Arona', 'Tarraco', 'Alhambra', 'Altea', 'Cordoba', 'Toledo'],
  },
  {
    brand: 'Dacia',
    models: ['Duster', 'Logan', 'Sandero', 'Lodgy', 'Dokker', 'Spring', 'Jogger'],
  },
  {
    brand: 'Lada',
    models: ['Granta', 'Vesta', 'Niva', 'Largus', 'Kalina', '2107', '2106', 'Priora', 'XRAY', '4x4'],
  },
  {
    brand: 'Volkswagen (мікроавтобус)',
    models: ['Transporter', 'Multivan', 'Caravelle', 'Crafter'],
  },
  {
    brand: 'Mercedes-Benz (вантажний)',
    models: ['Sprinter', 'Vito', 'Viano', 'Citan', 'V-Class'],
  },
  { brand: 'Інше', models: ['Інша модель'] },
];

export const BRAND_NAMES = CAR_BRANDS.map(b => b.brand);

export function getModels(brand) {
  const found = CAR_BRANDS.find(b => b.brand === brand);
  return found ? found.models : [];
}
