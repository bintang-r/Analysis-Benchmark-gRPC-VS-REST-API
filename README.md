# Microservices Performance Benchmark: gRPC vs REST API
> Interactive Dashboard & Network Communication Simulator

---

*Baca dalam bahasa lain / Read in another language:*
- [**Bahasa Indonesia (Indonesian)**](#analisis-benchmark-performa-microservices-grpc-vs-rest-api)
- [**English**](#english-version)

---

## English Version

This repository contains the interactive dashboard and network communication simulator for a scientific study comparing **gRPC (HTTP/2 + Protocol Buffers)** and **REST API (HTTP/1.1 + JSON)** performance in microservices architectures. 

The benchmark measures communication latency, throughput, CPU utilization, and memory consumption across varying concurrency levels (100, 500, 1000, and 5000 requests).

### 📸 Application Screenshots
*(Add your screenshots here)*
- **Interactive Dashboard & Parameter Controller**:
  ![Dashboard Screenshot](screenshots/dashboard.png)
- **Real-Time Network Communication Simulator**:
  ![Simulator Screenshot](screenshots/simulator.png)
- **Dynamic Academic Paper Tab**:
  ![Paper Screenshot](screenshots/paper.png)

---

### 🚀 Key Features

1. **Dynamic Parameter Controller**: Edit raw benchmark numbers (latency, throughput, CPU, and memory) directly in the UI. The Chart.js graphs, academic paper tables, and network simulator will update instantly.
2. **Interactive Network Flow Visualizer**:
   - **REST (HTTP/1.1)**: Simulates parallel sequential pipes with a maximum limit of 6 connections. Requests exceeding this limit wait in a visual queue at the client node (illustrating *Head-of-Line Blocking*).
   - **gRPC (HTTP/2)**: Simulates a single multiplexed persistent conduit. Binary packets stream simultaneously with visible random Stream ID tags (e.g. `S13`, `S45`).
   - **MySQL Database Sub-Hop**: Packets complete a full hop (Client → Server → Database → Server → Client) illustrating real backend request cycles.
   - **Glow & Led Indicators**: SVG nodes pulse on data receipt, and payload blocks glow rose/cyan when transmitting.
3. **Dynamic Payload Customization Editor**: Modify the sent data payload (User ID, Full Name, Email, and Role) in real-time. 
   - Uses a custom-built JavaScript serializer to compress the fields into standard binary **Protocol Buffers** wire format (representing Hex values) and calculates the exact byte size difference between raw JSON and Protobuf.
4. **Authentic Terminal Communication Logger**: Logs TCP Handshakes, HTTP/2 Frames (SETTINGS, HEADERS, DATA), HTTP/1.1 headers, SQL queries, and stream closures with speed controls (0.5x to 10x).

---

### 🛠️ Tech Stack

- **Core**: HTML5, Tailwind CSS (via CDN), jQuery, Chart.js
- **Backend Architecture (referenced)**: NestJS, Docker, MySQL

---

### 💻 Getting Started

Ensure you have [Node.js](https://nodejs.org/) installed.

1. **Clone the repository**:
   ```bash
   git clone https://github.com/bintang-r/Analysis-Benchmark-gRCP-VS-REST-API.git
   cd Analysis-Benchmark-gRCP-VS-REST-API
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server (Vite)**:
   ```bash
   npm start
   ```
   Open **`http://localhost:5173/`** (or the port specified in your console) in your browser.

---

<br>

## Bahasa Indonesia (Indonesian)

Repositori ini berisi dashboard interaktif dan simulator komunikasi jaringan untuk studi ilmiah yang membandingkan performa antara **gRPC (HTTP/2 + Protocol Buffers)** dan **REST API (HTTP/1.1 + JSON)** pada arsitektur microservices. 

Benchmark menguji latensi komunikasi, throughput, utilisasi CPU, dan alokasi memori di bawah berbagai tingkat konkurensi request (100, 500, 1000, dan 5000 requests).

### 📸 Tangkapan Layar Aplikasi
*(Tambahkan tangkapan layar Anda di sini)*
- **Dashboard Interaktif & Kontroler Parameter**:
  ![Dashboard Screenshot](screenshots/dashboard.png)
- **Simulator Komunikasi Jaringan Real-Time**:
  ![Simulator Screenshot](screenshots/simulator.png)
- **Tab Dokumen Paper Akademik**:
  ![Paper Screenshot](screenshots/paper.png)

---

### 🚀 Fitur Utama

1. **Pengendali Parameter Dinamis**: Ubah angka mentah hasil benchmark (latensi, throughput, CPU, dan memori) langsung di UI. Grafik Chart.js, tabel paper akademik, dan simulator jaringan akan terupdate secara instan.
2. **Visualisasi Aliran Jaringan Interaktif**:
   - **REST (HTTP/1.1)**: Mensimulasikan pipa sequential paralel dengan batas maksimal 6 koneksi. Request yang melebihi batas akan tertahan di antrean visual (`Queue: X`) pada node client (mengilustrasikan *Head-of-Line Blocking*).
   - **gRPC (HTTP/2)**: Mensimulasikan pipa conduit tunggal persisten (multiplexed). Paket-paket biner dialirkan bersamaan dengan tag nomor Stream ID ganjil (seperti `S13`, `S45`).
   - **Sub-Hop Database MySQL**: Paket menempuh jalur lengkap (Client → Server → Database → Server → Client) menggambarkan siklus pemrosesan database sesungguhnya.
   - **Indikator Glow & Led**: Node SVG berdenyut saat memproses data dan blok kode payload menyala merah/cyan saat pengiriman paket.
3. **Editor Payload Dinamis**: Ubah data payload yang dikirim (User ID, Nama Lengkap, Email, dan Role) secara real-time. 
   - Menggunakan parser biner manual berbasis JavaScript untuk menyusun format kawat **Protocol Buffers** (ditampilkan dalam Hex) dan menghitung perbedaan byte size secara akurat dibanding JSON.
4. **Log Terminal Komunikasi Autentik**: Mencetak TCP Handshakes, Frame HTTP/2 (SETTINGS, HEADERS, DATA), headers HTTP/1.1, SQL queries, dan status stream dengan kontrol kecepatan simulasi (0.5x hingga 10x).

---

### 🛠️ Teknologi yang Digunakan

- **Frontend**: HTML5, Tailwind CSS (via CDN), jQuery, Chart.js
- **Arsitektur backend (referensi)**: NestJS, Docker, MySQL

---

### 💻 Cara Menjalankan

Pastikan Anda telah menginstal [Node.js](https://nodejs.org/).

1. **Clone repositori**:
   ```bash
   git clone https://github.com/bintang-r/Analysis-Benchmark-gRCP-VS-REST-API.git
   cd Analysis-Benchmark-gRCP-VS-REST-API
   ```

2. **Instal dependensi**:
   ```bash
   npm install
   ```

3. **Jalankan server dev lokal (Vite)**:
   ```bash
   npm start
   ```
   Buka alamat **`http://localhost:5173/`** (atau port yang tertera pada konsol Anda) di browser.
