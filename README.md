# Energy Monitor

> Monitoramento de consumo de energia elétrica em tempo real — CPU + GPU — com **Electron, React e Vite**.

![Electron](https://img.shields.io/badge/Electron-33-47848F?logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-4ade80)
![Platform](https://img.shields.io/badge/platform-Windows-38bdf8)

---

## ✨ Funcionalidades

- **Potência atual (W)**, consumo acumulado (kWh), tensão, corrente e fator de potência
- **Gráfico de área em tempo real** com histórico dos últimos 300 pontos
- **Dados reais do hardware** via HWiNFO64 (CPU W / GPU W, temperaturas de CPU/GPU)
- **Modo simulado** para demonstração sem hardware
- **Controle de velocidade** de amostragem: 1x, 2x, 5x e 10x
- **Painel de sensores HWiNFO** completo, com busca e filtros por tipo
- Interface **dark moderna**, com animações e suporte a `prefers-reduced-motion`

## 🖥️ Captura

![Dashboard](https://via.placeholder.com/1200x600/0f172a/38bdf8?text=Energy+Monitor+Dashboard)

## 🧱 Stack

| Camada   | Tecnologia                |
| -------- | ------------------------- |
| Shell    | Electron 33               |
| UI       | React 18                  |
| Build    | Vite 6                    |
| Gráficos | Recharts                  |
| Packager | electron-builder (NSIS)  |

## 🚀 Como rodar

```bash
# instalar dependências
npm install

# modo desenvolvimento (navegador, só a UI no modo simulado)
npm run dev

# modo desktop (Electron + UI com ponte para HWiNFO)
npm run dev:electron

# build de produção
npm run build

# gerar instalador Windows (.exe)
npm run dist
```

> O instalador é gerado em `release/` com o `electron-builder`.

## 🔌 Integração com HWiNFO64

Dados reais de energia vêm do HWiNFO64 via **Shared Memory**:

1. Abra o **HWiNFO64 em modo "Sensors-only"**
2. Ative **Settings → Main → Shared Memory Support**
3. No app, selecione a fonte **HWiNFO64**

Quando a fonte está ativa, o painel mostra sensores individuais com busca, temperatura de CPU/GPU e potência por componente.

## 📂 Estrutura

```
kjesk/
├── electron/            # processo principal do Electron + ponte HWiNFO
│   ├── main.js          # janela e IPC
│   ├── hwinfo.js        # leitura do Shared Memory do HWiNFO64
│   ├── simulator.js     # gerador de dados simulados
│   └── energy.js        # estimativas de energia / energia acumulada
├── src/                 # UI React (Vite)
│   ├── App.jsx          # dashboard principal
│   └── components/      # StatCard, EnergyChart
└── vite.config.js
```