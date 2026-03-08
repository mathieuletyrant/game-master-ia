export interface Role {
  id: string
  name: string
  team: 'village' | 'loups' | 'neutre'
  description: string
  nightAction: boolean
  instructions: string
}

export const ROLES: Role[] = [
  {
    id: 'simple-villageois',
    name: 'Simple Villageois',
    team: 'village',
    description: 'Un villageois ordinaire sans pouvoir spécial.',
    nightAction: false,
    instructions: '',
  },
  {
    id: 'loup-garou',
    name: 'Loup-Garou',
    team: 'loups',
    description: 'La nuit, les Loups-Garous se réveillent ensemble et choisissent une victime.',
    nightAction: true,
    instructions:
      'Les Loups-Garous se reconnaissent entre eux. Ils désignent silencieusement une victime parmi les villageois.',
  },
  {
    id: 'voyante',
    name: 'Voyante',
    team: 'village',
    description: "Chaque nuit, la Voyante peut découvrir la vraie identité d'un joueur.",
    nightAction: true,
    instructions:
      'La Voyante désigne silencieusement un joueur. Le MJ lui montre discrètement sa carte.',
  },
  {
    id: 'sorciere',
    name: 'Sorcière',
    team: 'village',
    description: 'La Sorcière possède deux potions : une de vie, une de mort. Chacune utilisable une seule fois.',
    nightAction: true,
    instructions:
      'Le MJ montre à la Sorcière qui a été tué. Elle peut utiliser sa potion de vie pour le sauver, ou sa potion de mort pour éliminer un autre joueur.',
  },
  {
    id: 'chasseur',
    name: 'Chasseur',
    team: 'village',
    description: "Quand le Chasseur est éliminé, il peut emporter quelqu'un avec lui.",
    nightAction: false,
    instructions: '',
  },
  {
    id: 'cupidon',
    name: 'Cupidon',
    team: 'neutre',
    description: 'La première nuit, Cupidon désigne deux amoureux liés par le destin.',
    nightAction: true,
    instructions:
      "Cupidon désigne silencieusement deux joueurs qui deviennent amoureux. Si l'un meurt, l'autre meurt de chagrin.",
  },
]

export function getRoleById(id: string): Role | undefined {
  return ROLES.find((r) => r.id === id)
}

export function distributeRoles(playerCount: number): Role[] {
  const loupCount = playerCount <= 6 ? 1 : playerCount <= 9 ? 2 : 3
  const specialRoles: Role[] = []

  if (playerCount >= 5) specialRoles.push(ROLES.find((r) => r.id === 'voyante')!)
  if (playerCount >= 7) specialRoles.push(ROLES.find((r) => r.id === 'sorciere')!)
  if (playerCount >= 8) specialRoles.push(ROLES.find((r) => r.id === 'chasseur')!)

  const loups = Array(loupCount).fill(ROLES.find((r) => r.id === 'loup-garou')!)
  const villageois = Array(
    playerCount - loupCount - specialRoles.length,
  ).fill(ROLES.find((r) => r.id === 'simple-villageois')!)

  return [...loups, ...specialRoles, ...villageois]
}
