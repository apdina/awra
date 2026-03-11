// Define the type for locales
export type Locale = 'en' | 'es' | 'it' | 'nl-NL' | 'ar-MA';

// Complete number names in all 4 languages
export const numberNames: Record<Locale, Record<number, string>> = {
  // English
  en: {
    1: "Noble", 2: "Sun", 3: "Boy", 4: "Bed", 5: "Cuffs", 6: "Heart", 7: "Moon", 8: "Woman", 9: "Shoes", 10: "Flower",
    11: "Nail", 12: "Eggs", 13: "Bad luck", 14: "Beer", 15: "Grapes", 16: "Guitar", 17: "Boat", 18: "Money", 19: "Jew", 20: "Bucket",
    21: "Travel", 22: "Duck", 23: "Melon", 24: "Car", 25: "Cannon", 26: "Rooster", 27: "Cage", 28: "Village", 29: "Christian", 30: "Lion",
    31: "Horse", 32: "Bomb", 33: "Shrimp", 34: "Club", 35: "Fire", 36: "Salon", 37: "Knife", 38: "Dog", 39: "Bull", 40: "Bell",
    41: "Black", 42: "Apple", 43: "Crown", 44: "Totem", 45: "Drum", 46: "Cap", 47: "World", 48: "Black woman", 49: "Fig", 50: "Bullet casing",
    51: "Goat", 52: "Tomato", 53: "Chilli", 54: "Snake", 55: "Police", 56: "Lettuce", 57: "Carrot", 58: "Lemon", 59: "Bird", 60: "Old lady",
    61: "Pipe", 62: "Lice", 63: "Onion", 64: "House", 65: "Pin", 66: "Nun", 67: "Imam", 68: "Rosary", 69: "Departure", 70: "Plum",
    71: "Teacher", 72: "Wheat", 73: "Rabbit", 74: "Ladder", 75: "Cat", 76: "Water", 77: "Flag", 78: "Bug", 79: "Pig", 80: "Hand-crank washing machine",
    81: "Ring", 82: "Shitter", 83: "Lady and child", 84: "Wedding", 85: "Tree", 86: "Shit", 87: "Fish", 88: "Sacks", 89: "Mule", 90: "Old man",
    91: "Drunk", 92: "Dove", 93: "Headache", 94: "Rat", 95: "The turkey", 96: "Park", 97: "Chicken", 98: "Sheep", 99: "The rope", 100: "Death"
  },
  
  // Spanish
  es: {
    1: "Noble", 2: "Sol", 3: "Niño", 4: "Cama", 5: "Esposas", 6: "Corazón", 7: "Luna", 8: "Mujer", 9: "Zapatos", 10: "Flor",
    11: "Clavo", 12: "Huevos", 13: "Mala suerte", 14: "Cerveza", 15: "Uvas", 16: "Guitarra", 17: "Barco", 18: "Dinero", 19: "Judío", 20: "Cubo",
    21: "Viaje", 22: "Pato", 23: "Melón", 24: "Coche", 25: "Cañón", 26: "Gallo", 27: "Jaula", 28: "Pueblo", 29: "Cristiano", 30: "León",
    31: "Caballo", 32: "Bomba", 33: "Gambas", 34: "Bate", 35: "Fuego", 36: "Salón", 37: "Cuchillo", 38: "Perro", 39: "Toro", 40: "Campana",
    41: "Negro", 42: "Manzana", 43: "Corona", 44: "Tótem", 45: "Tambor", 46: "Gorra", 47: "Mundo", 48: "Mujer negra", 49: "Higo", 50: "Cartucho",
    51: "Cabra", 52: "Tomate", 53: "Chile", 54: "Serpiente", 55: "Policía", 56: "Lechuga", 57: "Zanahoria", 58: "Limón", 59: "Pájaro", 60: "Vieja",
    61: "Pipa", 62: "Piojos", 63: "Cebolla", 64: "Casa", 65: "Pelea", 66: "Monja", 67: "Imán", 68: "Rosario", 69: "Mudanza", 70: "Ciruela",
    71: "Profesor", 72: "Trigo", 73: "Conejo", 74: "Escalera", 75: "Gato", 76: "Agua", 77: "Bandera", 78: "Bicho", 79: "Cerdo", 80: "Lavadora manual",
    81: "Anillo", 82: "Inodoro", 83: "Señora y niño", 84: "Boda", 85: "Árbol", 86: "Mierda", 87: "Pez", 88: "Sacos", 89: "Mula", 90: "Viejo",
    91: "Borracho", 92: "Paloma", 93: "Ruido", 94: "Rata", 95: "Pavo", 96: "Parque", 97: "Pollo", 98: "Oveja", 99: "La cuerda", 100: "Muerte"
  },
  
  // Italian
  it: {
    1: "Nobile", 2: "Sole", 3: "Ragazzo", 4: "Letto", 5: "Manette", 6: "Cuore", 7: "Luna", 8: "Donna", 9: "Scarpe", 10: "Fiore",
    11: "Vite", 12: "Uova", 13: "Sfortuna", 14: "Birra", 15: "Uva", 16: "Chitarra", 17: "Barca", 18: "Soldi", 19: "Ebreo", 20: "Secchio",
    21: "Viaggio", 22: "Anatra", 23: "Melone", 24: "Auto", 25: "Cannone", 26: "Gallo", 27: "Gabbia", 28: "Villaggio", 29: "Cristiano", 30: "Leone",
    31: "Cavallo", 32: "Bomba", 33: "Gamberi", 34: "Mazza", 35: "Fuoco", 36: "Salone", 37: "Coltello", 38: "Cane", 39: "Toro", 40: "Campana",
    41: "Nero", 42: "Mela", 43: "Corona", 44: "Totem", 45: "Tamburi", 46: "Cappello", 47: "Mondo", 48: "Donna nera", 49: "Fico", 50: "Cartuccia",
    51: "Capra", 52: "Pomodoro", 53: "Peperoncino", 54: "Serpente", 55: "Polizia", 56: "Lattuga", 57: "Carota", 58: "Limone", 59: "Uccello", 60: "Vecchia",
    61: "Pipa", 62: "Pulci", 63: "Cipolla", 64: "Casa", 65: "Rissa", 66: "Suora", 67: "Imam", 68: "Braccialetti religiosi", 69: "Trasloco", 70: "Albicocca",
    71: "Insegnante", 72: "Grano", 73: "Coniglio", 74: "Scale", 75: "Gatto", 76: "Acqua", 77: "Bandiera", 78: "Insetto", 79: "Maiale", 80: "Lavatrice a manovella",
    81: "Anello", 82: "Gabinetto", 83: "Signora e bambino", 84: "Matrimonio", 85: "Albero", 86: "Merda", 87: "Pesce", 88: "Sacchi", 89: "Mulo", 90: "Vecchio",
    91: "Ubriaco", 92: "Colomba", 93: "Rumore", 94: "Ratto", 95: "Tacchino", 96: "Parco", 97: "Pollo", 98: "Pecora", 99: "Corda", 100: "Morte"
  },
  
  // Dutch
  "nl-NL": {
    1: "Edel", 2: "Zon", 3: "Jongen", 4: "Bed", 5: "Handboeien", 6: "Hart", 7: "Maan", 8: "Vrouw", 9: "Schoenen", 10: "Bloem",
    11: "Schroef", 12: "Eieren", 13: "Pech", 14: "Bier", 15: "Druiven", 16: "Gitaar", 17: "Boot", 18: "Geld", 19: "Jood", 20: "Emmer",
    21: "Reis", 22: "Eend", 23: "Meloen", 24: "Auto", 25: "Kanon", 26: "Haan", 27: "Kooi", 28: "Dorp", 29: "Christen", 30: "Leeuw",
    31: "Paard", 32: "Bom", 33: "Garnalen", 34: "Knuppel", 35: "Vuur", 36: "Salon", 37: "Mes", 38: "Hond", 39: "Stier", 40: "Bel",
    41: "Zwart", 42: "Appel", 43: "Kroon", 44: "Totem", 45: "Drums", 46: "Pet", 47: "Wereld", 48: "Zwarte vrouw", 49: "Vijg", 50: "Patroonhouder",
    51: "Geit", 52: "Tomaat", 53: "Chili", 54: "Slang", 55: "Politie", 56: "Sla", 57: "Wortel", 58: "Citroen", 59: "Vogel", 60: "Oude vrouw",
    61: "Pijp", 62: "Vlooien", 63: "Ui", 64: "Huis", 65: "Gevecht", 66: "Non", 67: "Imam", 68: "Religieuze armbanden", 69: "Verhuizing", 70: "Abrikoos",
    71: "Leraar", 72: "Tarwe", 73: "Konijn", 74: "Trap", 75: "Kat", 76: "Water", 77: "Vlag", 78: "Bug", 79: "Varken", 80: "Handaangedreven wasmachine",
    81: "Ring", 82: "Toilet", 83: "Vrouw en kind", 84: "Huwelijk", 85: "Boom", 86: "Poep", 87: "Vis", 88: "Zakken", 89: "Muil", 90: "Oude man",
    91: "Dronken", 92: "Duif", 93: "Lawaai", 94: "Rat", 95: "Kalkoen", 96: "Park", 97: "Kip", 98: "Schaap", 99: "Het touw", 100: "Dood"
  },
  
  // Moroccan Arabic (Darija)
  "ar-MA": {
    1: "النبيل", 2: "الشمس", 3: "الولد", 4: "السرير", 5: "المينوط", 6: "القلب", 7: "القمر", 8: "المرا", 9: "الصباط", 10: "الوردة",
    11: "المسامر", 12: "البيض", 13: "النحس", 14: "البيرة", 15: "العنب", 16: "الڭيتارة", 17: "الفلوكة", 18: "الفلوس", 19: "اليهودي", 20: "السطل",
    21: "السفر", 22: "البط", 23: "البطيخ", 24: "الطوموبيل", 25: "المدفع", 26: "الفروج", 27: "القفص", 28: "الدوار", 29: "النصراني", 30: "السبع",
    31: "الخيل", 32: "القنبلة", 33: "القمرون", 34: "الهراوة", 35: "العافية", 36: "الصالون", 37: "الموس", 38: "الكلب", 39: "التور", 40: "الناقوس",
    41: "عزي", 42: "التفاح", 43: "التاج", 44: "الحجاب", 45: "الطبل", 46: "الطربوش", 47: "العالم", 48: "عزية", 49: "الكرموس", 50: "الخرطوشة",
    51: "المعزة", 52: "الماطيشة", 53: "الفلفلة", 54: "الحنش", 55: "البوليس", 56: "الخس", 57: "الجعدة", 58: "الليمون", 59: "العصفور", 60: "العجوزة",
    61: "السبسي", 62: "القمل", 63: "البصلة", 64: "الدار", 65: "الدبزة", 66: "الراهبة", 67: "الفقيه", 68: "التسبيح", 69: "الرحيل", 70: "البرقوق",
    71: "المعلم", 72: "القمح", 73: "القنية", 74: "السلم", 75: "القط", 76: "الما", 77: "الراية", 78: "البعبوش", 79: "الحلوف", 80: "الفراكة",
    81: "الخاتم", 82: "البيت لما", 83: "المرا والدري", 84: "العرس", 85: "الشجرة", 86: "الخرا", 87: "الحوت", 88: "الشكاير", 89: "البغلة", 90: "الشارف",
    91: "السكايري", 92: "الحمامة", 93: "الصداع", 94: "الفار", 95: "بيبي", 96: "الرباض", 97: "الدجاجة", 98: "الخروف", 99: "الحبل", 100: "الموت"
  }
};

// Get number name for a specific locale
export function getNumberName(number: number, locale: Locale = 'en'): string {
  // Handle numbers like 103 -> use last 2 digits (03 -> 3)
  const displayNumber = number % 100 || 100;
  return numberNames[locale]?.[displayNumber] || `Number ${displayNumber}`;
}

// Get size indicator (S for ≤100, B for >100)
export function getSizeIndicator(number: number): 'S' | 'B' {
  return number <= 100 ? 'S' : 'B';
}

// Get image path for the number
export function getImagePath(number: number): string {
  // For numbers like 103, we use 3.png
  const imageNumber = number % 100 || 100;
  return `/gameimages/${imageNumber}.png`;
}

// Get all number names for a locale (useful for testing/debugging)
export function getAllNumberNames(locale: Locale = 'en'): Record<number, string> {
  return numberNames[locale] || numberNames.en;
}
