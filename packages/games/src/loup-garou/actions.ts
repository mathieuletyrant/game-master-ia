import type { GameAction } from '../index.js'
import { LOUP_GAROU_RULES } from './rules.js'
import { ROLES, distributeRoles } from './roles.js'

function formatRoleList(roles: ReturnType<typeof distributeRoles>): string {
  const counts = new Map<string, number>()
  for (const role of roles) {
    counts.set(role.name, (counts.get(role.name) ?? 0) + 1)
  }
  return [...counts.entries()].map(([name, count]) => `- ${name} ×${count}`).join('\n')
}

function allRolesDescription(): string {
  return ROLES.map(
    (r) => `### ${r.name} (${r.team})\n${r.description}\n${r.instructions ? `> ${r.instructions}` : ''}`,
  ).join('\n\n')
}

export const actions: GameAction[] = [
  {
    id: 'setup',
    label: 'Mise en place',
    description: 'Explique comment préparer une partie selon le nombre de joueurs.',
    icon: '🎴',
    mode: 'one-shot',
    params: [
      {
        id: 'playerCount',
        label: 'Nombre de joueurs',
        type: 'number',
        required: true,
        default: 8,
        min: 6,
        max: 18,
      },
    ],
    buildPrompt: (params) => {
      const playerCount = (params?.playerCount as number) ?? 8
      const roles = distributeRoles(playerCount)
      const roleList = formatRoleList(roles)

      return `Tu es un assistant expert du jeu Loup-Garou de Thiercelieux. Tu t'exprimes en français uniquement.

${LOUP_GAROU_RULES}

---

L'utilisateur veut mettre en place une partie pour **${playerCount} joueurs**.

Voici la composition des rôles pour ${playerCount} joueurs :
${roleList}

Explique pas à pas comment mettre en place la partie :
1. Le matériel nécessaire
2. La distribution des cartes (composition ci-dessus)
3. L'installation des joueurs
4. Le lancement de la première nuit

Sois clair, structuré et concis.`
    },
  },
  {
    id: 'end-conditions',
    label: 'Fin de partie',
    description: 'Explique comment et quand la partie se termine.',
    icon: '🏁',
    mode: 'one-shot',
    buildPrompt: () => {
      return `Tu es un assistant expert du jeu Loup-Garou de Thiercelieux. Tu t'exprimes en français uniquement.

${LOUP_GAROU_RULES}

---

Explique clairement toutes les conditions de fin de partie :
- Comment les Villageois gagnent
- Comment les Loups-Garous gagnent
- Comment les Amoureux gagnent (si Cupidon est en jeu)
- Les cas spéciaux (Chasseur qui meurt, etc.)

Donne des exemples concrets pour chaque cas. Sois clair et structuré.`
    },
  },
  {
    id: 'roles',
    label: 'Les rôles',
    description: 'Découvre tous les rôles et leurs pouvoirs.',
    icon: '🎭',
    mode: 'one-shot',
    params: [
      {
        id: 'playerCount',
        label: 'Nombre de joueurs (optionnel)',
        type: 'number',
        required: false,
        min: 6,
        max: 18,
      },
    ],
    buildPrompt: (params) => {
      const playerCount = params?.playerCount as number | undefined
      const rolesContext = playerCount
        ? `\n\nPour une partie à **${playerCount} joueurs**, la composition est :\n${formatRoleList(distributeRoles(playerCount))}\n\nIndique quels rôles sont en jeu pour cette configuration.`
        : ''

      return `Tu es un assistant expert du jeu Loup-Garou de Thiercelieux. Tu t'exprimes en français uniquement.

${LOUP_GAROU_RULES}

---

Voici tous les rôles disponibles :

${allRolesDescription()}
${rolesContext}

Explique chaque rôle de manière claire :
- Son camp (Village, Loups, Neutre)
- Son pouvoir et quand il s'active
- Des conseils stratégiques pour ce rôle

Sois structuré et engageant.`
    },
  },
  {
    id: 'qa',
    label: 'Questions libres',
    description: 'Pose tes questions sur les règles, la stratégie, ou des situations de jeu.',
    icon: '❓',
    mode: 'qa',
    buildPrompt: () => {
      return `Tu es un assistant expert du jeu Loup-Garou de Thiercelieux. Tu t'exprimes en français uniquement.

${LOUP_GAROU_RULES}

---

Voici tous les rôles disponibles :

${allRolesDescription()}

---

Tu réponds aux questions des joueurs sur les règles, la stratégie, et les situations de jeu.
- Réponds de manière précise et concise
- Cite les règles quand c'est pertinent
- Donne des exemples concrets si ça aide à comprendre
- Si la question est ambiguë, demande des précisions`
    },
  },
]
