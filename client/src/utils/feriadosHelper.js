import feriadosData from '../data/feriados.json';

/**
 * Algoritmo Computus de Meeus/Jones/Butcher para calcular o Domingo de Páscoa
 */
function getEasterDate(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/**
 * Retorna os feriados móveis para determinado ano
 */
function getMobileHolidays(year) {
  const easter = getEasterDate(year);
  
  // Sexta-feira Santa: 2 dias antes da Páscoa
  const passionFriday = new Date(easter);
  passionFriday.setDate(easter.getDate() - 2);

  // Terça-feira de Carnaval: 47 dias antes da Páscoa
  const carnavalTuesday = new Date(easter);
  carnavalTuesday.setDate(easter.getDate() - 47);

  // Segunda-feira de Carnaval: 48 dias antes da Páscoa
  const carnavalMonday = new Date(easter);
  carnavalMonday.setDate(easter.getDate() - 48);

  // Corpus Christi: 60 dias após a Páscoa
  const corpusChristi = new Date(easter);
  corpusChristi.setDate(easter.getDate() + 60);

  const formatDateKey = (d) => {
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${m}-${day}`;
  };

  return [
    {
      dataKey: formatDateKey(passionFriday),
      nome: "Sexta-feira Santa (Paixão de Cristo)",
      tipo: "nacional",
      facultativo: false
    },
    {
      dataKey: formatDateKey(carnavalMonday),
      nome: "Carnaval (Ponto Facultativo)",
      tipo: "ponto_facultativo",
      facultativo: true
    },
    {
      dataKey: formatDateKey(carnavalTuesday),
      nome: "Carnaval (Ponto Facultativo)",
      tipo: "ponto_facultativo",
      facultativo: true
    },
    {
      dataKey: formatDateKey(corpusChristi),
      nome: "Corpus Christi",
      tipo: "ponto_facultativo",
      facultativo: true
    }
  ];
}

/**
 * Retorna os detalhes de feriado/ponto facultativo para uma data específica
 * @param {number} year 
 * @param {number} monthIndex 0..11 
 * @param {number} day 1..31
 */
export function getFeriadoInfo(year, monthIndex, day) {
  const mm = String(monthIndex + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  const key = `${mm}-${dd}`;

  // 1. Checar feriados móveis do ano
  const mobileList = getMobileHolidays(year);
  const matchedMobile = mobileList.find(item => item.dataKey === key);
  if (matchedMobile) {
    return {
      nome: matchedMobile.nome,
      tipo: matchedMobile.tipo,
      facultativo: matchedMobile.facultativo,
      classificacao: matchedMobile.tipo === 'nacional' 
        ? 'Feriado Nacional' 
        : (matchedMobile.facultativo ? 'Ponto Facultativo' : 'Feriado Municipal')
    };
  }

  // 2. Checar feriados nacionais fixos do JSON
  const matchedNacional = feriadosData.feriados_nacionais.find(item => item.data === key);
  if (matchedNacional) {
    return {
      nome: matchedNacional.nome,
      tipo: 'nacional',
      facultativo: false,
      classificacao: 'Feriado Nacional'
    };
  }

  // 3. Checar feriados municipais / pontos facultativos fixos do JSON
  const matchedMunicipal = feriadosData.feriados_municipais.find(item => item.data === key);
  if (matchedMunicipal) {
    return {
      nome: matchedMunicipal.nome,
      municipio: matchedMunicipal.municipio,
      tipo: matchedMunicipal.tipo,
      facultativo: matchedMunicipal.facultativo,
      classificacao: matchedMunicipal.tipo === 'nacional'
        ? 'Feriado Nacional'
        : (matchedMunicipal.facultativo ? 'Ponto Facultativo' : 'Feriado Municipal Obrigatório')
    };
  }

  return null;
}
