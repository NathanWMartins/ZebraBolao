export const TEAM_FLAGS: Record<string, string> = {
    'United States': 'us',
    'USA': 'us',
    'Canada': 'ca',
    'Mexico': 'mx',

    'England': 'gb-eng',
    'France': 'fr',
    'Croatia': 'hr',
    'Norway': 'no',
    'Portugal': 'pt',
    'Germany': 'de',
    'Netherlands': 'nl',
    'Switzerland': 'ch',
    'Scotland': 'gb-sct',
    'Spain': 'es',
    'Austria': 'at',
    'Belgium': 'be',
    'Bosnia and Herzegovina': 'ba',
    'Bosnia & Herzegovina': 'ba',
    'Bosnia-Herzegovina': 'ba',
    'Sweden': 'se',
    'Turkey': 'tr',
    'Türkiye': 'tr',
    'Czechia': 'cz',
    'Czech Republic': 'cz',

    'Argentina': 'ar',
    'Brazil': 'br',
    'Brasil': 'br',
    'Colombia': 'co',
    'Ecuador': 'ec',
    'Uruguay': 'uy',
    'Paraguay': 'py',

    'Japan': 'jp',
    'Iran': 'ir',
    'IR Iran': 'ir',
    'Uzbekistan': 'uz',
    'South Korea': 'kr',
    'Korea Republic': 'kr',
    'Jordan': 'jo',
    'Australia': 'au',
    'Qatar': 'qa',
    'Saudi Arabia': 'sa',
    'New Zealand': 'nz',

    'Morocco': 'ma',
    'Tunisia': 'tn',
    'Egypt': 'eg',
    'Algeria': 'dz',
    'Ghana': 'gh',
    'Cape Verde': 'cv',
    'Cabo Verde': 'cv',
    'South Africa': 'za',
    "Ivory Coast": 'ci',
    "Côte d'Ivoire": 'ci',
    'Senegal': 'sn',
    'DR Congo': 'cd',
    'Democratic Republic of Congo': 'cd',
    'Congo DR': 'cd',

    'Curaçao': 'cw',
    'Curacao': 'cw',
    'Haiti': 'ht',
    'Panama': 'pa',

    'Iraq': 'iq',
}

export function getTeamFlag(teamName: string): string {
    return TEAM_FLAGS[teamName] ?? 'un'
}

export function getFlagUrl(teamName: string, width: 20 | 40 | 80 | 160 = 40): string {
    const code = getTeamFlag(teamName)
    return `https://flagcdn.com/w${width}/${code}.png`
}