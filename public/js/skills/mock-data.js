/**
 * Mock Skill Data
 * Generated from Initial Files JSON data + handcrafted additions
 */

export const MOCK_SKILLS = {
  "fire": [
    {
      "id": "escudo-de-calor",
      "name": "Escudo de Calor",
      "element": "fire",
      "category": "brute",
      "tier": 1,
      "description": "Deflecte um ataque e causa 2d6 burn ao atacante. Inimigos corpo a corpo sofrem burn. Dura 1 turno.",
      "position": "def",
      "requirements": {
        "FOR": 2,
        "RES": 1
      },
      "prerequisites": [],
      "attacks": [
        {
          "name": "Barreira Flamejante",
          "description": "Ergue uma muralha de chamas entre o dobrador e o inimigo.",
          "damage": "2d6",
          "chi_cost": 2,
          "status": [
            "burn"
          ]
        },
        {
          "name": "Escudo Pulsante",
          "description": "O escudo pulsa e queima quem toca.",
          "damage": "2d6+2",
          "chi_cost": 3,
          "status": [
            "burn",
            "stun"
          ]
        },
        {
          "name": "Muro de Calor",
          "description": "O escudo expande em muro de 3m de largura.",
          "damage": "3d6",
          "chi_cost": 3,
          "status": [
            "burn",
            "slow"
          ]
        },
        {
          "name": "Escudo Explosivo",
          "description": "Ao ser partido, explode em nova de fogo radial.",
          "damage": "3d6+2",
          "chi_cost": 4,
          "status": [
            "burn",
            "stun"
          ]
        },
        {
          "name": "Capa de Chamas",
          "description": "O dobrador fica envolto em chamas — tudo que toca queima.",
          "damage": "2d8+2",
          "chi_cost": 4,
          "status": [
            "burn"
          ]
        },
        {
          "name": "Escudo do Dragao",
          "description": "O escudo tem a forma da cabeca de um dragao — ameacador e intimidante.",
          "damage": "3d8",
          "chi_cost": 5,
          "status": [
            "burn",
            "fear"
          ]
        },
        {
          "name": "Espelho de Fogo",
          "description": "Reflete ataques de energia de volta ao atacante original.",
          "damage": "4d6",
          "chi_cost": 5,
          "status": [
            "burn"
          ]
        },
        {
          "name": "Fortaleza Ardente",
          "description": "O escudo expande para cobertura completa de 360 graus.",
          "damage": "4d6+2",
          "chi_cost": 5,
          "status": [
            "burn",
            "shield"
          ]
        },
        {
          "name": "Escudo Solar",
          "description": "Alimentado pela energia do sol — maxima intensidade durante o dia.",
          "damage": "4d8",
          "chi_cost": 6,
          "status": [
            "burn",
            "blind"
          ]
        },
        {
          "name": "Inferno Defensivo",
          "description": "Transforma-se em nova de fogo devastadora ao ser partido.",
          "damage": "5d8",
          "chi_cost": 6,
          "status": [
            "burn",
            "stun",
            "blind"
          ]
        }
      ],
      "passive_effect": {
        "type": "def",
        "description": "Deflecte um ataque e causa 2d6 burn ao atacante. Inimigos corpo a corpo sofrem burn. Dura 1 turno.",
        "chi_cost": 2,
        "dice": "2d6",
        "status": [
          "burn",
          "shield"
        ]
      }
    },
    {
      "id": "esquiva-flamejante",
      "name": "Esquiva Flamejante",
      "element": "fire",
      "category": "agility",
      "tier": 2,
      "description": "Ao esquivar, o atacante recebe 1d4 burn. Chance de cegueira 20%.",
      "position": "def",
      "requirements": {
        "AGI": 4,
        "PER": 2
      },
      "prerequisites": [
        "Passo Ardente"
      ],
      "attacks": [
        {
          "name": "Contra-Esquiva",
          "description": "Redireciona o impeto do inimigo para as chamas.",
          "damage": "1d6+2",
          "chi_cost": 2,
          "status": [
            "burn"
          ]
        },
        {
          "name": "Esquiva Ardente",
          "description": "A evasao deixa corrente de fogo que queima quem atravessa.",
          "damage": "2d4",
          "chi_cost": 2,
          "status": [
            "burn"
          ]
        },
        {
          "name": "Desvio Explosivo",
          "description": "Esquiva que culmina numa explosao de calor na direcao do atacante.",
          "damage": "2d6",
          "chi_cost": 3,
          "status": [
            "stun",
            "burn"
          ]
        },
        {
          "name": "Rastro Letal",
          "description": "Ao esquivar deixa rastro de fogo azul persistente por 2 turnos.",
          "damage": "2d6+2",
          "chi_cost": 3,
          "status": [
            "burn",
            "slow"
          ]
        },
        {
          "name": "Contre-Feu",
          "description": "Esquiva e ataque simultaneos — fogo queima durante o desvio.",
          "damage": "3d6",
          "chi_cost": 4,
          "status": [
            "burn"
          ]
        },
        {
          "name": "Sombra de Chamas",
          "description": "Cria falso rastro de calor que confunde a pontaria inimiga.",
          "damage": "2d8",
          "chi_cost": 4,
          "status": [
            "blind",
            "burn"
          ]
        },
        {
          "name": "Explosao de Retorno",
          "description": "Ao esquivar, lanca uma micro-nova de calor radial.",
          "damage": "3d6+2",
          "chi_cost": 4,
          "status": [
            "burn",
            "stun"
          ]
        },
        {
          "name": "Danca de Esquivas",
          "description": "Tres esquivas em rapida sequencia, cada uma com contra-ataque.",
          "damage": "4d6",
          "chi_cost": 5,
          "status": [
            "burn"
          ]
        },
        {
          "name": "Fantasma Ardente",
          "description": "Move-se tao rapido que deixa imagem de fogo no lugar.",
          "damage": "4d6+2",
          "chi_cost": 5,
          "status": [
            "burn",
            "blind"
          ]
        },
        {
          "name": "Esquiva do Dragao",
          "description": "A forma completa de Danca do Dragao usada defensivamente.",
          "damage": "5d6",
          "chi_cost": 6,
          "status": [
            "burn",
            "stun",
            "blind"
          ]
        }
      ],
      "passive_effect": {
        "type": "def",
        "description": "Ao esquivar, o atacante recebe 1d4 burn. Chance de cegueira 20%.",
        "chi_cost": 1,
        "dice": "1d4",
        "status": [
          "burn"
        ]
      }
    },
    {
      "id": "foguete-humano",
      "name": "Foguete Humano",
      "element": "fire",
      "category": "agility",
      "tier": 4,
      "description": "",
      "position": "off",
      "requirements": {
        "AGI": 10,
        "CHI": 7,
        "FOR": 5
      },
      "prerequisites": [
        "Propulsao Tripla"
      ],
      "attacks": [
        {
          "name": "Lancamento Direto",
          "description": "Propulsao maxima em linha reta contra um alvo especifico.",
          "damage": "4d6+4",
          "chi_cost": 6,
          "status": [
            "stun",
            "burn"
          ]
        },
        {
          "name": "Foguete Rasante",
          "description": "Percorre o chao a velocidade extrema causando dano em linha.",
          "damage": "5d6",
          "chi_cost": 7,
          "status": [
            "burn",
            "slow"
          ]
        },
        {
          "name": "Colisao Solar",
          "description": "Impacto de fogo puro — o corpo e um projétil flamejante.",
          "damage": "6d6+4",
          "chi_cost": 8,
          "status": [
            "stun",
            "burn",
            "blind"
          ]
        },
        {
          "name": "Espiral de Fogo",
          "description": "Rota em espiral que atinge multiplos alvos em sequencia.",
          "damage": "5d6+2",
          "chi_cost": 7,
          "status": [
            "burn",
            "stun"
          ]
        },
        {
          "name": "Meteoro Humano",
          "description": "Queda em picado do ar — impacto cria cratera de fogo.",
          "damage": "8d6",
          "chi_cost": 9,
          "status": [
            "burn",
            "stun",
            "slow"
          ]
        },
        {
          "name": "Duplo Lancamento",
          "description": "Dois lancamentos em direcoes opostas em sequencia.",
          "damage": "6d6+2",
          "chi_cost": 8,
          "status": [
            "burn",
            "stun"
          ]
        },
        {
          "name": "Foguete Triplo",
          "description": "Tres lancamentos em triangulo — cobre area inteira.",
          "damage": "7d6",
          "chi_cost": 9,
          "status": [
            "burn",
            "stun",
            "blind"
          ]
        },
        {
          "name": "Tornado de Lancamentos",
          "description": "Gira em espiral enquanto propulsionado — area total.",
          "damage": "7d6+3",
          "chi_cost": 9,
          "status": [
            "burn",
            "stun",
            "slow"
          ]
        },
        {
          "name": "Asteroide",
          "description": "Velocidade de asteroide — impacto catastrofico de area.",
          "damage": "8d6+4",
          "chi_cost": 10,
          "status": [
            "burn",
            "stun",
            "blind",
            "slow"
          ]
        },
        {
          "name": "Colisao Final",
          "description": "O ultimo lancamento — destroi tudo no ponto de impacto.",
          "damage": "10d8",
          "chi_cost": 10,
          "status": [
            "burn",
            "stun",
            "blind",
            "slow"
          ]
        }
      ],
      "passive_effect": null
    },
    {
      "id": "passo-ardente",
      "name": "Passo Ardente",
      "element": "fire",
      "category": "agility",
      "tier": 1,
      "description": "Ao mover-se, deixa um rastro de chamas que dura 1 turno. Inimigos que passem sofrem 1d4 burn.",
      "position": "any",
      "requirements": {
        "AGI": 2
      },
      "prerequisites": [],
      "attacks": [
        {
          "name": "Rastro de Fogo",
          "description": "Corre deixando chamas no chão.",
          "damage": "1d4",
          "chi_cost": 1,
          "status": [
            "burn"
          ]
        },
        {
          "name": "Corrida Flamejante",
          "description": "Movimento rápido com explosão ao parar.",
          "damage": "1d6",
          "chi_cost": 2,
          "status": [
            "burn"
          ]
        }
      ],
      "passive_effect": {
        "type": "any",
        "description": "Ao mover, deixa rastro de chamas por 1 turno.",
        "chi_cost": 1,
        "dice": "1d4",
        "status": [
          "burn"
        ]
      }
    },
    {
      "id": "chama-interior",
      "name": "Chama Interior",
      "element": "fire",
      "category": "spirit",
      "tier": 1,
      "description": "Concentra o fogo interno para restaurar Chi e aquecer o corpo. Imune a congelamento por 2 turnos.",
      "position": "pass",
      "requirements": {
        "ESP": 2,
        "CHI": 1
      },
      "prerequisites": [],
      "attacks": [],
      "passive_effect": {
        "type": "pass",
        "description": "Restaura 1d4 Chi e concede imunidade a freeze por 2 turnos.",
        "chi_cost": 0,
        "dice": "1d4",
        "status": [
          "regen"
        ]
      }
    },
    {
      "id": "punho-de-fogo",
      "name": "Punho de Fogo",
      "element": "fire",
      "category": "brute",
      "tier": 1,
      "description": "Envolve os punhos em chamas, aumentando o dano corpo a corpo.",
      "position": "off",
      "requirements": {
        "FOR": 2
      },
      "prerequisites": [],
      "attacks": [
        {
          "name": "Soco Flamejante",
          "description": "Golpe direto envolvido em fogo.",
          "damage": "1d8+2",
          "chi_cost": 1,
          "status": [
            "burn"
          ]
        },
        {
          "name": "Combo Ardente",
          "description": "Sequência rápida de golpes flamejantes.",
          "damage": "2d6",
          "chi_cost": 2,
          "status": [
            "burn"
          ]
        },
        {
          "name": "Uppercut Vulcânico",
          "description": "Gancho ascendente que lança o inimigo.",
          "damage": "2d8",
          "chi_cost": 3,
          "status": [
            "burn",
            "stun"
          ]
        }
      ],
      "passive_effect": {
        "type": "off",
        "description": "Ataques corpo a corpo causam +1d4 burn adicional.",
        "chi_cost": 1,
        "dice": "1d4",
        "status": [
          "burn"
        ]
      }
    },
    {
      "id": "respiracao-de-dragao",
      "name": "Respiração de Dragão",
      "element": "fire",
      "category": "brute",
      "tier": 2,
      "description": "Lança uma rajada de fogo pela boca em cone de 3m.",
      "position": "off",
      "requirements": {
        "FOR": 4,
        "CHI": 3
      },
      "prerequisites": [
        "Punho de Fogo"
      ],
      "attacks": [
        {
          "name": "Bafo de Fogo",
          "description": "Sopra uma rajada de chamas num cone.",
          "damage": "2d8+3",
          "chi_cost": 3,
          "status": [
            "burn"
          ]
        },
        {
          "name": "Alento do Dragão",
          "description": "Versão contínua que queima por 2 turnos.",
          "damage": "3d6",
          "chi_cost": 4,
          "status": [
            "burn",
            "blind"
          ]
        }
      ],
      "passive_effect": {
        "type": "off",
        "description": "Ataques de fogo em cone causam cegueira 20% chance.",
        "chi_cost": 2,
        "dice": "2d8",
        "status": [
          "burn",
          "blind"
        ]
      }
    },
    {
      "id": "propulsao-tripla",
      "name": "Propulsão Tripla",
      "element": "fire",
      "category": "agility",
      "tier": 2,
      "description": "Usa jatos de fogo nos pés e mãos para propulsão aérea. Permite movimento vertical.",
      "position": "any",
      "requirements": {
        "AGI": 4,
        "CHI": 2
      },
      "prerequisites": [
        "Passo Ardente"
      ],
      "attacks": [
        {
          "name": "Impulso Aéreo",
          "description": "Propulsa-se para cima evitando ataques terrestres.",
          "damage": "1d6",
          "chi_cost": 2,
          "status": []
        },
        {
          "name": "Mergulho Flamejante",
          "description": "Desce em alta velocidade com impacto de fogo.",
          "damage": "2d8+2",
          "chi_cost": 3,
          "status": [
            "burn",
            "stun"
          ]
        }
      ],
      "passive_effect": {
        "type": "any",
        "description": "Esquiva +2 contra ataques corpo a corpo. Pode mover-se verticalmente.",
        "chi_cost": 2,
        "dice": "",
        "status": []
      }
    },
    {
      "id": "explosao-solar",
      "name": "Explosão Solar",
      "element": "fire",
      "category": "brute",
      "tier": 3,
      "description": "Canaliza toda a energia chi numa explosão devastadora de fogo em área.",
      "position": "off",
      "requirements": {
        "FOR": 6,
        "CHI": 5,
        "ESP": 3
      },
      "prerequisites": [
        "Respiração de Dragão"
      ],
      "attacks": [
        {
          "name": "Nova Solar",
          "description": "Explosão massiva num raio de 5m.",
          "damage": "4d8+5",
          "chi_cost": 6,
          "status": [
            "burn",
            "blind"
          ]
        },
        {
          "name": "Pilar de Fogo",
          "description": "Coluna de fogo que ergue do chão.",
          "damage": "3d10",
          "chi_cost": 5,
          "status": [
            "burn",
            "stun"
          ]
        }
      ],
      "passive_effect": {
        "type": "off",
        "description": "Ataques de área causam burn garantido a todos os alvos.",
        "chi_cost": 5,
        "dice": "4d8",
        "status": [
          "burn",
          "blind"
        ]
      }
    },
    {
      "id": "meditacao-do-fogo",
      "name": "Meditação do Fogo",
      "element": "fire",
      "category": "spirit",
      "tier": 2,
      "description": "Estado meditativo que regenera Chi e aumenta o poder das chamas.",
      "position": "pass",
      "requirements": {
        "ESP": 4,
        "CHI": 3
      },
      "prerequisites": [
        "Chama Interior"
      ],
      "attacks": [],
      "passive_effect": {
        "type": "pass",
        "description": "Regenera 2d4 Chi por turno durante 3 turnos. Próximo ataque de fogo causa +1d6 dano.",
        "chi_cost": 2,
        "dice": "2d4",
        "status": [
          "regen"
        ]
      }
    },
    {
      "id": "tiro-preciso-de-fogo",
      "name": "Tiro Preciso de Fogo",
      "element": "fire",
      "category": "precise",
      "tier": 1,
      "description": "Lança pequenas bolas de fogo com alta precisão a longa distância.",
      "position": "off",
      "requirements": {
        "PER": 3
      },
      "prerequisites": [],
      "attacks": [
        {
          "name": "Dardo de Fogo",
          "description": "Projétil de fogo rápido e preciso.",
          "damage": "1d6+1",
          "chi_cost": 1,
          "status": [
            "burn"
          ]
        },
        {
          "name": "Tiro Duplo",
          "description": "Dois projéteis em sequência rápida.",
          "damage": "2d4+2",
          "chi_cost": 2,
          "status": [
            "burn"
          ]
        },
        {
          "name": "Tiro Penetrante",
          "description": "Projétil que ignora 2 pontos de defesa.",
          "damage": "1d8+3",
          "chi_cost": 2,
          "status": [
            "burn"
          ]
        }
      ],
      "passive_effect": {
        "type": "off",
        "description": "Ataques à distância com fogo têm +2 precisão.",
        "chi_cost": 1,
        "dice": "1d6",
        "status": [
          "burn"
        ]
      }
    },
    {
      "id": "chicote-de-chamas",
      "name": "Chicote de Chamas",
      "element": "fire",
      "category": "precise",
      "tier": 2,
      "description": "Cria um chicote de fogo controlável com alcance de 4m.",
      "position": "off",
      "requirements": {
        "PER": 4,
        "AGI": 3
      },
      "prerequisites": [
        "Tiro Preciso de Fogo"
      ],
      "attacks": [
        {
          "name": "Estalo Flamejante",
          "description": "Ataque rápido com o chicote de fogo.",
          "damage": "1d8+2",
          "chi_cost": 2,
          "status": [
            "burn"
          ]
        },
        {
          "name": "Agarrar e Queimar",
          "description": "Prende o inimigo com o chicote.",
          "damage": "2d6",
          "chi_cost": 3,
          "status": [
            "burn",
            "root"
          ]
        },
        {
          "name": "Arremesso",
          "description": "Puxa e arremessa o inimigo preso.",
          "damage": "2d8",
          "chi_cost": 3,
          "status": [
            "stun"
          ]
        }
      ],
      "passive_effect": {
        "type": "off",
        "description": "Alcance de 4m em ataques de fogo. Pode prender inimigos.",
        "chi_cost": 2,
        "dice": "1d8",
        "status": [
          "burn",
          "root"
        ]
      }
    }
  ],
  "water": [
    {
      "id": "redemoinho",
      "name": "Redemoinho",
      "element": "water",
      "category": "agility",
      "tier": 2,
      "description": "Deflecte um ataque fisico ou de agua. Reposiciona imediatamente apos o desvio.",
      "position": "def",
      "requirements": {
        "AGI": 4,
        "CHI": 3
      },
      "prerequisites": [
        "Surf de Onda"
      ],
      "attacks": [
        {
          "name": "Vortice Defensivo",
          "description": "O redemoinho agarra o ataque e redireciona-o.",
          "damage": "1d6+2",
          "chi_cost": 2,
          "status": [
            "slow"
          ]
        },
        {
          "name": "Giro de Agua",
          "description": "Giro rapido que usa a agua como escudo e contra-ataca.",
          "damage": "2d4+2",
          "chi_cost": 2,
          "status": [
            "slow"
          ]
        },
        {
          "name": "Corrente Deflectora",
          "description": "Uma corrente de agua bloqueia e desvia o ataque.",
          "damage": "2d6",
          "chi_cost": 3,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Redemoinho Ofensivo",
          "description": "O redemoinho transforma-se em ataque giratorio.",
          "damage": "2d6+2",
          "chi_cost": 3,
          "status": [
            "slow",
            "stun"
          ]
        },
        {
          "name": "Vortice Expansivo",
          "description": "O redemoinho expande e cobre area maior.",
          "damage": "3d6",
          "chi_cost": 4,
          "status": [
            "slow",
            "freeze"
          ]
        },
        {
          "name": "Espiral de Agua",
          "description": "Espiral que abraca e imobiliza o inimigo.",
          "damage": "3d6+2",
          "chi_cost": 4,
          "status": [
            "root",
            "slow"
          ]
        },
        {
          "name": "Redemoinho Duplo",
          "description": "Dois redemoinhos em rotacoes opostas que convergem.",
          "damage": "4d6",
          "chi_cost": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Ciclone Aquatico",
          "description": "Um ciclone que aspira o inimigo para o centro.",
          "damage": "4d6+2",
          "chi_cost": 5,
          "status": [
            "stun",
            "root"
          ]
        },
        {
          "name": "Vortice do Oceano",
          "description": "O poder do oceano num unico redemoinho.",
          "damage": "5d6",
          "chi_cost": 5,
          "status": [
            "stun",
            "freeze"
          ]
        },
        {
          "name": "Espiral da Lua Cheia",
          "description": "O redemoinho alimentado pela lua — irresistivel.",
          "damage": "6d6",
          "chi_cost": 6,
          "status": [
            "stun",
            "freeze",
            "root"
          ]
        }
      ],
      "passive_effect": {
        "type": "def",
        "description": "Deflecte um ataque fisico ou de agua. Reposiciona imediatamente apos o desvio.",
        "chi_cost": 2,
        "dice": "-",
        "status": []
      }
    },
    {
      "id": "pontes-de-gelo",
      "name": "Pontes de Gelo",
      "element": "water",
      "category": "precise",
      "tier": 2,
      "description": "Cria estrutura de gelo ate 10m. Pode ser usada em combate para flanquear inimigos.",
      "position": "off",
      "requirements": {
        "AGI": 3,
        "CHI": 2
      },
      "prerequisites": [
        "Passo Escorregadio"
      ],
      "attacks": [
        {
          "name": "Rampa de Gelo",
          "description": "Cria uma rampa que lanca o dobrador em arco.",
          "damage": "1d6+2",
          "chi_cost": 2,
          "status": [
            "slow"
          ]
        },
        {
          "name": "Ponte Instantanea",
          "description": "Uma ponte de gelo que tambem serve de projétil.",
          "damage": "2d4+2",
          "chi_cost": 2,
          "status": [
            "freeze"
          ]
        },
        {
          "name": "Pilar de Gelo",
          "description": "Um pilar de gelo que ergue ou bloqueia o caminho.",
          "damage": "2d6",
          "chi_cost": 3,
          "status": [
            "root",
            "freeze"
          ]
        },
        {
          "name": "Lancamento em Ponte",
          "description": "O dobrador usa a propria ponte para se lancar.",
          "damage": "2d6+2",
          "chi_cost": 3,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Parede de Gelo",
          "description": "Uma parede de gelo que divide o campo de batalha.",
          "damage": "3d4+2",
          "chi_cost": 3,
          "status": [
            "root",
            "freeze"
          ]
        },
        {
          "name": "Escorrega Letal",
          "description": "Uma rampa que lanca o inimigo num abismo.",
          "damage": "3d6",
          "chi_cost": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Torre de Gelo",
          "description": "Uma torre emerge rapidamente e atinge inimigos acima.",
          "damage": "3d6+2",
          "chi_cost": 4,
          "status": [
            "freeze",
            "stun"
          ]
        },
        {
          "name": "Labirinto de Gelo",
          "description": "Multiplas estruturas que confundem e bloqueiam.",
          "damage": "4d6",
          "chi_cost": 4,
          "status": [
            "root",
            "blind"
          ]
        },
        {
          "name": "Prisao de Gelo",
          "description": "Uma prisao completa de gelo que captura o inimigo.",
          "damage": "4d6+2",
          "chi_cost": 5,
          "status": [
            "root",
            "freeze"
          ]
        },
        {
          "name": "Fortaleza Glacial",
          "description": "Uma fortaleza completa de gelo em fracao de segundo.",
          "damage": "5d6+2",
          "chi_cost": 5,
          "status": [
            "root",
            "freeze",
            "slow"
          ]
        }
      ],
      "passive_effect": {
        "type": "utility",
        "description": "Cria estrutura de gelo ate 10m. Pode ser usada em combate para flanquear inimigos.",
        "chi_cost": 2,
        "dice": "-",
        "status": []
      }
    },
    {
      "id": "corrente-submarina",
      "name": "Corrente Submarina",
      "element": "water",
      "category": "agility",
      "tier": 3,
      "description": "Movimento subaquatico invisivel. Pode atacar da agua com vantagem de surpresa.",
      "position": "off",
      "requirements": {
        "AGI": 6,
        "CHI": 5
      },
      "prerequisites": [
        "Redemoinho",
        "Surf de Onda"
      ],
      "attacks": [
        {
          "name": "Ataque da Profundidade",
          "description": "Emerge rapidamente e ataca antes de mergulhar.",
          "damage": "2d6+2",
          "chi_cost": 3,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Golpe Subaquatico",
          "description": "Ataca enquanto parcialmente submerso.",
          "damage": "3d6",
          "chi_cost": 3,
          "status": []
        },
        {
          "name": "Corrente de Ataque",
          "description": "Uma corrente de agua que segue e persegue o inimigo.",
          "damage": "3d6+2",
          "chi_cost": 4,
          "status": [
            "slow"
          ]
        },
        {
          "name": "Emboscada Aquatica",
          "description": "Emerge atras do inimigo sem ser visto.",
          "damage": "3d8",
          "chi_cost": 4,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "name": "Mergulho e Ataque",
          "description": "Mergulha e emerge num ponto diferente em ataque surpresa.",
          "damage": "4d6",
          "chi_cost": 4,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Torrente Submersa",
          "description": "Uma torrente que emerge verticalmente sob o inimigo.",
          "damage": "4d6+2",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Corrente Dupla",
          "description": "Dois ataques de agua de direcoes opostas em simultaneo.",
          "damage": "4d8",
          "chi_cost": 5,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Tsunami de Surpresa",
          "description": "Emerge criando uma onda colossal completamente inesperada.",
          "damage": "5d6+2",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow",
            "blind"
          ]
        },
        {
          "name": "O Mar Ataca",
          "description": "O proprio mar emerge em ataque devastador.",
          "damage": "6d6",
          "chi_cost": 6,
          "status": [
            "stun",
            "freeze",
            "slow"
          ]
        },
        {
          "name": "Corrente do Abismo",
          "description": "Agua das profundezas — fria, densa e absolutamente fatal.",
          "damage": "6d6+3",
          "chi_cost": 6,
          "status": [
            "freeze",
            "stun",
            "slow",
            "blind"
          ]
        }
      ],
      "passive_effect": {
        "type": "move",
        "description": "Movimento subaquatico invisivel. Pode atacar da agua com vantagem de surpresa.",
        "chi_cost": 3,
        "dice": "-",
        "status": []
      }
    },
    {
      "id": "esquiva-fluida",
      "name": "Esquiva Fluida",
      "element": "water",
      "category": "agility",
      "tier": 2,
      "description": "Ao esquivar com sucesso, o contra-ataque de agua causa 1d8 e slow ao atacante.",
      "position": "def",
      "requirements": {
        "AGI": 4,
        "PER": 3
      },
      "prerequisites": [
        "Redemoinho"
      ],
      "attacks": [
        {
          "name": "Contra-Agua",
          "description": "A esquiva lanca uma onda de agua certeira contra o atacante.",
          "damage": "1d8+2",
          "chi_cost": 2,
          "status": [
            "slow"
          ]
        },
        {
          "name": "Fluxo Inverso",
          "description": "Usa o impeto do inimigo para amplificar o contra-ataque.",
          "damage": "2d6+2",
          "chi_cost": 3,
          "status": [
            "slow",
            "stun"
          ]
        },
        {
          "name": "Vaga de Retorno",
          "description": "Uma onda maior que varre o atacante para longe.",
          "damage": "3d6",
          "chi_cost": 3,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Mar que Responde",
          "description": "O oceano responde ao ataque — onda colossal inesperada.",
          "damage": "3d6+3",
          "chi_cost": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Forma da Serpente",
          "description": "O corpo flui — o contra-ataque e uma cobra de gelo.",
          "damage": "4d6",
          "chi_cost": 5,
          "status": [
            "freeze",
            "stun"
          ]
        },
        {
          "name": "Contra-Corrente",
          "description": "Corrente de agua que segue o inimigo apos a esquiva.",
          "damage": "3d8",
          "chi_cost": 5,
          "status": [
            "slow",
            "freeze"
          ]
        },
        {
          "name": "Espiral Evasiva",
          "description": "Espiral de agua que tanto esquiva como ataca.",
          "damage": "4d6+2",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Refluxo Glacial",
          "description": "O contra-ataque e de gelo — imobiliza o membro atingido.",
          "damage": "4d8",
          "chi_cost": 6,
          "status": [
            "freeze",
            "root"
          ]
        },
        {
          "name": "Vaga Perfeita",
          "description": "A esquiva e o contra-ataque tornam-se uma so acao.",
          "damage": "5d6+2",
          "chi_cost": 6,
          "status": [
            "stun",
            "freeze",
            "slow"
          ]
        },
        {
          "name": "A Agua Nao Pode Ser Apanhada",
          "description": "Evasao total — o inimigo nunca acerta na agua.",
          "damage": "6d6",
          "chi_cost": 7,
          "status": [
            "stun",
            "freeze",
            "slow",
            "blind"
          ]
        }
      ],
      "passive_effect": {
        "type": "def",
        "description": "Ao esquivar com sucesso, o contra-ataque de agua causa 1d8 e slow ao atacante.",
        "chi_cost": 2,
        "dice": "1d8",
        "status": [
          "slow"
        ]
      }
    },
    {
      "id": "forma-da-agua",
      "name": "Forma da Agua",
      "element": "water",
      "category": "agility",
      "tier": 4,
      "description": "Reduz dano fisico em 50% por 3 turnos. Restaura 1d4 chi por turno enquanto ativo.",
      "position": "def",
      "requirements": {
        "AGI": 9,
        "CHI": 7,
        "ESP": 4
      },
      "prerequisites": [
        "Corrente Submarina",
        "Esquiva Fluida"
      ],
      "attacks": [
        {
          "name": "Golpe Fluido",
          "description": "O corpo flui em torno do inimigo e ataca de angulo impossivel.",
          "damage": "3d6+2",
          "chi_cost": 4,
          "status": [
            "slow"
          ]
        },
        {
          "name": "Forma Liquida",
          "description": "O dobrador dissolve-se e recondensa diretamente no inimigo.",
          "damage": "4d6",
          "chi_cost": 5,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Onda Pessoal",
          "description": "Uma onda de agua emerge do proprio corpo do dobrador.",
          "damage": "4d6+2",
          "chi_cost": 5,
          "status": [
            "slow",
            "freeze"
          ]
        },
        {
          "name": "Forma do Rio",
          "description": "Move-se como um rio — imparavel, constante e inevitavel.",
          "damage": "4d8",
          "chi_cost": 5,
          "status": [
            "slow",
            "root"
          ]
        },
        {
          "name": "Agua que Corta",
          "description": "A agua fluida comprime-se e torna-se um cortador preciso.",
          "damage": "5d6",
          "chi_cost": 6,
          "status": [
            "bleed",
            "slow"
          ]
        },
        {
          "name": "Corpo de Oceano",
          "description": "O corpo e o oceano — ataque de area total ao redor.",
          "damage": "5d6+3",
          "chi_cost": 6,
          "status": [
            "stun",
            "freeze"
          ]
        },
        {
          "name": "Forma do Tsunami",
          "description": "O corpo amplifica-se numa onda colossal devastadora.",
          "damage": "6d6",
          "chi_cost": 7,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Fusao Aquatica",
          "description": "O dobrador funde-se com a agua ao redor — invisivel e letal.",
          "damage": "6d6+2",
          "chi_cost": 7,
          "status": [
            "stun",
            "freeze",
            "blind"
          ]
        },
        {
          "name": "Forma da Lua Cheia",
          "description": "A lua cheia amplifica a forma — poder maximo atingido.",
          "damage": "7d6",
          "chi_cost": 8,
          "status": [
            "stun",
            "freeze",
            "slow"
          ]
        },
        {
          "name": "A Agua Absoluta",
          "description": "O dobrador e a agua — indistinguiveis e absolutamente fatais.",
          "damage": "8d6",
          "chi_cost": 9,
          "status": [
            "stun",
            "freeze",
            "slow",
            "blind"
          ]
        }
      ],
      "passive_effect": {
        "type": "def",
        "description": "Reduz dano fisico em 50% por 3 turnos. Restaura 1d4 chi por turno enquanto ativo.",
        "chi_cost": 4,
        "dice": "1d4/t",
        "status": [
          "regen",
          "shield"
        ]
      }
    },
    {
      "id": "escudo-aquatico",
      "name": "Escudo Aquatico",
      "element": "water",
      "category": "brute",
      "tier": 1,
      "description": "Absorve 2d8 dano. Se o escudo for partido, explode causando 1d6 slow a proximos.",
      "position": "def",
      "requirements": {
        "FOR": 2,
        "CHI": 1,
        "RES": 1
      },
      "prerequisites": [],
      "attacks": [
        {
          "name": "Escudo em Colapso",
          "description": "O escudo cede propositalmente — explode em onda de agua.",
          "damage": "2d6",
          "chi_cost": 2,
          "status": [
            "slow"
          ]
        },
        {
          "name": "Barreira Pulsante",
          "description": "O escudo pulsa e empurra violentamente inimigos proximos.",
          "damage": "2d6+2",
          "chi_cost": 3,
          "status": [
            "slow",
            "stun"
          ]
        },
        {
          "name": "Escudo de Gelo",
          "description": "O escudo congela — mais resistente e fere ao tocar.",
          "damage": "3d4+2",
          "chi_cost": 3,
          "status": [
            "freeze"
          ]
        },
        {
          "name": "Barreira Expansiva",
          "description": "O escudo expande para cobrir aliados proximos.",
          "damage": "2d8",
          "chi_cost": 3,
          "status": [
            "shield",
            "slow"
          ]
        },
        {
          "name": "Escudo Explosivo",
          "description": "O escudo explode ao ser partido — onda radial devastadora.",
          "damage": "3d6",
          "chi_cost": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Cortina de Agua",
          "description": "Uma cortina de agua que bloqueia projéteis completamente.",
          "damage": "3d6+2",
          "chi_cost": 4,
          "status": [
            "slow",
            "freeze"
          ]
        },
        {
          "name": "Escudo do Oceano",
          "description": "Alimentado pelo oceano — absorve enormes quantidades de dano.",
          "damage": "4d6",
          "chi_cost": 4,
          "status": [
            "shield"
          ]
        },
        {
          "name": "Fortaleza Aquatica",
          "description": "O escudo expande em fortaleza completa de agua.",
          "damage": "4d6+2",
          "chi_cost": 5,
          "status": [
            "shield",
            "slow"
          ]
        },
        {
          "name": "Escudo da Lua",
          "description": "Energia lunar amplifica o escudo — quase impenetravel.",
          "damage": "4d8",
          "chi_cost": 5,
          "status": [
            "shield",
            "freeze"
          ]
        },
        {
          "name": "Mar Protetor",
          "description": "O oceano inteiro protege o dobrador — poder absoluto.",
          "damage": "5d6+3",
          "chi_cost": 6,
          "status": [
            "shield",
            "freeze",
            "slow"
          ]
        }
      ],
      "passive_effect": {
        "type": "def",
        "description": "Absorve 2d8 dano. Se o escudo for partido, explode causando 1d6 slow a proximos.",
        "chi_cost": 2,
        "dice": "2d8",
        "status": [
          "shield"
        ]
      }
    }
  ],
  "earth": [
    {
      "id": "visao-sismica",
      "name": "Visao Sismica",
      "element": "earth",
      "category": "precise",
      "tier": 2,
      "description": "Ve tudo num raio de 20m atraves do chao. Imune a cegueira em terreno natural.",
      "position": "def",
      "requirements": {
        "PER": 4,
        "ESP": 3
      },
      "prerequisites": [
        "Escuta da Terra"
      ],
      "attacks": [
        {
          "name": "Pulso Sismico",
          "description": "Liberta um pulso de vibracoes para revelar e atacar.",
          "damage": "1d8+2",
          "chi_cost": 2,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Eco da Terra",
          "description": "O eco das vibracoes guia um ataque certeiro no ponto fraco.",
          "damage": "2d6",
          "chi_cost": 2,
          "status": []
        },
        {
          "name": "Vibracoes Cortantes",
          "description": "As vibracoes amplificam-se e danificam tudo ao redor.",
          "damage": "2d6+2",
          "chi_cost": 3,
          "status": [
            "slow"
          ]
        },
        {
          "name": "Onda de Detecao",
          "description": "Uma onda sismica que revela e atinge inimigos em simultaneo.",
          "damage": "2d8",
          "chi_cost": 3,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Pulso Sismico Medio",
          "description": "Um pulso mais forte que derruba inimigos proximos.",
          "damage": "3d6",
          "chi_cost": 3,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Eco Amplificado",
          "description": "O eco da terra volta amplificado como onda de ataque.",
          "damage": "3d6+2",
          "chi_cost": 4,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Visao e Ataque",
          "description": "Simultaneamente ve e ataca todos os inimigos no raio.",
          "damage": "3d8",
          "chi_cost": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Pulso Total",
          "description": "Pulso maximo — sente e atinge absolutamente tudo.",
          "damage": "4d6",
          "chi_cost": 4,
          "status": [
            "stun",
            "slow",
            "blind"
          ]
        },
        {
          "name": "Sismo de Visao",
          "description": "A visao sismica converte-se em onda sismica devastadora.",
          "damage": "4d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow",
            "root"
          ]
        },
        {
          "name": "Terra que Ve e Mata",
          "description": "A visao da terra torna-se uma arma totalmente devastadora.",
          "damage": "5d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow",
            "root",
            "blind"
          ]
        }
      ],
      "passive_effect": {
        "type": "utility",
        "description": "Ve tudo num raio de 20m atraves do chao. Imune a cegueira em terreno natural.",
        "chi_cost": 2,
        "dice": "-",
        "status": []
      }
    },
    {
      "id": "vontade-inabalavel",
      "name": "Vontade Inabalavel",
      "element": "earth",
      "category": "spirit",
      "tier": 2,
      "description": "Imune a fear, silence e dobra de sangue. Restaura 1d4 chi ao sofrer dano emocional.",
      "position": "pass",
      "requirements": {
        "RES": 4,
        "ESP": 3
      },
      "prerequisites": [
        "Paciencia da Pedra"
      ],
      "attacks": [
        {
          "name": "Punho da Pedra",
          "description": "A vontade inabalavel transmuta-se em golpe de pedra puro.",
          "damage": "2d6+2",
          "chi_cost": 3,
          "status": []
        },
        {
          "name": "Resistencia Ativa",
          "description": "A vontade inabalavel amplifica cada golpe dado.",
          "damage": "3d6",
          "chi_cost": 3,
          "status": []
        },
        {
          "name": "Forca da Montanha",
          "description": "A forca da montanha canalizada num unico golpe preciso.",
          "damage": "3d6+2",
          "chi_cost": 3,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Impacto Inabalavel",
          "description": "Um impacto que nenhuma defesa pode negar ou resistir.",
          "damage": "3d8",
          "chi_cost": 4,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Furia da Pedra",
          "description": "A vontade inabalavel explode em furia de pedra pura.",
          "damage": "4d6",
          "chi_cost": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Golpe Inquebravel",
          "description": "O golpe de quem simplesmente nao pode ser quebrado.",
          "damage": "4d6+2",
          "chi_cost": 4,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Vontade Manifestada",
          "description": "A vontade inabalavel torna-se pedra viva que ataca.",
          "damage": "4d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "root"
          ]
        },
        {
          "name": "Determinacao Absoluta",
          "description": "A determinacao mais profunda amplifica cada ataque.",
          "damage": "5d6",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Pedra Eterna",
          "description": "A forca da pedra eterna concentrada num unico ataque.",
          "damage": "5d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "root",
            "slow"
          ]
        },
        {
          "name": "O Inabalavel",
          "description": "Nada quebra esta vontade — e nada sobrevive a este golpe.",
          "damage": "6d8",
          "chi_cost": 6,
          "status": [
            "stun",
            "root",
            "slow",
            "fear"
          ]
        }
      ],
      "passive_effect": {
        "type": "restore",
        "description": "Imune a fear, silence e dobra de sangue. Restaura 1d4 chi ao sofrer dano emocional.",
        "chi_cost": 0,
        "dice": "1d4",
        "status": [
          "regen",
          "shield"
        ]
      }
    },
    {
      "id": "visao-profunda",
      "name": "Visao Profunda",
      "element": "earth",
      "category": "precise",
      "tier": 3,
      "description": "Visao sismica expande para 100m. Detecta armadilhas, tuneis e estruturas subterraneas.",
      "position": "def",
      "requirements": {
        "PER": 6,
        "ESP": 5
      },
      "prerequisites": [
        "Visao Sismica"
      ],
      "attacks": [
        {
          "name": "Onda Profunda",
          "description": "Uma onda sismica das profundezas que abala as fundacoes.",
          "damage": "3d6+2",
          "chi_cost": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Tremor Estrutural",
          "description": "Atinge as fundacoes das estruturas inimigas.",
          "damage": "3d8",
          "chi_cost": 4,
          "status": [
            "stun",
            "root"
          ]
        },
        {
          "name": "Pulso das Profundezas",
          "description": "Um pulso que vem das profundezas da terra.",
          "damage": "4d6",
          "chi_cost": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Eco Profundo",
          "description": "O eco da terra profunda volta amplificado em dano.",
          "damage": "4d6+2",
          "chi_cost": 5,
          "status": [
            "stun",
            "root"
          ]
        },
        {
          "name": "Sismo Estrutural",
          "description": "Um sismo que destroi estruturas medias completamente.",
          "damage": "4d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow",
            "root"
          ]
        },
        {
          "name": "Vibracoes das Profundezas",
          "description": "Vibracoes subterraneas que surgem diretamente sob inimigos.",
          "damage": "5d6",
          "chi_cost": 5,
          "status": [
            "stun",
            "root"
          ]
        },
        {
          "name": "Onda Devastadora",
          "description": "Uma onda sismica de grande profundidade e alcance.",
          "damage": "5d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow",
            "root"
          ]
        },
        {
          "name": "Sismo Profundo",
          "description": "Um sismo das profundezas — absolutamente imparavel.",
          "damage": "6d6+2",
          "chi_cost": 6,
          "status": [
            "stun",
            "root",
            "slow"
          ]
        },
        {
          "name": "Voz das Profundezas",
          "description": "A voz da terra profunda manifestada em ataque direto.",
          "damage": "6d8",
          "chi_cost": 6,
          "status": [
            "stun",
            "root",
            "slow",
            "blind"
          ]
        },
        {
          "name": "A Fundacao Range",
          "description": "Tudo que assenta na terra e atingido simultaneamente.",
          "damage": "7d8",
          "chi_cost": 7,
          "status": [
            "stun",
            "root",
            "slow",
            "blind"
          ]
        }
      ],
      "passive_effect": {
        "type": "utility",
        "description": "Visao sismica expande para 100m. Detecta armadilhas, tuneis e estruturas subterraneas.",
        "chi_cost": 3,
        "dice": "-",
        "status": []
      }
    },
    {
      "id": "memoria-da-pedra",
      "name": "Memoria da Pedra",
      "element": "earth",
      "category": "spirit",
      "tier": 3,
      "description": "Revela os ultimos 24h de eventos num raio de 5m de qualquer pedra tocada.",
      "position": "pass",
      "requirements": {
        "PER": 5,
        "ESP": 5
      },
      "prerequisites": [
        "Escuta da Terra",
        "Vontade Inabalavel"
      ],
      "attacks": [
        {
          "name": "Golpe da Memoria",
          "description": "A memoria da pedra guia o golpe com precisao historica absoluta.",
          "damage": "2d8+2",
          "chi_cost": 3,
          "status": []
        },
        {
          "name": "Pedra que Lembra",
          "description": "A pedra lembra cada golpe que recebeu — e devolve com juros.",
          "damage": "3d6",
          "chi_cost": 3,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Eco do Passado",
          "description": "O eco dos eventos passados torna-se onda de dano.",
          "damage": "3d6+2",
          "chi_cost": 4,
          "status": [
            "slow"
          ]
        },
        {
          "name": "Furia da Historia",
          "description": "A historia de violencia armazenada e libertada de uma vez.",
          "damage": "3d8",
          "chi_cost": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Projecao do Passado",
          "description": "Projeta a memoria de um impacto poderoso registado pela pedra.",
          "damage": "4d6",
          "chi_cost": 4,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Pedra Ancestral",
          "description": "A pedra usa a forca de todos os impactos que ja recebeu.",
          "damage": "4d6+2",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Memoria Viva",
          "description": "A pedra ataca com os golpes de quem a usou em batalha antes.",
          "damage": "4d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "root"
          ]
        },
        {
          "name": "Eco Ancestral",
          "description": "O eco de batalhas passadas guia o ataque com precisao.",
          "damage": "5d6",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Cronica de Pedra",
          "description": "A historia da pedra descarregada em impacto total.",
          "damage": "5d8",
          "chi_cost": 6,
          "status": [
            "stun",
            "root",
            "slow"
          ]
        },
        {
          "name": "Tudo o Que a Pedra Sabe",
          "description": "O conhecimento ancestral da pedra em ataque puro.",
          "damage": "6d8",
          "chi_cost": 6,
          "status": [
            "stun",
            "root",
            "slow",
            "blind"
          ]
        }
      ],
      "passive_effect": {
        "type": "utility",
        "description": "Revela os ultimos 24h de eventos num raio de 5m de qualquer pedra tocada.",
        "chi_cost": 4,
        "dice": "-",
        "status": []
      }
    },
    {
      "id": "voz-da-terra",
      "name": "Voz da Terra",
      "element": "earth",
      "category": "spirit",
      "tier": 4,
      "description": "Aprende historia geologica do local. Preve sismos. Restaura 2d6 chi ao comunicar.",
      "position": "pass",
      "requirements": {
        "PER": 8,
        "ESP": 9,
        "RES": 5
      },
      "prerequisites": [
        "Visao Profunda",
        "Memoria da Pedra"
      ],
      "attacks": [
        {
          "name": "Palavra da Terra",
          "description": "A voz da terra manifesta-se em onda sismica devastadora.",
          "damage": "3d8+2",
          "chi_cost": 5,
          "status": [
            "stun",
            "root"
          ]
        },
        {
          "name": "Eco do Mundo",
          "description": "O eco do mundo inteiro concentrado num unico ataque.",
          "damage": "4d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Voz do Sismo",
          "description": "A voz que antecede cada sismo — absolutamente devastadora.",
          "damage": "4d8+4",
          "chi_cost": 6,
          "status": [
            "stun",
            "root",
            "slow"
          ]
        },
        {
          "name": "Comando Sismico",
          "description": "Um comando dado a terra que ela obedece imediatamente.",
          "damage": "5d8",
          "chi_cost": 6,
          "status": [
            "stun",
            "root"
          ]
        },
        {
          "name": "A Terra Responde",
          "description": "A terra inteira responde ao comando do dobrador.",
          "damage": "5d8+3",
          "chi_cost": 7,
          "status": [
            "stun",
            "root",
            "slow"
          ]
        },
        {
          "name": "Rugido da Terra",
          "description": "O rugido da terra ao ser ferida — absolutamente aterrador.",
          "damage": "6d8",
          "chi_cost": 7,
          "status": [
            "stun",
            "root",
            "fear"
          ]
        },
        {
          "name": "Voz do Planeta",
          "description": "A voz do planeta inteiro concentrada num ponto.",
          "damage": "6d8+4",
          "chi_cost": 8,
          "status": [
            "stun",
            "root",
            "slow",
            "fear"
          ]
        },
        {
          "name": "Ordem da Terra",
          "description": "Uma ordem que a terra simplesmente nao pode recusar.",
          "damage": "7d8",
          "chi_cost": 8,
          "status": [
            "stun",
            "root",
            "slow"
          ]
        },
        {
          "name": "A Terra Fala",
          "description": "Quando a terra fala — tudo treme sem excecao.",
          "damage": "8d8",
          "chi_cost": 9,
          "status": [
            "stun",
            "root",
            "slow",
            "blind"
          ]
        },
        {
          "name": "Voz do Mundo",
          "description": "A voz do mundo — o maior poder que a terra pode dar.",
          "damage": "10d8",
          "chi_cost": 10,
          "status": [
            "stun",
            "root",
            "slow",
            "blind",
            "fear"
          ]
        }
      ],
      "passive_effect": {
        "type": "special",
        "description": "Aprende historia geologica do local. Preve sismos. Restaura 2d6 chi ao comunicar.",
        "chi_cost": 5,
        "dice": "2d6",
        "status": [
          "regen"
        ]
      }
    },
    {
      "id": "surf-de-terra",
      "name": "Surf de Terra",
      "element": "earth",
      "category": "agility",
      "tier": 1,
      "description": "Velocidade triplicada em terreno natural. Pode carregar aliados na plataforma.",
      "position": "off",
      "requirements": {
        "AGI": 2,
        "CHI": 1
      },
      "prerequisites": [],
      "attacks": [
        {
          "name": "Rampa de Terra",
          "description": "Cria uma rampa que lanca o dobrador em arco sobre o inimigo.",
          "damage": "1d6+2",
          "chi_cost": 2,
          "status": []
        },
        {
          "name": "Surf de Ataque",
          "description": "O bloco de terra e lancado diretamente contra o inimigo.",
          "damage": "2d4+2",
          "chi_cost": 2,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Onda de Chao",
          "description": "Uma onda de terra que rola pelo chao em direcao ao inimigo.",
          "damage": "2d6",
          "chi_cost": 3,
          "status": [
            "slow"
          ]
        },
        {
          "name": "Surf Duplo",
          "description": "Dois blocos de terra lancados em direcoes diferentes.",
          "damage": "2d6+2",
          "chi_cost": 3,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Rampa de Combate",
          "description": "A rampa e usada para ganhar posicao vantajosa.",
          "damage": "2d8",
          "chi_cost": 3,
          "status": [
            "slow"
          ]
        },
        {
          "name": "Surf Rapido",
          "description": "O bloco acelera a maxima velocidade — colisao devastadora.",
          "damage": "3d6",
          "chi_cost": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Plataforma de Ataque",
          "description": "A plataforma e lancada como arma colossal de impacto.",
          "damage": "3d6+2",
          "chi_cost": 4,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Surf de Flanqueamento",
          "description": "O surf usa-se para chegar rapidamente a posicao de flanco.",
          "damage": "3d8",
          "chi_cost": 4,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "name": "Onda Sismica Movel",
          "description": "O surf gera uma onda sismica no caminho percorrido.",
          "damage": "4d6",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow",
            "root"
          ]
        },
        {
          "name": "Torrente de Terra",
          "description": "Uma torrente de terra que carrega tudo no seu caminho.",
          "damage": "4d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow",
            "root"
          ]
        }
      ],
      "passive_effect": {
        "type": "move",
        "description": "Velocidade triplicada em terreno natural. Pode carregar aliados na plataforma.",
        "chi_cost": 1,
        "dice": "-",
        "status": []
      }
    },
    {
      "id": "passo-sismico",
      "name": "Passo Sismico",
      "element": "earth",
      "category": "brute",
      "tier": 1,
      "description": "Cada passo causa 1d4 e slow a inimigos em contacto com o chao num raio de 2m.",
      "position": "off",
      "requirements": {
        "FOR": 2,
        "AGI": 1
      },
      "prerequisites": [],
      "attacks": [
        {
          "name": "Passo Forte",
          "description": "Um passo deliberadamente forte — tremor de raio 3m.",
          "damage": "1d8+2",
          "chi_cost": 2,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Sequencia de Passos",
          "description": "Cinco passos rapidos — cinco micro-tremores em cascata.",
          "damage": "2d6",
          "chi_cost": 2,
          "status": [
            "slow"
          ]
        },
        {
          "name": "Passo Sismico Medio",
          "description": "Um passo que gera tremor de raio 5m ao redor.",
          "damage": "2d6+2",
          "chi_cost": 3,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Carga com Passos",
          "description": "Uma carga onde cada passo e um tremor devastador.",
          "damage": "2d8",
          "chi_cost": 3,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Danca Sismica",
          "description": "Uma danca de passos sismicos que cobre toda a area.",
          "damage": "3d6",
          "chi_cost": 3,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Passos em Cadeia",
          "description": "Cada passo amplifica o proximo — dano crescente.",
          "damage": "3d6+2",
          "chi_cost": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Passo do Gigante",
          "description": "Um passo que simula literalmente o passo de um gigante.",
          "damage": "3d8",
          "chi_cost": 4,
          "status": [
            "stun",
            "root"
          ]
        },
        {
          "name": "Sequencia Sismica",
          "description": "Uma sequencia de passos que culmina num sismo.",
          "damage": "4d6",
          "chi_cost": 4,
          "status": [
            "stun",
            "slow",
            "root"
          ]
        },
        {
          "name": "Passo Apocaliptico",
          "description": "Um passo que gera sismo de raio 10m devastador.",
          "damage": "4d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow",
            "root"
          ]
        },
        {
          "name": "O Passo da Terra",
          "description": "Quando este passo ressoa — a terra inteira range.",
          "damage": "5d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow",
            "root",
            "blind"
          ]
        }
      ],
      "passive_effect": {
        "type": "move",
        "description": "Cada passo causa 1d4 e slow a inimigos em contacto com o chao num raio de 2m.",
        "chi_cost": 1,
        "dice": "1d4",
        "status": [
          "slow"
        ]
      }
    },
    {
      "id": "tunel-rapido",
      "name": "Tunel Rapido",
      "element": "earth",
      "category": "agility",
      "tier": 2,
      "description": "Atravessa o solo invisivelmente. Emerge atras de inimigos com vantagem de surpresa.",
      "position": "off",
      "requirements": {
        "AGI": 4,
        "FOR": 3
      },
      "prerequisites": [
        "Surf de Terra"
      ],
      "attacks": [
        {
          "name": "Emergencia de Surpresa",
          "description": "Emerge do chao atras do inimigo em ataque surpresa.",
          "damage": "2d6+2",
          "chi_cost": 2,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Tunel Explosivo",
          "description": "Ao sair do tunel explode pedras em area.",
          "damage": "3d6",
          "chi_cost": 3,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "name": "Ataque do Subsolo",
          "description": "Ataca a partir do interior do chao sem emergir.",
          "damage": "3d6+2",
          "chi_cost": 3,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Dupla Emergencia",
          "description": "Emerge, ataca e mergulha de volta no mesmo turno.",
          "damage": "3d8",
          "chi_cost": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Tunel de Combate",
          "description": "O tunel e usado para flanquear continuamente o inimigo.",
          "damage": "4d6",
          "chi_cost": 4,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "name": "Corredor de Pedra",
          "description": "Cria um corredor de pedra que canaliza o ataque.",
          "damage": "4d6+2",
          "chi_cost": 4,
          "status": [
            "root",
            "stun"
          ]
        },
        {
          "name": "Mina de Terra",
          "description": "Cria uma mina de pedra que explode ao ser pisada.",
          "damage": "3d8+3",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow",
            "root"
          ]
        },
        {
          "name": "Tunel Rapido Maximo",
          "description": "Velocidade maxima em tunel — colisao catastrofica ao emergir.",
          "damage": "4d8+2",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Rede de Tuneis",
          "description": "Multiplos tuneis que emergem em pontos completamente diferentes.",
          "damage": "5d6+2",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow",
            "root"
          ]
        },
        {
          "name": "O Subsolo Ataca",
          "description": "O subsolo inteiro e uma extensao armada do dobrador.",
          "damage": "6d8",
          "chi_cost": 6,
          "status": [
            "stun",
            "slow",
            "root",
            "blind"
          ]
        }
      ],
      "passive_effect": {
        "type": "move",
        "description": "Atravessa o solo invisivelmente. Emerge atras de inimigos com vantagem de surpresa.",
        "chi_cost": 2,
        "dice": "-",
        "status": []
      }
    },
    {
      "id": "plataforma-elevatoria",
      "name": "Plataforma Elevatoria",
      "element": "earth",
      "category": "brute",
      "tier": 2,
      "description": "Lanca o utilizador ou aliado a grande altura. Pode ser usada para fugir ou flanquear.",
      "position": "off",
      "requirements": {
        "FOR": 3,
        "AGI": 2
      },
      "prerequisites": [
        "Passo Sismico",
        "Surf de Terra"
      ],
      "attacks": [
        {
          "name": "Plataforma de Ataque",
          "description": "A plataforma lanca o dobrador num ataque de cima.",
          "damage": "2d6+2",
          "chi_cost": 3,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Coluna de Lancamento",
          "description": "Uma coluna ergue e lanca como catapulta humana.",
          "damage": "3d6",
          "chi_cost": 3,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Plataforma Multipla",
          "description": "Multiplas plataformas lancam multiplos aliados.",
          "damage": "3d6+2",
          "chi_cost": 3,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Elevacao e Ataque",
          "description": "Eleva e ataca simultaneamente no mesmo momento.",
          "damage": "2d8+2",
          "chi_cost": 4,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Plataforma Explosiva",
          "description": "A plataforma explode no ponto maximo da elevacao.",
          "damage": "4d6",
          "chi_cost": 4,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "name": "Lance Duplo",
          "description": "Dois lancamentos em direcoes opostas em rapida sequencia.",
          "damage": "4d6+2",
          "chi_cost": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Plataforma Giratoria",
          "description": "A plataforma gira enquanto eleva — projeta o dobrador.",
          "damage": "3d8+3",
          "chi_cost": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Elevacao Colossal",
          "description": "Uma plataforma colossal que eleva a grande altitude.",
          "damage": "4d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Lancamento de Precisao",
          "description": "A plataforma lanca exatamente no ponto pretendido.",
          "damage": "5d6",
          "chi_cost": 5,
          "status": [
            "stun",
            "root"
          ]
        },
        {
          "name": "O Ceu e o Limite",
          "description": "A plataforma eleva tanto que a queda e absolutamente letal.",
          "damage": "5d8+2",
          "chi_cost": 5,
          "status": [
            "stun",
            "root",
            "blind"
          ]
        }
      ],
      "passive_effect": {
        "type": "move",
        "description": "Lanca o utilizador ou aliado a grande altura. Pode ser usada para fugir ou flanquear.",
        "chi_cost": 2,
        "dice": "1d6",
        "status": [
          "stun"
        ]
      }
    },
    {
      "id": "deslize-sismico",
      "name": "Deslize Sismico",
      "element": "earth",
      "category": "agility",
      "tier": 3,
      "description": "Velocidade maxima subterranea. Pode atacar e mergulhar de volta no mesmo turno.",
      "position": "off",
      "requirements": {
        "AGI": 6,
        "FOR": 4
      },
      "prerequisites": [
        "Tunel Rapido"
      ],
      "attacks": [
        {
          "name": "Ataque Subterraneo",
          "description": "Emerge e ataca antes de qualquer reacao possivel.",
          "damage": "2d8+2",
          "chi_cost": 3,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Deslize e Ataque",
          "description": "Desliza sob o inimigo e emerge em ataque preciso.",
          "damage": "3d6+2",
          "chi_cost": 4,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Silvo da Terra",
          "description": "Um ataque tao rapido que parece magia absoluta.",
          "damage": "3d8",
          "chi_cost": 4,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "name": "Emergencia Explosiva",
          "description": "Emerge explodindo rochas em todas as direcoes.",
          "damage": "4d6+2",
          "chi_cost": 4,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "name": "Deslize Duplo",
          "description": "Dois ataques de posicoes subterraneas diferentes.",
          "damage": "4d6+3",
          "chi_cost": 5,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Fantasma Sismico",
          "description": "O dobrador e invisivel ate ao exato momento do impacto.",
          "damage": "4d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "name": "Onda Subterranea",
          "description": "Uma onda de terra que viaja no subsolo antes de emergir.",
          "damage": "5d6",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow",
            "root"
          ]
        },
        {
          "name": "Deslize Mortal",
          "description": "Velocidade maxima — impacto de colisao devastadora.",
          "damage": "5d8",
          "chi_cost": 6,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Tempestade Subterranea",
          "description": "Multiplos ataques do subsolo em rapida sequencia.",
          "damage": "6d6+2",
          "chi_cost": 6,
          "status": [
            "stun",
            "slow",
            "blind"
          ]
        },
        {
          "name": "O Subsolo e a Arma",
          "description": "O dobrador e o subsolo — indistinguiveis e imparaveis.",
          "damage": "6d8+2",
          "chi_cost": 7,
          "status": [
            "stun",
            "slow",
            "root",
            "blind"
          ]
        }
      ],
      "passive_effect": {
        "type": "move",
        "description": "Velocidade maxima subterranea. Pode atacar e mergulhar de volta no mesmo turno.",
        "chi_cost": 3,
        "dice": "-",
        "status": []
      }
    },
    {
      "id": "salto-de-catapulta",
      "name": "Salto de Catapulta",
      "element": "earth",
      "category": "agility",
      "tier": 2,
      "description": "",
      "position": "off",
      "requirements": {
        "FOR": 3,
        "AGI": 3
      },
      "prerequisites": [
        "Plataforma Elevatoria"
      ],
      "attacks": [
        {
          "name": "Lancamento Vertical",
          "description": "Pilar lanca verticalmente para ganhar altitude maxima.",
          "damage": "1d8+2",
          "chi_cost": 2,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Lancamento Obliquo",
          "description": "Pilar com angulo — lanca em arco para um alvo.",
          "damage": "2d6",
          "chi_cost": 2,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Catapulta de Pedra",
          "description": "A propria rocha e lancada junto com o dobrador.",
          "damage": "2d6+2",
          "chi_cost": 3,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Lancamento Duplo",
          "description": "Dois pilares em sequencia — alcance dobrado.",
          "damage": "3d6",
          "chi_cost": 3,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Meteoro de Terra",
          "description": "Cai como meteoro — impacto catastrofico no alvo.",
          "damage": "4d6+2",
          "chi_cost": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Catapulta Dupla",
          "description": "Dois lancamentos de angulos opostos em simultaneo.",
          "damage": "4d6",
          "chi_cost": 4,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "name": "Voo de Pedra",
          "description": "O dobrador voa em arco longo sobre o campo.",
          "damage": "3d8+2",
          "chi_cost": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Catapulta Colossal",
          "description": "Um pilar enorme que lanca a grande distancia.",
          "damage": "5d6",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow",
            "root"
          ]
        },
        {
          "name": "Lance Perfeito",
          "description": "O lancamento calculado com precisao absoluta.",
          "damage": "5d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "name": "Projetil Humano",
          "description": "O dobrador torna-se um projétil de pedra irresistivel.",
          "damage": "6d8",
          "chi_cost": 6,
          "status": [
            "stun",
            "slow",
            "root",
            "blind"
          ]
        }
      ],
      "passive_effect": null
    },
    {
      "id": "fantasma-de-terra",
      "name": "Fantasma de Terra",
      "element": "earth",
      "category": "agility",
      "tier": 4,
      "description": "",
      "position": "off",
      "requirements": {
        "AGI": 9,
        "FOR": 6,
        "PER": 5
      },
      "prerequisites": [
        "Deslize Sismico",
        "Salto de Catapulta"
      ],
      "attacks": [
        {
          "name": "Mao da Terra",
          "description": "Mao de pedra que emerge do chao e agarra o alvo.",
          "damage": "3d6+2",
          "chi_cost": 4,
          "status": [
            "root",
            "stun"
          ]
        },
        {
          "name": "Espiga Subterranea",
          "description": "Espiga de rocha que perfura verticalmente sob o alvo.",
          "damage": "4d6",
          "chi_cost": 5,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Emergencia Explosiva",
          "description": "Emerge explodindo pedras em area ao redor.",
          "damage": "4d6+3",
          "chi_cost": 5,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "name": "Toco de Pedra",
          "description": "Agarra o pe do inimigo pelo chao — imobiliza completamente.",
          "damage": "3d8",
          "chi_cost": 5,
          "status": [
            "root",
            "slow"
          ]
        },
        {
          "name": "Fantasma Revelado",
          "description": "Emerge com toda a forca antes de submergir novamente.",
          "damage": "5d8+3",
          "chi_cost": 7,
          "status": [
            "stun",
            "slow",
            "root"
          ]
        },
        {
          "name": "Armadilha Subterranea",
          "description": "Prepara uma armadilha de pedra no subsolo indetectavel.",
          "damage": "4d8+2",
          "chi_cost": 6,
          "status": [
            "root",
            "stun",
            "slow"
          ]
        },
        {
          "name": "Multiplas Emergencias",
          "description": "Emerge em tres pontos diferentes em rapida sequencia.",
          "damage": "5d8",
          "chi_cost": 7,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "name": "O Fantasma Atacou",
          "description": "O inimigo nao percebeu absolutamente nada ate ser tarde.",
          "damage": "6d8",
          "chi_cost": 8,
          "status": [
            "stun",
            "root",
            "blind"
          ]
        },
        {
          "name": "Terra Viva",
          "description": "A terra inteira ao redor e uma extensao do dobrador.",
          "damage": "7d8",
          "chi_cost": 8,
          "status": [
            "stun",
            "root",
            "slow",
            "blind"
          ]
        },
        {
          "name": "O Subsolo Domina",
          "description": "O dobrador domina completamente o terreno.",
          "damage": "8d8+2",
          "chi_cost": 9,
          "status": [
            "stun",
            "root",
            "slow",
            "blind",
            "fear"
          ]
        }
      ],
      "passive_effect": null
    },
    {
      "id": "muralha-de-terra",
      "name": "Muralha de Terra",
      "element": "earth",
      "category": "brute",
      "tier": 1,
      "description": "Cria barreira que absorve 3d8 dano. Pode ser lancada contra inimigos causando 2d6.",
      "position": "def",
      "requirements": {
        "FOR": 2,
        "RES": 1
      },
      "prerequisites": [],
      "attacks": [
        {
          "name": "Muralha Caindo",
          "description": "A muralha tomba propositalmente sobre o inimigo.",
          "damage": "2d6+2",
          "chi_cost": 2,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Projetil de Muralha",
          "description": "Um fragmento da muralha lancado a alta velocidade.",
          "damage": "3d6",
          "chi_cost": 3,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Muralha Expansiva",
          "description": "A muralha expande e esmaga inimigos proximos.",
          "damage": "3d6+2",
          "chi_cost": 3,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Crush de Muralha",
          "description": "Duas muralhas esmagam de dois lados em simultaneo.",
          "damage": "3d8",
          "chi_cost": 4,
          "status": [
            "stun",
            "root"
          ]
        },
        {
          "name": "Muralha Explosiva",
          "description": "A muralha explode em projéteis ao ser destruida.",
          "damage": "4d6",
          "chi_cost": 4,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "name": "Avalanche de Muralha",
          "description": "A muralha desmorona em avalanche devastadora.",
          "damage": "4d6+2",
          "chi_cost": 4,
          "status": [
            "stun",
            "slow",
            "blind"
          ]
        },
        {
          "name": "Muralha Gigante",
          "description": "Uma muralha colossal que esmaga ate estruturas.",
          "damage": "4d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "root"
          ]
        },
        {
          "name": "Fortaleza Caindo",
          "description": "A fortaleza inteira colapsa sobre o inimigo.",
          "damage": "5d6+2",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow",
            "root"
          ]
        },
        {
          "name": "Muralha de Granito",
          "description": "Muralha de granito puro — quase indestrutivel.",
          "damage": "5d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "root",
            "slow"
          ]
        },
        {
          "name": "A Muralha Eterna",
          "description": "A maior muralha possivel — colapsa tudo ao redor.",
          "damage": "6d8",
          "chi_cost": 6,
          "status": [
            "stun",
            "root",
            "slow",
            "blind"
          ]
        }
      ],
      "passive_effect": {
        "type": "def",
        "description": "Cria barreira que absorve 3d8 dano. Pode ser lancada contra inimigos causando 2d6.",
        "chi_cost": 2,
        "dice": "3d8",
        "status": [
          "shield"
        ]
      }
    }
  ],
  "air": [
    {
      "id": "desapego-total",
      "name": "Desapego Total",
      "element": "air",
      "category": "spirit",
      "tier": 2,
      "description": "Restaura 1d4 chi por turno. Imune a fear, slow psiquico e manipulacao emocional.",
      "position": "pass",
      "requirements": {
        "CHI": 4,
        "ESP": 3
      },
      "prerequisites": [
        "Meditacao do Vento"
      ],
      "attacks": [
        {
          "name": "Desapego Ativo",
          "description": "O desapego interior transforma-se em ataque de vento puro.",
          "damage": "1d8+2",
          "chi_cost": 2,
          "status": [
            "slow"
          ]
        },
        {
          "name": "Paz Armada",
          "description": "A paz interior exterioriza-se em golpe de ar certeiro.",
          "damage": "2d6",
          "chi_cost": 2,
          "status": []
        },
        {
          "name": "Tranquilidade Ofensiva",
          "description": "A tranquilidade absoluta e a arma mais afiada de todas.",
          "damage": "2d6+2",
          "chi_cost": 3,
          "status": []
        },
        {
          "name": "Serenidade Explosiva",
          "description": "A serenidade acumula silenciosamente e explode em ataque.",
          "damage": "2d8",
          "chi_cost": 3,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Vento da Paz",
          "description": "Um vento de paz que ainda assim derruba tudo a frente.",
          "damage": "3d6",
          "chi_cost": 3,
          "status": [
            "slow"
          ]
        },
        {
          "name": "Calma do Mestre",
          "description": "A calma do mestre manifesta-se em poder devastador.",
          "damage": "3d6+2",
          "chi_cost": 4,
          "status": [
            "slow",
            "stun"
          ]
        },
        {
          "name": "Equanimidade Marcial",
          "description": "A equanimidade interior guia o golpe perfeito.",
          "damage": "3d8",
          "chi_cost": 4,
          "status": []
        },
        {
          "name": "Desapego Total em Ataque",
          "description": "O desapego total converte-se em forca pura e imparavel.",
          "damage": "4d6",
          "chi_cost": 4,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Paz do Avatar",
          "description": "A paz que o Avatar carrega dentro de si — devastadora.",
          "damage": "4d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "O Vazio que Ataca",
          "description": "O vazio interior absoluto e a arma mais devastadora.",
          "damage": "5d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow",
            "blind"
          ]
        }
      ],
      "passive_effect": {
        "type": "restore",
        "description": "Restaura 1d4 chi por turno. Imune a fear, slow psiquico e manipulacao emocional.",
        "chi_cost": 0,
        "dice": "1d4/t",
        "status": [
          "regen",
          "shield"
        ]
      }
    },
    {
      "id": "ligacao-ao-espirito",
      "name": "Ligacao ao Espirito",
      "element": "air",
      "category": "spirit",
      "tier": 2,
      "description": "Ve e comunica com espiritos. Deteta portais espirituais. Pede informacao a espiritos amigaveis.",
      "position": "pass",
      "requirements": {
        "ESP": 3,
        "CHI": 3
      },
      "prerequisites": [
        "Escuta do Ar"
      ],
      "attacks": [
        {
          "name": "Sopro Espiritual",
          "description": "O vento carrega a essencia dos espiritos em ataque.",
          "damage": "1d8+2",
          "chi_cost": 2,
          "status": [
            "slow"
          ]
        },
        {
          "name": "Eco Espiritual",
          "description": "O eco espiritual manifesta-se em ataque visivel.",
          "damage": "2d6",
          "chi_cost": 2,
          "status": []
        },
        {
          "name": "Vento dos Espiritos",
          "description": "Os espiritos guiam o ataque de ar com precisao.",
          "damage": "2d6+2",
          "chi_cost": 3,
          "status": [
            "slow"
          ]
        },
        {
          "name": "Chama Espiritual",
          "description": "A ligacao espiritual amplifica o vento em poder.",
          "damage": "2d8",
          "chi_cost": 3,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Rajada dos Espiritos",
          "description": "Os espiritos sopram em conjunto num unico ataque.",
          "damage": "3d6",
          "chi_cost": 3,
          "status": [
            "slow",
            "stun"
          ]
        },
        {
          "name": "Eco do Alem",
          "description": "O alem ecoando neste mundo em ataque puro.",
          "damage": "3d6+2",
          "chi_cost": 4,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "name": "Voz dos Espiritos",
          "description": "A voz dos espiritos como onda de choque de ar.",
          "damage": "3d8",
          "chi_cost": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Manifestacao Espiritual",
          "description": "Um espirito manifesta-se brevemente em ataque direto.",
          "damage": "4d6",
          "chi_cost": 4,
          "status": [
            "stun",
            "fear"
          ]
        },
        {
          "name": "Exercito Espiritual",
          "description": "Multiplos espiritos atacam em simultaneo.",
          "damage": "4d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow",
            "fear"
          ]
        },
        {
          "name": "O Espirito Ataca",
          "description": "O espirito do vento encarna brevemente neste mundo.",
          "damage": "5d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow",
            "fear",
            "blind"
          ]
        }
      ],
      "passive_effect": {
        "type": "utility",
        "description": "Ve e comunica com espiritos. Deteta portais espirituais. Pede informacao a espiritos amigaveis.",
        "chi_cost": 2,
        "dice": "-",
        "status": []
      }
    },
    {
      "id": "projecao-espiritual",
      "name": "Projecao Espiritual",
      "element": "air",
      "category": "spirit",
      "tier": 3,
      "description": "Viaja pelo mundo espiritual. O corpo fica vulneravel. Espiona e comunica a distancia.",
      "position": "pass",
      "requirements": {
        "CHI": 6,
        "ESP": 6
      },
      "prerequisites": [
        "Ligacao ao Espirito",
        "Desapego Total"
      ],
      "attacks": [
        {
          "name": "Ataque Espiritual",
          "description": "O espirito projeta-se e ataca diretamente o inimigo.",
          "damage": "2d8+2",
          "chi_cost": 4,
          "status": [
            "stun",
            "fear"
          ]
        },
        {
          "name": "Fantasma de Ataque",
          "description": "O espirito usa o proprio corpo como projétil de ar.",
          "damage": "3d6+2",
          "chi_cost": 4,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Projecao Ofensiva",
          "description": "A projecao espiritual e usada diretamente em combate.",
          "damage": "3d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "fear"
          ]
        },
        {
          "name": "Duplo Ataque",
          "description": "O corpo e o espirito atacam em simultâneo.",
          "damage": "4d6+2",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Espirito Combatente",
          "description": "O espirito e um guerreiro que luta completamente sozinho.",
          "damage": "4d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "fear"
          ]
        },
        {
          "name": "Projecao Total",
          "description": "A projecao total deixa o espirito completamente livre.",
          "damage": "5d6+2",
          "chi_cost": 6,
          "status": [
            "stun",
            "fear",
            "blind"
          ]
        },
        {
          "name": "O Espirito Livre",
          "description": "Um espirito livre e absolutamente imparavel.",
          "damage": "5d8",
          "chi_cost": 6,
          "status": [
            "stun",
            "fear",
            "slow"
          ]
        },
        {
          "name": "Fantasma de Guerra",
          "description": "O espirito de um guerreiro antigo manifesta-se em batalha.",
          "damage": "6d6+2",
          "chi_cost": 7,
          "status": [
            "stun",
            "fear",
            "slow"
          ]
        },
        {
          "name": "Dois Mundos",
          "description": "O dobrador luta em dois mundos completamente em simultaneo.",
          "damage": "6d8",
          "chi_cost": 7,
          "status": [
            "stun",
            "fear",
            "blind"
          ]
        },
        {
          "name": "Transcendencia",
          "description": "O dobrador transcende a fisica — poder absoluto.",
          "damage": "7d8+2",
          "chi_cost": 8,
          "status": [
            "stun",
            "fear",
            "blind",
            "slow"
          ]
        }
      ],
      "passive_effect": {
        "type": "special",
        "description": "Viaja pelo mundo espiritual. O corpo fica vulneravel. Espiona e comunica a distancia.",
        "chi_cost": 4,
        "dice": "-",
        "status": []
      }
    },
    {
      "id": "respiracao-cosmica",
      "name": "Respiracao Cosmica",
      "element": "air",
      "category": "spirit",
      "tier": 3,
      "description": "Restaura 2d4 chi ao sincronizar. Alcance de todas as habilidades de ar triplica.",
      "position": "pass",
      "requirements": {
        "CHI": 7,
        "ESP": 5,
        "PER": 4
      },
      "prerequisites": [
        "Desapego Total"
      ],
      "attacks": [
        {
          "name": "Sopro Cosmico",
          "description": "O cosmo inteiro sopra atraves do dobrador em ataque.",
          "damage": "2d8+2",
          "chi_cost": 4,
          "status": [
            "slow"
          ]
        },
        {
          "name": "Respiracao em Ataque",
          "description": "A respiracao cosmica liberta-se em ataque devastador.",
          "damage": "3d6+2",
          "chi_cost": 4,
          "status": [
            "slow",
            "stun"
          ]
        },
        {
          "name": "Vento do Cosmos",
          "description": "O vento cosmico concentrado num unico ponto.",
          "damage": "3d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Exalacao Cosmica",
          "description": "A exalacao cosmica varre completamente o campo.",
          "damage": "4d6+2",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow",
            "blind"
          ]
        },
        {
          "name": "Respiracao Total",
          "description": "Toda a respiracao cosmica num so momento explosivo.",
          "damage": "4d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Sopro Universal",
          "description": "O universo inteiro sopra atraves do dobrador.",
          "damage": "5d6+2",
          "chi_cost": 6,
          "status": [
            "stun",
            "slow",
            "blind"
          ]
        },
        {
          "name": "Exalacao Universal",
          "description": "A exalacao que literalmente muda o cosmos.",
          "damage": "5d8",
          "chi_cost": 6,
          "status": [
            "stun",
            "slow",
            "blind"
          ]
        },
        {
          "name": "Vento Eterno",
          "description": "O vento que sopra desde o inicio dos tempos.",
          "damage": "6d6+4",
          "chi_cost": 7,
          "status": [
            "stun",
            "slow",
            "blind"
          ]
        },
        {
          "name": "Respiracao do Cosmos",
          "description": "A respiracao que o proprio cosmos usa.",
          "damage": "6d8+2",
          "chi_cost": 7,
          "status": [
            "stun",
            "slow",
            "blind",
            "root"
          ]
        },
        {
          "name": "O Universo Sopra",
          "description": "O universo inteiro sopra em ataque absolutamente puro.",
          "damage": "8d8",
          "chi_cost": 8,
          "status": [
            "stun",
            "slow",
            "blind",
            "root"
          ]
        }
      ],
      "passive_effect": {
        "type": "restore",
        "description": "Restaura 2d4 chi ao sincronizar. Alcance de todas as habilidades de ar triplica.",
        "chi_cost": 3,
        "dice": "2d4",
        "status": [
          "regen"
        ]
      }
    },
    {
      "id": "fusao-espiritual",
      "name": "Fusao Espiritual",
      "element": "air",
      "category": "spirit",
      "tier": 4,
      "description": "Funde com espirito aliado por 3 turnos. Todos os atributos +3. Restaura 3d8 chi.",
      "position": "pass",
      "requirements": {
        "CHI": 10,
        "ESP": 10
      },
      "prerequisites": [
        "Projecao Espiritual",
        "Respiracao Cosmica"
      ],
      "attacks": [
        {
          "name": "Golpe da Fusao",
          "description": "O espirito funde-se com o punho do dobrador.",
          "damage": "3d8+2",
          "chi_cost": 5,
          "status": [
            "stun",
            "fear"
          ]
        },
        {
          "name": "Ataque Fundido",
          "description": "O dobrador fundido ataca com poder totalmente duplicado.",
          "damage": "4d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Furia Espiritual",
          "description": "A furia do espirito fundido manifesta-se em poder.",
          "damage": "4d8+4",
          "chi_cost": 6,
          "status": [
            "stun",
            "fear"
          ]
        },
        {
          "name": "Poder Duplo",
          "description": "O dobrador possui o poder de dois seres completamente.",
          "damage": "5d8",
          "chi_cost": 6,
          "status": [
            "stun",
            "slow",
            "fear"
          ]
        },
        {
          "name": "Golpe do Ser Fundido",
          "description": "O ser fundido ataca com toda a sua essencia.",
          "damage": "5d8+3",
          "chi_cost": 7,
          "status": [
            "stun",
            "fear"
          ]
        },
        {
          "name": "Manifestacao Total",
          "description": "O espirito manifesta-se completamente neste mundo.",
          "damage": "6d8",
          "chi_cost": 7,
          "status": [
            "stun",
            "fear",
            "blind"
          ]
        },
        {
          "name": "Forca Combinada",
          "description": "A forca de dois mundos completamente combinada.",
          "damage": "6d8+4",
          "chi_cost": 8,
          "status": [
            "stun",
            "fear",
            "slow"
          ]
        },
        {
          "name": "O Ser Completo",
          "description": "O dobrador e o espirito — completos e absolutos.",
          "damage": "7d8",
          "chi_cost": 8,
          "status": [
            "stun",
            "fear",
            "slow",
            "blind"
          ]
        },
        {
          "name": "Fusao Absoluta",
          "description": "A fusao mais completa e poderosa possivel.",
          "damage": "8d8",
          "chi_cost": 9,
          "status": [
            "stun",
            "fear",
            "slow",
            "blind"
          ]
        },
        {
          "name": "O Avatar e o Espirito",
          "description": "Quando ambos se unem — absolutamente nada os pode parar.",
          "damage": "10d8",
          "chi_cost": 10,
          "status": [
            "stun",
            "fear",
            "slow",
            "blind",
            "root"
          ]
        }
      ],
      "passive_effect": {
        "type": "special",
        "description": "Funde com espirito aliado por 3 turnos. Todos os atributos +3. Restaura 3d8 chi.",
        "chi_cost": 7,
        "dice": "3d8",
        "status": [
          "regen",
          "shield"
        ]
      }
    },
    {
      "id": "voo-com-planador",
      "name": "Voo com Planador",
      "element": "air",
      "category": "agility",
      "tier": 2,
      "description": "Voa silenciosamente por ate 10 turnos. Pode atacar em voo sem perder altitude.",
      "position": "off",
      "requirements": {
        "AGI": 4,
        "CHI": 2
      },
      "prerequisites": [
        "Salto de Ar"
      ],
      "attacks": [
        {
          "name": "Ataque em Voo",
          "description": "Ataca em picado durante o voo com forca de gravidade.",
          "damage": "2d6+2",
          "chi_cost": 2,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Mergulho do Planador",
          "description": "Mergulho em picado que aumenta o impacto.",
          "damage": "3d6",
          "chi_cost": 3,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Planador Ofensivo",
          "description": "Usa o proprio planador como arma de impacto.",
          "damage": "3d6+2",
          "chi_cost": 3,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Voo de Ataque",
          "description": "Voa em linhas de ataque multiplas e coordenadas.",
          "damage": "3d8",
          "chi_cost": 4,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "name": "Mergulho Explosivo",
          "description": "Mergulho a alta velocidade — colisao catastrofica.",
          "damage": "4d6",
          "chi_cost": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Planador Giratorio",
          "description": "Giro com planador — atinge tudo ao redor.",
          "damage": "4d6+2",
          "chi_cost": 4,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Voo Rasante de Ataque",
          "description": "Voo rasante que atinge linha inteira de inimigos.",
          "damage": "4d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Ataque Supremo em Voo",
          "description": "O ataque mais poderoso possivel realizado em voo.",
          "damage": "5d6+2",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow",
            "blind"
          ]
        },
        {
          "name": "Planador da Morte",
          "description": "O planador e usado como arma de destruicao pura.",
          "damage": "5d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "name": "Voo do Mestre do Vento",
          "description": "O voo absolutamente perfeito de um mestre do vento.",
          "damage": "6d8",
          "chi_cost": 6,
          "status": [
            "stun",
            "slow",
            "blind"
          ]
        }
      ],
      "passive_effect": {
        "type": "move",
        "description": "Voa silenciosamente por ate 10 turnos. Pode atacar em voo sem perder altitude.",
        "chi_cost": 2,
        "dice": "-",
        "status": []
      }
    },
    {
      "id": "esfera-de-ar",
      "name": "Esfera de Ar",
      "element": "air",
      "category": "agility",
      "tier": 2,
      "description": "Reduz dano fisico em 2d4. Permite rotacoes e esquivas em qualquer direcao.",
      "position": "def",
      "requirements": {
        "AGI": 4,
        "CHI": 3
      },
      "prerequisites": [
        "Passo do Vento"
      ],
      "attacks": [
        {
          "name": "Esfera Explosiva",
          "description": "A esfera explode em onda de vento devastadora.",
          "damage": "2d6+2",
          "chi_cost": 2,
          "status": [
            "slow",
            "stun"
          ]
        },
        {
          "name": "Esfera Rolante",
          "description": "A esfera avanca e atropela o inimigo no caminho.",
          "damage": "3d6",
          "chi_cost": 3,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Esfera Giratoria",
          "description": "A esfera gira a alta velocidade — absolutamente cortante.",
          "damage": "3d6+2",
          "chi_cost": 3,
          "status": [
            "slow",
            "stun"
          ]
        },
        {
          "name": "Esfera de Impacto",
          "description": "A esfera e lancada como projétil de vento puro.",
          "damage": "3d8",
          "chi_cost": 4,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Esfera Expansiva",
          "description": "A esfera expande instantaneamente em area.",
          "damage": "4d6",
          "chi_cost": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Colisao de Esferas",
          "description": "O dobrador colide intencionalmente na esfera.",
          "damage": "4d6+2",
          "chi_cost": 4,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "name": "Esfera Dupla",
          "description": "Duas esferas de vento em direcoes completamente diferentes.",
          "damage": "4d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Tornado de Esferas",
          "description": "A esfera transforma-se num tornado devastador.",
          "damage": "5d6+2",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow",
            "blind"
          ]
        },
        {
          "name": "Esfera Maxima",
          "description": "A maior esfera possivel de vento concentrado.",
          "damage": "5d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow",
            "blind"
          ]
        },
        {
          "name": "Esfera Absoluta",
          "description": "A esfera que contem o poder de um tornado completo.",
          "damage": "6d8",
          "chi_cost": 6,
          "status": [
            "stun",
            "slow",
            "blind",
            "root"
          ]
        }
      ],
      "passive_effect": {
        "type": "def",
        "description": "Reduz dano fisico em 2d4. Permite rotacoes e esquivas em qualquer direcao.",
        "chi_cost": 2,
        "dice": "2d4",
        "status": [
          "shield"
        ]
      }
    },
    {
      "id": "correntes-globais",
      "name": "Correntes Globais",
      "element": "air",
      "category": "agility",
      "tier": 3,
      "description": "Velocidade maxima de voo em correntes globais. Cruzar grandes distancias rapidamente.",
      "position": "off",
      "requirements": {
        "AGI": 6,
        "CHI": 4,
        "PER": 4
      },
      "prerequisites": [
        "Voo com Planador"
      ],
      "attacks": [
        {
          "name": "Corrente em Ataque",
          "description": "Uma corrente global e redirecionada em ataque certeiro.",
          "damage": "2d8+2",
          "chi_cost": 3,
          "status": [
            "slow"
          ]
        },
        {
          "name": "Golpe de Corrente",
          "description": "Uma corrente global concentrada num unico golpe.",
          "damage": "3d6+2",
          "chi_cost": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Onda de Corrente",
          "description": "Uma onda de corrente global devasta toda a area.",
          "damage": "3d8",
          "chi_cost": 4,
          "status": [
            "stun",
            "slow",
            "blind"
          ]
        },
        {
          "name": "Correntes Multiplas",
          "description": "Multiplas correntes atacam de direcoes completamente diferentes.",
          "damage": "4d6+2",
          "chi_cost": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Tempestade de Correntes",
          "description": "As correntes globais formam uma tempestade devastadora.",
          "damage": "4d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow",
            "blind"
          ]
        },
        {
          "name": "Corrente Suprema",
          "description": "A corrente mais poderosa do mundo em ataque puro.",
          "damage": "5d6+2",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Vortice Global",
          "description": "As correntes formam um vortice de escala global.",
          "damage": "5d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow",
            "blind",
            "root"
          ]
        },
        {
          "name": "O Mundo Sopra",
          "description": "O mundo inteiro sopra em direcao ao inimigo.",
          "damage": "6d6+4",
          "chi_cost": 6,
          "status": [
            "stun",
            "slow",
            "blind"
          ]
        },
        {
          "name": "Corrente do Fim",
          "description": "A corrente que termina absolutamente tudo.",
          "damage": "6d8+2",
          "chi_cost": 6,
          "status": [
            "stun",
            "slow",
            "blind",
            "root"
          ]
        },
        {
          "name": "As Correntes do Mundo",
          "description": "As correntes do mundo convergem num ponto imparavel.",
          "damage": "7d8",
          "chi_cost": 7,
          "status": [
            "stun",
            "slow",
            "blind",
            "root"
          ]
        }
      ],
      "passive_effect": {
        "type": "move",
        "description": "Velocidade maxima de voo em correntes globais. Cruzar grandes distancias rapidamente.",
        "chi_cost": 3,
        "dice": "-",
        "status": []
      }
    },
    {
      "id": "esquiva-perfeita",
      "name": "Esquiva Perfeita",
      "element": "air",
      "category": "agility",
      "tier": 3,
      "description": "50% chance de esquivar completamente qualquer ataque por 3 turnos.",
      "position": "def",
      "requirements": {
        "AGI": 7,
        "PER": 5
      },
      "prerequisites": [
        "Esfera de Ar",
        "Passo do Vento"
      ],
      "attacks": [
        {
          "name": "Contra-Vento",
          "description": "Ao esquivar, giro de vento atinge de flanco o atacante.",
          "damage": "2d6",
          "chi_cost": 3,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Redemoinho de Esquiva",
          "description": "Esquiva que cria redemoinho — empurra o atacante.",
          "damage": "2d6+2",
          "chi_cost": 3,
          "status": [
            "slow"
          ]
        },
        {
          "name": "Vento que Responde",
          "description": "O vento retorna o ataque em triplo ao atacante.",
          "damage": "3d6+2",
          "chi_cost": 4,
          "status": [
            "slow",
            "stun"
          ]
        },
        {
          "name": "O Ar Contra-Ataca",
          "description": "O ar ao redor ataca o inimigo que errou.",
          "damage": "4d6",
          "chi_cost": 4,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "name": "Forma do Vazio",
          "description": "O corpo torna-se ar — o contra e absolutamente devastador.",
          "damage": "5d6",
          "chi_cost": 5,
          "status": [
            "stun",
            "blind",
            "slow"
          ]
        },
        {
          "name": "Vento Vindicativo",
          "description": "O vento lembra cada ataque e responde com forca.",
          "damage": "4d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Esquiva do Fantasma",
          "description": "O dobrador e mais vento do que corpo.",
          "damage": "5d6+2",
          "chi_cost": 5,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "name": "Contra-Tempestade",
          "description": "A esquiva desencadeia uma tempestade de resposta.",
          "damage": "5d8",
          "chi_cost": 6,
          "status": [
            "stun",
            "slow",
            "blind"
          ]
        },
        {
          "name": "Forma do Vento",
          "description": "O dobrador e o vento — exatamente a mesma coisa.",
          "damage": "6d6+2",
          "chi_cost": 6,
          "status": [
            "stun",
            "blind",
            "slow"
          ]
        },
        {
          "name": "Esquiva Absoluta",
          "description": "A esquiva perfeita — o inimigo simplesmente nunca acerta.",
          "damage": "6d8",
          "chi_cost": 7,
          "status": [
            "stun",
            "blind",
            "slow",
            "fear"
          ]
        }
      ],
      "passive_effect": {
        "type": "def",
        "description": "50% chance de esquivar completamente qualquer ataque por 3 turnos.",
        "chi_cost": 3,
        "dice": "1d6",
        "status": [
          "shield"
        ]
      }
    },
    {
      "id": "voo-livre",
      "name": "Voo Livre",
      "element": "air",
      "category": "agility",
      "tier": 4,
      "description": "Voo permanente sem custo. Imune a ataques de chao e root.",
      "position": "off",
      "requirements": {
        "AGI": 10,
        "CHI": 8,
        "ESP": 8
      },
      "prerequisites": [
        "Correntes Globais",
        "Esquiva Perfeita"
      ],
      "attacks": [
        {
          "name": "Ataque do Voo Livre",
          "description": "Ataca em picado do voo livre — absolutamente imparavel.",
          "damage": "3d8+2",
          "chi_cost": 4,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "name": "Mergulho da Liberdade",
          "description": "Mergulho de voo livre — colisao absolutamente catastrofica.",
          "damage": "4d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Golpe do Vento Livre",
          "description": "O vento livre guia o golpe mais perfeito possivel.",
          "damage": "4d8+3",
          "chi_cost": 5,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "name": "Voo e Ataque",
          "description": "Voa e ataca simultaneamente sem qualquer perda.",
          "damage": "5d8",
          "chi_cost": 6,
          "status": [
            "stun",
            "slow",
            "blind"
          ]
        },
        {
          "name": "Livre como o Vento",
          "description": "Um ser que voa livremente ataca completamente livre.",
          "damage": "5d8+4",
          "chi_cost": 6,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Altitude Maxima e Ataque",
          "description": "A altitude maxima e usada como arma definitiva.",
          "damage": "6d8",
          "chi_cost": 7,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "name": "Voo Absoluto",
          "description": "O voo absoluto transforma-se em ataque absoluto.",
          "damage": "6d8+4",
          "chi_cost": 7,
          "status": [
            "stun",
            "slow",
            "blind"
          ]
        },
        {
          "name": "O Horizonte Ataca",
          "description": "O horizonte inteiro e o campo de ataque do dobrador.",
          "damage": "7d8",
          "chi_cost": 8,
          "status": [
            "stun",
            "slow",
            "blind",
            "root"
          ]
        },
        {
          "name": "A Liberdade e Letal",
          "description": "A liberdade do voo e a arma mais poderosa de todas.",
          "damage": "8d8",
          "chi_cost": 8,
          "status": [
            "stun",
            "slow",
            "blind"
          ]
        },
        {
          "name": "Voo do Avatar",
          "description": "Quando o Avatar voa livremente — nada no mundo o pode parar.",
          "damage": "10d8",
          "chi_cost": 10,
          "status": [
            "stun",
            "slow",
            "blind",
            "root",
            "fear"
          ]
        }
      ],
      "passive_effect": {
        "type": "special",
        "description": "Voo permanente sem custo. Imune a ataques de chao e root.",
        "chi_cost": 4,
        "dice": "2d6",
        "status": [
          "shield",
          "regen"
        ]
      }
    },
    {
      "id": "escudo-de-ar",
      "name": "Escudo de Ar",
      "element": "air",
      "category": "brute",
      "tier": 1,
      "description": "Deflecte ataque fisico ou projétil. Pode redirecionar o ataque para outro alvo.",
      "position": "def",
      "requirements": {
        "FOR": 2,
        "RES": 1
      },
      "prerequisites": [],
      "attacks": [
        {
          "name": "Escudo Ativo",
          "description": "O escudo de ar redireciona o ataque para o proprio inimigo.",
          "damage": "2d6+2",
          "chi_cost": 2,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Escudo Explosivo",
          "description": "O escudo explode ao ser partido — onda de vento radial.",
          "damage": "3d6",
          "chi_cost": 3,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Escudo Giratorio",
          "description": "O escudo gira e corta tudo que se aproxima.",
          "damage": "3d6+2",
          "chi_cost": 3,
          "status": [
            "slow",
            "bleed"
          ]
        },
        {
          "name": "Escudo de Impacto",
          "description": "O escudo usa a forca do ataque para contra-atacar.",
          "damage": "3d8",
          "chi_cost": 4,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Escudo Expansivo",
          "description": "O escudo expande para cobrir area ao redor.",
          "damage": "4d6",
          "chi_cost": 4,
          "status": [
            "slow",
            "stun"
          ]
        },
        {
          "name": "Redemoinho Defensivo",
          "description": "Um redemoinho que bloqueia e ataca em simultaneo.",
          "damage": "4d6+2",
          "chi_cost": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Escudo do Vento",
          "description": "O vento protege e ataca completamente em simultaneo.",
          "damage": "4d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "name": "Barreira Absoluta",
          "description": "Uma barreira de vento que protege area ao redor.",
          "damage": "5d6",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow",
            "shield"
          ]
        },
        {
          "name": "Escudo Solar",
          "description": "Escudo de vento que amplifica os proprios ataques.",
          "damage": "5d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Vento Protetor",
          "description": "O vento protege e destroi em absolutamente igual medida.",
          "damage": "6d6+2",
          "chi_cost": 6,
          "status": [
            "stun",
            "slow",
            "blind"
          ]
        }
      ],
      "passive_effect": {
        "type": "def",
        "description": "Deflecte ataque fisico ou projétil. Pode redirecionar o ataque para outro alvo.",
        "chi_cost": 2,
        "dice": "2d6",
        "status": [
          "shield"
        ]
      }
    }
  ],
  "none": [
    {
      "id": "resistencia-mental",
      "name": "Resistencia Mental",
      "element": "none",
      "category": "spirit",
      "tier": 2,
      "description": "Imune a fear e manipulacao emocional. Restaura 1d4 chi ao sofrer dano psiquico.",
      "position": "pass",
      "requirements": {
        "RES": 3,
        "ESP": 3
      },
      "prerequisites": [
        "Meditacao Marcial"
      ],
      "attacks": [
        {
          "name": "Vontade de Aco",
          "description": "A resistencia mental converte-se em forca fisica pura.",
          "damage": "2d6+2",
          "chi_cost": 3,
          "status": []
        },
        {
          "name": "Determinacao",
          "description": "A determinacao inabalavel amplifica cada golpe dado.",
          "damage": "3d6",
          "chi_cost": 3,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Forca Interior",
          "description": "A forca interior extravasa em ataque devastador.",
          "damage": "3d6+2",
          "chi_cost": 3,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Resolucao",
          "description": "A resolucao inabalavel guia o ataque com precisao.",
          "damage": "3d8",
          "chi_cost": 4,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Mentalmente Invencivel",
          "description": "A mente invencivel torna o corpo invencivel.",
          "damage": "4d6",
          "chi_cost": 4,
          "status": [
            "stun",
            "fear"
          ]
        },
        {
          "name": "Resistencia Ativa",
          "description": "A resistencia mental amplifica cada ataque fisico.",
          "damage": "4d6+2",
          "chi_cost": 4,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Foco Absoluto",
          "description": "Foco absoluto concentrado numa unica acao devastadora.",
          "damage": "4d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Mente de Batalha",
          "description": "A mente de batalha em pleno potencial maximal.",
          "damage": "5d6",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Determinacao Suprema",
          "description": "A determinacao mais profunda possivel.",
          "damage": "5d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "fear",
            "slow"
          ]
        },
        {
          "name": "Inquebravel",
          "description": "Nada quebra esta mente — e nada sobrevive a este golpe.",
          "damage": "6d8",
          "chi_cost": 6,
          "status": [
            "stun",
            "fear",
            "slow",
            "blind"
          ]
        }
      ],
      "passive_effect": {
        "type": "restore",
        "description": "Imune a fear e manipulacao emocional. Restaura 1d4 chi ao sofrer dano psiquico.",
        "chi_cost": 0,
        "dice": "1d4",
        "status": [
          "regen",
          "shield"
        ]
      }
    },
    {
      "id": "visao-de-combate",
      "name": "Visao de Combate",
      "element": "none",
      "category": "precise",
      "tier": 2,
      "description": "Por 2 turnos, todas as acoes inimigas ficam previsiveis. +3 a defesa.",
      "position": "def",
      "requirements": {
        "PER": 4,
        "ESP": 3
      },
      "prerequisites": [
        "Leitura de Chi"
      ],
      "attacks": [
        {
          "name": "Ataque Previsto",
          "description": "Ataca o ponto exato onde o inimigo nao pode defender.",
          "damage": "2d6+2",
          "chi_cost": 2,
          "status": []
        },
        {
          "name": "Golpe na Brecha",
          "description": "Identifica e ataca a brecha perfeita do inimigo.",
          "damage": "3d6",
          "chi_cost": 3,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Sequencia Calculada",
          "description": "Calcula a sequencia perfeita de golpes com antecedencia.",
          "damage": "3d6+2",
          "chi_cost": 3,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Golpe do Futuro",
          "description": "Ataca onde o inimigo vai estar, nao onde esta agora.",
          "damage": "3d8",
          "chi_cost": 4,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Visao Total",
          "description": "Ve o campo inteiro de batalha com visao completamente ampla.",
          "damage": "4d6",
          "chi_cost": 4,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "name": "Brecha Critica",
          "description": "A brecha mais vulneravel — dano critico garantido.",
          "damage": "4d6+2",
          "chi_cost": 4,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Antecipacao Perfeita",
          "description": "Antecipa e responde antes que o inimigo aja.",
          "damage": "4d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Golpe Inevitavel",
          "description": "Um golpe que simplesmente nao pode ser evitado.",
          "damage": "5d6",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Visao do Mestre",
          "description": "A visao completa de um mestre de combate.",
          "damage": "5d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow",
            "blind"
          ]
        },
        {
          "name": "O Tempo Para",
          "description": "O tempo para para o guerreiro — ataque absolutamente perfeito.",
          "damage": "6d8",
          "chi_cost": 6,
          "status": [
            "stun",
            "slow",
            "blind",
            "fear"
          ]
        }
      ],
      "passive_effect": {
        "type": "utility",
        "description": "Por 2 turnos, todas as acoes inimigas ficam previsiveis. +3 a defesa.",
        "chi_cost": 2,
        "dice": "1d6",
        "status": [
          "shield"
        ]
      }
    },
    {
      "id": "chi-bloqueado",
      "name": "Chi Bloqueado",
      "element": "none",
      "category": "spirit",
      "tier": 3,
      "description": "Detecta dobra de sangue antes de ser afetado. Chance de resistir a efeitos de chi.",
      "position": "pass",
      "requirements": {
        "PER": 5,
        "ESP": 5,
        "RES": 3
      },
      "prerequisites": [
        "Resistencia Mental",
        "Leitura de Chi"
      ],
      "attacks": [
        {
          "name": "Golpe de Chi",
          "description": "Usa o conhecimento do chi para atacar pontos vitais.",
          "damage": "2d8+2",
          "chi_cost": 3,
          "status": [
            "silence"
          ]
        },
        {
          "name": "Toque Informado",
          "description": "Usa o conhecimento do chi para bloquear o inimigo.",
          "damage": "3d6",
          "chi_cost": 3,
          "status": [
            "silence",
            "slow"
          ]
        },
        {
          "name": "Golpe de Saber",
          "description": "O saber sobre o chi guia um golpe absolutamente certeiro.",
          "damage": "3d6+2",
          "chi_cost": 4,
          "status": [
            "silence",
            "stun"
          ]
        },
        {
          "name": "Bloqueio Informado",
          "description": "Usa o conhecimento para bloquear e responder.",
          "damage": "3d8",
          "chi_cost": 4,
          "status": [
            "silence",
            "stun"
          ]
        },
        {
          "name": "Chi Contra Chi",
          "description": "Usa o proprio chi do inimigo completamente contra ele.",
          "damage": "4d6",
          "chi_cost": 4,
          "status": [
            "silence",
            "stun",
            "slow"
          ]
        },
        {
          "name": "Golpe no Fluxo",
          "description": "Ataca diretamente o fluxo de chi do inimigo.",
          "damage": "4d6+2",
          "chi_cost": 5,
          "status": [
            "silence",
            "stun"
          ]
        },
        {
          "name": "Interrupcao do Chi",
          "description": "Interrompe completamente o fluxo de chi.",
          "damage": "4d8",
          "chi_cost": 5,
          "status": [
            "silence",
            "stun",
            "slow"
          ]
        },
        {
          "name": "Dominancia de Chi",
          "description": "Demonstra dominancia absoluta sobre o chi do inimigo.",
          "damage": "5d6",
          "chi_cost": 5,
          "status": [
            "silence",
            "stun",
            "fear"
          ]
        },
        {
          "name": "Chi Aniquilado",
          "description": "O chi do inimigo e aniquilado temporariamente.",
          "damage": "5d8",
          "chi_cost": 6,
          "status": [
            "silence",
            "stun",
            "fear",
            "slow"
          ]
        },
        {
          "name": "O Chi Nao Mente",
          "description": "O conhecimento absoluto do chi — ataque definitivo.",
          "damage": "6d8",
          "chi_cost": 6,
          "status": [
            "silence",
            "stun",
            "fear",
            "slow",
            "blind"
          ]
        }
      ],
      "passive_effect": {
        "type": "utility",
        "description": "Detecta dobra de sangue antes de ser afetado. Chance de resistir a efeitos de chi.",
        "chi_cost": 2,
        "dice": "1d8",
        "status": [
          "shield",
          "regen"
        ]
      }
    },
    {
      "id": "serenidade-do-kyoshi",
      "name": "Serenidade do Kyoshi",
      "element": "none",
      "category": "spirit",
      "tier": 3,
      "description": "Imune a todos os efeitos psiquicos. Restaura 1d6 chi apos dano critico.",
      "position": "pass",
      "requirements": {
        "PER": 6,
        "ESP": 6,
        "RES": 4
      },
      "prerequisites": [
        "Visao de Combate",
        "Resistencia Mental"
      ],
      "attacks": [
        {
          "name": "Serenidade em Ataque",
          "description": "A serenidade absoluta amplifica completamente cada golpe.",
          "damage": "2d8+2",
          "chi_cost": 4,
          "status": []
        },
        {
          "name": "Calma Devastadora",
          "description": "A calma absoluta e a arma mais poderosa de todas.",
          "damage": "3d8",
          "chi_cost": 4,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Tranquilidade Letal",
          "description": "Tranquilidade que se converte em letalidade pura.",
          "damage": "3d8+2",
          "chi_cost": 4,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Paz Armada",
          "description": "Carrega a paz dentro de si e usa-a como arma mortal.",
          "damage": "4d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "fear"
          ]
        },
        {
          "name": "Serenidade Suprema",
          "description": "A serenidade suprema em estado de combate total.",
          "damage": "4d8+2",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Calma que Mata",
          "description": "A calma que mata absolutamente sem hesitacao.",
          "damage": "5d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "fear"
          ]
        },
        {
          "name": "Tranquilidade Absoluta",
          "description": "A tranquilidade mais profunda usada em combate.",
          "damage": "5d8+2",
          "chi_cost": 6,
          "status": [
            "stun",
            "fear",
            "slow"
          ]
        },
        {
          "name": "O Kyoshi em Paz",
          "description": "Quando Kyoshi encontrou a paz — era completamente invencivel.",
          "damage": "6d8",
          "chi_cost": 6,
          "status": [
            "stun",
            "fear",
            "slow"
          ]
        },
        {
          "name": "Serenidade de Avancar",
          "description": "A serenidade que permite avancar sem qualquer hesitacao.",
          "damage": "7d8",
          "chi_cost": 7,
          "status": [
            "stun",
            "fear",
            "slow",
            "blind"
          ]
        },
        {
          "name": "Paz Absoluta em Batalha",
          "description": "A paz e a batalha sao absolutamente a mesma coisa.",
          "damage": "8d8",
          "chi_cost": 7,
          "status": [
            "stun",
            "fear",
            "slow",
            "blind"
          ]
        }
      ],
      "passive_effect": {
        "type": "restore",
        "description": "Imune a todos os efeitos psiquicos. Restaura 1d6 chi apos dano critico.",
        "chi_cost": 0,
        "dice": "1d6",
        "status": [
          "regen",
          "shield"
        ]
      }
    },
    {
      "id": "espirito-inquebravel",
      "name": "Espirito Inquebravel",
      "element": "none",
      "category": "spirit",
      "tier": 4,
      "description": "Uma vez por combate, levanta-se com 1 PV ao cair. Restaura 3d6 chi a aliados proximos.",
      "position": "pass",
      "requirements": {
        "PER": 8,
        "ESP": 9,
        "RES": 6
      },
      "prerequisites": [
        "Chi Bloqueado",
        "Serenidade do Kyoshi"
      ],
      "attacks": [
        {
          "name": "O Espirito Levanta",
          "description": "O espirito inquebravel manifesta-se em ataque puro.",
          "damage": "3d8+2",
          "chi_cost": 5,
          "status": [
            "stun",
            "fear"
          ]
        },
        {
          "name": "Forca do Espirito",
          "description": "A forca do espirito inquebravel em toda a sua gloria.",
          "damage": "4d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "fear"
          ]
        },
        {
          "name": "Golpe do Sobrevivente",
          "description": "O golpe definitivo de quem nunca foi derrotado.",
          "damage": "4d8+4",
          "chi_cost": 6,
          "status": [
            "stun",
            "fear"
          ]
        },
        {
          "name": "O Inquebravel Ataca",
          "description": "Quando o inquebravel ataca — absolutamente ninguem resiste.",
          "damage": "5d8",
          "chi_cost": 6,
          "status": [
            "stun",
            "fear",
            "slow"
          ]
        },
        {
          "name": "Furia do Espirito",
          "description": "A furia de um espirito que nunca rendeu a ninguem.",
          "damage": "5d8+3",
          "chi_cost": 7,
          "status": [
            "stun",
            "fear"
          ]
        },
        {
          "name": "Inspiracao em Ataque",
          "description": "A inspiracao pura transforma-se em ataque devastador.",
          "damage": "6d8",
          "chi_cost": 7,
          "status": [
            "stun",
            "fear",
            "blind"
          ]
        },
        {
          "name": "Lenda em Vida",
          "description": "O ataque de uma lenda viva que ainda caminha.",
          "damage": "6d8+4",
          "chi_cost": 8,
          "status": [
            "stun",
            "fear",
            "slow"
          ]
        },
        {
          "name": "Espirito Imortal",
          "description": "O espirito imortal em forma de golpe absoluto.",
          "damage": "7d8",
          "chi_cost": 8,
          "status": [
            "stun",
            "fear",
            "slow",
            "blind"
          ]
        },
        {
          "name": "O Ultimo a Cair",
          "description": "O ultimo guerreiro a cair — e que nunca cai.",
          "damage": "8d8",
          "chi_cost": 9,
          "status": [
            "stun",
            "fear",
            "slow",
            "blind"
          ]
        },
        {
          "name": "Ninguem Me Derrota",
          "description": "A declaracao e o golpe final de um espirito inquebravel.",
          "damage": "10d8+4",
          "chi_cost": 10,
          "status": [
            "stun",
            "fear",
            "slow",
            "blind",
            "root"
          ]
        }
      ],
      "passive_effect": {
        "type": "special",
        "description": "Uma vez por combate, levanta-se com 1 PV ao cair. Restaura 3d6 chi a aliados proximos.",
        "chi_cost": 5,
        "dice": "3d6",
        "status": [
          "regen",
          "shield"
        ]
      }
    },
    {
      "id": "corrida-de-telhados",
      "name": "Corrida de Telhados",
      "element": "none",
      "category": "agility",
      "tier": 2,
      "description": "Velocidade triplicada em terreno urbano. Pode atacar durante o movimento sem penalidade.",
      "position": "off",
      "requirements": {
        "AGI": 4,
        "PER": 2
      },
      "prerequisites": [
        "Parkour Urbano"
      ],
      "attacks": [
        {
          "name": "Ataque em Corrida",
          "description": "Ataca enquanto corre a maxima velocidade.",
          "damage": "2d6+2",
          "chi_cost": 2,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Golpe do Telhado",
          "description": "Salta de um telhado em ataque de cima.",
          "damage": "3d6",
          "chi_cost": 3,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Corrida de Ataque",
          "description": "A corrida inteira e um ataque continuo e imparavel.",
          "damage": "3d6+2",
          "chi_cost": 3,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Emboscada de Cima",
          "description": "Salta de posicao elevada em emboscada total.",
          "damage": "3d8",
          "chi_cost": 4,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "name": "Sequencia em Corrida",
          "description": "Uma sequencia de golpes durante a corrida.",
          "damage": "4d6",
          "chi_cost": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Velocidade e Violencia",
          "description": "A velocidade amplifica completamente a violencia do golpe.",
          "damage": "4d6+2",
          "chi_cost": 4,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Telhado como Arena",
          "description": "Usa o ambiente como extensao natural do combate.",
          "damage": "4d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "name": "Corrida Letal",
          "description": "Uma corrida que termina inevitavelmente em golpe letal.",
          "damage": "5d6",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow",
            "blind"
          ]
        },
        {
          "name": "Parkour Assassino",
          "description": "O parkour usado como arte marcial de alto nivel.",
          "damage": "5d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "O Telhado e Meu",
          "description": "Dominio absoluto do combate em ambiente vertical.",
          "damage": "6d8",
          "chi_cost": 6,
          "status": [
            "stun",
            "slow",
            "blind"
          ]
        }
      ],
      "passive_effect": {
        "type": "move",
        "description": "Velocidade triplicada em terreno urbano. Pode atacar durante o movimento sem penalidade.",
        "chi_cost": 2,
        "dice": "-",
        "status": []
      }
    },
    {
      "id": "cables-e-ganchos",
      "name": "Cables e Ganchos",
      "element": "none",
      "category": "agility",
      "tier": 2,
      "description": "Alcance de 30m para ganchos. Reposiciona instantaneamente. Pode usar como arma 1d6.",
      "position": "off",
      "requirements": {
        "AGI": 4,
        "PER": 2
      },
      "prerequisites": [
        "Acrobacia"
      ],
      "attacks": [
        {
          "name": "Chicote de Cabo",
          "description": "O cabo e usado como chicote de longa distancia preciso.",
          "damage": "1d8+2",
          "chi_cost": 2,
          "status": []
        },
        {
          "name": "Gancho em Ataque",
          "description": "O gancho e lancado como arma de impacto pesado.",
          "damage": "2d6",
          "chi_cost": 2,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Cabo Cortante",
          "description": "O cabo e afiado e absolutamente cortante.",
          "damage": "2d6+2",
          "chi_cost": 3,
          "status": [
            "bleed"
          ]
        },
        {
          "name": "Balanco de Ataque",
          "description": "O balanco no cabo culmina num ataque devastador.",
          "damage": "2d8",
          "chi_cost": 3,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Laco de Cable",
          "description": "O cabo envolve e prende o inimigo completamente.",
          "damage": "3d6",
          "chi_cost": 3,
          "status": [
            "root",
            "slow"
          ]
        },
        {
          "name": "Estrangulamento",
          "description": "O cabo envolve o pescoco do inimigo.",
          "damage": "3d6+2",
          "chi_cost": 4,
          "status": [
            "slow",
            "stun"
          ]
        },
        {
          "name": "Cabo em Sequencia",
          "description": "O cabo permite uma sequencia de golpes coordenados.",
          "damage": "3d8",
          "chi_cost": 4,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Ataque de Gancho",
          "description": "O gancho e usado para puxar e atacar simultaneamente.",
          "damage": "4d6",
          "chi_cost": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Rede de Cables",
          "description": "Uma rede de cables que aprisiona o inimigo completamente.",
          "damage": "4d6+2",
          "chi_cost": 5,
          "status": [
            "root",
            "stun"
          ]
        },
        {
          "name": "Master de Cables",
          "description": "O mestre dos cables controla completamente o campo.",
          "damage": "4d8",
          "chi_cost": 5,
          "status": [
            "root",
            "stun",
            "slow",
            "blind"
          ]
        }
      ],
      "passive_effect": {
        "type": "move",
        "description": "Alcance de 30m para ganchos. Reposiciona instantaneamente. Pode usar como arma 1d6.",
        "chi_cost": 2,
        "dice": "-",
        "status": []
      }
    },
    {
      "id": "evasao-extrema",
      "name": "Evasao Extrema",
      "element": "none",
      "category": "agility",
      "tier": 3,
      "description": "50% chance de esquivar qualquer ataque por 3 turnos. Inclui ataques de dobra.",
      "position": "def",
      "requirements": {
        "AGI": 7,
        "PER": 5
      },
      "prerequisites": [
        "Cables e Ganchos",
        "Corrida de Telhados"
      ],
      "attacks": [
        {
          "name": "Esquiva e Golpe",
          "description": "Esquiva de ataque e responde imediatamente.",
          "damage": "2d6+2",
          "chi_cost": 2,
          "status": []
        },
        {
          "name": "Contra-Evasao",
          "description": "Usa o impeto do inimigo para amplificar o contra-ataque.",
          "damage": "3d6",
          "chi_cost": 3,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Fantasma",
          "description": "Esquiva tao rapida que o inimigo nao percebe o que aconteceu.",
          "damage": "3d6+2",
          "chi_cost": 3,
          "status": [
            "blind"
          ]
        },
        {
          "name": "Sombra Assassina",
          "description": "Desaparece e ataca da cobertura com precisao absoluta.",
          "damage": "4d6",
          "chi_cost": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "O Vento Nao Pode Ser Apanhado",
          "description": "Evasao total — o inimigo nunca consegue acertar.",
          "damage": "4d6+3",
          "chi_cost": 5,
          "status": [
            "stun",
            "fear"
          ]
        },
        {
          "name": "Esquiva Dupla",
          "description": "Esquiva dois ataques e responde a ambos simultaneamente.",
          "damage": "4d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Fantasma Duplo",
          "description": "Duplica a velocidade de evasao — dois fantasmas.",
          "damage": "5d6",
          "chi_cost": 5,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "name": "Danca de Esquivas",
          "description": "Uma danca de esquivas e contra-ataques fluida.",
          "damage": "5d6+2",
          "chi_cost": 6,
          "status": [
            "stun",
            "blind",
            "slow"
          ]
        },
        {
          "name": "Evasao Suprema",
          "description": "A evasao mais avancada absolutamente possivel.",
          "damage": "5d8",
          "chi_cost": 6,
          "status": [
            "stun",
            "blind",
            "slow"
          ]
        },
        {
          "name": "O Intocavel",
          "description": "Absolutamente ninguem consegue tocar este guerreiro.",
          "damage": "6d8",
          "chi_cost": 7,
          "status": [
            "stun",
            "blind",
            "slow",
            "fear"
          ]
        }
      ],
      "passive_effect": {
        "type": "def",
        "description": "50% chance de esquivar qualquer ataque por 3 turnos. Inclui ataques de dobra.",
        "chi_cost": 3,
        "dice": "1d6",
        "status": [
          "shield"
        ]
      }
    },
    {
      "id": "sombra",
      "name": "Sombra",
      "element": "none",
      "category": "agility",
      "tier": 2,
      "description": "Invisivel enquanto em movimento silencioso. Primeiro ataque e sempre critico.",
      "position": "off",
      "requirements": {
        "AGI": 4,
        "PER": 3
      },
      "prerequisites": [
        "Parkour Urbano"
      ],
      "attacks": [
        {
          "name": "Golpe da Sombra",
          "description": "Um golpe que vem da escuridao total sem aviso.",
          "damage": "2d6+2",
          "chi_cost": 3,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "name": "Assassino Silencioso",
          "description": "Um assassino que nao faz absolutamente nenhum som.",
          "damage": "3d6",
          "chi_cost": 3,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "name": "Sombra Atacante",
          "description": "A propria sombra ataca — confunde completamente.",
          "damage": "3d6+2",
          "chi_cost": 4,
          "status": [
            "blind",
            "stun"
          ]
        },
        {
          "name": "Golpe Inaudivel",
          "description": "Um golpe que nao faz absolutamente nenhum som.",
          "damage": "3d8",
          "chi_cost": 4,
          "status": [
            "stun",
            "blind"
          ]
        },
        {
          "name": "Sombra Dupla",
          "description": "O guerreiro divide-se em duas sombras independentes.",
          "damage": "4d6",
          "chi_cost": 4,
          "status": [
            "blind",
            "stun"
          ]
        },
        {
          "name": "Escuridao Armada",
          "description": "A escuridao e uma arma nas suas maos.",
          "damage": "4d6+2",
          "chi_cost": 5,
          "status": [
            "blind",
            "stun",
            "fear"
          ]
        },
        {
          "name": "Sombra Letal",
          "description": "A sombra letal que absolutamente ninguem ve chegar.",
          "damage": "4d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "blind",
            "fear"
          ]
        },
        {
          "name": "Noite Personificada",
          "description": "O guerreiro e a noite — invisivel e absolutamente letal.",
          "damage": "5d6+2",
          "chi_cost": 5,
          "status": [
            "blind",
            "stun",
            "fear"
          ]
        },
        {
          "name": "Sombra Absoluta",
          "description": "A sombra absoluta — ninguem ve nem ouve absolutamente nada.",
          "damage": "5d8",
          "chi_cost": 6,
          "status": [
            "blind",
            "stun",
            "fear",
            "slow"
          ]
        },
        {
          "name": "O Escuro que Mata",
          "description": "O escuro personificado em golpe mortal e definitivo.",
          "damage": "6d8",
          "chi_cost": 6,
          "status": [
            "blind",
            "stun",
            "fear",
            "slow",
            "root"
          ]
        }
      ],
      "passive_effect": {
        "type": "move",
        "description": "Invisivel enquanto em movimento silencioso. Primeiro ataque e sempre critico.",
        "chi_cost": 2,
        "dice": "-",
        "status": []
      }
    },
    {
      "id": "forca-bruta",
      "name": "Forca Bruta",
      "element": "none",
      "category": "brute",
      "tier": 1,
      "description": "Passivo permanente: +1d4 a todo o dano fisico. Resistencia a knockback. Remove slow fisico.",
      "position": "pass",
      "requirements": {
        "FOR": 3,
        "RES": 1
      },
      "prerequisites": [],
      "attacks": [
        {
          "name": "Soco da Forca",
          "description": "Um soco com toda a forca bruta treinada ao maximo.",
          "damage": "2d6+2",
          "chi_cost": 1,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Pancada",
          "description": "Uma pancada com todo o peso do corpo concentrado.",
          "damage": "2d8",
          "chi_cost": 2,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Esmagamento",
          "description": "Esmaga o inimigo com forca bruta absolutamente pura.",
          "damage": "3d6",
          "chi_cost": 2,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Investida",
          "description": "Investe com todo o peso e forca contra o inimigo.",
          "damage": "3d6+2",
          "chi_cost": 3,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Pancada Pesada",
          "description": "Uma pancada que equivale ao impacto de um martelo.",
          "damage": "3d8",
          "chi_cost": 3,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Golpe de Gigante",
          "description": "O golpe de um gigante — absolutamente imparavel.",
          "damage": "4d6",
          "chi_cost": 3,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Esmagamento Total",
          "description": "Esmaga tudo com forca sobre-humana pura.",
          "damage": "4d6+2",
          "chi_cost": 4,
          "status": [
            "stun",
            "root"
          ]
        },
        {
          "name": "Pancada Devastadora",
          "description": "Uma pancada completamente devastadora de forca pura.",
          "damage": "4d8",
          "chi_cost": 4,
          "status": [
            "stun",
            "slow",
            "root"
          ]
        },
        {
          "name": "Golpe Maximo",
          "description": "O golpe mais forte que um ser humano consegue dar.",
          "damage": "5d6+2",
          "chi_cost": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Forca Pura",
          "description": "A forca bruta em estado absolutamente puro.",
          "damage": "5d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow",
            "root"
          ]
        }
      ],
      "passive_effect": {
        "type": "buff",
        "description": "Passivo permanente: +1d4 a todo o dano fisico. Resistencia a knockback. Remove slow fisico.",
        "chi_cost": 0,
        "dice": "1d4",
        "status": [
          "shield"
        ]
      }
    },
    {
      "id": "armadura-pesada",
      "name": "Armadura Pesada",
      "element": "none",
      "category": "brute",
      "tier": 2,
      "description": "Reduz dano fisico em 3d4. Imune a slow e knockback. Dura o combate inteiro.",
      "position": "def",
      "requirements": {
        "FOR": 4,
        "RES": 3
      },
      "prerequisites": [
        "Forca Bruta"
      ],
      "attacks": [
        {
          "name": "Rampage de Armadura",
          "description": "A armadura pesada e usada diretamente como arma.",
          "damage": "2d8+2",
          "chi_cost": 2,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Batida de Escudo",
          "description": "O escudo da armadura como arma de impacto pesado.",
          "damage": "3d6",
          "chi_cost": 3,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Pressao da Armadura",
          "description": "A armadura pesada esmaga o inimigo completamente.",
          "damage": "3d6+2",
          "chi_cost": 3,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Carga Blindada",
          "description": "Uma carga com toda a armadura pesada a maxima velocidade.",
          "damage": "3d8",
          "chi_cost": 4,
          "status": [
            "stun",
            "root"
          ]
        },
        {
          "name": "Escudo Ofensivo",
          "description": "O escudo usado ativamente para atacar e empurrar.",
          "damage": "4d6",
          "chi_cost": 4,
          "status": [
            "stun",
            "slow"
          ]
        },
        {
          "name": "Armadura em Furia",
          "description": "A armadura inteira e uma arma de destruicao.",
          "damage": "4d6+2",
          "chi_cost": 4,
          "status": [
            "stun"
          ]
        },
        {
          "name": "Pancada Blindada",
          "description": "Uma pancada com a armadura no alvo.",
          "damage": "4d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow",
            "root"
          ]
        },
        {
          "name": "Carga de Ferro",
          "description": "Uma carga de ferro puro que absolutamente nada para.",
          "damage": "5d6",
          "chi_cost": 5,
          "status": [
            "stun",
            "root"
          ]
        },
        {
          "name": "Armadura de Batalha",
          "description": "A armadura usada como instrumento de guerra puro.",
          "damage": "5d8",
          "chi_cost": 5,
          "status": [
            "stun",
            "slow",
            "root"
          ]
        },
        {
          "name": "O Muralha de Ferro",
          "description": "O guerreiro torna-se uma muralha de ferro.",
          "damage": "6d8",
          "chi_cost": 6,
          "status": [
            "stun",
            "root",
            "slow",
            "blind"
          ]
        }
      ],
      "passive_effect": {
        "type": "def",
        "description": "Reduz dano fisico em 3d4. Imune a slow e knockback. Dura o combate inteiro.",
        "chi_cost": 0,
        "dice": "3d4",
        "status": [
          "shield"
        ]
      }
    }
  ]
};
