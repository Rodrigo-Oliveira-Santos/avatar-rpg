// ============================================================
// Avatar RPG — Patch v6
// Aplica sobre o widget v5. Ver instrucoes no final do ficheiro.
// ============================================================

const AVATAR_PATCH = {
  "fire": {
    "Escudo de Calor": {
      "tier": 1,
      "pos": "def",
      "reqs": {
        "FOR": 2,
        "RES": 1
      },
      "req": [],
      "effect": {
        "type": "def",
        "desc": "Deflecte um ataque e causa 2d6 burn ao atacante. Inimigos corpo a corpo sofrem burn. Dura 1 turno.",
        "dice": "2d6",
        "chi": 2,
        "status": [
          "burn",
          "shield"
        ]
      },
      "attacks": [
        {
          "n": "Barreira Flamejante",
          "d": "Ergue uma muralha de chamas entre o dobrador e o inimigo.",
          "dmg": "2d6",
          "chi": 2,
          "status": [
            "burn"
          ]
        },
        {
          "n": "Escudo Pulsante",
          "d": "O escudo pulsa e queima quem toca.",
          "dmg": "2d6+2",
          "chi": 3,
          "status": [
            "burn",
            "stun"
          ]
        },
        {
          "n": "Muro de Calor",
          "d": "O escudo expande em muro de 3m de largura.",
          "dmg": "3d6",
          "chi": 3,
          "status": [
            "burn",
            "slow"
          ]
        },
        {
          "n": "Escudo Explosivo",
          "d": "Ao ser partido, explode em nova de fogo radial.",
          "dmg": "3d6+2",
          "chi": 4,
          "status": [
            "burn",
            "stun"
          ]
        },
        {
          "n": "Capa de Chamas",
          "d": "O dobrador fica envolto em chamas — tudo que toca queima.",
          "dmg": "2d8+2",
          "chi": 4,
          "status": [
            "burn"
          ]
        },
        {
          "n": "Escudo do Dragao",
          "d": "O escudo tem a forma da cabeca de um dragao — ameacador e intimidante.",
          "dmg": "3d8",
          "chi": 5,
          "status": [
            "burn",
            "fear"
          ]
        },
        {
          "n": "Espelho de Fogo",
          "d": "Reflete ataques de energia de volta ao atacante original.",
          "dmg": "4d6",
          "chi": 5,
          "status": [
            "burn"
          ]
        },
        {
          "n": "Fortaleza Ardente",
          "d": "O escudo expande para cobertura completa de 360 graus.",
          "dmg": "4d6+2",
          "chi": 5,
          "status": [
            "burn",
            "shield"
          ]
        },
        {
          "n": "Escudo Solar",
          "d": "Alimentado pela energia do sol — maxima intensidade durante o dia.",
          "dmg": "4d8",
          "chi": 6,
          "status": [
            "burn",
            "blind"
          ]
        },
        {
          "n": "Inferno Defensivo",
          "d": "Transforma-se em nova de fogo devastadora ao ser partido.",
          "dmg": "5d8",
          "chi": 6,
          "status": [
            "burn",
            "stun",
            "blind"
          ]
        }
      ]
    },
    "Esquiva Flamejante": {
      "tier": 2,
      "pos": "def",
      "reqs": {
        "AGI": 4,
        "PER": 2
      },
      "req": [
        "Passo Ardente"
      ],
      "effect": {
        "type": "def",
        "desc": "Ao esquivar, o atacante recebe 1d4 burn. Chance de cegueira 20%.",
        "dice": "1d4",
        "chi": 1,
        "status": [
          "burn"
        ]
      },
      "attacks": [
        {
          "n": "Contra-Esquiva",
          "d": "Redireciona o impeto do inimigo para as chamas.",
          "dmg": "1d6+2",
          "chi": 2,
          "status": [
            "burn"
          ]
        },
        {
          "n": "Esquiva Ardente",
          "d": "A evasao deixa corrente de fogo que queima quem atravessa.",
          "dmg": "2d4",
          "chi": 2,
          "status": [
            "burn"
          ]
        },
        {
          "n": "Desvio Explosivo",
          "d": "Esquiva que culmina numa explosao de calor na direcao do atacante.",
          "dmg": "2d6",
          "chi": 3,
          "status": [
            "stun",
            "burn"
          ]
        },
        {
          "n": "Rastro Letal",
          "d": "Ao esquivar deixa rastro de fogo azul persistente por 2 turnos.",
          "dmg": "2d6+2",
          "chi": 3,
          "status": [
            "burn",
            "slow"
          ]
        },
        {
          "n": "Contre-Feu",
          "d": "Esquiva e ataque simultaneos — fogo queima durante o desvio.",
          "dmg": "3d6",
          "chi": 4,
          "status": [
            "burn"
          ]
        },
        {
          "n": "Sombra de Chamas",
          "d": "Cria falso rastro de calor que confunde a pontaria inimiga.",
          "dmg": "2d8",
          "chi": 4,
          "status": [
            "blind",
            "burn"
          ]
        },
        {
          "n": "Explosao de Retorno",
          "d": "Ao esquivar, lanca uma micro-nova de calor radial.",
          "dmg": "3d6+2",
          "chi": 4,
          "status": [
            "burn",
            "stun"
          ]
        },
        {
          "n": "Danca de Esquivas",
          "d": "Tres esquivas em rapida sequencia, cada uma com contra-ataque.",
          "dmg": "4d6",
          "chi": 5,
          "status": [
            "burn"
          ]
        },
        {
          "n": "Fantasma Ardente",
          "d": "Move-se tao rapido que deixa imagem de fogo no lugar.",
          "dmg": "4d6+2",
          "chi": 5,
          "status": [
            "burn",
            "blind"
          ]
        },
        {
          "n": "Esquiva do Dragao",
          "d": "A forma completa de Danca do Dragao usada defensivamente.",
          "dmg": "5d6",
          "chi": 6,
          "status": [
            "burn",
            "stun",
            "blind"
          ]
        }
      ]
    },
    "Foguete Humano": {
      "tier": 4,
      "pos": "off",
      "reqs": {
        "AGI": 10,
        "CHI": 7,
        "FOR": 5
      },
      "req": [
        "Propulsao Tripla"
      ],
      "attacks": [
        {
          "n": "Lancamento Direto",
          "d": "Propulsao maxima em linha reta contra um alvo especifico.",
          "dmg": "4d6+4",
          "chi": 6,
          "status": [
            "stun",
            "burn"
          ]
        },
        {
          "n": "Foguete Rasante",
          "d": "Percorre o chao a velocidade extrema causando dano em linha.",
          "dmg": "5d6",
          "chi": 7,
          "status": [
            "burn",
            "slow"
          ]
        },
        {
          "n": "Colisao Solar",
          "d": "Impacto de fogo puro — o corpo e um projétil flamejante.",
          "dmg": "6d6+4",
          "chi": 8,
          "status": [
            "stun",
            "burn",
            "blind"
          ]
        },
        {
          "n": "Espiral de Fogo",
          "d": "Rota em espiral que atinge multiplos alvos em sequencia.",
          "dmg": "5d6+2",
          "chi": 7,
          "status": [
            "burn",
            "stun"
          ]
        },
        {
          "n": "Meteoro Humano",
          "d": "Queda em picado do ar — impacto cria cratera de fogo.",
          "dmg": "8d6",
          "chi": 9,
          "status": [
            "burn",
            "stun",
            "slow"
          ]
        },
        {
          "n": "Duplo Lancamento",
          "d": "Dois lancamentos em direcoes opostas em sequencia.",
          "dmg": "6d6+2",
          "chi": 8,
          "status": [
            "burn",
            "stun"
          ]
        },
        {
          "n": "Foguete Triplo",
          "d": "Tres lancamentos em triangulo — cobre area inteira.",
          "dmg": "7d6",
          "chi": 9,
          "status": [
            "burn",
            "stun",
            "blind"
          ]
        },
        {
          "n": "Tornado de Lancamentos",
          "d": "Gira em espiral enquanto propulsionado — area total.",
          "dmg": "7d6+3",
          "chi": 9,
          "status": [
            "burn",
            "stun",
            "slow"
          ]
        },
        {
          "n": "Asteroide",
          "d": "Velocidade de asteroide — impacto catastrofico de area.",
          "dmg": "8d6+4",
          "chi": 10,
          "status": [
            "burn",
            "stun",
            "blind",
            "slow"
          ]
        },
        {
          "n": "Colisao Final",
          "d": "O ultimo lancamento — destroi tudo no ponto de impacto.",
          "dmg": "10d8",
          "chi": 10,
          "status": [
            "burn",
            "stun",
            "blind",
            "slow"
          ]
        }
      ]
    }
  },
  "water": {
    "Redemoinho": {
      "tier": 2,
      "pos": "def",
      "reqs": {
        "AGI": 4,
        "CHI": 3
      },
      "req": [
        "Surf de Onda"
      ],
      "effect": {
        "type": "def",
        "desc": "Deflecte um ataque fisico ou de agua. Reposiciona imediatamente apos o desvio.",
        "dice": "-",
        "chi": 2,
        "status": []
      },
      "attacks": [
        {
          "n": "Vortice Defensivo",
          "d": "O redemoinho agarra o ataque e redireciona-o.",
          "dmg": "1d6+2",
          "chi": 2,
          "status": [
            "slow"
          ]
        },
        {
          "n": "Giro de Agua",
          "d": "Giro rapido que usa a agua como escudo e contra-ataca.",
          "dmg": "2d4+2",
          "chi": 2,
          "status": [
            "slow"
          ]
        },
        {
          "n": "Corrente Deflectora",
          "d": "Uma corrente de agua bloqueia e desvia o ataque.",
          "dmg": "2d6",
          "chi": 3,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Redemoinho Ofensivo",
          "d": "O redemoinho transforma-se em ataque giratorio.",
          "dmg": "2d6+2",
          "chi": 3,
          "status": [
            "slow",
            "stun"
          ]
        },
        {
          "n": "Vortice Expansivo",
          "d": "O redemoinho expande e cobre area maior.",
          "dmg": "3d6",
          "chi": 4,
          "status": [
            "slow",
            "freeze"
          ]
        },
        {
          "n": "Espiral de Agua",
          "d": "Espiral que abraca e imobiliza o inimigo.",
          "dmg": "3d6+2",
          "chi": 4,
          "status": [
            "root",
            "slow"
          ]
        },
        {
          "n": "Redemoinho Duplo",
          "d": "Dois redemoinhos em rotacoes opostas que convergem.",
          "dmg": "4d6",
          "chi": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Ciclone Aquatico",
          "d": "Um ciclone que aspira o inimigo para o centro.",
          "dmg": "4d6+2",
          "chi": 5,
          "status": [
            "stun",
            "root"
          ]
        },
        {
          "n": "Vortice do Oceano",
          "d": "O poder do oceano num unico redemoinho.",
          "dmg": "5d6",
          "chi": 5,
          "status": [
            "stun",
            "freeze"
          ]
        },
        {
          "n": "Espiral da Lua Cheia",
          "d": "O redemoinho alimentado pela lua — irresistivel.",
          "dmg": "6d6",
          "chi": 6,
          "status": [
            "stun",
            "freeze",
            "root"
          ]
        }
      ]
    },
    "Pontes de Gelo": {
      "tier": 2,
      "pos": "off",
      "reqs": {
        "AGI": 3,
        "CHI": 2
      },
      "req": [
        "Passo Escorregadio"
      ],
      "effect": {
        "type": "utility",
        "desc": "Cria estrutura de gelo ate 10m. Pode ser usada em combate para flanquear inimigos.",
        "dice": "-",
        "chi": 2,
        "status": []
      },
      "attacks": [
        {
          "n": "Rampa de Gelo",
          "d": "Cria uma rampa que lanca o dobrador em arco.",
          "dmg": "1d6+2",
          "chi": 2,
          "status": [
            "slow"
          ]
        },
        {
          "n": "Ponte Instantanea",
          "d": "Uma ponte de gelo que tambem serve de projétil.",
          "dmg": "2d4+2",
          "chi": 2,
          "status": [
            "freeze"
          ]
        },
        {
          "n": "Pilar de Gelo",
          "d": "Um pilar de gelo que ergue ou bloqueia o caminho.",
          "dmg": "2d6",
          "chi": 3,
          "status": [
            "root",
            "freeze"
          ]
        },
        {
          "n": "Lancamento em Ponte",
          "d": "O dobrador usa a propria ponte para se lancar.",
          "dmg": "2d6+2",
          "chi": 3,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Parede de Gelo",
          "d": "Uma parede de gelo que divide o campo de batalha.",
          "dmg": "3d4+2",
          "chi": 3,
          "status": [
            "root",
            "freeze"
          ]
        },
        {
          "n": "Escorrega Letal",
          "d": "Uma rampa que lanca o inimigo num abismo.",
          "dmg": "3d6",
          "chi": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Torre de Gelo",
          "d": "Uma torre emerge rapidamente e atinge inimigos acima.",
          "dmg": "3d6+2",
          "chi": 4,
          "status": [
            "freeze",
            "stun"
          ]
        },
        {
          "n": "Labirinto de Gelo",
          "d": "Multiplas estruturas que confundem e bloqueiam.",
          "dmg": "4d6",
          "chi": 4,
          "status": [
            "root",
            "blind"
          ]
        },
        {
          "n": "Prisao de Gelo",
          "d": "Uma prisao completa de gelo que captura o inimigo.",
          "dmg": "4d6+2",
          "chi": 5,
          "status": [
            "root",
            "freeze"
          ]
        },
        {
          "n": "Fortaleza Glacial",
          "d": "Uma fortaleza completa de gelo em fracao de segundo.",
          "dmg": "5d6+2",
          "chi": 5,
          "status": [
            "root",
            "freeze",
            "slow"
          ]
        }
      ]
    },
    "Corrente Submarina": {
      "tier": 3,
      "pos": "off",
      "reqs": {
        "AGI": 6,
        "CHI": 5
      },
      "req": [
        "Redemoinho",
        "Surf de Onda"
      ],
      "effect": {
        "type": "move",
        "desc": "Movimento subaquatico invisivel. Pode atacar da agua com vantagem de surpresa.",
        "dice": "-",
        "chi": 3,
        "status": []
      },
      "attacks": [
        {
          "n": "Ataque da Profundidade",
          "d": "Emerge rapidamente e ataca antes de mergulhar.",
          "dmg": "2d6+2",
          "chi": 3,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Golpe Subaquatico",
          "d": "Ataca enquanto parcialmente submerso.",
          "dmg": "3d6",
          "chi": 3,
          "status": []
        },
        {
          "n": "Corrente de Ataque",
          "d": "Uma corrente de agua que segue e persegue o inimigo.",
          "dmg": "3d6+2",
          "chi": 4,
          "status": [
            "slow"
          ]
        },
        {
          "n": "Emboscada Aquatica",
          "d": "Emerge atras do inimigo sem ser visto.",
          "dmg": "3d8",
          "chi": 4,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "n": "Mergulho e Ataque",
          "d": "Mergulha e emerge num ponto diferente em ataque surpresa.",
          "dmg": "4d6",
          "chi": 4,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Torrente Submersa",
          "d": "Uma torrente que emerge verticalmente sob o inimigo.",
          "dmg": "4d6+2",
          "chi": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Corrente Dupla",
          "d": "Dois ataques de agua de direcoes opostas em simultaneo.",
          "dmg": "4d8",
          "chi": 5,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Tsunami de Surpresa",
          "d": "Emerge criando uma onda colossal completamente inesperada.",
          "dmg": "5d6+2",
          "chi": 5,
          "status": [
            "stun",
            "slow",
            "blind"
          ]
        },
        {
          "n": "O Mar Ataca",
          "d": "O proprio mar emerge em ataque devastador.",
          "dmg": "6d6",
          "chi": 6,
          "status": [
            "stun",
            "freeze",
            "slow"
          ]
        },
        {
          "n": "Corrente do Abismo",
          "d": "Agua das profundezas — fria, densa e absolutamente fatal.",
          "dmg": "6d6+3",
          "chi": 6,
          "status": [
            "freeze",
            "stun",
            "slow",
            "blind"
          ]
        }
      ]
    },
    "Esquiva Fluida": {
      "tier": 2,
      "pos": "def",
      "reqs": {
        "AGI": 4,
        "PER": 3
      },
      "req": [
        "Redemoinho"
      ],
      "effect": {
        "type": "def",
        "desc": "Ao esquivar com sucesso, o contra-ataque de agua causa 1d8 e slow ao atacante.",
        "dice": "1d8",
        "chi": 2,
        "status": [
          "slow"
        ]
      },
      "attacks": [
        {
          "n": "Contra-Agua",
          "d": "A esquiva lanca uma onda de agua certeira contra o atacante.",
          "dmg": "1d8+2",
          "chi": 2,
          "status": [
            "slow"
          ]
        },
        {
          "n": "Fluxo Inverso",
          "d": "Usa o impeto do inimigo para amplificar o contra-ataque.",
          "dmg": "2d6+2",
          "chi": 3,
          "status": [
            "slow",
            "stun"
          ]
        },
        {
          "n": "Vaga de Retorno",
          "d": "Uma onda maior que varre o atacante para longe.",
          "dmg": "3d6",
          "chi": 3,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Mar que Responde",
          "d": "O oceano responde ao ataque — onda colossal inesperada.",
          "dmg": "3d6+3",
          "chi": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Forma da Serpente",
          "d": "O corpo flui — o contra-ataque e uma cobra de gelo.",
          "dmg": "4d6",
          "chi": 5,
          "status": [
            "freeze",
            "stun"
          ]
        },
        {
          "n": "Contra-Corrente",
          "d": "Corrente de agua que segue o inimigo apos a esquiva.",
          "dmg": "3d8",
          "chi": 5,
          "status": [
            "slow",
            "freeze"
          ]
        },
        {
          "n": "Espiral Evasiva",
          "d": "Espiral de agua que tanto esquiva como ataca.",
          "dmg": "4d6+2",
          "chi": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Refluxo Glacial",
          "d": "O contra-ataque e de gelo — imobiliza o membro atingido.",
          "dmg": "4d8",
          "chi": 6,
          "status": [
            "freeze",
            "root"
          ]
        },
        {
          "n": "Vaga Perfeita",
          "d": "A esquiva e o contra-ataque tornam-se uma so acao.",
          "dmg": "5d6+2",
          "chi": 6,
          "status": [
            "stun",
            "freeze",
            "slow"
          ]
        },
        {
          "n": "A Agua Nao Pode Ser Apanhada",
          "d": "Evasao total — o inimigo nunca acerta na agua.",
          "dmg": "6d6",
          "chi": 7,
          "status": [
            "stun",
            "freeze",
            "slow",
            "blind"
          ]
        }
      ]
    },
    "Forma da Agua": {
      "tier": 4,
      "pos": "def",
      "reqs": {
        "AGI": 9,
        "CHI": 7,
        "ESP": 4
      },
      "req": [
        "Corrente Submarina",
        "Esquiva Fluida"
      ],
      "effect": {
        "type": "def",
        "desc": "Reduz dano fisico em 50% por 3 turnos. Restaura 1d4 chi por turno enquanto ativo.",
        "dice": "1d4/t",
        "chi": 4,
        "status": [
          "regen",
          "shield"
        ]
      },
      "attacks": [
        {
          "n": "Golpe Fluido",
          "d": "O corpo flui em torno do inimigo e ataca de angulo impossivel.",
          "dmg": "3d6+2",
          "chi": 4,
          "status": [
            "slow"
          ]
        },
        {
          "n": "Forma Liquida",
          "d": "O dobrador dissolve-se e recondensa diretamente no inimigo.",
          "dmg": "4d6",
          "chi": 5,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Onda Pessoal",
          "d": "Uma onda de agua emerge do proprio corpo do dobrador.",
          "dmg": "4d6+2",
          "chi": 5,
          "status": [
            "slow",
            "freeze"
          ]
        },
        {
          "n": "Forma do Rio",
          "d": "Move-se como um rio — imparavel, constante e inevitavel.",
          "dmg": "4d8",
          "chi": 5,
          "status": [
            "slow",
            "root"
          ]
        },
        {
          "n": "Agua que Corta",
          "d": "A agua fluida comprime-se e torna-se um cortador preciso.",
          "dmg": "5d6",
          "chi": 6,
          "status": [
            "bleed",
            "slow"
          ]
        },
        {
          "n": "Corpo de Oceano",
          "d": "O corpo e o oceano — ataque de area total ao redor.",
          "dmg": "5d6+3",
          "chi": 6,
          "status": [
            "stun",
            "freeze"
          ]
        },
        {
          "n": "Forma do Tsunami",
          "d": "O corpo amplifica-se numa onda colossal devastadora.",
          "dmg": "6d6",
          "chi": 7,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Fusao Aquatica",
          "d": "O dobrador funde-se com a agua ao redor — invisivel e letal.",
          "dmg": "6d6+2",
          "chi": 7,
          "status": [
            "stun",
            "freeze",
            "blind"
          ]
        },
        {
          "n": "Forma da Lua Cheia",
          "d": "A lua cheia amplifica a forma — poder maximo atingido.",
          "dmg": "7d6",
          "chi": 8,
          "status": [
            "stun",
            "freeze",
            "slow"
          ]
        },
        {
          "n": "A Agua Absoluta",
          "d": "O dobrador e a agua — indistinguiveis e absolutamente fatais.",
          "dmg": "8d6",
          "chi": 9,
          "status": [
            "stun",
            "freeze",
            "slow",
            "blind"
          ]
        }
      ]
    },
    "Escudo Aquatico": {
      "tier": 1,
      "pos": "def",
      "reqs": {
        "FOR": 2,
        "CHI": 1,
        "RES": 1
      },
      "req": [],
      "effect": {
        "type": "def",
        "desc": "Absorve 2d8 dano. Se o escudo for partido, explode causando 1d6 slow a proximos.",
        "dice": "2d8",
        "chi": 2,
        "status": [
          "shield"
        ]
      },
      "attacks": [
        {
          "n": "Escudo em Colapso",
          "d": "O escudo cede propositalmente — explode em onda de agua.",
          "dmg": "2d6",
          "chi": 2,
          "status": [
            "slow"
          ]
        },
        {
          "n": "Barreira Pulsante",
          "d": "O escudo pulsa e empurra violentamente inimigos proximos.",
          "dmg": "2d6+2",
          "chi": 3,
          "status": [
            "slow",
            "stun"
          ]
        },
        {
          "n": "Escudo de Gelo",
          "d": "O escudo congela — mais resistente e fere ao tocar.",
          "dmg": "3d4+2",
          "chi": 3,
          "status": [
            "freeze"
          ]
        },
        {
          "n": "Barreira Expansiva",
          "d": "O escudo expande para cobrir aliados proximos.",
          "dmg": "2d8",
          "chi": 3,
          "status": [
            "shield",
            "slow"
          ]
        },
        {
          "n": "Escudo Explosivo",
          "d": "O escudo explode ao ser partido — onda radial devastadora.",
          "dmg": "3d6",
          "chi": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Cortina de Agua",
          "d": "Uma cortina de agua que bloqueia projéteis completamente.",
          "dmg": "3d6+2",
          "chi": 4,
          "status": [
            "slow",
            "freeze"
          ]
        },
        {
          "n": "Escudo do Oceano",
          "d": "Alimentado pelo oceano — absorve enormes quantidades de dano.",
          "dmg": "4d6",
          "chi": 4,
          "status": [
            "shield"
          ]
        },
        {
          "n": "Fortaleza Aquatica",
          "d": "O escudo expande em fortaleza completa de agua.",
          "dmg": "4d6+2",
          "chi": 5,
          "status": [
            "shield",
            "slow"
          ]
        },
        {
          "n": "Escudo da Lua",
          "d": "Energia lunar amplifica o escudo — quase impenetravel.",
          "dmg": "4d8",
          "chi": 5,
          "status": [
            "shield",
            "freeze"
          ]
        },
        {
          "n": "Mar Protetor",
          "d": "O oceano inteiro protege o dobrador — poder absoluto.",
          "dmg": "5d6+3",
          "chi": 6,
          "status": [
            "shield",
            "freeze",
            "slow"
          ]
        }
      ]
    }
  },
  "earth": {
    "Visao Sismica": {
      "tier": 2,
      "pos": "def",
      "reqs": {
        "PER": 4,
        "ESP": 3
      },
      "req": [
        "Escuta da Terra"
      ],
      "effect": {
        "type": "utility",
        "desc": "Ve tudo num raio de 20m atraves do chao. Imune a cegueira em terreno natural.",
        "dice": "-",
        "chi": 2,
        "status": []
      },
      "attacks": [
        {
          "n": "Pulso Sismico",
          "d": "Liberta um pulso de vibracoes para revelar e atacar.",
          "dmg": "1d8+2",
          "chi": 2,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Eco da Terra",
          "d": "O eco das vibracoes guia um ataque certeiro no ponto fraco.",
          "dmg": "2d6",
          "chi": 2,
          "status": []
        },
        {
          "n": "Vibracoes Cortantes",
          "d": "As vibracoes amplificam-se e danificam tudo ao redor.",
          "dmg": "2d6+2",
          "chi": 3,
          "status": [
            "slow"
          ]
        },
        {
          "n": "Onda de Detecao",
          "d": "Uma onda sismica que revela e atinge inimigos em simultaneo.",
          "dmg": "2d8",
          "chi": 3,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Pulso Sismico Medio",
          "d": "Um pulso mais forte que derruba inimigos proximos.",
          "dmg": "3d6",
          "chi": 3,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Eco Amplificado",
          "d": "O eco da terra volta amplificado como onda de ataque.",
          "dmg": "3d6+2",
          "chi": 4,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Visao e Ataque",
          "d": "Simultaneamente ve e ataca todos os inimigos no raio.",
          "dmg": "3d8",
          "chi": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Pulso Total",
          "d": "Pulso maximo — sente e atinge absolutamente tudo.",
          "dmg": "4d6",
          "chi": 4,
          "status": [
            "stun",
            "slow",
            "blind"
          ]
        },
        {
          "n": "Sismo de Visao",
          "d": "A visao sismica converte-se em onda sismica devastadora.",
          "dmg": "4d8",
          "chi": 5,
          "status": [
            "stun",
            "slow",
            "root"
          ]
        },
        {
          "n": "Terra que Ve e Mata",
          "d": "A visao da terra torna-se uma arma totalmente devastadora.",
          "dmg": "5d8",
          "chi": 5,
          "status": [
            "stun",
            "slow",
            "root",
            "blind"
          ]
        }
      ]
    },
    "Vontade Inabalavel": {
      "tier": 2,
      "pos": "pass",
      "reqs": {
        "RES": 4,
        "ESP": 3
      },
      "req": [
        "Paciencia da Pedra"
      ],
      "effect": {
        "type": "restore",
        "desc": "Imune a fear, silence e dobra de sangue. Restaura 1d4 chi ao sofrer dano emocional.",
        "dice": "1d4",
        "chi": 0,
        "status": [
          "regen",
          "shield"
        ]
      },
      "attacks": [
        {
          "n": "Punho da Pedra",
          "d": "A vontade inabalavel transmuta-se em golpe de pedra puro.",
          "dmg": "2d6+2",
          "chi": 3,
          "status": []
        },
        {
          "n": "Resistencia Ativa",
          "d": "A vontade inabalavel amplifica cada golpe dado.",
          "dmg": "3d6",
          "chi": 3,
          "status": []
        },
        {
          "n": "Forca da Montanha",
          "d": "A forca da montanha canalizada num unico golpe preciso.",
          "dmg": "3d6+2",
          "chi": 3,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Impacto Inabalavel",
          "d": "Um impacto que nenhuma defesa pode negar ou resistir.",
          "dmg": "3d8",
          "chi": 4,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Furia da Pedra",
          "d": "A vontade inabalavel explode em furia de pedra pura.",
          "dmg": "4d6",
          "chi": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Golpe Inquebravel",
          "d": "O golpe de quem simplesmente nao pode ser quebrado.",
          "dmg": "4d6+2",
          "chi": 4,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Vontade Manifestada",
          "d": "A vontade inabalavel torna-se pedra viva que ataca.",
          "dmg": "4d8",
          "chi": 5,
          "status": [
            "stun",
            "root"
          ]
        },
        {
          "n": "Determinacao Absoluta",
          "d": "A determinacao mais profunda amplifica cada ataque.",
          "dmg": "5d6",
          "chi": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Pedra Eterna",
          "d": "A forca da pedra eterna concentrada num unico ataque.",
          "dmg": "5d8",
          "chi": 5,
          "status": [
            "stun",
            "root",
            "slow"
          ]
        },
        {
          "n": "O Inabalavel",
          "d": "Nada quebra esta vontade — e nada sobrevive a este golpe.",
          "dmg": "6d8",
          "chi": 6,
          "status": [
            "stun",
            "root",
            "slow",
            "fear"
          ]
        }
      ]
    },
    "Visao Profunda": {
      "tier": 3,
      "pos": "def",
      "reqs": {
        "PER": 6,
        "ESP": 5
      },
      "req": [
        "Visao Sismica"
      ],
      "effect": {
        "type": "utility",
        "desc": "Visao sismica expande para 100m. Detecta armadilhas, tuneis e estruturas subterraneas.",
        "dice": "-",
        "chi": 3,
        "status": []
      },
      "attacks": [
        {
          "n": "Onda Profunda",
          "d": "Uma onda sismica das profundezas que abala as fundacoes.",
          "dmg": "3d6+2",
          "chi": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Tremor Estrutural",
          "d": "Atinge as fundacoes das estruturas inimigas.",
          "dmg": "3d8",
          "chi": 4,
          "status": [
            "stun",
            "root"
          ]
        },
        {
          "n": "Pulso das Profundezas",
          "d": "Um pulso que vem das profundezas da terra.",
          "dmg": "4d6",
          "chi": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Eco Profundo",
          "d": "O eco da terra profunda volta amplificado em dano.",
          "dmg": "4d6+2",
          "chi": 5,
          "status": [
            "stun",
            "root"
          ]
        },
        {
          "n": "Sismo Estrutural",
          "d": "Um sismo que destroi estruturas medias completamente.",
          "dmg": "4d8",
          "chi": 5,
          "status": [
            "stun",
            "slow",
            "root"
          ]
        },
        {
          "n": "Vibracoes das Profundezas",
          "d": "Vibracoes subterraneas que surgem diretamente sob inimigos.",
          "dmg": "5d6",
          "chi": 5,
          "status": [
            "stun",
            "root"
          ]
        },
        {
          "n": "Onda Devastadora",
          "d": "Uma onda sismica de grande profundidade e alcance.",
          "dmg": "5d8",
          "chi": 5,
          "status": [
            "stun",
            "slow",
            "root"
          ]
        },
        {
          "n": "Sismo Profundo",
          "d": "Um sismo das profundezas — absolutamente imparavel.",
          "dmg": "6d6+2",
          "chi": 6,
          "status": [
            "stun",
            "root",
            "slow"
          ]
        },
        {
          "n": "Voz das Profundezas",
          "d": "A voz da terra profunda manifestada em ataque direto.",
          "dmg": "6d8",
          "chi": 6,
          "status": [
            "stun",
            "root",
            "slow",
            "blind"
          ]
        },
        {
          "n": "A Fundacao Range",
          "d": "Tudo que assenta na terra e atingido simultaneamente.",
          "dmg": "7d8",
          "chi": 7,
          "status": [
            "stun",
            "root",
            "slow",
            "blind"
          ]
        }
      ]
    },
    "Memoria da Pedra": {
      "tier": 3,
      "pos": "pass",
      "reqs": {
        "PER": 5,
        "ESP": 5
      },
      "req": [
        "Escuta da Terra",
        "Vontade Inabalavel"
      ],
      "effect": {
        "type": "utility",
        "desc": "Revela os ultimos 24h de eventos num raio de 5m de qualquer pedra tocada.",
        "dice": "-",
        "chi": 4,
        "status": []
      },
      "attacks": [
        {
          "n": "Golpe da Memoria",
          "d": "A memoria da pedra guia o golpe com precisao historica absoluta.",
          "dmg": "2d8+2",
          "chi": 3,
          "status": []
        },
        {
          "n": "Pedra que Lembra",
          "d": "A pedra lembra cada golpe que recebeu — e devolve com juros.",
          "dmg": "3d6",
          "chi": 3,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Eco do Passado",
          "d": "O eco dos eventos passados torna-se onda de dano.",
          "dmg": "3d6+2",
          "chi": 4,
          "status": [
            "slow"
          ]
        },
        {
          "n": "Furia da Historia",
          "d": "A historia de violencia armazenada e libertada de uma vez.",
          "dmg": "3d8",
          "chi": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Projecao do Passado",
          "d": "Projeta a memoria de um impacto poderoso registado pela pedra.",
          "dmg": "4d6",
          "chi": 4,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Pedra Ancestral",
          "d": "A pedra usa a forca de todos os impactos que ja recebeu.",
          "dmg": "4d6+2",
          "chi": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Memoria Viva",
          "d": "A pedra ataca com os golpes de quem a usou em batalha antes.",
          "dmg": "4d8",
          "chi": 5,
          "status": [
            "stun",
            "root"
          ]
        },
        {
          "n": "Eco Ancestral",
          "d": "O eco de batalhas passadas guia o ataque com precisao.",
          "dmg": "5d6",
          "chi": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Cronica de Pedra",
          "d": "A historia da pedra descarregada em impacto total.",
          "dmg": "5d8",
          "chi": 6,
          "status": [
            "stun",
            "root",
            "slow"
          ]
        },
        {
          "n": "Tudo o Que a Pedra Sabe",
          "d": "O conhecimento ancestral da pedra em ataque puro.",
          "dmg": "6d8",
          "chi": 6,
          "status": [
            "stun",
            "root",
            "slow",
            "blind"
          ]
        }
      ]
    },
    "Voz da Terra": {
      "tier": 4,
      "pos": "pass",
      "reqs": {
        "PER": 8,
        "ESP": 9,
        "RES": 5
      },
      "req": [
        "Visao Profunda",
        "Memoria da Pedra"
      ],
      "effect": {
        "type": "special",
        "desc": "Aprende historia geologica do local. Preve sismos. Restaura 2d6 chi ao comunicar.",
        "dice": "2d6",
        "chi": 5,
        "status": [
          "regen"
        ]
      },
      "attacks": [
        {
          "n": "Palavra da Terra",
          "d": "A voz da terra manifesta-se em onda sismica devastadora.",
          "dmg": "3d8+2",
          "chi": 5,
          "status": [
            "stun",
            "root"
          ]
        },
        {
          "n": "Eco do Mundo",
          "d": "O eco do mundo inteiro concentrado num unico ataque.",
          "dmg": "4d8",
          "chi": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Voz do Sismo",
          "d": "A voz que antecede cada sismo — absolutamente devastadora.",
          "dmg": "4d8+4",
          "chi": 6,
          "status": [
            "stun",
            "root",
            "slow"
          ]
        },
        {
          "n": "Comando Sismico",
          "d": "Um comando dado a terra que ela obedece imediatamente.",
          "dmg": "5d8",
          "chi": 6,
          "status": [
            "stun",
            "root"
          ]
        },
        {
          "n": "A Terra Responde",
          "d": "A terra inteira responde ao comando do dobrador.",
          "dmg": "5d8+3",
          "chi": 7,
          "status": [
            "stun",
            "root",
            "slow"
          ]
        },
        {
          "n": "Rugido da Terra",
          "d": "O rugido da terra ao ser ferida — absolutamente aterrador.",
          "dmg": "6d8",
          "chi": 7,
          "status": [
            "stun",
            "root",
            "fear"
          ]
        },
        {
          "n": "Voz do Planeta",
          "d": "A voz do planeta inteiro concentrada num ponto.",
          "dmg": "6d8+4",
          "chi": 8,
          "status": [
            "stun",
            "root",
            "slow",
            "fear"
          ]
        },
        {
          "n": "Ordem da Terra",
          "d": "Uma ordem que a terra simplesmente nao pode recusar.",
          "dmg": "7d8",
          "chi": 8,
          "status": [
            "stun",
            "root",
            "slow"
          ]
        },
        {
          "n": "A Terra Fala",
          "d": "Quando a terra fala — tudo treme sem excecao.",
          "dmg": "8d8",
          "chi": 9,
          "status": [
            "stun",
            "root",
            "slow",
            "blind"
          ]
        },
        {
          "n": "Voz do Mundo",
          "d": "A voz do mundo — o maior poder que a terra pode dar.",
          "dmg": "10d8",
          "chi": 10,
          "status": [
            "stun",
            "root",
            "slow",
            "blind",
            "fear"
          ]
        }
      ]
    },
    "Surf de Terra": {
      "tier": 1,
      "pos": "off",
      "reqs": {
        "AGI": 2,
        "CHI": 1
      },
      "req": [],
      "effect": {
        "type": "move",
        "desc": "Velocidade triplicada em terreno natural. Pode carregar aliados na plataforma.",
        "dice": "-",
        "chi": 1,
        "status": []
      },
      "attacks": [
        {
          "n": "Rampa de Terra",
          "d": "Cria uma rampa que lanca o dobrador em arco sobre o inimigo.",
          "dmg": "1d6+2",
          "chi": 2,
          "status": []
        },
        {
          "n": "Surf de Ataque",
          "d": "O bloco de terra e lancado diretamente contra o inimigo.",
          "dmg": "2d4+2",
          "chi": 2,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Onda de Chao",
          "d": "Uma onda de terra que rola pelo chao em direcao ao inimigo.",
          "dmg": "2d6",
          "chi": 3,
          "status": [
            "slow"
          ]
        },
        {
          "n": "Surf Duplo",
          "d": "Dois blocos de terra lancados em direcoes diferentes.",
          "dmg": "2d6+2",
          "chi": 3,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Rampa de Combate",
          "d": "A rampa e usada para ganhar posicao vantajosa.",
          "dmg": "2d8",
          "chi": 3,
          "status": [
            "slow"
          ]
        },
        {
          "n": "Surf Rapido",
          "d": "O bloco acelera a maxima velocidade — colisao devastadora.",
          "dmg": "3d6",
          "chi": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Plataforma de Ataque",
          "d": "A plataforma e lancada como arma colossal de impacto.",
          "dmg": "3d6+2",
          "chi": 4,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Surf de Flanqueamento",
          "d": "O surf usa-se para chegar rapidamente a posicao de flanco.",
          "dmg": "3d8",
          "chi": 4,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "n": "Onda Sismica Movel",
          "d": "O surf gera uma onda sismica no caminho percorrido.",
          "dmg": "4d6",
          "chi": 5,
          "status": [
            "stun",
            "slow",
            "root"
          ]
        },
        {
          "n": "Torrente de Terra",
          "d": "Uma torrente de terra que carrega tudo no seu caminho.",
          "dmg": "4d8",
          "chi": 5,
          "status": [
            "stun",
            "slow",
            "root"
          ]
        }
      ]
    },
    "Passo Sismico": {
      "tier": 1,
      "pos": "off",
      "reqs": {
        "FOR": 2,
        "AGI": 1
      },
      "req": [],
      "effect": {
        "type": "move",
        "desc": "Cada passo causa 1d4 e slow a inimigos em contacto com o chao num raio de 2m.",
        "dice": "1d4",
        "chi": 1,
        "status": [
          "slow"
        ]
      },
      "attacks": [
        {
          "n": "Passo Forte",
          "d": "Um passo deliberadamente forte — tremor de raio 3m.",
          "dmg": "1d8+2",
          "chi": 2,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Sequencia de Passos",
          "d": "Cinco passos rapidos — cinco micro-tremores em cascata.",
          "dmg": "2d6",
          "chi": 2,
          "status": [
            "slow"
          ]
        },
        {
          "n": "Passo Sismico Medio",
          "d": "Um passo que gera tremor de raio 5m ao redor.",
          "dmg": "2d6+2",
          "chi": 3,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Carga com Passos",
          "d": "Uma carga onde cada passo e um tremor devastador.",
          "dmg": "2d8",
          "chi": 3,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Danca Sismica",
          "d": "Uma danca de passos sismicos que cobre toda a area.",
          "dmg": "3d6",
          "chi": 3,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Passos em Cadeia",
          "d": "Cada passo amplifica o proximo — dano crescente.",
          "dmg": "3d6+2",
          "chi": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Passo do Gigante",
          "d": "Um passo que simula literalmente o passo de um gigante.",
          "dmg": "3d8",
          "chi": 4,
          "status": [
            "stun",
            "root"
          ]
        },
        {
          "n": "Sequencia Sismica",
          "d": "Uma sequencia de passos que culmina num sismo.",
          "dmg": "4d6",
          "chi": 4,
          "status": [
            "stun",
            "slow",
            "root"
          ]
        },
        {
          "n": "Passo Apocaliptico",
          "d": "Um passo que gera sismo de raio 10m devastador.",
          "dmg": "4d8",
          "chi": 5,
          "status": [
            "stun",
            "slow",
            "root"
          ]
        },
        {
          "n": "O Passo da Terra",
          "d": "Quando este passo ressoa — a terra inteira range.",
          "dmg": "5d8",
          "chi": 5,
          "status": [
            "stun",
            "slow",
            "root",
            "blind"
          ]
        }
      ]
    },
    "Tunel Rapido": {
      "tier": 2,
      "pos": "off",
      "reqs": {
        "AGI": 4,
        "FOR": 3
      },
      "req": [
        "Surf de Terra"
      ],
      "effect": {
        "type": "move",
        "desc": "Atravessa o solo invisivelmente. Emerge atras de inimigos com vantagem de surpresa.",
        "dice": "-",
        "chi": 2,
        "status": []
      },
      "attacks": [
        {
          "n": "Emergencia de Surpresa",
          "d": "Emerge do chao atras do inimigo em ataque surpresa.",
          "dmg": "2d6+2",
          "chi": 2,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Tunel Explosivo",
          "d": "Ao sair do tunel explode pedras em area.",
          "dmg": "3d6",
          "chi": 3,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "n": "Ataque do Subsolo",
          "d": "Ataca a partir do interior do chao sem emergir.",
          "dmg": "3d6+2",
          "chi": 3,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Dupla Emergencia",
          "d": "Emerge, ataca e mergulha de volta no mesmo turno.",
          "dmg": "3d8",
          "chi": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Tunel de Combate",
          "d": "O tunel e usado para flanquear continuamente o inimigo.",
          "dmg": "4d6",
          "chi": 4,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "n": "Corredor de Pedra",
          "d": "Cria um corredor de pedra que canaliza o ataque.",
          "dmg": "4d6+2",
          "chi": 4,
          "status": [
            "root",
            "stun"
          ]
        },
        {
          "n": "Mina de Terra",
          "d": "Cria uma mina de pedra que explode ao ser pisada.",
          "dmg": "3d8+3",
          "chi": 5,
          "status": [
            "stun",
            "slow",
            "root"
          ]
        },
        {
          "n": "Tunel Rapido Maximo",
          "d": "Velocidade maxima em tunel — colisao catastrofica ao emergir.",
          "dmg": "4d8+2",
          "chi": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Rede de Tuneis",
          "d": "Multiplos tuneis que emergem em pontos completamente diferentes.",
          "dmg": "5d6+2",
          "chi": 5,
          "status": [
            "stun",
            "slow",
            "root"
          ]
        },
        {
          "n": "O Subsolo Ataca",
          "d": "O subsolo inteiro e uma extensao armada do dobrador.",
          "dmg": "6d8",
          "chi": 6,
          "status": [
            "stun",
            "slow",
            "root",
            "blind"
          ]
        }
      ]
    },
    "Plataforma Elevatoria": {
      "tier": 2,
      "pos": "off",
      "reqs": {
        "FOR": 3,
        "AGI": 2
      },
      "req": [
        "Passo Sismico",
        "Surf de Terra"
      ],
      "effect": {
        "type": "move",
        "desc": "Lanca o utilizador ou aliado a grande altura. Pode ser usada para fugir ou flanquear.",
        "dice": "1d6",
        "chi": 2,
        "status": [
          "stun"
        ]
      },
      "attacks": [
        {
          "n": "Plataforma de Ataque",
          "d": "A plataforma lanca o dobrador num ataque de cima.",
          "dmg": "2d6+2",
          "chi": 3,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Coluna de Lancamento",
          "d": "Uma coluna ergue e lanca como catapulta humana.",
          "dmg": "3d6",
          "chi": 3,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Plataforma Multipla",
          "d": "Multiplas plataformas lancam multiplos aliados.",
          "dmg": "3d6+2",
          "chi": 3,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Elevacao e Ataque",
          "d": "Eleva e ataca simultaneamente no mesmo momento.",
          "dmg": "2d8+2",
          "chi": 4,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Plataforma Explosiva",
          "d": "A plataforma explode no ponto maximo da elevacao.",
          "dmg": "4d6",
          "chi": 4,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "n": "Lance Duplo",
          "d": "Dois lancamentos em direcoes opostas em rapida sequencia.",
          "dmg": "4d6+2",
          "chi": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Plataforma Giratoria",
          "d": "A plataforma gira enquanto eleva — projeta o dobrador.",
          "dmg": "3d8+3",
          "chi": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Elevacao Colossal",
          "d": "Uma plataforma colossal que eleva a grande altitude.",
          "dmg": "4d8",
          "chi": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Lancamento de Precisao",
          "d": "A plataforma lanca exatamente no ponto pretendido.",
          "dmg": "5d6",
          "chi": 5,
          "status": [
            "stun",
            "root"
          ]
        },
        {
          "n": "O Ceu e o Limite",
          "d": "A plataforma eleva tanto que a queda e absolutamente letal.",
          "dmg": "5d8+2",
          "chi": 5,
          "status": [
            "stun",
            "root",
            "blind"
          ]
        }
      ]
    },
    "Deslize Sismico": {
      "tier": 3,
      "pos": "off",
      "reqs": {
        "AGI": 6,
        "FOR": 4
      },
      "req": [
        "Tunel Rapido"
      ],
      "effect": {
        "type": "move",
        "desc": "Velocidade maxima subterranea. Pode atacar e mergulhar de volta no mesmo turno.",
        "dice": "-",
        "chi": 3,
        "status": []
      },
      "attacks": [
        {
          "n": "Ataque Subterraneo",
          "d": "Emerge e ataca antes de qualquer reacao possivel.",
          "dmg": "2d8+2",
          "chi": 3,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Deslize e Ataque",
          "d": "Desliza sob o inimigo e emerge em ataque preciso.",
          "dmg": "3d6+2",
          "chi": 4,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Silvo da Terra",
          "d": "Um ataque tao rapido que parece magia absoluta.",
          "dmg": "3d8",
          "chi": 4,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "n": "Emergencia Explosiva",
          "d": "Emerge explodindo rochas em todas as direcoes.",
          "dmg": "4d6+2",
          "chi": 4,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "n": "Deslize Duplo",
          "d": "Dois ataques de posicoes subterraneas diferentes.",
          "dmg": "4d6+3",
          "chi": 5,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Fantasma Sismico",
          "d": "O dobrador e invisivel ate ao exato momento do impacto.",
          "dmg": "4d8",
          "chi": 5,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "n": "Onda Subterranea",
          "d": "Uma onda de terra que viaja no subsolo antes de emergir.",
          "dmg": "5d6",
          "chi": 5,
          "status": [
            "stun",
            "slow",
            "root"
          ]
        },
        {
          "n": "Deslize Mortal",
          "d": "Velocidade maxima — impacto de colisao devastadora.",
          "dmg": "5d8",
          "chi": 6,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Tempestade Subterranea",
          "d": "Multiplos ataques do subsolo em rapida sequencia.",
          "dmg": "6d6+2",
          "chi": 6,
          "status": [
            "stun",
            "slow",
            "blind"
          ]
        },
        {
          "n": "O Subsolo e a Arma",
          "d": "O dobrador e o subsolo — indistinguiveis e imparaveis.",
          "dmg": "6d8+2",
          "chi": 7,
          "status": [
            "stun",
            "slow",
            "root",
            "blind"
          ]
        }
      ]
    },
    "Salto de Catapulta": {
      "tier": 2,
      "pos": "off",
      "reqs": {
        "FOR": 3,
        "AGI": 3
      },
      "req": [
        "Plataforma Elevatoria"
      ],
      "attacks": [
        {
          "n": "Lancamento Vertical",
          "d": "Pilar lanca verticalmente para ganhar altitude maxima.",
          "dmg": "1d8+2",
          "chi": 2,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Lancamento Obliquo",
          "d": "Pilar com angulo — lanca em arco para um alvo.",
          "dmg": "2d6",
          "chi": 2,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Catapulta de Pedra",
          "d": "A propria rocha e lancada junto com o dobrador.",
          "dmg": "2d6+2",
          "chi": 3,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Lancamento Duplo",
          "d": "Dois pilares em sequencia — alcance dobrado.",
          "dmg": "3d6",
          "chi": 3,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Meteoro de Terra",
          "d": "Cai como meteoro — impacto catastrofico no alvo.",
          "dmg": "4d6+2",
          "chi": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Catapulta Dupla",
          "d": "Dois lancamentos de angulos opostos em simultaneo.",
          "dmg": "4d6",
          "chi": 4,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "n": "Voo de Pedra",
          "d": "O dobrador voa em arco longo sobre o campo.",
          "dmg": "3d8+2",
          "chi": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Catapulta Colossal",
          "d": "Um pilar enorme que lanca a grande distancia.",
          "dmg": "5d6",
          "chi": 5,
          "status": [
            "stun",
            "slow",
            "root"
          ]
        },
        {
          "n": "Lance Perfeito",
          "d": "O lancamento calculado com precisao absoluta.",
          "dmg": "5d8",
          "chi": 5,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "n": "Projetil Humano",
          "d": "O dobrador torna-se um projétil de pedra irresistivel.",
          "dmg": "6d8",
          "chi": 6,
          "status": [
            "stun",
            "slow",
            "root",
            "blind"
          ]
        }
      ]
    },
    "Fantasma de Terra": {
      "tier": 4,
      "pos": "off",
      "reqs": {
        "AGI": 9,
        "FOR": 6,
        "PER": 5
      },
      "req": [
        "Deslize Sismico",
        "Salto de Catapulta"
      ],
      "attacks": [
        {
          "n": "Mao da Terra",
          "d": "Mao de pedra que emerge do chao e agarra o alvo.",
          "dmg": "3d6+2",
          "chi": 4,
          "status": [
            "root",
            "stun"
          ]
        },
        {
          "n": "Espiga Subterranea",
          "d": "Espiga de rocha que perfura verticalmente sob o alvo.",
          "dmg": "4d6",
          "chi": 5,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Emergencia Explosiva",
          "d": "Emerge explodindo pedras em area ao redor.",
          "dmg": "4d6+3",
          "chi": 5,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "n": "Toco de Pedra",
          "d": "Agarra o pe do inimigo pelo chao — imobiliza completamente.",
          "dmg": "3d8",
          "chi": 5,
          "status": [
            "root",
            "slow"
          ]
        },
        {
          "n": "Fantasma Revelado",
          "d": "Emerge com toda a forca antes de submergir novamente.",
          "dmg": "5d8+3",
          "chi": 7,
          "status": [
            "stun",
            "slow",
            "root"
          ]
        },
        {
          "n": "Armadilha Subterranea",
          "d": "Prepara uma armadilha de pedra no subsolo indetectavel.",
          "dmg": "4d8+2",
          "chi": 6,
          "status": [
            "root",
            "stun",
            "slow"
          ]
        },
        {
          "n": "Multiplas Emergencias",
          "d": "Emerge em tres pontos diferentes em rapida sequencia.",
          "dmg": "5d8",
          "chi": 7,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "n": "O Fantasma Atacou",
          "d": "O inimigo nao percebeu absolutamente nada ate ser tarde.",
          "dmg": "6d8",
          "chi": 8,
          "status": [
            "stun",
            "root",
            "blind"
          ]
        },
        {
          "n": "Terra Viva",
          "d": "A terra inteira ao redor e uma extensao do dobrador.",
          "dmg": "7d8",
          "chi": 8,
          "status": [
            "stun",
            "root",
            "slow",
            "blind"
          ]
        },
        {
          "n": "O Subsolo Domina",
          "d": "O dobrador domina completamente o terreno.",
          "dmg": "8d8+2",
          "chi": 9,
          "status": [
            "stun",
            "root",
            "slow",
            "blind",
            "fear"
          ]
        }
      ]
    },
    "Muralha de Terra": {
      "tier": 1,
      "pos": "def",
      "reqs": {
        "FOR": 2,
        "RES": 1
      },
      "req": [],
      "effect": {
        "type": "def",
        "desc": "Cria barreira que absorve 3d8 dano. Pode ser lancada contra inimigos causando 2d6.",
        "dice": "3d8",
        "chi": 2,
        "status": [
          "shield"
        ]
      },
      "attacks": [
        {
          "n": "Muralha Caindo",
          "d": "A muralha tomba propositalmente sobre o inimigo.",
          "dmg": "2d6+2",
          "chi": 2,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Projetil de Muralha",
          "d": "Um fragmento da muralha lancado a alta velocidade.",
          "dmg": "3d6",
          "chi": 3,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Muralha Expansiva",
          "d": "A muralha expande e esmaga inimigos proximos.",
          "dmg": "3d6+2",
          "chi": 3,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Crush de Muralha",
          "d": "Duas muralhas esmagam de dois lados em simultaneo.",
          "dmg": "3d8",
          "chi": 4,
          "status": [
            "stun",
            "root"
          ]
        },
        {
          "n": "Muralha Explosiva",
          "d": "A muralha explode em projéteis ao ser destruida.",
          "dmg": "4d6",
          "chi": 4,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "n": "Avalanche de Muralha",
          "d": "A muralha desmorona em avalanche devastadora.",
          "dmg": "4d6+2",
          "chi": 4,
          "status": [
            "stun",
            "slow",
            "blind"
          ]
        },
        {
          "n": "Muralha Gigante",
          "d": "Uma muralha colossal que esmaga ate estruturas.",
          "dmg": "4d8",
          "chi": 5,
          "status": [
            "stun",
            "root"
          ]
        },
        {
          "n": "Fortaleza Caindo",
          "d": "A fortaleza inteira colapsa sobre o inimigo.",
          "dmg": "5d6+2",
          "chi": 5,
          "status": [
            "stun",
            "slow",
            "root"
          ]
        },
        {
          "n": "Muralha de Granito",
          "d": "Muralha de granito puro — quase indestrutivel.",
          "dmg": "5d8",
          "chi": 5,
          "status": [
            "stun",
            "root",
            "slow"
          ]
        },
        {
          "n": "A Muralha Eterna",
          "d": "A maior muralha possivel — colapsa tudo ao redor.",
          "dmg": "6d8",
          "chi": 6,
          "status": [
            "stun",
            "root",
            "slow",
            "blind"
          ]
        }
      ]
    }
  },
  "air": {
    "Desapego Total": {
      "tier": 2,
      "pos": "pass",
      "reqs": {
        "CHI": 4,
        "ESP": 3
      },
      "req": [
        "Meditacao do Vento"
      ],
      "effect": {
        "type": "restore",
        "desc": "Restaura 1d4 chi por turno. Imune a fear, slow psiquico e manipulacao emocional.",
        "dice": "1d4/t",
        "chi": 0,
        "status": [
          "regen",
          "shield"
        ]
      },
      "attacks": [
        {
          "n": "Desapego Ativo",
          "d": "O desapego interior transforma-se em ataque de vento puro.",
          "dmg": "1d8+2",
          "chi": 2,
          "status": [
            "slow"
          ]
        },
        {
          "n": "Paz Armada",
          "d": "A paz interior exterioriza-se em golpe de ar certeiro.",
          "dmg": "2d6",
          "chi": 2,
          "status": []
        },
        {
          "n": "Tranquilidade Ofensiva",
          "d": "A tranquilidade absoluta e a arma mais afiada de todas.",
          "dmg": "2d6+2",
          "chi": 3,
          "status": []
        },
        {
          "n": "Serenidade Explosiva",
          "d": "A serenidade acumula silenciosamente e explode em ataque.",
          "dmg": "2d8",
          "chi": 3,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Vento da Paz",
          "d": "Um vento de paz que ainda assim derruba tudo a frente.",
          "dmg": "3d6",
          "chi": 3,
          "status": [
            "slow"
          ]
        },
        {
          "n": "Calma do Mestre",
          "d": "A calma do mestre manifesta-se em poder devastador.",
          "dmg": "3d6+2",
          "chi": 4,
          "status": [
            "slow",
            "stun"
          ]
        },
        {
          "n": "Equanimidade Marcial",
          "d": "A equanimidade interior guia o golpe perfeito.",
          "dmg": "3d8",
          "chi": 4,
          "status": []
        },
        {
          "n": "Desapego Total em Ataque",
          "d": "O desapego total converte-se em forca pura e imparavel.",
          "dmg": "4d6",
          "chi": 4,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Paz do Avatar",
          "d": "A paz que o Avatar carrega dentro de si — devastadora.",
          "dmg": "4d8",
          "chi": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "O Vazio que Ataca",
          "d": "O vazio interior absoluto e a arma mais devastadora.",
          "dmg": "5d8",
          "chi": 5,
          "status": [
            "stun",
            "slow",
            "blind"
          ]
        }
      ]
    },
    "Ligacao ao Espirito": {
      "tier": 2,
      "pos": "pass",
      "reqs": {
        "ESP": 3,
        "CHI": 3
      },
      "req": [
        "Escuta do Ar"
      ],
      "effect": {
        "type": "utility",
        "desc": "Ve e comunica com espiritos. Deteta portais espirituais. Pede informacao a espiritos amigaveis.",
        "dice": "-",
        "chi": 2,
        "status": []
      },
      "attacks": [
        {
          "n": "Sopro Espiritual",
          "d": "O vento carrega a essencia dos espiritos em ataque.",
          "dmg": "1d8+2",
          "chi": 2,
          "status": [
            "slow"
          ]
        },
        {
          "n": "Eco Espiritual",
          "d": "O eco espiritual manifesta-se em ataque visivel.",
          "dmg": "2d6",
          "chi": 2,
          "status": []
        },
        {
          "n": "Vento dos Espiritos",
          "d": "Os espiritos guiam o ataque de ar com precisao.",
          "dmg": "2d6+2",
          "chi": 3,
          "status": [
            "slow"
          ]
        },
        {
          "n": "Chama Espiritual",
          "d": "A ligacao espiritual amplifica o vento em poder.",
          "dmg": "2d8",
          "chi": 3,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Rajada dos Espiritos",
          "d": "Os espiritos sopram em conjunto num unico ataque.",
          "dmg": "3d6",
          "chi": 3,
          "status": [
            "slow",
            "stun"
          ]
        },
        {
          "n": "Eco do Alem",
          "d": "O alem ecoando neste mundo em ataque puro.",
          "dmg": "3d6+2",
          "chi": 4,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "n": "Voz dos Espiritos",
          "d": "A voz dos espiritos como onda de choque de ar.",
          "dmg": "3d8",
          "chi": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Manifestacao Espiritual",
          "d": "Um espirito manifesta-se brevemente em ataque direto.",
          "dmg": "4d6",
          "chi": 4,
          "status": [
            "stun",
            "fear"
          ]
        },
        {
          "n": "Exercito Espiritual",
          "d": "Multiplos espiritos atacam em simultaneo.",
          "dmg": "4d8",
          "chi": 5,
          "status": [
            "stun",
            "slow",
            "fear"
          ]
        },
        {
          "n": "O Espirito Ataca",
          "d": "O espirito do vento encarna brevemente neste mundo.",
          "dmg": "5d8",
          "chi": 5,
          "status": [
            "stun",
            "slow",
            "fear",
            "blind"
          ]
        }
      ]
    },
    "Projecao Espiritual": {
      "tier": 3,
      "pos": "pass",
      "reqs": {
        "CHI": 6,
        "ESP": 6
      },
      "req": [
        "Ligacao ao Espirito",
        "Desapego Total"
      ],
      "effect": {
        "type": "special",
        "desc": "Viaja pelo mundo espiritual. O corpo fica vulneravel. Espiona e comunica a distancia.",
        "dice": "-",
        "chi": 4,
        "status": []
      },
      "attacks": [
        {
          "n": "Ataque Espiritual",
          "d": "O espirito projeta-se e ataca diretamente o inimigo.",
          "dmg": "2d8+2",
          "chi": 4,
          "status": [
            "stun",
            "fear"
          ]
        },
        {
          "n": "Fantasma de Ataque",
          "d": "O espirito usa o proprio corpo como projétil de ar.",
          "dmg": "3d6+2",
          "chi": 4,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Projecao Ofensiva",
          "d": "A projecao espiritual e usada diretamente em combate.",
          "dmg": "3d8",
          "chi": 5,
          "status": [
            "stun",
            "fear"
          ]
        },
        {
          "n": "Duplo Ataque",
          "d": "O corpo e o espirito atacam em simultâneo.",
          "dmg": "4d6+2",
          "chi": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Espirito Combatente",
          "d": "O espirito e um guerreiro que luta completamente sozinho.",
          "dmg": "4d8",
          "chi": 5,
          "status": [
            "stun",
            "fear"
          ]
        },
        {
          "n": "Projecao Total",
          "d": "A projecao total deixa o espirito completamente livre.",
          "dmg": "5d6+2",
          "chi": 6,
          "status": [
            "stun",
            "fear",
            "blind"
          ]
        },
        {
          "n": "O Espirito Livre",
          "d": "Um espirito livre e absolutamente imparavel.",
          "dmg": "5d8",
          "chi": 6,
          "status": [
            "stun",
            "fear",
            "slow"
          ]
        },
        {
          "n": "Fantasma de Guerra",
          "d": "O espirito de um guerreiro antigo manifesta-se em batalha.",
          "dmg": "6d6+2",
          "chi": 7,
          "status": [
            "stun",
            "fear",
            "slow"
          ]
        },
        {
          "n": "Dois Mundos",
          "d": "O dobrador luta em dois mundos completamente em simultaneo.",
          "dmg": "6d8",
          "chi": 7,
          "status": [
            "stun",
            "fear",
            "blind"
          ]
        },
        {
          "n": "Transcendencia",
          "d": "O dobrador transcende a fisica — poder absoluto.",
          "dmg": "7d8+2",
          "chi": 8,
          "status": [
            "stun",
            "fear",
            "blind",
            "slow"
          ]
        }
      ]
    },
    "Respiracao Cosmica": {
      "tier": 3,
      "pos": "pass",
      "reqs": {
        "CHI": 7,
        "ESP": 5,
        "PER": 4
      },
      "req": [
        "Desapego Total"
      ],
      "effect": {
        "type": "restore",
        "desc": "Restaura 2d4 chi ao sincronizar. Alcance de todas as habilidades de ar triplica.",
        "dice": "2d4",
        "chi": 3,
        "status": [
          "regen"
        ]
      },
      "attacks": [
        {
          "n": "Sopro Cosmico",
          "d": "O cosmo inteiro sopra atraves do dobrador em ataque.",
          "dmg": "2d8+2",
          "chi": 4,
          "status": [
            "slow"
          ]
        },
        {
          "n": "Respiracao em Ataque",
          "d": "A respiracao cosmica liberta-se em ataque devastador.",
          "dmg": "3d6+2",
          "chi": 4,
          "status": [
            "slow",
            "stun"
          ]
        },
        {
          "n": "Vento do Cosmos",
          "d": "O vento cosmico concentrado num unico ponto.",
          "dmg": "3d8",
          "chi": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Exalacao Cosmica",
          "d": "A exalacao cosmica varre completamente o campo.",
          "dmg": "4d6+2",
          "chi": 5,
          "status": [
            "stun",
            "slow",
            "blind"
          ]
        },
        {
          "n": "Respiracao Total",
          "d": "Toda a respiracao cosmica num so momento explosivo.",
          "dmg": "4d8",
          "chi": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Sopro Universal",
          "d": "O universo inteiro sopra atraves do dobrador.",
          "dmg": "5d6+2",
          "chi": 6,
          "status": [
            "stun",
            "slow",
            "blind"
          ]
        },
        {
          "n": "Exalacao Universal",
          "d": "A exalacao que literalmente muda o cosmos.",
          "dmg": "5d8",
          "chi": 6,
          "status": [
            "stun",
            "slow",
            "blind"
          ]
        },
        {
          "n": "Vento Eterno",
          "d": "O vento que sopra desde o inicio dos tempos.",
          "dmg": "6d6+4",
          "chi": 7,
          "status": [
            "stun",
            "slow",
            "blind"
          ]
        },
        {
          "n": "Respiracao do Cosmos",
          "d": "A respiracao que o proprio cosmos usa.",
          "dmg": "6d8+2",
          "chi": 7,
          "status": [
            "stun",
            "slow",
            "blind",
            "root"
          ]
        },
        {
          "n": "O Universo Sopra",
          "d": "O universo inteiro sopra em ataque absolutamente puro.",
          "dmg": "8d8",
          "chi": 8,
          "status": [
            "stun",
            "slow",
            "blind",
            "root"
          ]
        }
      ]
    },
    "Fusao Espiritual": {
      "tier": 4,
      "pos": "pass",
      "reqs": {
        "CHI": 10,
        "ESP": 10
      },
      "req": [
        "Projecao Espiritual",
        "Respiracao Cosmica"
      ],
      "effect": {
        "type": "special",
        "desc": "Funde com espirito aliado por 3 turnos. Todos os atributos +3. Restaura 3d8 chi.",
        "dice": "3d8",
        "chi": 7,
        "status": [
          "regen",
          "shield"
        ]
      },
      "attacks": [
        {
          "n": "Golpe da Fusao",
          "d": "O espirito funde-se com o punho do dobrador.",
          "dmg": "3d8+2",
          "chi": 5,
          "status": [
            "stun",
            "fear"
          ]
        },
        {
          "n": "Ataque Fundido",
          "d": "O dobrador fundido ataca com poder totalmente duplicado.",
          "dmg": "4d8",
          "chi": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Furia Espiritual",
          "d": "A furia do espirito fundido manifesta-se em poder.",
          "dmg": "4d8+4",
          "chi": 6,
          "status": [
            "stun",
            "fear"
          ]
        },
        {
          "n": "Poder Duplo",
          "d": "O dobrador possui o poder de dois seres completamente.",
          "dmg": "5d8",
          "chi": 6,
          "status": [
            "stun",
            "slow",
            "fear"
          ]
        },
        {
          "n": "Golpe do Ser Fundido",
          "d": "O ser fundido ataca com toda a sua essencia.",
          "dmg": "5d8+3",
          "chi": 7,
          "status": [
            "stun",
            "fear"
          ]
        },
        {
          "n": "Manifestacao Total",
          "d": "O espirito manifesta-se completamente neste mundo.",
          "dmg": "6d8",
          "chi": 7,
          "status": [
            "stun",
            "fear",
            "blind"
          ]
        },
        {
          "n": "Forca Combinada",
          "d": "A forca de dois mundos completamente combinada.",
          "dmg": "6d8+4",
          "chi": 8,
          "status": [
            "stun",
            "fear",
            "slow"
          ]
        },
        {
          "n": "O Ser Completo",
          "d": "O dobrador e o espirito — completos e absolutos.",
          "dmg": "7d8",
          "chi": 8,
          "status": [
            "stun",
            "fear",
            "slow",
            "blind"
          ]
        },
        {
          "n": "Fusao Absoluta",
          "d": "A fusao mais completa e poderosa possivel.",
          "dmg": "8d8",
          "chi": 9,
          "status": [
            "stun",
            "fear",
            "slow",
            "blind"
          ]
        },
        {
          "n": "O Avatar e o Espirito",
          "d": "Quando ambos se unem — absolutamente nada os pode parar.",
          "dmg": "10d8",
          "chi": 10,
          "status": [
            "stun",
            "fear",
            "slow",
            "blind",
            "root"
          ]
        }
      ]
    },
    "Voo com Planador": {
      "tier": 2,
      "pos": "off",
      "reqs": {
        "AGI": 4,
        "CHI": 2
      },
      "req": [
        "Salto de Ar"
      ],
      "effect": {
        "type": "move",
        "desc": "Voa silenciosamente por ate 10 turnos. Pode atacar em voo sem perder altitude.",
        "dice": "-",
        "chi": 2,
        "status": []
      },
      "attacks": [
        {
          "n": "Ataque em Voo",
          "d": "Ataca em picado durante o voo com forca de gravidade.",
          "dmg": "2d6+2",
          "chi": 2,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Mergulho do Planador",
          "d": "Mergulho em picado que aumenta o impacto.",
          "dmg": "3d6",
          "chi": 3,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Planador Ofensivo",
          "d": "Usa o proprio planador como arma de impacto.",
          "dmg": "3d6+2",
          "chi": 3,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Voo de Ataque",
          "d": "Voa em linhas de ataque multiplas e coordenadas.",
          "dmg": "3d8",
          "chi": 4,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "n": "Mergulho Explosivo",
          "d": "Mergulho a alta velocidade — colisao catastrofica.",
          "dmg": "4d6",
          "chi": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Planador Giratorio",
          "d": "Giro com planador — atinge tudo ao redor.",
          "dmg": "4d6+2",
          "chi": 4,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Voo Rasante de Ataque",
          "d": "Voo rasante que atinge linha inteira de inimigos.",
          "dmg": "4d8",
          "chi": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Ataque Supremo em Voo",
          "d": "O ataque mais poderoso possivel realizado em voo.",
          "dmg": "5d6+2",
          "chi": 5,
          "status": [
            "stun",
            "slow",
            "blind"
          ]
        },
        {
          "n": "Planador da Morte",
          "d": "O planador e usado como arma de destruicao pura.",
          "dmg": "5d8",
          "chi": 5,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "n": "Voo do Mestre do Vento",
          "d": "O voo absolutamente perfeito de um mestre do vento.",
          "dmg": "6d8",
          "chi": 6,
          "status": [
            "stun",
            "slow",
            "blind"
          ]
        }
      ]
    },
    "Esfera de Ar": {
      "tier": 2,
      "pos": "def",
      "reqs": {
        "AGI": 4,
        "CHI": 3
      },
      "req": [
        "Passo do Vento"
      ],
      "effect": {
        "type": "def",
        "desc": "Reduz dano fisico em 2d4. Permite rotacoes e esquivas em qualquer direcao.",
        "dice": "2d4",
        "chi": 2,
        "status": [
          "shield"
        ]
      },
      "attacks": [
        {
          "n": "Esfera Explosiva",
          "d": "A esfera explode em onda de vento devastadora.",
          "dmg": "2d6+2",
          "chi": 2,
          "status": [
            "slow",
            "stun"
          ]
        },
        {
          "n": "Esfera Rolante",
          "d": "A esfera avanca e atropela o inimigo no caminho.",
          "dmg": "3d6",
          "chi": 3,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Esfera Giratoria",
          "d": "A esfera gira a alta velocidade — absolutamente cortante.",
          "dmg": "3d6+2",
          "chi": 3,
          "status": [
            "slow",
            "stun"
          ]
        },
        {
          "n": "Esfera de Impacto",
          "d": "A esfera e lancada como projétil de vento puro.",
          "dmg": "3d8",
          "chi": 4,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Esfera Expansiva",
          "d": "A esfera expande instantaneamente em area.",
          "dmg": "4d6",
          "chi": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Colisao de Esferas",
          "d": "O dobrador colide intencionalmente na esfera.",
          "dmg": "4d6+2",
          "chi": 4,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "n": "Esfera Dupla",
          "d": "Duas esferas de vento em direcoes completamente diferentes.",
          "dmg": "4d8",
          "chi": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Tornado de Esferas",
          "d": "A esfera transforma-se num tornado devastador.",
          "dmg": "5d6+2",
          "chi": 5,
          "status": [
            "stun",
            "slow",
            "blind"
          ]
        },
        {
          "n": "Esfera Maxima",
          "d": "A maior esfera possivel de vento concentrado.",
          "dmg": "5d8",
          "chi": 5,
          "status": [
            "stun",
            "slow",
            "blind"
          ]
        },
        {
          "n": "Esfera Absoluta",
          "d": "A esfera que contem o poder de um tornado completo.",
          "dmg": "6d8",
          "chi": 6,
          "status": [
            "stun",
            "slow",
            "blind",
            "root"
          ]
        }
      ]
    },
    "Correntes Globais": {
      "tier": 3,
      "pos": "off",
      "reqs": {
        "AGI": 6,
        "CHI": 4,
        "PER": 4
      },
      "req": [
        "Voo com Planador"
      ],
      "effect": {
        "type": "move",
        "desc": "Velocidade maxima de voo em correntes globais. Cruzar grandes distancias rapidamente.",
        "dice": "-",
        "chi": 3,
        "status": []
      },
      "attacks": [
        {
          "n": "Corrente em Ataque",
          "d": "Uma corrente global e redirecionada em ataque certeiro.",
          "dmg": "2d8+2",
          "chi": 3,
          "status": [
            "slow"
          ]
        },
        {
          "n": "Golpe de Corrente",
          "d": "Uma corrente global concentrada num unico golpe.",
          "dmg": "3d6+2",
          "chi": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Onda de Corrente",
          "d": "Uma onda de corrente global devasta toda a area.",
          "dmg": "3d8",
          "chi": 4,
          "status": [
            "stun",
            "slow",
            "blind"
          ]
        },
        {
          "n": "Correntes Multiplas",
          "d": "Multiplas correntes atacam de direcoes completamente diferentes.",
          "dmg": "4d6+2",
          "chi": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Tempestade de Correntes",
          "d": "As correntes globais formam uma tempestade devastadora.",
          "dmg": "4d8",
          "chi": 5,
          "status": [
            "stun",
            "slow",
            "blind"
          ]
        },
        {
          "n": "Corrente Suprema",
          "d": "A corrente mais poderosa do mundo em ataque puro.",
          "dmg": "5d6+2",
          "chi": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Vortice Global",
          "d": "As correntes formam um vortice de escala global.",
          "dmg": "5d8",
          "chi": 5,
          "status": [
            "stun",
            "slow",
            "blind",
            "root"
          ]
        },
        {
          "n": "O Mundo Sopra",
          "d": "O mundo inteiro sopra em direcao ao inimigo.",
          "dmg": "6d6+4",
          "chi": 6,
          "status": [
            "stun",
            "slow",
            "blind"
          ]
        },
        {
          "n": "Corrente do Fim",
          "d": "A corrente que termina absolutamente tudo.",
          "dmg": "6d8+2",
          "chi": 6,
          "status": [
            "stun",
            "slow",
            "blind",
            "root"
          ]
        },
        {
          "n": "As Correntes do Mundo",
          "d": "As correntes do mundo convergem num ponto imparavel.",
          "dmg": "7d8",
          "chi": 7,
          "status": [
            "stun",
            "slow",
            "blind",
            "root"
          ]
        }
      ]
    },
    "Esquiva Perfeita": {
      "tier": 3,
      "pos": "def",
      "reqs": {
        "AGI": 7,
        "PER": 5
      },
      "req": [
        "Esfera de Ar",
        "Passo do Vento"
      ],
      "effect": {
        "type": "def",
        "desc": "50% chance de esquivar completamente qualquer ataque por 3 turnos.",
        "dice": "1d6",
        "chi": 3,
        "status": [
          "shield"
        ]
      },
      "attacks": [
        {
          "n": "Contra-Vento",
          "d": "Ao esquivar, giro de vento atinge de flanco o atacante.",
          "dmg": "2d6",
          "chi": 3,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Redemoinho de Esquiva",
          "d": "Esquiva que cria redemoinho — empurra o atacante.",
          "dmg": "2d6+2",
          "chi": 3,
          "status": [
            "slow"
          ]
        },
        {
          "n": "Vento que Responde",
          "d": "O vento retorna o ataque em triplo ao atacante.",
          "dmg": "3d6+2",
          "chi": 4,
          "status": [
            "slow",
            "stun"
          ]
        },
        {
          "n": "O Ar Contra-Ataca",
          "d": "O ar ao redor ataca o inimigo que errou.",
          "dmg": "4d6",
          "chi": 4,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "n": "Forma do Vazio",
          "d": "O corpo torna-se ar — o contra e absolutamente devastador.",
          "dmg": "5d6",
          "chi": 5,
          "status": [
            "stun",
            "blind",
            "slow"
          ]
        },
        {
          "n": "Vento Vindicativo",
          "d": "O vento lembra cada ataque e responde com forca.",
          "dmg": "4d8",
          "chi": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Esquiva do Fantasma",
          "d": "O dobrador e mais vento do que corpo.",
          "dmg": "5d6+2",
          "chi": 5,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "n": "Contra-Tempestade",
          "d": "A esquiva desencadeia uma tempestade de resposta.",
          "dmg": "5d8",
          "chi": 6,
          "status": [
            "stun",
            "slow",
            "blind"
          ]
        },
        {
          "n": "Forma do Vento",
          "d": "O dobrador e o vento — exatamente a mesma coisa.",
          "dmg": "6d6+2",
          "chi": 6,
          "status": [
            "stun",
            "blind",
            "slow"
          ]
        },
        {
          "n": "Esquiva Absoluta",
          "d": "A esquiva perfeita — o inimigo simplesmente nunca acerta.",
          "dmg": "6d8",
          "chi": 7,
          "status": [
            "stun",
            "blind",
            "slow",
            "fear"
          ]
        }
      ]
    },
    "Voo Livre": {
      "tier": 4,
      "pos": "off",
      "reqs": {
        "AGI": 10,
        "CHI": 8,
        "ESP": 8
      },
      "req": [
        "Correntes Globais",
        "Esquiva Perfeita"
      ],
      "effect": {
        "type": "special",
        "desc": "Voo permanente sem custo. Imune a ataques de chao e root.",
        "dice": "2d6",
        "chi": 4,
        "status": [
          "shield",
          "regen"
        ]
      },
      "attacks": [
        {
          "n": "Ataque do Voo Livre",
          "d": "Ataca em picado do voo livre — absolutamente imparavel.",
          "dmg": "3d8+2",
          "chi": 4,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "n": "Mergulho da Liberdade",
          "d": "Mergulho de voo livre — colisao absolutamente catastrofica.",
          "dmg": "4d8",
          "chi": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Golpe do Vento Livre",
          "d": "O vento livre guia o golpe mais perfeito possivel.",
          "dmg": "4d8+3",
          "chi": 5,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "n": "Voo e Ataque",
          "d": "Voa e ataca simultaneamente sem qualquer perda.",
          "dmg": "5d8",
          "chi": 6,
          "status": [
            "stun",
            "slow",
            "blind"
          ]
        },
        {
          "n": "Livre como o Vento",
          "d": "Um ser que voa livremente ataca completamente livre.",
          "dmg": "5d8+4",
          "chi": 6,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Altitude Maxima e Ataque",
          "d": "A altitude maxima e usada como arma definitiva.",
          "dmg": "6d8",
          "chi": 7,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "n": "Voo Absoluto",
          "d": "O voo absoluto transforma-se em ataque absoluto.",
          "dmg": "6d8+4",
          "chi": 7,
          "status": [
            "stun",
            "slow",
            "blind"
          ]
        },
        {
          "n": "O Horizonte Ataca",
          "d": "O horizonte inteiro e o campo de ataque do dobrador.",
          "dmg": "7d8",
          "chi": 8,
          "status": [
            "stun",
            "slow",
            "blind",
            "root"
          ]
        },
        {
          "n": "A Liberdade e Letal",
          "d": "A liberdade do voo e a arma mais poderosa de todas.",
          "dmg": "8d8",
          "chi": 8,
          "status": [
            "stun",
            "slow",
            "blind"
          ]
        },
        {
          "n": "Voo do Avatar",
          "d": "Quando o Avatar voa livremente — nada no mundo o pode parar.",
          "dmg": "10d8",
          "chi": 10,
          "status": [
            "stun",
            "slow",
            "blind",
            "root",
            "fear"
          ]
        }
      ]
    },
    "Escudo de Ar": {
      "tier": 1,
      "pos": "def",
      "reqs": {
        "FOR": 2,
        "RES": 1
      },
      "req": [],
      "effect": {
        "type": "def",
        "desc": "Deflecte ataque fisico ou projétil. Pode redirecionar o ataque para outro alvo.",
        "dice": "2d6",
        "chi": 2,
        "status": [
          "shield"
        ]
      },
      "attacks": [
        {
          "n": "Escudo Ativo",
          "d": "O escudo de ar redireciona o ataque para o proprio inimigo.",
          "dmg": "2d6+2",
          "chi": 2,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Escudo Explosivo",
          "d": "O escudo explode ao ser partido — onda de vento radial.",
          "dmg": "3d6",
          "chi": 3,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Escudo Giratorio",
          "d": "O escudo gira e corta tudo que se aproxima.",
          "dmg": "3d6+2",
          "chi": 3,
          "status": [
            "slow",
            "bleed"
          ]
        },
        {
          "n": "Escudo de Impacto",
          "d": "O escudo usa a forca do ataque para contra-atacar.",
          "dmg": "3d8",
          "chi": 4,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Escudo Expansivo",
          "d": "O escudo expande para cobrir area ao redor.",
          "dmg": "4d6",
          "chi": 4,
          "status": [
            "slow",
            "stun"
          ]
        },
        {
          "n": "Redemoinho Defensivo",
          "d": "Um redemoinho que bloqueia e ataca em simultaneo.",
          "dmg": "4d6+2",
          "chi": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Escudo do Vento",
          "d": "O vento protege e ataca completamente em simultaneo.",
          "dmg": "4d8",
          "chi": 5,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "n": "Barreira Absoluta",
          "d": "Uma barreira de vento que protege area ao redor.",
          "dmg": "5d6",
          "chi": 5,
          "status": [
            "stun",
            "slow",
            "shield"
          ]
        },
        {
          "n": "Escudo Solar",
          "d": "Escudo de vento que amplifica os proprios ataques.",
          "dmg": "5d8",
          "chi": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Vento Protetor",
          "d": "O vento protege e destroi em absolutamente igual medida.",
          "dmg": "6d6+2",
          "chi": 6,
          "status": [
            "stun",
            "slow",
            "blind"
          ]
        }
      ]
    }
  },
  "none": {
    "Resistencia Mental": {
      "tier": 2,
      "pos": "pass",
      "reqs": {
        "RES": 3,
        "ESP": 3
      },
      "req": [
        "Meditacao Marcial"
      ],
      "effect": {
        "type": "restore",
        "desc": "Imune a fear e manipulacao emocional. Restaura 1d4 chi ao sofrer dano psiquico.",
        "dice": "1d4",
        "chi": 0,
        "status": [
          "regen",
          "shield"
        ]
      },
      "attacks": [
        {
          "n": "Vontade de Aco",
          "d": "A resistencia mental converte-se em forca fisica pura.",
          "dmg": "2d6+2",
          "chi": 3,
          "status": []
        },
        {
          "n": "Determinacao",
          "d": "A determinacao inabalavel amplifica cada golpe dado.",
          "dmg": "3d6",
          "chi": 3,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Forca Interior",
          "d": "A forca interior extravasa em ataque devastador.",
          "dmg": "3d6+2",
          "chi": 3,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Resolucao",
          "d": "A resolucao inabalavel guia o ataque com precisao.",
          "dmg": "3d8",
          "chi": 4,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Mentalmente Invencivel",
          "d": "A mente invencivel torna o corpo invencivel.",
          "dmg": "4d6",
          "chi": 4,
          "status": [
            "stun",
            "fear"
          ]
        },
        {
          "n": "Resistencia Ativa",
          "d": "A resistencia mental amplifica cada ataque fisico.",
          "dmg": "4d6+2",
          "chi": 4,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Foco Absoluto",
          "d": "Foco absoluto concentrado numa unica acao devastadora.",
          "dmg": "4d8",
          "chi": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Mente de Batalha",
          "d": "A mente de batalha em pleno potencial maximal.",
          "dmg": "5d6",
          "chi": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Determinacao Suprema",
          "d": "A determinacao mais profunda possivel.",
          "dmg": "5d8",
          "chi": 5,
          "status": [
            "stun",
            "fear",
            "slow"
          ]
        },
        {
          "n": "Inquebravel",
          "d": "Nada quebra esta mente — e nada sobrevive a este golpe.",
          "dmg": "6d8",
          "chi": 6,
          "status": [
            "stun",
            "fear",
            "slow",
            "blind"
          ]
        }
      ]
    },
    "Visao de Combate": {
      "tier": 2,
      "pos": "def",
      "reqs": {
        "PER": 4,
        "ESP": 3
      },
      "req": [
        "Leitura de Chi"
      ],
      "effect": {
        "type": "utility",
        "desc": "Por 2 turnos, todas as acoes inimigas ficam previsiveis. +3 a defesa.",
        "dice": "1d6",
        "chi": 2,
        "status": [
          "shield"
        ]
      },
      "attacks": [
        {
          "n": "Ataque Previsto",
          "d": "Ataca o ponto exato onde o inimigo nao pode defender.",
          "dmg": "2d6+2",
          "chi": 2,
          "status": []
        },
        {
          "n": "Golpe na Brecha",
          "d": "Identifica e ataca a brecha perfeita do inimigo.",
          "dmg": "3d6",
          "chi": 3,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Sequencia Calculada",
          "d": "Calcula a sequencia perfeita de golpes com antecedencia.",
          "dmg": "3d6+2",
          "chi": 3,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Golpe do Futuro",
          "d": "Ataca onde o inimigo vai estar, nao onde esta agora.",
          "dmg": "3d8",
          "chi": 4,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Visao Total",
          "d": "Ve o campo inteiro de batalha com visao completamente ampla.",
          "dmg": "4d6",
          "chi": 4,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "n": "Brecha Critica",
          "d": "A brecha mais vulneravel — dano critico garantido.",
          "dmg": "4d6+2",
          "chi": 4,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Antecipacao Perfeita",
          "d": "Antecipa e responde antes que o inimigo aja.",
          "dmg": "4d8",
          "chi": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Golpe Inevitavel",
          "d": "Um golpe que simplesmente nao pode ser evitado.",
          "dmg": "5d6",
          "chi": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Visao do Mestre",
          "d": "A visao completa de um mestre de combate.",
          "dmg": "5d8",
          "chi": 5,
          "status": [
            "stun",
            "slow",
            "blind"
          ]
        },
        {
          "n": "O Tempo Para",
          "d": "O tempo para para o guerreiro — ataque absolutamente perfeito.",
          "dmg": "6d8",
          "chi": 6,
          "status": [
            "stun",
            "slow",
            "blind",
            "fear"
          ]
        }
      ]
    },
    "Chi Bloqueado": {
      "tier": 3,
      "pos": "pass",
      "reqs": {
        "PER": 5,
        "ESP": 5,
        "RES": 3
      },
      "req": [
        "Resistencia Mental",
        "Leitura de Chi"
      ],
      "effect": {
        "type": "utility",
        "desc": "Detecta dobra de sangue antes de ser afetado. Chance de resistir a efeitos de chi.",
        "dice": "1d8",
        "chi": 2,
        "status": [
          "shield",
          "regen"
        ]
      },
      "attacks": [
        {
          "n": "Golpe de Chi",
          "d": "Usa o conhecimento do chi para atacar pontos vitais.",
          "dmg": "2d8+2",
          "chi": 3,
          "status": [
            "silence"
          ]
        },
        {
          "n": "Toque Informado",
          "d": "Usa o conhecimento do chi para bloquear o inimigo.",
          "dmg": "3d6",
          "chi": 3,
          "status": [
            "silence",
            "slow"
          ]
        },
        {
          "n": "Golpe de Saber",
          "d": "O saber sobre o chi guia um golpe absolutamente certeiro.",
          "dmg": "3d6+2",
          "chi": 4,
          "status": [
            "silence",
            "stun"
          ]
        },
        {
          "n": "Bloqueio Informado",
          "d": "Usa o conhecimento para bloquear e responder.",
          "dmg": "3d8",
          "chi": 4,
          "status": [
            "silence",
            "stun"
          ]
        },
        {
          "n": "Chi Contra Chi",
          "d": "Usa o proprio chi do inimigo completamente contra ele.",
          "dmg": "4d6",
          "chi": 4,
          "status": [
            "silence",
            "stun",
            "slow"
          ]
        },
        {
          "n": "Golpe no Fluxo",
          "d": "Ataca diretamente o fluxo de chi do inimigo.",
          "dmg": "4d6+2",
          "chi": 5,
          "status": [
            "silence",
            "stun"
          ]
        },
        {
          "n": "Interrupcao do Chi",
          "d": "Interrompe completamente o fluxo de chi.",
          "dmg": "4d8",
          "chi": 5,
          "status": [
            "silence",
            "stun",
            "slow"
          ]
        },
        {
          "n": "Dominancia de Chi",
          "d": "Demonstra dominancia absoluta sobre o chi do inimigo.",
          "dmg": "5d6",
          "chi": 5,
          "status": [
            "silence",
            "stun",
            "fear"
          ]
        },
        {
          "n": "Chi Aniquilado",
          "d": "O chi do inimigo e aniquilado temporariamente.",
          "dmg": "5d8",
          "chi": 6,
          "status": [
            "silence",
            "stun",
            "fear",
            "slow"
          ]
        },
        {
          "n": "O Chi Nao Mente",
          "d": "O conhecimento absoluto do chi — ataque definitivo.",
          "dmg": "6d8",
          "chi": 6,
          "status": [
            "silence",
            "stun",
            "fear",
            "slow",
            "blind"
          ]
        }
      ]
    },
    "Serenidade do Kyoshi": {
      "tier": 3,
      "pos": "pass",
      "reqs": {
        "PER": 6,
        "ESP": 6,
        "RES": 4
      },
      "req": [
        "Visao de Combate",
        "Resistencia Mental"
      ],
      "effect": {
        "type": "restore",
        "desc": "Imune a todos os efeitos psiquicos. Restaura 1d6 chi apos dano critico.",
        "dice": "1d6",
        "chi": 0,
        "status": [
          "regen",
          "shield"
        ]
      },
      "attacks": [
        {
          "n": "Serenidade em Ataque",
          "d": "A serenidade absoluta amplifica completamente cada golpe.",
          "dmg": "2d8+2",
          "chi": 4,
          "status": []
        },
        {
          "n": "Calma Devastadora",
          "d": "A calma absoluta e a arma mais poderosa de todas.",
          "dmg": "3d8",
          "chi": 4,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Tranquilidade Letal",
          "d": "Tranquilidade que se converte em letalidade pura.",
          "dmg": "3d8+2",
          "chi": 4,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Paz Armada",
          "d": "Carrega a paz dentro de si e usa-a como arma mortal.",
          "dmg": "4d8",
          "chi": 5,
          "status": [
            "stun",
            "fear"
          ]
        },
        {
          "n": "Serenidade Suprema",
          "d": "A serenidade suprema em estado de combate total.",
          "dmg": "4d8+2",
          "chi": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Calma que Mata",
          "d": "A calma que mata absolutamente sem hesitacao.",
          "dmg": "5d8",
          "chi": 5,
          "status": [
            "stun",
            "fear"
          ]
        },
        {
          "n": "Tranquilidade Absoluta",
          "d": "A tranquilidade mais profunda usada em combate.",
          "dmg": "5d8+2",
          "chi": 6,
          "status": [
            "stun",
            "fear",
            "slow"
          ]
        },
        {
          "n": "O Kyoshi em Paz",
          "d": "Quando Kyoshi encontrou a paz — era completamente invencivel.",
          "dmg": "6d8",
          "chi": 6,
          "status": [
            "stun",
            "fear",
            "slow"
          ]
        },
        {
          "n": "Serenidade de Avancar",
          "d": "A serenidade que permite avancar sem qualquer hesitacao.",
          "dmg": "7d8",
          "chi": 7,
          "status": [
            "stun",
            "fear",
            "slow",
            "blind"
          ]
        },
        {
          "n": "Paz Absoluta em Batalha",
          "d": "A paz e a batalha sao absolutamente a mesma coisa.",
          "dmg": "8d8",
          "chi": 7,
          "status": [
            "stun",
            "fear",
            "slow",
            "blind"
          ]
        }
      ]
    },
    "Espirito Inquebravel": {
      "tier": 4,
      "pos": "pass",
      "reqs": {
        "PER": 8,
        "ESP": 9,
        "RES": 6
      },
      "req": [
        "Chi Bloqueado",
        "Serenidade do Kyoshi"
      ],
      "effect": {
        "type": "special",
        "desc": "Uma vez por combate, levanta-se com 1 PV ao cair. Restaura 3d6 chi a aliados proximos.",
        "dice": "3d6",
        "chi": 5,
        "status": [
          "regen",
          "shield"
        ]
      },
      "attacks": [
        {
          "n": "O Espirito Levanta",
          "d": "O espirito inquebravel manifesta-se em ataque puro.",
          "dmg": "3d8+2",
          "chi": 5,
          "status": [
            "stun",
            "fear"
          ]
        },
        {
          "n": "Forca do Espirito",
          "d": "A forca do espirito inquebravel em toda a sua gloria.",
          "dmg": "4d8",
          "chi": 5,
          "status": [
            "stun",
            "fear"
          ]
        },
        {
          "n": "Golpe do Sobrevivente",
          "d": "O golpe definitivo de quem nunca foi derrotado.",
          "dmg": "4d8+4",
          "chi": 6,
          "status": [
            "stun",
            "fear"
          ]
        },
        {
          "n": "O Inquebravel Ataca",
          "d": "Quando o inquebravel ataca — absolutamente ninguem resiste.",
          "dmg": "5d8",
          "chi": 6,
          "status": [
            "stun",
            "fear",
            "slow"
          ]
        },
        {
          "n": "Furia do Espirito",
          "d": "A furia de um espirito que nunca rendeu a ninguem.",
          "dmg": "5d8+3",
          "chi": 7,
          "status": [
            "stun",
            "fear"
          ]
        },
        {
          "n": "Inspiracao em Ataque",
          "d": "A inspiracao pura transforma-se em ataque devastador.",
          "dmg": "6d8",
          "chi": 7,
          "status": [
            "stun",
            "fear",
            "blind"
          ]
        },
        {
          "n": "Lenda em Vida",
          "d": "O ataque de uma lenda viva que ainda caminha.",
          "dmg": "6d8+4",
          "chi": 8,
          "status": [
            "stun",
            "fear",
            "slow"
          ]
        },
        {
          "n": "Espirito Imortal",
          "d": "O espirito imortal em forma de golpe absoluto.",
          "dmg": "7d8",
          "chi": 8,
          "status": [
            "stun",
            "fear",
            "slow",
            "blind"
          ]
        },
        {
          "n": "O Ultimo a Cair",
          "d": "O ultimo guerreiro a cair — e que nunca cai.",
          "dmg": "8d8",
          "chi": 9,
          "status": [
            "stun",
            "fear",
            "slow",
            "blind"
          ]
        },
        {
          "n": "Ninguem Me Derrota",
          "d": "A declaracao e o golpe final de um espirito inquebravel.",
          "dmg": "10d8+4",
          "chi": 10,
          "status": [
            "stun",
            "fear",
            "slow",
            "blind",
            "root"
          ]
        }
      ]
    },
    "Corrida de Telhados": {
      "tier": 2,
      "pos": "off",
      "reqs": {
        "AGI": 4,
        "PER": 2
      },
      "req": [
        "Parkour Urbano"
      ],
      "effect": {
        "type": "move",
        "desc": "Velocidade triplicada em terreno urbano. Pode atacar durante o movimento sem penalidade.",
        "dice": "-",
        "chi": 2,
        "status": []
      },
      "attacks": [
        {
          "n": "Ataque em Corrida",
          "d": "Ataca enquanto corre a maxima velocidade.",
          "dmg": "2d6+2",
          "chi": 2,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Golpe do Telhado",
          "d": "Salta de um telhado em ataque de cima.",
          "dmg": "3d6",
          "chi": 3,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Corrida de Ataque",
          "d": "A corrida inteira e um ataque continuo e imparavel.",
          "dmg": "3d6+2",
          "chi": 3,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Emboscada de Cima",
          "d": "Salta de posicao elevada em emboscada total.",
          "dmg": "3d8",
          "chi": 4,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "n": "Sequencia em Corrida",
          "d": "Uma sequencia de golpes durante a corrida.",
          "dmg": "4d6",
          "chi": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Velocidade e Violencia",
          "d": "A velocidade amplifica completamente a violencia do golpe.",
          "dmg": "4d6+2",
          "chi": 4,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Telhado como Arena",
          "d": "Usa o ambiente como extensao natural do combate.",
          "dmg": "4d8",
          "chi": 5,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "n": "Corrida Letal",
          "d": "Uma corrida que termina inevitavelmente em golpe letal.",
          "dmg": "5d6",
          "chi": 5,
          "status": [
            "stun",
            "slow",
            "blind"
          ]
        },
        {
          "n": "Parkour Assassino",
          "d": "O parkour usado como arte marcial de alto nivel.",
          "dmg": "5d8",
          "chi": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "O Telhado e Meu",
          "d": "Dominio absoluto do combate em ambiente vertical.",
          "dmg": "6d8",
          "chi": 6,
          "status": [
            "stun",
            "slow",
            "blind"
          ]
        }
      ]
    },
    "Cables e Ganchos": {
      "tier": 2,
      "pos": "off",
      "reqs": {
        "AGI": 4,
        "PER": 2
      },
      "req": [
        "Acrobacia"
      ],
      "effect": {
        "type": "move",
        "desc": "Alcance de 30m para ganchos. Reposiciona instantaneamente. Pode usar como arma 1d6.",
        "dice": "-",
        "chi": 2,
        "status": []
      },
      "attacks": [
        {
          "n": "Chicote de Cabo",
          "d": "O cabo e usado como chicote de longa distancia preciso.",
          "dmg": "1d8+2",
          "chi": 2,
          "status": []
        },
        {
          "n": "Gancho em Ataque",
          "d": "O gancho e lancado como arma de impacto pesado.",
          "dmg": "2d6",
          "chi": 2,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Cabo Cortante",
          "d": "O cabo e afiado e absolutamente cortante.",
          "dmg": "2d6+2",
          "chi": 3,
          "status": [
            "bleed"
          ]
        },
        {
          "n": "Balanco de Ataque",
          "d": "O balanco no cabo culmina num ataque devastador.",
          "dmg": "2d8",
          "chi": 3,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Laco de Cable",
          "d": "O cabo envolve e prende o inimigo completamente.",
          "dmg": "3d6",
          "chi": 3,
          "status": [
            "root",
            "slow"
          ]
        },
        {
          "n": "Estrangulamento",
          "d": "O cabo envolve o pescoco do inimigo.",
          "dmg": "3d6+2",
          "chi": 4,
          "status": [
            "slow",
            "stun"
          ]
        },
        {
          "n": "Cabo em Sequencia",
          "d": "O cabo permite uma sequencia de golpes coordenados.",
          "dmg": "3d8",
          "chi": 4,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Ataque de Gancho",
          "d": "O gancho e usado para puxar e atacar simultaneamente.",
          "dmg": "4d6",
          "chi": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Rede de Cables",
          "d": "Uma rede de cables que aprisiona o inimigo completamente.",
          "dmg": "4d6+2",
          "chi": 5,
          "status": [
            "root",
            "stun"
          ]
        },
        {
          "n": "Master de Cables",
          "d": "O mestre dos cables controla completamente o campo.",
          "dmg": "4d8",
          "chi": 5,
          "status": [
            "root",
            "stun",
            "slow",
            "blind"
          ]
        }
      ]
    },
    "Evasao Extrema": {
      "tier": 3,
      "pos": "def",
      "reqs": {
        "AGI": 7,
        "PER": 5
      },
      "req": [
        "Cables e Ganchos",
        "Corrida de Telhados"
      ],
      "effect": {
        "type": "def",
        "desc": "50% chance de esquivar qualquer ataque por 3 turnos. Inclui ataques de dobra.",
        "dice": "1d6",
        "chi": 3,
        "status": [
          "shield"
        ]
      },
      "attacks": [
        {
          "n": "Esquiva e Golpe",
          "d": "Esquiva de ataque e responde imediatamente.",
          "dmg": "2d6+2",
          "chi": 2,
          "status": []
        },
        {
          "n": "Contra-Evasao",
          "d": "Usa o impeto do inimigo para amplificar o contra-ataque.",
          "dmg": "3d6",
          "chi": 3,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Fantasma",
          "d": "Esquiva tao rapida que o inimigo nao percebe o que aconteceu.",
          "dmg": "3d6+2",
          "chi": 3,
          "status": [
            "blind"
          ]
        },
        {
          "n": "Sombra Assassina",
          "d": "Desaparece e ataca da cobertura com precisao absoluta.",
          "dmg": "4d6",
          "chi": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "O Vento Nao Pode Ser Apanhado",
          "d": "Evasao total — o inimigo nunca consegue acertar.",
          "dmg": "4d6+3",
          "chi": 5,
          "status": [
            "stun",
            "fear"
          ]
        },
        {
          "n": "Esquiva Dupla",
          "d": "Esquiva dois ataques e responde a ambos simultaneamente.",
          "dmg": "4d8",
          "chi": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Fantasma Duplo",
          "d": "Duplica a velocidade de evasao — dois fantasmas.",
          "dmg": "5d6",
          "chi": 5,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "n": "Danca de Esquivas",
          "d": "Uma danca de esquivas e contra-ataques fluida.",
          "dmg": "5d6+2",
          "chi": 6,
          "status": [
            "stun",
            "blind",
            "slow"
          ]
        },
        {
          "n": "Evasao Suprema",
          "d": "A evasao mais avancada absolutamente possivel.",
          "dmg": "5d8",
          "chi": 6,
          "status": [
            "stun",
            "blind",
            "slow"
          ]
        },
        {
          "n": "O Intocavel",
          "d": "Absolutamente ninguem consegue tocar este guerreiro.",
          "dmg": "6d8",
          "chi": 7,
          "status": [
            "stun",
            "blind",
            "slow",
            "fear"
          ]
        }
      ]
    },
    "Sombra": {
      "tier": 2,
      "pos": "off",
      "reqs": {
        "AGI": 4,
        "PER": 3
      },
      "req": [
        "Parkour Urbano"
      ],
      "effect": {
        "type": "move",
        "desc": "Invisivel enquanto em movimento silencioso. Primeiro ataque e sempre critico.",
        "dice": "-",
        "chi": 2,
        "status": []
      },
      "attacks": [
        {
          "n": "Golpe da Sombra",
          "d": "Um golpe que vem da escuridao total sem aviso.",
          "dmg": "2d6+2",
          "chi": 3,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "n": "Assassino Silencioso",
          "d": "Um assassino que nao faz absolutamente nenhum som.",
          "dmg": "3d6",
          "chi": 3,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "n": "Sombra Atacante",
          "d": "A propria sombra ataca — confunde completamente.",
          "dmg": "3d6+2",
          "chi": 4,
          "status": [
            "blind",
            "stun"
          ]
        },
        {
          "n": "Golpe Inaudivel",
          "d": "Um golpe que nao faz absolutamente nenhum som.",
          "dmg": "3d8",
          "chi": 4,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "n": "Sombra Dupla",
          "d": "O guerreiro divide-se em duas sombras independentes.",
          "dmg": "4d6",
          "chi": 4,
          "status": [
            "blind",
            "stun"
          ]
        },
        {
          "n": "Escuridao Armada",
          "d": "A escuridao e uma arma nas suas maos.",
          "dmg": "4d6+2",
          "chi": 5,
          "status": [
            "blind",
            "stun",
            "fear"
          ]
        },
        {
          "n": "Sombra Letal",
          "d": "A sombra letal que absolutamente ninguem ve chegar.",
          "dmg": "4d8",
          "chi": 5,
          "status": [
            "stun",
            "blind",
            "fear"
          ]
        },
        {
          "n": "Noite Personificada",
          "d": "O guerreiro e a noite — invisivel e absolutamente letal.",
          "dmg": "5d6+2",
          "chi": 5,
          "status": [
            "blind",
            "stun",
            "fear"
          ]
        },
        {
          "n": "Sombra Absoluta",
          "d": "A sombra absoluta — ninguem ve nem ouve absolutamente nada.",
          "dmg": "5d8",
          "chi": 6,
          "status": [
            "blind",
            "stun",
            "fear",
            "slow"
          ]
        },
        {
          "n": "O Escuro que Mata",
          "d": "O escuro personificado em golpe mortal e definitivo.",
          "dmg": "6d8",
          "chi": 6,
          "status": [
            "blind",
            "stun",
            "fear",
            "slow",
            "root"
          ]
        }
      ]
    },
    "Forca Bruta": {
      "tier": 1,
      "pos": "pass",
      "reqs": {
        "FOR": 3,
        "RES": 1
      },
      "req": [],
      "effect": {
        "type": "buff",
        "desc": "Passivo permanente: +1d4 a todo o dano fisico. Resistencia a knockback. Remove slow fisico.",
        "dice": "1d4",
        "chi": 0,
        "status": [
          "shield"
        ]
      },
      "attacks": [
        {
          "n": "Soco da Forca",
          "d": "Um soco com toda a forca bruta treinada ao maximo.",
          "dmg": "2d6+2",
          "chi": 1,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Pancada",
          "d": "Uma pancada com todo o peso do corpo concentrado.",
          "dmg": "2d8",
          "chi": 2,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Esmagamento",
          "d": "Esmaga o inimigo com forca bruta absolutamente pura.",
          "dmg": "3d6",
          "chi": 2,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Investida",
          "d": "Investe com todo o peso e forca contra o inimigo.",
          "dmg": "3d6+2",
          "chi": 3,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Pancada Pesada",
          "d": "Uma pancada que equivale ao impacto de um martelo.",
          "dmg": "3d8",
          "chi": 3,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Golpe de Gigante",
          "d": "O golpe de um gigante — absolutamente imparavel.",
          "dmg": "4d6",
          "chi": 3,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Esmagamento Total",
          "d": "Esmaga tudo com forca sobre-humana pura.",
          "dmg": "4d6+2",
          "chi": 4,
          "status": [
            "stun",
            "root"
          ]
        },
        {
          "n": "Pancada Devastadora",
          "d": "Uma pancada completamente devastadora de forca pura.",
          "dmg": "4d8",
          "chi": 4,
          "status": [
            "stun",
            "slow",
            "root"
          ]
        },
        {
          "n": "Golpe Maximo",
          "d": "O golpe mais forte que um ser humano consegue dar.",
          "dmg": "5d6+2",
          "chi": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Forca Pura",
          "d": "A forca bruta em estado absolutamente puro.",
          "dmg": "5d8",
          "chi": 5,
          "status": [
            "stun",
            "slow",
            "root"
          ]
        }
      ]
    },
    "Armadura Pesada": {
      "tier": 2,
      "pos": "def",
      "reqs": {
        "FOR": 4,
        "RES": 3
      },
      "req": [
        "Forca Bruta"
      ],
      "effect": {
        "type": "def",
        "desc": "Reduz dano fisico em 3d4. Imune a slow e knockback. Dura o combate inteiro.",
        "dice": "3d4",
        "chi": 0,
        "status": [
          "shield"
        ]
      },
      "attacks": [
        {
          "n": "Rampage de Armadura",
          "d": "A armadura pesada e usada diretamente como arma.",
          "dmg": "2d8+2",
          "chi": 2,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Batida de Escudo",
          "d": "O escudo da armadura como arma de impacto pesado.",
          "dmg": "3d6",
          "chi": 3,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Pressao da Armadura",
          "d": "A armadura pesada esmaga o inimigo completamente.",
          "dmg": "3d6+2",
          "chi": 3,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Carga Blindada",
          "d": "Uma carga com toda a armadura pesada a maxima velocidade.",
          "dmg": "3d8",
          "chi": 4,
          "status": [
            "stun",
            "root"
          ]
        },
        {
          "n": "Escudo Ofensivo",
          "d": "O escudo usado ativamente para atacar e empurrar.",
          "dmg": "4d6",
          "chi": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "n": "Armadura em Furia",
          "d": "A armadura inteira e uma arma de destruicao.",
          "dmg": "4d6+2",
          "chi": 4,
          "status": [
            "stun"
          ]
        },
        {
          "n": "Pancada Blindada",
          "d": "Uma pancada com a armadura no alvo.",
          "dmg": "4d8",
          "chi": 5,
          "status": [
            "stun",
            "slow",
            "root"
          ]
        },
        {
          "n": "Carga de Ferro",
          "d": "Uma carga de ferro puro que absolutamente nada para.",
          "dmg": "5d6",
          "chi": 5,
          "status": [
            "stun",
            "root"
          ]
        },
        {
          "n": "Armadura de Batalha",
          "d": "A armadura usada como instrumento de guerra puro.",
          "dmg": "5d8",
          "chi": 5,
          "status": [
            "stun",
            "slow",
            "root"
          ]
        },
        {
          "n": "O Muralha de Ferro",
          "d": "O guerreiro torna-se uma muralha de ferro.",
          "dmg": "6d8",
          "chi": 6,
          "status": [
            "stun",
            "root",
            "slow",
            "blind"
          ]
        }
      ]
    }
  }
};

const CHAR_SYSTEM = {
  "stats_formulas": {
    "vida": {
      "formula": "10 + (nivel * 8) + (FOR * 3)",
      "desc": "Pontos de vida fisicos. Chega a 0 = inconsciente."
    },
    "espirito": {
      "formula": "8 + (nivel * 6) + (ESP * 3)",
      "desc": "Pontos de vida espirituais. Afetados por ataques psiquicos, dobra de sangue, medo e silencio."
    },
    "chi": {
      "formula": "6 + (nivel * 5) + (CHI * 4)",
      "desc": "Pontos de energia para usar habilidades e ataques."
    },
    "defesa": {
      "formula": "(RES * 2) + (nivel * 1)",
      "desc": "Reduz dano fisico recebido. Subtraido do dano bruto."
    },
    "esquiva": {
      "formula": "(AGI * 2) + (PER * 1)",
      "desc": "Valor alvo para o inimigo acertar. Ataque inimigo (1d20 + bonus) deve superar este valor."
    }
  },
  "combat_sequence": [
    "1. Inimigo rola 1d20 + bonus de ataque vs Esquiva do jogador",
    "2. Se falha: 0 dano",
    "3. Se acerta: calcula dano bruto (dado da arma/habilidade)",
    "4. Escudos de habilidade ativa absorvem primeiro",
    "5. Defesa base absorve o resto",
    "6. Dano restante vai para PV (fisico) ou PE (espiritual/psiquico)"
  ],
  "chi_recovery": {
    "em_repouso": "1d4 + (CHI / 3 arredondado) por turno fora de combate",
    "meditacao": "Dobra o valor de recuperacao. Requer turno completo sem agir.",
    "habilidades_de_restauro": "Algumas habilidades de Espiritualidade restauram chi — ver cada habilidade."
  },
  "sub_skill_slots": {
    "desc": "Slots globais que permitem ativar sub-habilidades dentro de habilidades desbloqueadas.",
    "slots_base_nivel_1": 2,
    "slots_por_nivel": 0.333,
    "nota_calculo": "Ganhas +1 slot a cada 3 niveis. Total base ao nivel 40 = 15 slots.",
    "cap_por_habilidade": 3,
    "cap_desc": "Cada habilidade desbloqueada pode ter no maximo 3 sub-habilidades ativas em simultaneo.",
    "pergaminhos": {
      "efeito": "Cada Pergaminho de Dobra encontrado adiciona +1 slot bonus permanente.",
      "ultrapassa_cap": true,
      "ultrapassa_cap_desc": "Pergaminhos sao a UNICA forma de ter mais de 3 sub-habilidades ativas numa mesma habilidade.",
      "exemplo": "Com 2 pergaminhos investidos na habilidade Jato Focado, podes ter 5 sub-habilidades ativas nessa habilidade."
    },
    "tabela_slots_por_nivel": [
      {
        "nivel": 1,
        "slots_base": 2
      },
      {
        "nivel": 3,
        "slots_base": 3
      },
      {
        "nivel": 6,
        "slots_base": 4
      },
      {
        "nivel": 9,
        "slots_base": 5
      },
      {
        "nivel": 12,
        "slots_base": 6
      },
      {
        "nivel": 15,
        "slots_base": 7
      },
      {
        "nivel": 18,
        "slots_base": 8
      },
      {
        "nivel": 21,
        "slots_base": 9
      },
      {
        "nivel": 24,
        "slots_base": 10
      },
      {
        "nivel": 27,
        "slots_base": 11
      },
      {
        "nivel": 30,
        "slots_base": 12
      },
      {
        "nivel": 33,
        "slots_base": 13
      },
      {
        "nivel": 36,
        "slots_base": 14
      },
      {
        "nivel": 40,
        "slots_base": 15
      }
    ]
  },
  "xp_system": {
    "nivel_maximo": 40,
    "pontos_por_nivel": 3,
    "formula_xp": "Math.round(200 * Math.pow(nivel - 1, 1.55))",
    "marcos": {
      "5": "Aprendiz",
      "10": "Discipulo",
      "15": "Praticante",
      "20": "Veterano",
      "25": "Especialista",
      "30": "Mestre",
      "35": "Grande Mestre",
      "40": "Lendario"
    }
  },
  "status_effects": {
    "burn": {
      "label": "Queimadura",
      "desc": "Causa 1d4 dano no inicio de cada turno. Dura 2 turnos. Removido por agua ou gelo."
    },
    "freeze": {
      "label": "Congelamento",
      "desc": "Reduz velocidade de iniciativa a metade. Dura 2 turnos. Removido por fogo ou calor."
    },
    "shock": {
      "label": "Choque",
      "desc": "Causa 1d4 dano e tem 25% de chance de saltar para aliados com armadura metalica. Dura 1 turno."
    },
    "blind": {
      "label": "Cegueira",
      "desc": "Todos os ataques tem 50% de chance de falhar automaticamente. Dura 2 turnos."
    },
    "slow": {
      "label": "Lentidao",
      "desc": "Reduz Esquiva em 4 e velocidade de movimento a metade. Dura 2 turnos."
    },
    "stun": {
      "label": "Atordoado",
      "desc": "Perde a proxima acao. Defesa reduzida em 5 enquanto atordoado."
    },
    "poison": {
      "label": "Veneno",
      "desc": "Causa 1d6 dano no inicio de cada turno durante 3 turnos. Nao e removido por fogo ou agua."
    },
    "root": {
      "label": "Enraizado",
      "desc": "Impossivel mover-se. Esquiva reduzida para 0. Dura 2 turnos ou ate ser libertado."
    },
    "silence": {
      "label": "Silencio",
      "desc": "Nao pode usar habilidades de dobra. Pode continuar a atacar fisicamente. Dura 2 turnos."
    },
    "fear": {
      "label": "Medo",
      "desc": "Reduz todos os ataques em 1d4 de dano. Chance de 20% de fugir em vez de atacar. Dura 2 turnos."
    },
    "bleed": {
      "label": "Sangramento",
      "desc": "Causa 1d4 dano no inicio de cada turno. Dura 3 turnos. Nao e removido por fogo."
    },
    "regen": {
      "label": "Regeneracao",
      "desc": "Restaura 1d4 PV ou Chi no inicio de cada turno durante a duracao indicada."
    },
    "shield": {
      "label": "Escudo",
      "desc": "Absorve a proxima fonte de dano antes dos PV serem afetados. Valor indicado na habilidade."
    }
  }
};

const ITEMS_DB = {
  "armas": {
    "genericas": [
      {
        "id": "arma_001",
        "nome": "Espada Curta",
        "tipo": "arma",
        "dano": "1d6+2",
        "peso": 2,
        "preco": 50,
        "desc": "Lamina de aco padrao. Rapida e fiavel.",
        "bonus_ataque": 1,
        "requisito": {
          "FOR": 2
        }
      },
      {
        "id": "arma_002",
        "nome": "Lanca",
        "tipo": "arma",
        "dano": "1d8+1",
        "peso": 3,
        "preco": 40,
        "desc": "Alcance superior. Permite atacar a 2m de distancia.",
        "bonus_ataque": 0,
        "alcance": 2,
        "requisito": {
          "FOR": 2
        }
      },
      {
        "id": "arma_003",
        "nome": "Arco Composto",
        "tipo": "arma",
        "dano": "1d8",
        "peso": 2,
        "preco": 80,
        "desc": "Alcance de 30m. Exige municao.",
        "bonus_ataque": 2,
        "alcance": 30,
        "requisito": {
          "AGI": 3,
          "PER": 2
        }
      },
      {
        "id": "arma_004",
        "nome": "Maca de Guerra",
        "tipo": "arma",
        "dano": "2d6",
        "peso": 5,
        "preco": 70,
        "desc": "Lenta mas devastadora. +2 dano contra armaduras pesadas.",
        "bonus_ataque": 0,
        "requisito": {
          "FOR": 4
        }
      },
      {
        "id": "arma_005",
        "nome": "Adagas Duplas",
        "tipo": "arma",
        "dano": "1d4+1",
        "peso": 1,
        "preco": 60,
        "desc": "Dois ataques por turno. Ideal para combatentes ageis.",
        "bonus_ataque": 2,
        "ataques_por_turno": 2,
        "requisito": {
          "AGI": 3
        }
      },
      {
        "id": "arma_006",
        "nome": "Katana",
        "tipo": "arma",
        "dano": "1d10+1",
        "peso": 2,
        "preco": 150,
        "desc": "Lamina refinada de alta qualidade. Critico em 19-20.",
        "bonus_ataque": 1,
        "critico": "19-20",
        "requisito": {
          "AGI": 3,
          "PER": 2
        }
      },
      {
        "id": "arma_007",
        "nome": "Martelo de Guerra",
        "tipo": "arma",
        "dano": "2d8",
        "peso": 7,
        "preco": 120,
        "desc": "Esmagador. Causa stun em 18-20 no d20.",
        "bonus_ataque": 0,
        "efeito_especial": "stun em 18-20",
        "requisito": {
          "FOR": 6
        }
      },
      {
        "id": "arma_008",
        "nome": "Besta Pesada",
        "tipo": "arma",
        "dano": "2d6+2",
        "peso": 4,
        "preco": 200,
        "desc": "Alcance de 40m. Perfura armaduras leves.",
        "bonus_ataque": 2,
        "alcance": 40,
        "requisito": {
          "FOR": 3,
          "PER": 3
        }
      }
    ],
    "fogo": [
      {
        "id": "arma_f001",
        "nome": "Lanca de Cobre Vulcanico",
        "tipo": "arma",
        "dano": "1d10+3",
        "peso": 3,
        "preco": 300,
        "desc": "Forjada em magma. Ataques causam burn automaticamente.",
        "bonus_ataque": 1,
        "efeito_especial": "burn automatico",
        "elemento": "fogo",
        "requisito": {
          "FOR": 4,
          "CHI": 2
        }
      },
      {
        "id": "arma_f002",
        "nome": "Katana do Dragao",
        "tipo": "arma",
        "dano": "1d12+2",
        "peso": 2,
        "preco": 500,
        "desc": "Lamina que aquece ao ser empunhada. +2 dados de dano em posicao ofensiva.",
        "bonus_ataque": 2,
        "efeito_especial": "+2 dados em posicao ofensiva",
        "elemento": "fogo",
        "requisito": {
          "FOR": 3,
          "AGI": 4,
          "CHI": 3
        }
      },
      {
        "id": "arma_f003",
        "nome": "Chicote de Chamas",
        "tipo": "arma",
        "dano": "1d8+2",
        "peso": 1,
        "preco": 250,
        "desc": "Alcance de 5m. Causa burn e tem chance de desarmar.",
        "bonus_ataque": 1,
        "alcance": 5,
        "efeito_especial": "burn + chance de desarmar",
        "elemento": "fogo",
        "requisito": {
          "AGI": 3,
          "CHI": 2
        }
      }
    ],
    "agua": [
      {
        "id": "arma_w001",
        "nome": "Espada de Gelo Eterno",
        "tipo": "arma",
        "dano": "1d10+2",
        "peso": 2,
        "preco": 400,
        "desc": "Nunca derrete. Ataques causam freeze em 17-20.",
        "bonus_ataque": 1,
        "efeito_especial": "freeze em 17-20",
        "elemento": "agua",
        "requisito": {
          "AGI": 3,
          "CHI": 3
        }
      },
      {
        "id": "arma_w002",
        "nome": "Chicote de Agua Viva",
        "tipo": "arma",
        "dano": "1d8+1",
        "peso": 1,
        "preco": 280,
        "desc": "Alcance de 6m. Pode imobilizar e tem bonus a lua cheia.",
        "bonus_ataque": 2,
        "alcance": 6,
        "efeito_especial": "slow + bonus na lua cheia",
        "elemento": "agua",
        "requisito": {
          "AGI": 4,
          "CHI": 2
        }
      },
      {
        "id": "arma_w003",
        "nome": "Tridente do Oceano",
        "tipo": "arma",
        "dano": "2d6+2",
        "peso": 4,
        "preco": 350,
        "desc": "Amplifica ondas de agua. +1 dado de dano em combate aquatico.",
        "bonus_ataque": 1,
        "efeito_especial": "+1 dado em combate aquatico",
        "elemento": "agua",
        "requisito": {
          "FOR": 4,
          "CHI": 3
        }
      }
    ],
    "terra": [
      {
        "id": "arma_e001",
        "nome": "Maca de Granito Vivo",
        "tipo": "arma",
        "dano": "2d8+3",
        "peso": 8,
        "preco": 350,
        "desc": "A pedra obedece. Pode dobrar a propria arma em combate.",
        "bonus_ataque": 1,
        "efeito_especial": "pode ser dobrada pelo utilizador",
        "elemento": "terra",
        "requisito": {
          "FOR": 6,
          "CHI": 2
        }
      },
      {
        "id": "arma_e002",
        "nome": "Luvas de Metal Vivo",
        "tipo": "arma",
        "dano": "1d8+2",
        "peso": 2,
        "preco": 400,
        "desc": "Amplificam dobra de metal. +2 dados a ataques de metal.",
        "bonus_ataque": 2,
        "efeito_especial": "+2 dados em ataques de metal",
        "elemento": "terra",
        "requisito": {
          "FOR": 3,
          "PER": 4,
          "CHI": 3
        }
      },
      {
        "id": "arma_e003",
        "nome": "Lanca de Obsidiana",
        "tipo": "arma",
        "dano": "1d12+2",
        "peso": 3,
        "preco": 320,
        "desc": "Perfura qualquer armadura. Ignora 5 pontos de Defesa.",
        "bonus_ataque": 1,
        "efeito_especial": "ignora 5 pontos de Defesa",
        "elemento": "terra",
        "requisito": {
          "FOR": 5,
          "PER": 3
        }
      }
    ],
    "ar": [
      {
        "id": "arma_a001",
        "nome": "Bastao Planador Reforçado",
        "tipo": "arma",
        "dano": "1d8+2",
        "peso": 1,
        "preco": 300,
        "desc": "Permite voo com planador e serve de arma versatil.",
        "bonus_ataque": 2,
        "efeito_especial": "permite voo com planador",
        "elemento": "ar",
        "requisito": {
          "AGI": 3,
          "CHI": 2
        }
      },
      {
        "id": "arma_a002",
        "nome": "Leque de Vento Cortante",
        "tipo": "arma",
        "dano": "1d6+3",
        "peso": 1,
        "preco": 280,
        "desc": "Amplifica laminas de vento. +1 dado a ataques de ar preciso.",
        "bonus_ataque": 2,
        "efeito_especial": "+1 dado em laminas de vento",
        "elemento": "ar",
        "requisito": {
          "AGI": 4,
          "PER": 3
        }
      },
      {
        "id": "arma_a003",
        "nome": "Cetro dos Ventos",
        "tipo": "arma",
        "dano": "1d10+1",
        "peso": 2,
        "preco": 450,
        "desc": "Amplifica todos os ataques de ar. +2 Chi por turno durante combate.",
        "bonus_ataque": 1,
        "efeito_especial": "+2 Chi por turno em combate",
        "elemento": "ar",
        "requisito": {
          "CHI": 4,
          "ESP": 3
        }
      }
    ],
    "sem_dobra": [
      {
        "id": "arma_n001",
        "nome": "Shuriken Mecanico",
        "tipo": "arma",
        "dano": "1d6+2",
        "peso": 0.5,
        "preco": 200,
        "desc": "Regressa automaticamente ao utilizador. Pode bloquear dobra ao acertar.",
        "bonus_ataque": 3,
        "efeito_especial": "regressa automaticamente + chance de silence",
        "requisito": {
          "AGI": 4,
          "PER": 3
        }
      },
      {
        "id": "arma_n002",
        "nome": "Braço Mecanico de Combate",
        "tipo": "arma",
        "dano": "2d8+3",
        "peso": 5,
        "preco": 600,
        "desc": "Amplifica forca bruta. +1d6 a todos os ataques corpo a corpo.",
        "bonus_ataque": 2,
        "efeito_especial": "+1d6 corpo a corpo",
        "requisito": {
          "FOR": 5,
          "PER": 2
        }
      },
      {
        "id": "arma_n003",
        "nome": "Canhao de Ombro Portatil",
        "tipo": "arma",
        "dano": "3d8",
        "peso": 6,
        "preco": 800,
        "desc": "Alcance de 50m. 3 cargas por combate. Causa stun no alvo.",
        "bonus_ataque": 1,
        "alcance": 50,
        "cargas": 3,
        "efeito_especial": "stun",
        "requisito": {
          "FOR": 4,
          "PER": 4
        }
      }
    ]
  },
  "armaduras": {
    "genericas": [
      {
        "id": "arm_001",
        "nome": "Armadura de Couro",
        "tipo": "armadura",
        "bonus_defesa": 4,
        "penalidade_esquiva": 0,
        "peso": 4,
        "preco": 80,
        "desc": "Leve e flexivel. Sem penalidade a esquiva.",
        "requisito": {}
      },
      {
        "id": "arm_002",
        "nome": "Cota de Malha",
        "tipo": "armadura",
        "bonus_defesa": 8,
        "penalidade_esquiva": 2,
        "peso": 8,
        "preco": 200,
        "desc": "Boa protecao. Penalidade de -2 a Esquiva.",
        "requisito": {
          "FOR": 3
        }
      },
      {
        "id": "arm_003",
        "nome": "Armadura de Placas",
        "tipo": "armadura",
        "bonus_defesa": 14,
        "penalidade_esquiva": 5,
        "peso": 15,
        "preco": 500,
        "desc": "Maxima protecao. Penalidade de -5 a Esquiva.",
        "requisito": {
          "FOR": 5
        }
      },
      {
        "id": "arm_004",
        "nome": "Vestes de Combate",
        "tipo": "armadura",
        "bonus_defesa": 2,
        "penalidade_esquiva": 0,
        "peso": 1,
        "preco": 50,
        "desc": "Quase sem peso. Bonus de +1 a Esquiva.",
        "bonus_esquiva": 1,
        "requisito": {}
      },
      {
        "id": "arm_005",
        "nome": "Escudo de Madeira",
        "tipo": "armadura",
        "subtipo": "escudo",
        "bonus_defesa": 3,
        "penalidade_esquiva": 0,
        "peso": 3,
        "preco": 40,
        "desc": "Bloqueia um ataque por turno gratuitamente.",
        "efeito_especial": "bloqueia 1 ataque por turno sem custo",
        "requisito": {
          "FOR": 2
        }
      },
      {
        "id": "arm_006",
        "nome": "Escudo de Aco",
        "tipo": "armadura",
        "subtipo": "escudo",
        "bonus_defesa": 6,
        "penalidade_esquiva": 1,
        "peso": 5,
        "preco": 150,
        "desc": "Bloqueia um ataque por turno. Pode ser usado para bater.",
        "efeito_especial": "bloqueia 1 ataque + 1d6 dano de pancada",
        "requisito": {
          "FOR": 3
        }
      }
    ],
    "fogo": [
      {
        "id": "arm_f001",
        "nome": "Armadura de Escamas do Dragao",
        "tipo": "armadura",
        "bonus_defesa": 12,
        "penalidade_esquiva": 1,
        "peso": 6,
        "preco": 800,
        "desc": "Resistente ao fogo. Ataques de fogo contra o utilizador causam metade do dano.",
        "efeito_especial": "resistencia ao fogo (50%)",
        "elemento": "fogo",
        "requisito": {
          "FOR": 4,
          "CHI": 2
        }
      },
      {
        "id": "arm_f002",
        "nome": "Manto do Inferno",
        "tipo": "armadura",
        "bonus_defesa": 6,
        "penalidade_esquiva": 0,
        "peso": 2,
        "preco": 600,
        "desc": "Inimigos que atacam corpo a corpo sofrem 1d4 burn automaticamente.",
        "efeito_especial": "burn 1d4 em ataques corpo a corpo",
        "elemento": "fogo",
        "requisito": {
          "CHI": 3
        }
      }
    ],
    "agua": [
      {
        "id": "arm_w001",
        "nome": "Armadura de Gelo Polar",
        "tipo": "armadura",
        "bonus_defesa": 10,
        "penalidade_esquiva": 2,
        "peso": 5,
        "preco": 700,
        "desc": "Ataques de gelo contra o utilizador causam metade do dano. Inimigos proximos sofrem freeze.",
        "efeito_especial": "resistencia ao gelo (50%) + freeze passivo",
        "elemento": "agua",
        "requisito": {
          "RES": 3,
          "CHI": 3
        }
      },
      {
        "id": "arm_w002",
        "nome": "Vestes da Lua",
        "tipo": "armadura",
        "bonus_defesa": 5,
        "penalidade_esquiva": 0,
        "peso": 1,
        "preco": 550,
        "desc": "Amplifica cura. +1d4 a todas as habilidades de cura por agua.",
        "efeito_especial": "+1d4 a cura por agua",
        "elemento": "agua",
        "requisito": {
          "ESP": 3,
          "CHI": 3
        }
      }
    ],
    "terra": [
      {
        "id": "arm_e001",
        "nome": "Armadura de Granito Vivo",
        "tipo": "armadura",
        "bonus_defesa": 16,
        "penalidade_esquiva": 4,
        "peso": 20,
        "preco": 900,
        "desc": "A mais resistente de todas. O utilizador pode dobrar a propria armadura.",
        "efeito_especial": "pode ser dobrada pelo utilizador + imune a knockback",
        "elemento": "terra",
        "requisito": {
          "FOR": 6,
          "RES": 5,
          "CHI": 2
        }
      },
      {
        "id": "arm_e002",
        "nome": "Vestes do Mineiro",
        "tipo": "armadura",
        "bonus_defesa": 7,
        "penalidade_esquiva": 0,
        "peso": 3,
        "preco": 400,
        "desc": "Amplifica visao sismica. Raio de detecao aumentado em 5m.",
        "efeito_especial": "+5m a visao sismica",
        "elemento": "terra",
        "requisito": {
          "PER": 3,
          "ESP": 2
        }
      }
    ],
    "ar": [
      {
        "id": "arm_a001",
        "nome": "Vestes do Monge do Vento",
        "tipo": "armadura",
        "bonus_defesa": 3,
        "bonus_esquiva": 4,
        "penalidade_esquiva": 0,
        "peso": 1,
        "preco": 500,
        "desc": "Maxima mobilidade. +4 a Esquiva. Perfeita para estilos evasivos.",
        "efeito_especial": "+4 Esquiva",
        "elemento": "ar",
        "requisito": {
          "AGI": 4,
          "ESP": 2
        }
      },
      {
        "id": "arm_a002",
        "nome": "Manto das Correntes",
        "tipo": "armadura",
        "bonus_defesa": 4,
        "bonus_esquiva": 2,
        "penalidade_esquiva": 0,
        "peso": 1,
        "preco": 650,
        "desc": "Amplifica voo. Duração de todas as habilidades de voo aumenta em 2 turnos.",
        "efeito_especial": "+2 turnos a habilidades de voo",
        "elemento": "ar",
        "requisito": {
          "AGI": 5,
          "CHI": 3
        }
      }
    ],
    "sem_dobra": [
      {
        "id": "arm_n001",
        "nome": "Armadura Mecanica Completa",
        "tipo": "armadura",
        "bonus_defesa": 14,
        "penalidade_esquiva": 3,
        "peso": 12,
        "preco": 1000,
        "desc": "Tecnologia avancada. Inclui jetpack integrado e amplificadores de forca.",
        "efeito_especial": "jetpack integrado + forca amplificada (+2 dano)",
        "requisito": {
          "FOR": 4,
          "PER": 3
        }
      },
      {
        "id": "arm_n002",
        "nome": "Colete de Chi Blocking",
        "tipo": "armadura",
        "bonus_defesa": 5,
        "penalidade_esquiva": 0,
        "peso": 2,
        "preco": 700,
        "desc": "Protege os pontos de pressao do utilizador. Resistencia a Chi Blocking e dobra de sangue.",
        "efeito_especial": "resistencia a Chi Blocking e dobra de sangue",
        "requisito": {
          "PER": 4,
          "ESP": 3
        }
      }
    ]
  },
  "consumiveis": {
    "genericos": [
      {
        "id": "con_001",
        "nome": "Pocao de Vida",
        "tipo": "consumivel",
        "efeito": "Restaura 3d8+5 PV",
        "peso": 0.5,
        "preco": 50,
        "usos": 1,
        "desc": "Ervas medicinais concentradas. Efeito imediato."
      },
      {
        "id": "con_002",
        "nome": "Pocao de Vida Superior",
        "tipo": "consumivel",
        "efeito": "Restaura 6d8+10 PV",
        "peso": 0.5,
        "preco": 150,
        "usos": 1,
        "desc": "Formula refinada de grande potencia."
      },
      {
        "id": "con_003",
        "nome": "Antidoto Universal",
        "tipo": "consumivel",
        "efeito": "Remove veneno, burn, freeze e sangramento",
        "peso": 0.5,
        "preco": 80,
        "usos": 1,
        "desc": "Remove todos os efeitos de status fisicos."
      },
      {
        "id": "con_004",
        "nome": "Erva de Espirito",
        "tipo": "consumivel",
        "efeito": "Restaura 3d6+4 PE",
        "peso": 0.5,
        "preco": 70,
        "usos": 1,
        "desc": "Remove medo e silencio. Restaura a ligacao espiritual."
      },
      {
        "id": "con_005",
        "nome": "Racao de Combate",
        "tipo": "consumivel",
        "efeito": "+3 a todos os atributos por 3 turnos",
        "peso": 0.5,
        "preco": 100,
        "usos": 1,
        "desc": "Estimulante natural que amplifica temporariamente o corpo."
      },
      {
        "id": "con_006",
        "nome": "Oleo de Arma",
        "tipo": "consumivel",
        "efeito": "+1d4 de dano a proximos 5 ataques",
        "peso": 0.3,
        "preco": 40,
        "usos": 1,
        "desc": "Aplicado na arma. Amplifica o corte ou impacto."
      },
      {
        "id": "con_007",
        "nome": "Fumaca de Cobertura",
        "tipo": "consumivel",
        "efeito": "Cria zona de fumaca por 3 turnos — blind a todos na area",
        "peso": 0.3,
        "preco": 60,
        "usos": 1,
        "desc": "Granada de fumaca. Util para escapar ou emboscar."
      },
      {
        "id": "con_008",
        "nome": "Pedra de Afiar",
        "tipo": "consumivel",
        "efeito": "+2 bonus de ataque por 1 combate",
        "peso": 0.2,
        "preco": 30,
        "usos": 1,
        "desc": "Afia a arma antes de combate."
      }
    ],
    "fogo": [
      {
        "id": "con_f001",
        "nome": "Oleo Vulcanico",
        "tipo": "consumivel",
        "efeito": "Ataques de fogo causam +1d6 burn por 5 turnos",
        "peso": 0.5,
        "preco": 120,
        "usos": 1,
        "elemento": "fogo",
        "desc": "Extrato de magma. Amplifica calor das tecnicas de fogo."
      },
      {
        "id": "con_f002",
        "nome": "Cristal Solar",
        "tipo": "consumivel",
        "efeito": "Duplica o poder de todas as habilidades de fogo por 2 turnos",
        "peso": 0.3,
        "preco": 300,
        "usos": 1,
        "elemento": "fogo",
        "desc": "Canaliza a energia do sol diretamente. Extremamente raro."
      },
      {
        "id": "con_f003",
        "nome": "Pocao de Chi Ardente",
        "tipo": "consumivel",
        "efeito": "Restaura 4d8 Chi imediatamente",
        "peso": 0.5,
        "preco": 200,
        "usos": 1,
        "elemento": "fogo",
        "desc": "Concentrado de chi ígneo. Muito eficaz para dobadores de fogo."
      }
    ],
    "agua": [
      {
        "id": "con_w001",
        "nome": "Agua da Lua Cheia",
        "tipo": "consumivel",
        "efeito": "Efeito de lua cheia por 3 turnos — todos os ataques de agua ganham +2 dados",
        "peso": 0.5,
        "preco": 250,
        "usos": 1,
        "elemento": "agua",
        "desc": "Recolhida durante a lua cheia. Extremamente poderosa."
      },
      {
        "id": "con_w002",
        "nome": "Essencia de Oceano",
        "tipo": "consumivel",
        "efeito": "Restaura 5d8 PV e remove todos os efeitos de status",
        "peso": 0.5,
        "preco": 280,
        "usos": 1,
        "elemento": "agua",
        "desc": "Agua pura das profundezas do oceano. Cura profunda."
      },
      {
        "id": "con_w003",
        "nome": "Pocao de Chi Glacial",
        "tipo": "consumivel",
        "efeito": "Restaura 4d8 Chi imediatamente",
        "peso": 0.5,
        "preco": 200,
        "usos": 1,
        "elemento": "agua",
        "desc": "Concentrado de chi aquatico. Muito eficaz para dobadores de agua."
      }
    ],
    "terra": [
      {
        "id": "con_e001",
        "nome": "Po de Pedra Viva",
        "tipo": "consumivel",
        "efeito": "+6 Defesa por 4 turnos",
        "peso": 0.3,
        "preco": 180,
        "usos": 1,
        "elemento": "terra",
        "desc": "Po de rocha viva. Reforça a pele como pedra."
      },
      {
        "id": "con_e002",
        "nome": "Cristal Sismico",
        "tipo": "consumivel",
        "efeito": "Visao sismica ativada por 5 turnos mesmo sem a habilidade",
        "peso": 0.3,
        "preco": 220,
        "usos": 1,
        "elemento": "terra",
        "desc": "Vibra em sintonia com o solo. Qualquer dobador de terra pode usa-lo."
      },
      {
        "id": "con_e003",
        "nome": "Pocao de Chi de Pedra",
        "tipo": "consumivel",
        "efeito": "Restaura 4d8 Chi imediatamente",
        "peso": 0.5,
        "preco": 200,
        "usos": 1,
        "elemento": "terra",
        "desc": "Concentrado de chi da terra. Muito eficaz para dobadores de terra."
      }
    ],
    "ar": [
      {
        "id": "con_a001",
        "nome": "Essencia das Correntes",
        "tipo": "consumivel",
        "efeito": "+5 Esquiva e velocidade dobrada por 3 turnos",
        "peso": 0.2,
        "preco": 200,
        "usos": 1,
        "elemento": "ar",
        "desc": "Concentrado das correntes globais. Torna o utilizador incrivelmente rapido."
      },
      {
        "id": "con_a002",
        "nome": "Incenso de Meditacao",
        "tipo": "consumivel",
        "efeito": "Restaura 3d8 Chi e PE imediatamente",
        "peso": 0.3,
        "preco": 180,
        "usos": 1,
        "elemento": "ar",
        "desc": "Usado pelos monges do Templo do Ar. Equilibra chi e espirito."
      },
      {
        "id": "con_a003",
        "nome": "Pocao de Chi do Vento",
        "tipo": "consumivel",
        "efeito": "Restaura 4d8 Chi imediatamente",
        "peso": 0.5,
        "preco": 200,
        "usos": 1,
        "elemento": "ar",
        "desc": "Concentrado de chi aereo. Muito eficaz para dobadores de ar."
      }
    ],
    "sem_dobra": [
      {
        "id": "con_n001",
        "nome": "Seringa de Chi Blocker",
        "tipo": "consumivel",
        "efeito": "Aplica silence a um alvo por 3 turnos (a distancia)",
        "peso": 0.2,
        "preco": 300,
        "usos": 1,
        "desc": "Composto que bloqueia o chi ao ser injetado. Muito eficaz contra dobadores."
      },
      {
        "id": "con_n002",
        "nome": "Granada Eletromagnetica",
        "tipo": "consumivel",
        "efeito": "Causa shock a todos num raio de 3m e desativa tecnologia por 2 turnos",
        "peso": 0.5,
        "preco": 250,
        "usos": 1,
        "desc": "Tecnologia de vanguarda. Desarma e atordoa."
      },
      {
        "id": "con_n003",
        "nome": "Estimulante de Combate",
        "tipo": "consumivel",
        "efeito": "+4 FOR e AGI por 3 turnos. Apos o efeito, slow por 1 turno.",
        "peso": 0.3,
        "preco": 180,
        "usos": 1,
        "desc": "Amplifica o corpo ao limite. Ha um custo."
      }
    ]
  },
  "especiais": {
    "pergaminhos": [
      {
        "id": "per_001",
        "nome": "Pergaminho de Fogo",
        "tipo": "pergaminho",
        "elemento": "fogo",
        "efeito": "+1 slot de sub-habilidade (pode ultrapassar cap de 3 por habilidade)",
        "peso": 0.1,
        "preco": 500,
        "desc": "Ensinamentos antigos de um Mestre do Fogo. Expande a capacidade de dominar tecnicas.",
        "raridade": "raro"
      },
      {
        "id": "per_002",
        "nome": "Pergaminho de Agua",
        "tipo": "pergaminho",
        "elemento": "agua",
        "efeito": "+1 slot de sub-habilidade (pode ultrapassar cap de 3 por habilidade)",
        "peso": 0.1,
        "preco": 500,
        "desc": "Sabedoria da Tribo da Agua do Sul. Expande o dominio das tecnicas aquaticas.",
        "raridade": "raro"
      },
      {
        "id": "per_003",
        "nome": "Pergaminho de Terra",
        "tipo": "pergaminho",
        "elemento": "terra",
        "efeito": "+1 slot de sub-habilidade (pode ultrapassar cap de 3 por habilidade)",
        "peso": 0.1,
        "preco": 500,
        "desc": "Tecnicas gravadas nas paredes de Omashu. Permite dominar mais tecnicas de terra.",
        "raridade": "raro"
      },
      {
        "id": "per_004",
        "nome": "Pergaminho de Ar",
        "tipo": "pergaminho",
        "elemento": "ar",
        "efeito": "+1 slot de sub-habilidade (pode ultrapassar cap de 3 por habilidade)",
        "peso": 0.1,
        "preco": 500,
        "desc": "Preservado pelos Nomades do Ar. Expande a ligacao com o vento.",
        "raridade": "raro"
      },
      {
        "id": "per_005",
        "nome": "Pergaminho do Guerreiro",
        "tipo": "pergaminho",
        "elemento": "nenhum",
        "efeito": "+1 slot de sub-habilidade (pode ultrapassar cap de 3 por habilidade)",
        "peso": 0.1,
        "preco": 500,
        "desc": "Tecnicas dos Guerreiros de Kyoshi. Qualquer personagem pode usar.",
        "raridade": "raro"
      },
      {
        "id": "per_006",
        "nome": "Pergaminho Lendario",
        "tipo": "pergaminho",
        "elemento": "qualquer",
        "efeito": "+2 slots de sub-habilidade (pode ultrapassar cap de 3 por habilidade)",
        "peso": 0.1,
        "preco": 1500,
        "desc": "Escrito pelo proprio Avatar. Expansao massiva de capacidade. Extremamente raro.",
        "raridade": "lendario"
      }
    ],
    "artefactos": [
      {
        "id": "art_001",
        "nome": "Amuleto do Chi",
        "tipo": "artefacto",
        "efeito": "+10 Chi maximo permanentemente",
        "peso": 0.1,
        "preco": 800,
        "desc": "Um cristal que ressoa com o chi do utilizador.",
        "requisito": {
          "CHI": 3
        }
      },
      {
        "id": "art_002",
        "nome": "Colar do Guerreiro",
        "tipo": "artefacto",
        "efeito": "+15 Vida maxima permanentemente",
        "peso": 0.1,
        "preco": 700,
        "desc": "Feito com dente de leao-urso. Representa a forca do guerreiro.",
        "requisito": {}
      },
      {
        "id": "art_003",
        "nome": "Anel do Espirito",
        "tipo": "artefacto",
        "efeito": "+12 Espirito maximo permanentemente. +1 Recuperacao de Chi em meditacao.",
        "peso": 0.1,
        "preco": 900,
        "desc": "Forjado na fronteira entre o mundo fisico e espiritual.",
        "requisito": {
          "ESP": 3
        }
      },
      {
        "id": "art_004",
        "nome": "Bracelete da Agilidade",
        "tipo": "artefacto",
        "efeito": "+3 Esquiva permanentemente",
        "peso": 0.1,
        "preco": 750,
        "desc": "Feito com penas de aguia da montanha. Leveza incomparavel.",
        "requisito": {
          "AGI": 3
        }
      },
      {
        "id": "art_005",
        "nome": "Cinturao da Resistencia",
        "tipo": "artefacto",
        "efeito": "+4 Defesa permanentemente. Imune a knockback.",
        "peso": 0.3,
        "preco": 850,
        "desc": "Couro de rinoceronte. Absorcao de impacto extrema.",
        "requisito": {
          "FOR": 3,
          "RES": 3
        }
      },
      {
        "id": "art_006",
        "nome": "Mascara do Vidente",
        "tipo": "artefacto",
        "efeito": "+3 Percepcao permanentemente. Imune a blind.",
        "peso": 0.2,
        "preco": 1000,
        "desc": "Mascara usada pelos Videntes do Norte. Permite ver atraves de ilusoes.",
        "requisito": {
          "PER": 4,
          "ESP": 2
        }
      },
      {
        "id": "art_007",
        "nome": "Pedra do Avatar",
        "tipo": "artefacto",
        "efeito": "+1 a todos os atributos permanentemente",
        "peso": 0.2,
        "preco": 5000,
        "desc": "Um fragmento da Pedra do Avatar. Extremamente raro. Concede equilíbrio perfeito.",
        "raridade": "lendario",
        "requisito": {
          "nivel": 30
        }
      },
      {
        "id": "art_008",
        "nome": "Talisma do Equilíbrio",
        "tipo": "artefacto",
        "efeito": "Recupera 1 Chi por turno passivamente em combate",
        "peso": 0.1,
        "preco": 1200,
        "desc": "Equilibra o fluxo de chi do utilizador.",
        "requisito": {
          "CHI": 4,
          "ESP": 3
        }
      }
    ]
  }
};

const SHEET_SCHEMA = {
  "identidade": {
    "nome": "",
    "elemento": "",
    "subclasse": "",
    "nivel": 1,
    "xp_atual": 0,
    "xp_proximo_nivel": 300,
    "marco": "Aprendiz",
    "idade": "",
    "origem": "",
    "afiliacao": "",
    "aparencia": "",
    "background": "",
    "motivacao": "",
    "fraquezas": "",
    "objetivos": ""
  },
  "atributos": {
    "FOR": 0,
    "AGI": 0,
    "CHI": 0,
    "PER": 0,
    "RES": 0,
    "ESP": 0,
    "pontos_disponiveis": 3
  },
  "stats_derivados": {
    "vida_maxima": 0,
    "vida_atual": 0,
    "espirito_maximo": 0,
    "espirito_atual": 0,
    "chi_maximo": 0,
    "chi_atual": 0,
    "defesa": 0,
    "esquiva": 0
  },
  "slots": {
    "slots_base": 2,
    "slots_pergaminhos": 0,
    "slots_totais": 2,
    "slots_usados": 0
  },
  "habilidades_ativas": [],
  "sub_habilidades_ativas": [],
  "inventario": {
    "armas": [],
    "armaduras": [],
    "consumiveis": [],
    "especiais": [],
    "pergaminhos": [],
    "ouro": 0,
    "carga_atual": 0,
    "carga_maxima": 0
  },
  "status_ativos": [],
  "notas_sessao": "",
  "historico_batalhas": [],
  "aliados": [],
  "inimigos_conhecidos": []
};

// ============================================================
// FUNCAO DE PATCH — aplica os dados em falta no ELEMS do v5
// Chama applyPatch() apos o ELEMS estar definido no widget v5
// ============================================================
function applyPatch() {
  const EL_MAP = {fire:'fire',water:'water',earth:'earth',air:'air',none:'none'};
  for (const [elem, skills] of Object.entries(AVATAR_PATCH)) {
    if (!ELEMS[elem]) continue;
    for (const [skillName, patchData] of Object.entries(skills)) {
      // Find skill in all cats
      for (const cat of ['spirit','agility','precise','brute']) {
        const catSkills = ELEMS[elem].cats[cat];
        if (!catSkills) continue;
        const skill = catSkills.find(s => s.n === skillName);
        if (!skill) continue;
        // Apply attacks if missing or incomplete
        if (patchData.attacks && (!skill.attacks || skill.attacks.length < patchData.attacks.length)) {
          skill.attacks = patchData.attacks;
        }
        // Apply effect if missing
        if (patchData.effect && !skill.effect) {
          skill.effect = patchData.effect;
        }
        // Apply pos if missing
        if (patchData.pos && !skill.pos) {
          skill.pos = patchData.pos;
        }
      }
    }
  }
  console.log('[Avatar RPG Patch v6] Patch aplicado com sucesso.');
}

// ============================================================
// STATS DERIVADOS — chama calcStats(attrs, nivel) para obter stats
// ============================================================
function calcStats(attrs, nivel) {
  return {
    vida:     10 + (nivel * 8)  + (attrs.FOR * 3),
    espirito: 8  + (nivel * 6)  + (attrs.ESP * 3),
    chi:      6  + (nivel * 5)  + (attrs.CHI * 4),
    defesa:   (attrs.RES * 2)   + nivel,
    esquiva:  (attrs.AGI * 2)   + attrs.PER
  };
}

// ============================================================
// SLOTS DE SUB-HABILIDADES
// ============================================================
function calcSlots(nivel, pergaminhos) {
  const base = 2 + Math.floor(nivel / 3);
  return base + (pergaminhos || 0);
}

// Slots maximos por habilidade (sem pergaminhos)
const SLOT_CAP_POR_HABILIDADE = 3;

// ============================================================
// XP
// ============================================================
function xpParaNivel(lv) {
  if (lv <= 1) return 0;
  return Math.round(200 * Math.pow(lv - 1, 1.55));
}
function xpAcumulado(lv) {
  let acc = 0;
  for (let i = 2; i <= lv; i++) acc += xpParaNivel(i);
  return acc;
}

// ============================================================
// INSTRUCOES DE INTEGRACAO
// ============================================================
/*
  1. Inclui este ficheiro ANTES do fecho </script> do widget v5.
  2. No final do script do v5, adiciona a linha: applyPatch();
  3. Para calcular os stats de um personagem:
       const stats = calcStats(G.attrs, G.level);
  4. Para calcular slots disponiveis:
       const slots = calcSlots(G.level, pergaminhosDoPersonagem);
  5. Os itens estao em ITEMS_DB — usa ITEMS_DB.armas, ITEMS_DB.armaduras, etc.
  6. O schema da ficha esta em SHEET_SCHEMA.
  7. Os status effects estao em CHAR_SYSTEM.status_effects.
  8. A sequencia de combate esta em CHAR_SYSTEM.combat_sequence.
*/
