# 🧊 TET3D - Cylindrical Defense System
**A Modern 3D Reimagining of the Classic Tetris Experience.**

[![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-black?style=flat-square&logo=three.js&logoColor=white)](https://threejs.org/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com/)



## 🚀 Overview
**TET3D** membawa gameplay Tetris klasik ke dalam ruang tiga dimensi. Pemain harus menyusun balok mengelilingi pilar 4-sisi (8x8 per sisi). Baris akan hancur (Line Clear) jika kamu berhasil membentuk satu **cincin penuh** yang melingkari seluruh sisi pilar.

Proyek ini dikembangkan dengan semangat **Ngawi Silicon Valley (NSV)**, menggabungkan performa tinggi Vite dengan estetika visual *Cyberpunk*.

## ✨ Features
- **3D Cylindrical Grid:** Menara 4-sisi dengan sistem koordinat melingkar yang mulus.
- **Adaptive Leveling:** Kecepatan jatuh balok meningkat secara otomatis setiap kelipatan 500 poin.
- **Jukebox System:** 4 Soundtrack *ambient* yang bisa diganti secara real-time melalui menu Pause.
- **Mobile Friendly:** Kontrol D-Pad virtual khusus untuk pengalaman bermain di smartphone.
- **Visual Juice:** Efek partikel ledakan saat *Line Clear* dan sistem *Ghost Piece assist* (Level 1-2).
- **Pause System:** Menekan tombol `ESC` untuk menjeda permainan dan mengakses setelan Jukebox.

## 🛠️ Tech Stack
Proyek ini menggunakan beberapa teknologi utama:
- **Core:** [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **3D Rendering:** [@react-three/fiber](https://r3f.docs.pmnd.rs/) & [@react-three/drei](https://github.com/pmndrs/drei)
- **Math Engine:** [Three.js](https://threejs.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Audio:** [use-sound](https://github.com/joshwcomeau/use-sound)

## 🎮 Controls

### Desktop (Keyboard)
| Action | Key |
| :--- | :--- |
| **Move Camera** | `A` (Left) / `D` (Right) |
| **Move Piece** | `Arrow Left` / `Arrow Right` |
| **Rotate Piece** | `Arrow Up` |
| **Fast Drop** | `Arrow Down` |
| **Pause Game** | `ESC` |
| **Cheat Code** | `C` (+500 Score) |

### Mobile (Touch)
Gunakan **Virtual Controller** yang muncul secara otomatis di layar perangkat mobile:
- **D-Pad Kiri:** Rotasi Kamera (A/D).
- **D-Pad Kanan:** Kontrol Balok (Kiri, Kanan, Atas/Rotate, Bawah/Drop).

## 📦 Getting Started

### Prerequisites
- Node.js (Versi 18 atau lebih baru)
- npm atau yarn

### Installation
1. Clone repository:
   ```bash
   git clone [https://github.com/ReviDaerobi/tet3d-game.git](https://github.com/ReviDaerobi/tet3d-game.git)
Install dependencies:

2. Install dependencies:
```Bash
npm install

3. Run development server:

```Bash
npm run dev


##🏗️ Deployment
Proyek ini siap dideploy ke Vercel dengan satu klik. Pastikan build command diatur ke npm run build dan output directory ke dist. silahkan kembangkan :D

# Crafted with ❤️ by Revi Daerobi 
## IG : revidaerobi_
## YT : Code RV
# Programmer Ngawi as My Title
