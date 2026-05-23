// Benchmark Data Model (Initial values match the user's uploaded scientific images exactly)
const benchmarkData = {
    concurrency: [100, 500, 1000, 5000],
    rest: {
        responseTime: [120, 240, 430, 920], // ms
        throughput: [850, 720, 600, 420],   // req/s
        cpu: [45, 58, 65, 68],               // %
        memory: [320, 420, 480, 520]         // MB
    },
    grpc: {
        responseTime: [80, 150, 260, 540],   // ms
        throughput: [1200, 1100, 980, 810],  // req/s
        cpu: [30, 40, 46, 51],               // %
        memory: [220, 300, 350, 410]         // MB
    }
};

// Code Snippets Database
const codeSnippets = {
    'proto-definition': `syntax = "proto3";

package user;

// Layanan User untuk komunikasi antar microservices
service UserService {
  rpc GetUserDetail (UserRequest) returns (UserResponse);
}

// Request payload
message UserRequest {
  string id = 1;
}

// Response payload dalam format biner ter-serialisasi
message UserResponse {
  string id = 1;
  string name = 2;
  string email = 3;
  string role = 4;
}`,
    'grpc-main': `import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { join } from 'path';

async function bootstrap() {
  // Inisialisasi NestJS Microservice berbasis gRPC (HTTP/2)
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'user',
      protoPath: join(__dirname, 'user/user.proto'),
      url: '0.0.0.0:50051', // Port gRPC
    },
  });
  
  await app.listen();
  console.log('gRPC User Microservice is listening on port 50051');
}
bootstrap();`,
    'grpc-controller': `import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { UserRequest, UserResponse } from './interfaces/user.interface';

@Controller()
export class UserController {
  
  // Mapping RPC Method dari file proto
  @GrpcMethod('UserService', 'GetUserDetail')
  getUserDetail(data: UserRequest): UserResponse {
    // Kembalikan objek data langsung (akan diubah ke biner Protobuf secara otomatis)
    return {
      id: data.id,
      name: 'Muhammad Bintang',
      email: 'mbintang23@mhs.unitama.ac.id',
      role: 'Administrator',
    };
  }
}`,
    'rest-controller': `import { Controller, Get, Param } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Endpoint REST API berbasis HTTP/1.1 dan serialisasi JSON
  @Get(':id')
  async getUserDetail(@Param('id') id: string) {
    // Mengembalikan data JSON
    return {
      id: id,
      name: 'Muhammad Bintang',
      email: 'mbintang23@mhs.unitama.ac.id',
      role: 'Administrator',
    };
  }
}`,
    'docker-compose': `version: '3.8'

services:
  # Database Service
  db:
    image: mysql:8.0
    container_name: micro_mysql
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: micro_db
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

  # Authentication Service
  auth-service:
    build: ./auth-service
    container_name: auth_service
    ports:
      - "3001:3001"
    depends_on:
      - db

  # User Service (Mendukung REST & gRPC)
  user-service:
    build: ./user-service
    container_name: user_service
    ports:
      - "50051:50051" # gRPC Port (HTTP/2)
      - "3002:3002"  # REST Port (HTTP/1.1)
    depends_on:
      - db

volumes:
  mysql_data:`
};

// State Variables
let chartsInstance = {};
let simulatorRunning = false;
let simIntervals = [];
let simTimeouts = [];

// Initialize Page
document.addEventListener('DOMContentLoaded', () => {
    initCharts();
    initNavigation();
    initCodeExplorer();
    initSimulator();
    initPaperTOC();
    initParameterControls();
    updateDashboardUI(); // First sync
});

// Setup ChartJS Config
function initCharts() {
    // Common Chart Layout Config
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: '#94a3b8',
                    font: { family: 'Outfit', size: 11 }
                }
            },
            tooltip: {
                backgroundColor: '#0f172a',
                titleColor: '#f8fafc',
                bodyColor: '#cbd5e1',
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                titleFont: { family: 'Outfit', weight: 'bold' },
                bodyFont: { family: 'Outfit' }
            }
        },
        scales: {
            x: {
                grid: { color: 'rgba(255,255,255,0.04)' },
                ticks: { color: '#94a3b8', font: { family: 'Outfit' } }
            },
            y: {
                grid: { color: 'rgba(255,255,255,0.04)' },
                ticks: { color: '#94a3b8', font: { family: 'Outfit' } }
            }
        }
    };

    // 1. Response Time Chart (Line Chart)
    const ctxRT = document.getElementById('chart-response-time').getContext('2d');
    chartsInstance.rt = new Chart(ctxRT, {
        type: 'line',
        data: {
            labels: benchmarkData.concurrency.map(c => `${c} Req`),
            datasets: [
                {
                    label: 'REST API (HTTP/1.1)',
                    data: [...benchmarkData.rest.responseTime],
                    borderColor: '#ff5e62',
                    backgroundColor: 'rgba(255, 94, 98, 0.08)',
                    borderWidth: 2.5,
                    fill: true,
                    tension: 0.25,
                    pointBackgroundColor: '#ff5e62',
                    pointRadius: 4.5,
                    pointHoverRadius: 6
                },
                {
                    label: 'gRPC (HTTP/2)',
                    data: [...benchmarkData.grpc.responseTime],
                    borderColor: '#22d3ee',
                    backgroundColor: 'rgba(34, 211, 238, 0.08)',
                    borderWidth: 2.5,
                    fill: true,
                    tension: 0.25,
                    pointBackgroundColor: '#22d3ee',
                    pointRadius: 4.5,
                    pointHoverRadius: 6
                }
            ]
        },
        options: {
            ...commonOptions,
            scales: {
                ...commonOptions.scales,
                y: {
                    ...commonOptions.scales.y,
                    title: { display: true, text: 'Waktu Respon (ms)', color: '#94a3b8', font: { family: 'Outfit', size: 11 } }
                }
            }
        }
    });

    // 2. Throughput Chart (Line/Point Chart - matches the visual uploaded style)
    const ctxTP = document.getElementById('chart-throughput').getContext('2d');
    chartsInstance.tp = new Chart(ctxTP, {
        type: 'line',
        data: {
            labels: benchmarkData.concurrency.map(c => `${c} Req`),
            datasets: [
                {
                    label: 'REST API (HTTP/1.1)',
                    data: [...benchmarkData.rest.throughput],
                    borderColor: '#ff5e62',
                    backgroundColor: 'transparent',
                    borderWidth: 2.5,
                    pointBackgroundColor: '#ff5e62',
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    tension: 0.1
                },
                {
                    label: 'gRPC (HTTP/2)',
                    data: [...benchmarkData.grpc.throughput],
                    borderColor: '#22d3ee',
                    backgroundColor: 'transparent',
                    borderWidth: 2.5,
                    pointBackgroundColor: '#22d3ee',
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    tension: 0.1
                }
            ]
        },
        options: {
            ...commonOptions,
            scales: {
                ...commonOptions.scales,
                y: {
                    ...commonOptions.scales.y,
                    title: { display: true, text: 'Request / Detik', color: '#94a3b8', font: { family: 'Outfit', size: 11 } }
                }
            }
        }
    });

    // 3. CPU Usage Chart (Grouped Vertical Bar Chart - matches the uploaded CPU Usage image)
    const ctxCPU = document.getElementById('chart-cpu').getContext('2d');
    chartsInstance.cpu = new Chart(ctxCPU, {
        type: 'bar',
        data: {
            labels: benchmarkData.concurrency.map(c => `${c} Req`),
            datasets: [
                {
                    label: 'REST API',
                    data: [...benchmarkData.rest.cpu],
                    backgroundColor: 'rgba(255, 94, 98, 0.75)',
                    borderColor: '#ff5e62',
                    borderWidth: 1.5,
                    borderRadius: 4
                },
                {
                    label: 'gRPC',
                    data: [...benchmarkData.grpc.cpu],
                    backgroundColor: 'rgba(34, 211, 238, 0.75)',
                    borderColor: '#22d3ee',
                    borderWidth: 1.5,
                    borderRadius: 4
                }
            ]
        },
        options: {
            ...commonOptions,
            scales: {
                ...commonOptions.scales,
                y: {
                    ...commonOptions.scales.y,
                    max: 100,
                    title: { display: true, text: 'Utilisasi CPU (%)', color: '#94a3b8' }
                }
            }
        }
    });

    // 4. Memory Usage Chart (Grouped Vertical Bar Chart - matches the uploaded Memory Usage image)
    const ctxMem = document.getElementById('chart-memory').getContext('2d');
    chartsInstance.mem = new Chart(ctxMem, {
        type: 'bar',
        data: {
            labels: benchmarkData.concurrency.map(c => `${c} Req`),
            datasets: [
                {
                    label: 'REST API',
                    data: [...benchmarkData.rest.memory],
                    backgroundColor: 'rgba(255, 94, 98, 0.75)',
                    borderColor: '#ff5e62',
                    borderWidth: 1.5,
                    borderRadius: 4
                },
                {
                    label: 'gRPC',
                    data: [...benchmarkData.grpc.memory],
                    backgroundColor: 'rgba(34, 211, 238, 0.75)',
                    borderColor: '#22d3ee',
                    borderWidth: 1.5,
                    borderRadius: 4
                }
            ]
        },
        options: {
            ...commonOptions,
            scales: {
                ...commonOptions.scales,
                y: {
                    ...commonOptions.scales.y,
                    max: 1000,
                    title: { display: true, text: 'Alokasi Memori (MB)', color: '#94a3b8' }
                }
            }
        }
    });
}

// Navigation Logic
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active classes
            navItems.forEach(n => n.classList.remove('active'));
            sections.forEach(s => {
                s.classList.add('hidden');
                s.classList.remove('block');
            });

            // Add active class to clicked item
            item.classList.add('active');

            // Show corresponding section
            const targetSection = document.getElementById(item.getAttribute('data-target'));
            if (targetSection) {
                targetSection.classList.remove('hidden');
                targetSection.classList.add('block');
            }

            // Scroll main content to top
            document.querySelector('main').scrollTop = 0;

            // Trigger chart updates if returning to dashboard
            if (item.id === 'btn-nav-dashboard') {
                Object.values(chartsInstance).forEach(chart => {
                    chart.resize();
                    chart.update('active');
                });
            }
        });
    });
}

// Code Snippet Explorer Logic
function initCodeExplorer() {
    const codeTabBtns = document.querySelectorAll('.code-tab-btn');
    const filenameEl = document.getElementById('code-filename');
    const codeContentEl = document.getElementById('code-content');
    const copyBtn = document.getElementById('btn-copy-code');

    // Load Default Snippet
    loadSnippet('proto-definition');

    codeTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            codeTabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const fileKey = btn.getAttribute('data-file');
            loadSnippet(fileKey);
            filenameEl.textContent = btn.textContent.trim();
        });
    });

    function loadSnippet(key) {
        if (codeSnippets[key]) {
            codeContentEl.textContent = codeSnippets[key];
        }
    }

    // Copy to clipboard
    copyBtn.addEventListener('click', () => {
        const text = codeContentEl.textContent;
        navigator.clipboard.writeText(text).then(() => {
            copyBtn.textContent = 'Copied!';
            copyBtn.classList.remove('bg-slate-800/50', 'text-slate-300', 'border-slate-700/60');
            copyBtn.classList.add('bg-emerald-500/10', 'text-emerald-400', 'border-emerald-500/20');

            setTimeout(() => {
                copyBtn.textContent = 'Copy Code';
                copyBtn.classList.remove('bg-emerald-500/10', 'text-emerald-400', 'border-emerald-500/20');
                copyBtn.classList.add('bg-slate-800/50', 'text-slate-300', 'border-slate-700/60');
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    });
}

// Paper Table of Contents Active Highlighting
function initPaperTOC() {
    const tocLinks = document.querySelectorAll('.toc-link');
    const paperSections = document.querySelectorAll('.paper-sub-section');
    const mainContent = document.querySelector('main');

    tocLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                // Scroll main content to target section
                const offset = targetSection.offsetTop - 50;
                mainContent.scrollTo({
                    top: offset,
                    behavior: 'smooth'
                });

                tocLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            }
        });
    });

    // Detect scroll position to highlight TOC link
    mainContent.addEventListener('scroll', () => {
        let currentSectionId = '';
        const scrollPosition = mainContent.scrollTop + 100;

        paperSections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;

            if (scrollPosition >= sectionTop && scrollPosition < (sectionTop + sectionHeight)) {
                currentSectionId = section.getAttribute('id');
            }
        });

        if (currentSectionId) {
            tocLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${currentSectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}

// Parameter Controls Input Sync & Chart Update
function initParameterControls() {
    const inputs = document.querySelectorAll('input[id^="p-"]');

    inputs.forEach(input => {
        input.addEventListener('input', () => {
            syncDataFromInputs();
            updateDashboardUI();
        });
    });
}

function syncDataFromInputs() {
    const categories = ['rest', 'grpc'];
    const metrics = ['rt', 'tp', 'cpu', 'mem'];
    const runs = [100, 500, 1000, 5000];

    runs.forEach((run, rIdx) => {
        // Read REST inputs
        benchmarkData.rest.responseTime[rIdx] = parseFloat(document.getElementById(`p-rest-rt-${run}`).value) || 0;
        benchmarkData.rest.throughput[rIdx] = parseFloat(document.getElementById(`p-rest-tp-${run}`).value) || 0;
        benchmarkData.rest.cpu[rIdx] = parseFloat(document.getElementById(`p-rest-cpu-${run}`).value) || 0;
        benchmarkData.rest.memory[rIdx] = parseFloat(document.getElementById(`p-rest-mem-${run}`).value) || 0;

        // Read gRPC inputs
        benchmarkData.grpc.responseTime[rIdx] = parseFloat(document.getElementById(`p-grpc-rt-${run}`).value) || 0;
        benchmarkData.grpc.throughput[rIdx] = parseFloat(document.getElementById(`p-grpc-tp-${run}`).value) || 0;
        benchmarkData.grpc.cpu[rIdx] = parseFloat(document.getElementById(`p-grpc-cpu-${run}`).value) || 0;
        benchmarkData.grpc.memory[rIdx] = parseFloat(document.getElementById(`p-grpc-mem-${run}`).value) || 0;
    });
}

// Updates UI Elements & Chart Instances
function updateDashboardUI() {
    // 1. Update card text values
    const lastIdx = benchmarkData.concurrency.length - 1; // 5000 req

    const restMaxRt = benchmarkData.rest.responseTime[lastIdx];
    const grpcMaxRt = benchmarkData.grpc.responseTime[lastIdx];
    const restMaxTp = benchmarkData.rest.throughput[lastIdx];
    const grpcMaxTp = benchmarkData.grpc.throughput[lastIdx];

    document.getElementById('val-rest-rt').textContent = `${restMaxRt} ms`;
    document.getElementById('val-grpc-rt').textContent = `${grpcMaxRt} ms`;

    // Performance diff percentage
    const rtDiffPercent = restMaxRt > 0 ? ((restMaxRt - grpcMaxRt) / restMaxRt * 100).toFixed(1) : 0;
    document.getElementById('metric-grpc-diff').textContent = `${rtDiffPercent}% Faster`;
    document.getElementById('txt-latency-diff').textContent = `${restMaxRt - grpcMaxRt} ms`;
    document.getElementById('txt-rest-rt').textContent = `${restMaxRt} ms`;

    // Throughput speed ratio
    const tpRatio = restMaxTp > 0 ? (grpcMaxTp / restMaxTp).toFixed(1) : 0;
    document.getElementById('val-win-ratio').textContent = `${tpRatio}x`;
    document.getElementById('txt-grpc-tp').textContent = `${grpcMaxTp} req/s`;
    document.getElementById('txt-rest-tp').textContent = `${restMaxTp} req/s`;

    // 1.5 Update values inside the Academic Paper (Tabel 2 & Tabel 3)
    const runs = [100, 500, 1000, 5000];
    runs.forEach((run, idx) => {
        const pRestRt = document.getElementById(`paper-rest-rt-${run}`);
        const pGrpcRt = document.getElementById(`paper-grpc-rt-${run}`);
        const pRestTp = document.getElementById(`paper-rest-tp-${run}`);
        const pGrpcTp = document.getElementById(`paper-grpc-tp-${run}`);

        if (pRestRt) pRestRt.textContent = `${benchmarkData.rest.responseTime[idx]} ms`;
        if (pGrpcRt) pGrpcRt.textContent = `${benchmarkData.grpc.responseTime[idx]} ms`;
        if (pRestTp) pRestTp.textContent = `${benchmarkData.rest.throughput[idx]} req/s`;
        if (pGrpcTp) pGrpcTp.textContent = `${benchmarkData.grpc.throughput[idx]} req/s`;
    });

    // Update dynamic averages inside Paper Tabel 4 (CPU & Memory)
    const restCpuAvg = (benchmarkData.rest.cpu.reduce((a, b) => a + b, 0) / 4).toFixed(0);
    const grpcCpuAvg = (benchmarkData.grpc.cpu.reduce((a, b) => a + b, 0) / 4).toFixed(0);
    const restMemAvg = (benchmarkData.rest.memory.reduce((a, b) => a + b, 0) / 4).toFixed(0);
    const grpcMemAvg = (benchmarkData.grpc.memory.reduce((a, b) => a + b, 0) / 4).toFixed(0);

    const pRestCpuAvg = document.getElementById('paper-rest-cpu-avg');
    const pGrpcCpuAvg = document.getElementById('paper-grpc-cpu-avg');
    const pRestMemAvg = document.getElementById('paper-rest-mem-avg');
    const pGrpcMemAvg = document.getElementById('paper-grpc-mem-avg');

    if (pRestCpuAvg) pRestCpuAvg.textContent = `${restCpuAvg}%`;
    if (pGrpcCpuAvg) pGrpcCpuAvg.textContent = `${grpcCpuAvg}%`;
    if (pRestMemAvg) pRestMemAvg.textContent = `${restMemAvg} MB`;
    if (pGrpcMemAvg) pGrpcMemAvg.textContent = `${grpcMemAvg} MB`;

    // 2. Refresh Chart Data
    if (chartsInstance.rt) {
        chartsInstance.rt.data.datasets[0].data = [...benchmarkData.rest.responseTime];
        chartsInstance.rt.data.datasets[1].data = [...benchmarkData.grpc.responseTime];
        chartsInstance.rt.update();
    }

    if (chartsInstance.tp) {
        chartsInstance.tp.data.datasets[0].data = [...benchmarkData.rest.throughput];
        chartsInstance.tp.data.datasets[1].data = [...benchmarkData.grpc.throughput];
        chartsInstance.tp.update();
    }

    if (chartsInstance.cpu) {
        chartsInstance.cpu.data.datasets[0].data = [...benchmarkData.rest.cpu];
        chartsInstance.cpu.data.datasets[1].data = [...benchmarkData.grpc.cpu];
        chartsInstance.cpu.update();
    }

    if (chartsInstance.mem) {
        chartsInstance.mem.data.datasets[0].data = [...benchmarkData.rest.memory];
        chartsInstance.mem.data.datasets[1].data = [...benchmarkData.grpc.memory];
        chartsInstance.mem.update();
    }
}

// Protocol Buffers Wire Format Serialization Simulator
function calculateProtobuf(id, name, email, role) {
    const encoder = new TextEncoder();
    const idBytes = encoder.encode(id);
    const nameBytes = encoder.encode(name);
    const emailBytes = encoder.encode(email);
    const roleBytes = encoder.encode(role);

    // Helper to write Protobuf Varint
    function writeVarint(value) {
        const bytes = [];
        while (value > 127) {
            bytes.push((value & 127) | 128);
            value >>>= 7;
        }
        bytes.push(value);
        return bytes;
    }

    let binary = [];

    // Field 1 (id): tag 0x0a (10)
    if (idBytes.length > 0) {
        binary.push(0x0a);
        binary.push(...writeVarint(idBytes.length));
        binary.push(...idBytes);
    }

    // Field 2 (name): tag 0x12 (18)
    if (nameBytes.length > 0) {
        binary.push(0x12);
        binary.push(...writeVarint(nameBytes.length));
        binary.push(...nameBytes);
    }

    // Field 3 (email): tag 0x1a (26)
    if (emailBytes.length > 0) {
        binary.push(0x1a);
        binary.push(...writeVarint(emailBytes.length));
        binary.push(...emailBytes);
    }

    // Field 4 (role): tag 0x22 (34)
    if (roleBytes.length > 0) {
        binary.push(0x22);
        binary.push(...writeVarint(roleBytes.length));
        binary.push(...roleBytes);
    }

    // Generate Hexadecimal Rows
    let hexRows = [];
    for (let i = 0; i < binary.length; i += 15) {
        const chunk = binary.slice(i, i + 15);
        const hexLine = chunk.map(b => b.toString(16).padStart(2, '0')).join(' ');
        hexRows.push(hexLine);
    }

    return {
        size: binary.length,
        hex: hexRows.join('\n'),
        binary: binary
    };
}

// Global payload size tracker
window.currentPayloadSizes = { rest: 98, grpc: 66 };

// Interactive Network Simulator Logic
function initSimulator() {
    const runBtn = document.getElementById('btn-run-sim');
    const resetBtn = document.getElementById('btn-reset-sim');
    const concurrencySel = document.getElementById('sim-concurrency');
    const speedSel = document.getElementById('sim-speed');
    const statusLabel = document.getElementById('sim-status-text');
    const termLog = document.getElementById('terminal-log-output');

    // Input fields for payload editor
    const payloadIdInp = document.getElementById('sim-payload-id');
    const payloadNameInp = document.getElementById('sim-payload-name');
    const payloadEmailInp = document.getElementById('sim-payload-email');
    const payloadRoleInp = document.getElementById('sim-payload-role');

    // Stats elements
    const restBar = document.getElementById('rest-progress-bar');
    const restTimeEl = document.getElementById('sim-rest-time');
    const restDoneEl = document.getElementById('sim-rest-done');

    const grpcBar = document.getElementById('grpc-progress-bar');
    const grpcTimeEl = document.getElementById('sim-grpc-time');
    const grpcDoneEl = document.getElementById('sim-grpc-done');

    // Queue text
    const restQueueText = document.getElementById('sim-rest-queue-text');

    // Active state variables for simulation ticks
    let restCompleted = 0;
    let grpcCompleted = 0;
    let restActiveConns = 0;
    let grpcActiveConns = 0;
    let restBandwidth = 0;
    let grpcBandwidth = 0;
    let restQueueCount = 0;
    let restPathsOccupied = [false, false, false, false, false, false];
    let restTimeElapsed = 0;
    let grpcTimeElapsed = 0;
    let restRunning = false;
    let grpcRunning = false;

    // SVG namespace
    const svgNS = "http://www.w3.org/2000/svg";

    // Bind event listeners for real-time payload updates
    [payloadIdInp, payloadNameInp, payloadEmailInp, payloadRoleInp].forEach(inp => {
        if (inp) {
            inp.addEventListener('input', updatePayloadVisuals);
        }
    });

    // Run first update to sync HTML with inputs on load
    updatePayloadVisuals();

    function updatePayloadVisuals() {
        const id = payloadIdInp ? payloadIdInp.value : 'USR-9988223';
        const name = payloadNameInp ? payloadNameInp.value : 'Muhammad Bintang';
        const email = payloadEmailInp ? payloadEmailInp.value : 'mbintang23@mhs.unitama.ac.id';
        const role = payloadRoleInp ? payloadRoleInp.value : 'Administrator';

        // 1. REST (JSON) representation and size
        const restObj = { id, name, email, role };
        const restJson = JSON.stringify(restObj, null, 2);
        const restColored = restJson
            .replace(/"(id|name|email|role)"/g, '<span class="text-rose-400">"$1"</span>')
            .replace(/: "(.*)"/g, ': <span class="text-emerald-400">"$1"</span>');
        
        const restBlock = document.getElementById('rest-payload-block');
        if (restBlock) restBlock.innerHTML = restColored;

        const restBytes = new TextEncoder().encode(restJson).length;
        const restLabel = document.getElementById('rest-payload-size');
        if (restLabel) restLabel.textContent = `Ukuran Payload: ~${restBytes} bytes (Teks JSON Formatted)`;

        // 2. gRPC (Protobuf) representation and size
        const protobufResult = calculateProtobuf(id, name, email, role);
        const grpcColored = `<span class="text-slate-500">// Serialized Binary (Hexadecimal representation)</span>\n` +
            protobufResult.hex.split(' ').map(h => `<span class="text-cyan-400">${h}</span>`).join(' ');
        
        const grpcBlock = document.getElementById('grpc-payload-block');
        if (grpcBlock) grpcBlock.innerHTML = grpcColored;

        const grpcLabel = document.getElementById('grpc-payload-size');
        if (grpcLabel) grpcLabel.textContent = `Ukuran Payload: ~${protobufResult.size} bytes (Biner terkompresi Protobuf)`;

        // Save sizes globally
        window.currentPayloadSizes = {
            rest: restBytes,
            grpc: protobufResult.size
        };
    }

    resetBtn.addEventListener('click', resetSimulation);

    runBtn.addEventListener('click', () => {
        if (simulatorRunning) return;
        runSimulation();
    });

    function logToTerminal(message, type = 'sys') {
        const span = document.createElement('span');
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;

        let typeSpan = '';
        if (type === 'sys') typeSpan = `<span class="text-emerald-400">[SYS]</span>`;
        else if (type === 'rest') typeSpan = `<span class="text-rose-400">[REST-HTTP/1.1]</span>`;
        else if (type === 'grpc') typeSpan = `<span class="text-cyan-400">[gRPC-HTTP/2]</span>`;
        else if (type === 'warn') typeSpan = `<span class="text-yellow-500">[WARN]</span>`;

        span.innerHTML = `[${timeStr}] ${typeSpan} ${message}<br>`;
        termLog.appendChild(span);
        termLog.scrollTop = termLog.scrollHeight;
    }

    function pulseNode(nodeId, type) {
        const selector = `#${nodeId} circle, #${nodeId} path, #${nodeId} ellipse`;
        const elements = document.querySelectorAll(selector);
        const className = `pulse-${type}`;
        
        elements.forEach(el => {
            el.classList.add(className);
            const timeoutId = setTimeout(() => {
                el.classList.remove(className);
            }, 300);
            simTimeouts.push(timeoutId);
        });
    }

    function resetSimulation() {
        // Clear all timers and intervals
        simIntervals.forEach(clearInterval);
        simTimeouts.forEach(clearTimeout);
        simIntervals = [];
        simTimeouts = [];
        
        simulatorRunning = false;
        restRunning = false;
        grpcRunning = false;

        // Reset state variables
        restCompleted = 0;
        grpcCompleted = 0;
        restActiveConns = 0;
        grpcActiveConns = 0;
        restBandwidth = 0;
        grpcBandwidth = 0;
        restQueueCount = 0;
        restPathsOccupied = [false, false, false, false, false, false];
        restTimeElapsed = 0;
        grpcTimeElapsed = 0;

        // Reset progress counters in UI
        if (restBar) restBar.style.width = '0%';
        if (grpcBar) grpcBar.style.width = '0%';
        document.getElementById('sim-rest-pct').textContent = '0%';
        document.getElementById('sim-grpc-pct').textContent = '0%';

        restTimeEl.textContent = '0 ms';
        restDoneEl.textContent = '0/0 req';
        grpcTimeEl.textContent = '0 ms';
        grpcDoneEl.textContent = '0/0 req';

        document.getElementById('sim-rest-conns').textContent = '0';
        document.getElementById('sim-grpc-conns').textContent = '0';
        document.getElementById('sim-rest-bandwidth').textContent = '0.0 KB';
        document.getElementById('sim-grpc-bandwidth').textContent = '0.0 KB';

        if (restQueueText) {
            restQueueText.textContent = 'Queue: 0';
            restQueueText.classList.add('hidden');
        }

        // Remove active glows from payload boxes
        const restBlock = document.getElementById('rest-payload-block');
        const grpcBlock = document.getElementById('grpc-payload-block');
        if (restBlock) restBlock.classList.remove('glow-active-rest');
        if (grpcBlock) grpcBlock.classList.remove('glow-active-grpc');

        // Reset SVG packets container
        const packetContainer = document.getElementById('packet-container');
        if (packetContainer) packetContainer.innerHTML = '';

        // Reset status
        statusLabel.textContent = 'Ready';
        termLog.innerHTML = `<span class="text-emerald-400">[SYS]</span> Simulation reset. Select concurrency and run again.<br>`;
    }

    function runSimulation() {
        resetSimulation();
        
        simulatorRunning = true;
        restRunning = true;
        grpcRunning = true;
        statusLabel.textContent = 'Running';

        const target = parseInt(concurrencySel.value) || 100;
        const speed = parseFloat(speedSel.value) || 1.0;
        const cIdx = benchmarkData.concurrency.indexOf(target);

        // Fetch latency and throughput based on user parameters
        const restTp = benchmarkData.rest.throughput[cIdx];
        const grpcTp = benchmarkData.grpc.throughput[cIdx];
        const restLatency = benchmarkData.rest.responseTime[cIdx];
        const grpcLatency = benchmarkData.grpc.responseTime[cIdx];

        logToTerminal(`Memulai simulasi dengan beban ${target} requests. Kecepatan: ${speed}x.`, 'sys');
        logToTerminal(`[REST API] Konkurensi Target: ${target} Req | Throughput: ${restTp} Req/s | Latency: ${restLatency} ms`, 'sys');
        logToTerminal(`[gRPC] Konkurensi Target: ${target} Req | Throughput: ${grpcTp} Req/s | Latency: ${grpcLatency} ms`, 'sys');

        // Connection logs
        logToTerminal(`Membuka 6 TCP connection parallel untuk REST API (HTTP/1.1)...`, 'rest');
        logToTerminal(`Membuka 1 persistent TCP connection untuk gRPC (HTTP/2 multiplexed)...`, 'grpc');

        restActiveConns = 0;
        grpcActiveConns = 1;
        document.getElementById('sim-grpc-conns').textContent = '1';

        // 1. Tick Interval: Increments stats based on real-time speeds
        const tickInterval = setInterval(() => {
            const tickTime = 40 * speed; // ms simulated per tick (40ms interval)

            // Increment REST Progress
            if (restRunning) {
                restTimeElapsed += tickTime;
                // Incremented completed requests based on throughput
                const increment = (restTp * (40 / 1000)) * speed;
                restCompleted = Math.min(target, restCompleted + increment);

                // Bandwidth including HTTP/1.1 headers overhead (~150 bytes per request)
                restBandwidth = (restCompleted * (window.currentPayloadSizes.rest + 150)) / 1024;

                // Update REST stats
                const pct = Math.floor((restCompleted / target) * 100);
                if (restBar) restBar.style.width = `${pct}%`;
                document.getElementById('sim-rest-pct').textContent = `${pct}%`;
                restDoneEl.textContent = `${Math.floor(restCompleted)}/${target} req`;
                restTimeEl.textContent = `${Math.floor(restTimeElapsed)} ms`;
                document.getElementById('sim-rest-bandwidth').textContent = `${restBandwidth.toFixed(1)} KB`;

                if (restCompleted >= target) {
                    restRunning = false;
                    restActiveConns = 0;
                    document.getElementById('sim-rest-conns').textContent = '0';
                    logToTerminal(`REST API simulasi selesai! Total waktu: ${Math.floor(restTimeElapsed)} ms. Bandwidth: ${restBandwidth.toFixed(1)} KB`, 'rest');
                }
            }

            // Increment gRPC Progress
            if (grpcRunning) {
                grpcTimeElapsed += tickTime;
                // Incremented completed requests based on throughput
                const increment = (grpcTp * (40 / 1000)) * speed;
                grpcCompleted = Math.min(target, grpcCompleted + increment);

                // Bandwidth with HPACK compressed HTTP/2 overhead (~15 bytes per request)
                grpcBandwidth = (grpcCompleted * (window.currentPayloadSizes.grpc + 15)) / 1024;

                // Update gRPC stats
                const pct = Math.floor((grpcCompleted / target) * 100);
                if (grpcBar) grpcBar.style.width = `${pct}%`;
                document.getElementById('sim-grpc-pct').textContent = `${pct}%`;
                grpcDoneEl.textContent = `${Math.floor(grpcCompleted)}/${target} req`;
                grpcTimeEl.textContent = `${Math.floor(grpcTimeElapsed)} ms`;
                document.getElementById('sim-grpc-bandwidth').textContent = `${grpcBandwidth.toFixed(1)} KB`;

                if (grpcCompleted >= target) {
                    grpcRunning = false;
                    grpcActiveConns = 0;
                    document.getElementById('sim-grpc-conns').textContent = '0';
                    logToTerminal(`gRPC simulasi selesai! Total waktu: ${Math.floor(grpcTimeElapsed)} ms. Bandwidth: ${grpcBandwidth.toFixed(1)} KB`, 'grpc');
                }
            }

            // Check simulation completion
            if (!restRunning && !grpcRunning) {
                clearInterval(tickInterval);
                statusLabel.textContent = 'Finished';
                simulatorRunning = false;

                // Output final comparative analysis to terminal
                const diffTime = Math.abs(restTimeElapsed - grpcTimeElapsed);
                const pctTime = ((restTimeElapsed - grpcTimeElapsed) / restTimeElapsed * 100).toFixed(1);
                const savedBw = Math.max(0, restBandwidth - grpcBandwidth);
                const pctBw = ((restBandwidth - grpcBandwidth) / restBandwidth * 100).toFixed(1);

                logToTerminal(`--- LAPORAN AKHIR SIMULASI PERFORMA ---`, 'sys');
                logToTerminal(`gRPC menyelesaikan tugas ${pctTime}% lebih cepat dari REST API (${Math.floor(grpcTimeElapsed)}ms vs ${Math.floor(restTimeElapsed)}ms).`, 'sys');
                logToTerminal(`gRPC menghemat ${savedBw.toFixed(1)} KB bandwidth (${pctBw}% lebih hemat).`, 'sys');
                logToTerminal(`Hal ini membuktikan gRPC biner (HTTP/2) jauh lebih efisien untuk transfer data user pada microservices.`, 'sys');
            }

        }, 40);
        simIntervals.push(tickInterval);

        // 2. SVG Packet Animation Loops (Throttled for browser performance)
        // REST Animation schedule
        const restAnimInterval = setInterval(() => {
            if (restRunning && restCompleted < target) {
                sendRestRequest();
            }
        }, Math.max(50, 240 / speed));
        simIntervals.push(restAnimInterval);

        // gRPC Animation schedule
        const grpcAnimInterval = setInterval(() => {
            if (grpcRunning && grpcCompleted < target) {
                sendGrpcRequest();
            }
        }, Math.max(40, 160 / speed));
        simIntervals.push(grpcAnimInterval);
    }

    function sendRestRequest() {
        const userId = payloadIdInp ? payloadIdInp.value : 'USR-9988223';
        
        if (restActiveConns < 6) {
            // Find available path index (0-5)
            let pathIdx = restPathsOccupied.indexOf(false);
            if (pathIdx === -1) pathIdx = 0;

            restPathsOccupied[pathIdx] = true;
            restActiveConns++;
            document.getElementById('sim-rest-conns').textContent = restActiveConns;

            // Trigger packet anim from Client to Server
            const packet = document.createElementNS(svgNS, 'circle');
            packet.setAttribute('r', '5.5');
            packet.setAttribute('fill', 'url(#rest-grad)');
            packet.setAttribute('class', 'packet rest-packet');
            packet.setAttribute('filter', 'url(#glow-rest)');

            const motion = document.createElementNS(svgNS, 'animateMotion');
            motion.setAttribute('dur', `${400 / parseFloat(speedSel.value)}ms`);
            motion.setAttribute('repeatCount', '1');
            motion.setAttribute('fill', 'freeze');

            const mpath = document.createElementNS(svgNS, 'mpath');
            mpath.setAttribute('href', `#path-rest-${pathIdx}`);
            motion.appendChild(mpath);
            packet.appendChild(motion);

            const container = document.getElementById('packet-container');
            if (container) container.appendChild(packet);

            // Step 1 timeout: Client -> Server
            const t1 = setTimeout(() => {
                pulseNode('node-rest-server', 'rest');
                const restBlock = document.getElementById('rest-payload-block');
                if (restBlock) {
                    restBlock.classList.add('glow-active-rest');
                    const tGlow = setTimeout(() => restBlock.classList.remove('glow-active-rest'), 350 / parseFloat(speedSel.value));
                    simTimeouts.push(tGlow);
                }
                logToTerminal(`Conn #${pathIdx+1}: HTTP GET request diterima Server. Mengambil data dari DB...`, 'rest');
                
                // Remove client packet
                packet.remove();

                // DB hop query packet
                const dbPack = document.createElementNS(svgNS, 'circle');
                dbPack.setAttribute('r', '4');
                dbPack.setAttribute('fill', '#fbbf24');
                dbPack.setAttribute('class', 'packet');

                const dbMotion = document.createElementNS(svgNS, 'animateMotion');
                dbMotion.setAttribute('dur', `${200 / parseFloat(speedSel.value)}ms`);
                dbMotion.setAttribute('repeatCount', '1');
                dbMotion.setAttribute('fill', 'freeze');
                
                const dbMpath = document.createElementNS(svgNS, 'mpath');
                dbMpath.setAttribute('href', '#path-rest-db');
                dbMotion.appendChild(dbMpath);
                dbPack.appendChild(dbMotion);
                if (container) container.appendChild(dbPack);

                // Step 2 timeout: Server -> DB
                const t2 = setTimeout(() => {
                    pulseNode('node-rest-db', 'db');
                    logToTerminal(`Conn #${pathIdx+1}: Database query: <span class="text-yellow-500">SELECT * FROM users WHERE id = '${userId}';</span>`, 'rest');
                    
                    dbPack.remove();

                    // DB hop response packet (reverse path)
                    const dbRespPack = document.createElementNS(svgNS, 'circle');
                    dbRespPack.setAttribute('r', '4');
                    dbRespPack.setAttribute('fill', '#fbbf24');
                    dbRespPack.setAttribute('class', 'packet');

                    const dbRespMotion = document.createElementNS(svgNS, 'animateMotion');
                    dbRespMotion.setAttribute('dur', `${200 / parseFloat(speedSel.value)}ms`);
                    dbRespMotion.setAttribute('repeatCount', '1');
                    dbRespMotion.setAttribute('fill', 'freeze');
                    dbRespMotion.setAttribute('keyPoints', '1;0');
                    dbRespMotion.setAttribute('keyTimes', '0;1');
                    dbRespMotion.setAttribute('calcMode', 'linear');
                    
                    const dbRespMpath = document.createElementNS(svgNS, 'mpath');
                    dbRespMpath.setAttribute('href', '#path-rest-db');
                    dbRespMotion.appendChild(dbRespMpath);
                    dbRespPack.appendChild(dbRespMotion);
                    if (container) container.appendChild(dbRespPack);

                    // Step 3 timeout: DB -> Server
                    const t3 = setTimeout(() => {
                        pulseNode('node-rest-server', 'rest');
                        logToTerminal(`Conn #${pathIdx+1}: Data ditemukan. Server menyusun payload JSON (${window.currentPayloadSizes.rest} Bytes)...`, 'rest');
                        
                        dbRespPack.remove();

                        // Response packet Server -> Client (reverse along same connection line)
                        const respPack = document.createElementNS(svgNS, 'circle');
                        respPack.setAttribute('r', '5.5');
                        respPack.setAttribute('fill', 'url(#rest-grad)');
                        respPack.setAttribute('class', 'packet rest-packet');
                        respPack.setAttribute('filter', 'url(#glow-rest)');

                        const respMotion = document.createElementNS(svgNS, 'animateMotion');
                        respMotion.setAttribute('dur', `${400 / parseFloat(speedSel.value)}ms`);
                        respMotion.setAttribute('repeatCount', '1');
                        respMotion.setAttribute('fill', 'freeze');
                        respMotion.setAttribute('keyPoints', '1;0');
                        respMotion.setAttribute('keyTimes', '0;1');
                        respMotion.setAttribute('calcMode', 'linear');

                        const respMpath = document.createElementNS(svgNS, 'mpath');
                        respMpath.setAttribute('href', `#path-rest-${pathIdx}`);
                        respMotion.appendChild(respMpath);
                        respPack.appendChild(respMotion);
                        if (container) container.appendChild(respPack);

                        // Step 4 timeout: Server -> Client
                        const t4 = setTimeout(() => {
                            pulseNode('node-rest-client', 'rest');
                            logToTerminal(`Conn #${pathIdx+1}: Response diterima Client. <span class="text-rose-400">200 OK</span> (${window.currentPayloadSizes.rest} Bytes)`, 'rest');
                            
                            respPack.remove();

                            // Free connection slot
                            restPathsOccupied[pathIdx] = false;
                            restActiveConns = Math.max(0, restActiveConns - 1);
                            document.getElementById('sim-rest-conns').textContent = restActiveConns;

                            // Check queue to process next
                            if (restQueueCount > 0) {
                                restQueueCount--;
                                if (restQueueCount > 0) {
                                    restQueueText.textContent = `Queue: ${restQueueCount}`;
                                } else {
                                    restQueueText.classList.add('hidden');
                                }
                                sendRestRequest();
                            }
                        }, 400 / parseFloat(speedSel.value));
                        simTimeouts.push(t4);

                    }, 200 / parseFloat(speedSel.value));
                    simTimeouts.push(t3);

                }, 200 / parseFloat(speedSel.value));
                simTimeouts.push(t2);

            }, 400 / parseFloat(speedSel.value));
            simTimeouts.push(t1);

        } else {
            // Queue request
            restQueueCount++;
            restQueueText.textContent = `Queue: ${restQueueCount}`;
            restQueueText.classList.remove('hidden');
            logToTerminal(`Batas koneksi tercapai (6/6). Request diantrekan (Queue size: ${restQueueCount}) [Head-of-Line Blocking]`, 'warn');
        }
    }

    function sendGrpcRequest() {
        const userId = payloadIdInp ? payloadIdInp.value : 'USR-9988223';
        const container = document.getElementById('packet-container');

        // Generate odd Stream ID (e.g. S1, S3, S5...)
        const streamId = 2 * Math.floor(Math.random() * 50) + 1;

        // Group containing circle and text label
        const packetG = document.createElementNS(svgNS, 'g');
        packetG.setAttribute('class', 'packet grpc-packet');

        const circle = document.createElementNS(svgNS, 'circle');
        circle.setAttribute('r', '5.5');
        circle.setAttribute('fill', 'url(#grpc-grad)');
        circle.setAttribute('filter', 'url(#glow-grpc)');
        packetG.appendChild(circle);

        const text = document.createElementNS(svgNS, 'text');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('y', '-9');
        text.setAttribute('fill', '#22d3ee');
        text.setAttribute('font-family', 'Outfit');
        text.setAttribute('font-size', '7px');
        text.setAttribute('font-weight', 'bold');
        text.textContent = `S${streamId}`;
        packetG.appendChild(text);

        const motion = document.createElementNS(svgNS, 'animateMotion');
        motion.setAttribute('dur', `${400 / parseFloat(speedSel.value)}ms`);
        motion.setAttribute('repeatCount', '1');
        motion.setAttribute('fill', 'freeze');

        const mpath = document.createElementNS(svgNS, 'mpath');
        mpath.setAttribute('href', '#path-grpc-line');
        motion.appendChild(mpath);
        packetG.appendChild(motion);

        if (container) container.appendChild(packetG);

        // Step 1: Client -> Server multiplexed
        const t1 = setTimeout(() => {
            pulseNode('node-grpc-server', 'grpc');
            const grpcBlock = document.getElementById('grpc-payload-block');
            if (grpcBlock) {
                grpcBlock.classList.add('glow-active-grpc');
                const tGlow = setTimeout(() => grpcBlock.classList.remove('glow-active-grpc'), 350 / parseFloat(speedSel.value));
                simTimeouts.push(tGlow);
            }
            logToTerminal(`Stream #${streamId}: Frame HEADERS & DATA biner diterima gRPC Server.`, 'grpc');

            packetG.remove();

            // DB Hop query packet
            const dbPack = document.createElementNS(svgNS, 'circle');
            dbPack.setAttribute('r', '4');
            dbPack.setAttribute('fill', '#fbbf24');
            dbPack.setAttribute('class', 'packet');

            const dbMotion = document.createElementNS(svgNS, 'animateMotion');
            dbMotion.setAttribute('dur', `${200 / parseFloat(speedSel.value)}ms`);
            dbMotion.setAttribute('repeatCount', '1');
            dbMotion.setAttribute('fill', 'freeze');
            
            const dbMpath = document.createElementNS(svgNS, 'mpath');
            dbMpath.setAttribute('href', '#path-grpc-db');
            dbMotion.appendChild(dbMpath);
            dbPack.appendChild(dbMotion);
            if (container) container.appendChild(dbPack);

            // Step 2: Server -> DB
            const t2 = setTimeout(() => {
                pulseNode('node-grpc-db', 'db');
                logToTerminal(`Stream #${streamId}: DB Query: <span class="text-yellow-500">SELECT * FROM users WHERE id = '${userId}';</span>`, 'grpc');
                
                dbPack.remove();

                // DB hop response
                const dbRespPack = document.createElementNS(svgNS, 'circle');
                dbRespPack.setAttribute('r', '4');
                dbRespPack.setAttribute('fill', '#fbbf24');
                dbRespPack.setAttribute('class', 'packet');

                const dbRespMotion = document.createElementNS(svgNS, 'animateMotion');
                dbRespMotion.setAttribute('dur', `${200 / parseFloat(speedSel.value)}ms`);
                dbRespMotion.setAttribute('repeatCount', '1');
                dbRespMotion.setAttribute('fill', 'freeze');
                dbRespMotion.setAttribute('keyPoints', '1;0');
                dbRespMotion.setAttribute('keyTimes', '0;1');
                dbRespMotion.setAttribute('calcMode', 'linear');
                
                const dbRespMpath = document.createElementNS(svgNS, 'mpath');
                dbRespMpath.setAttribute('href', '#path-grpc-db');
                dbRespMotion.appendChild(dbRespMpath);
                dbRespPack.appendChild(dbRespMotion);
                if (container) container.appendChild(dbRespPack);

                // Step 3: DB -> Server
                const t3 = setTimeout(() => {
                    pulseNode('node-grpc-server', 'grpc');
                    logToTerminal(`Stream #${streamId}: Menghasilkan biner Protobuf (${window.currentPayloadSizes.grpc} Bytes)...`, 'grpc');
                    
                    dbRespPack.remove();

                    // Response group Server -> Client multiplexed
                    const respG = document.createElementNS(svgNS, 'g');
                    respG.setAttribute('class', 'packet grpc-packet');

                    const respCircle = document.createElementNS(svgNS, 'circle');
                    respCircle.setAttribute('r', '5.5');
                    respCircle.setAttribute('fill', 'url(#grpc-grad)');
                    respCircle.setAttribute('filter', 'url(#glow-grpc)');
                    respG.appendChild(respCircle);

                    const respText = document.createElementNS(svgNS, 'text');
                    respText.setAttribute('text-anchor', 'middle');
                    respText.setAttribute('y', '-9');
                    respText.setAttribute('fill', '#22d3ee');
                    respText.setAttribute('font-family', 'Outfit');
                    respText.setAttribute('font-size', '7px');
                    respText.setAttribute('font-weight', 'bold');
                    respText.textContent = `S${streamId}`;
                    respG.appendChild(respText);

                    const respMotion = document.createElementNS(svgNS, 'animateMotion');
                    respMotion.setAttribute('dur', `${400 / parseFloat(speedSel.value)}ms`);
                    respMotion.setAttribute('repeatCount', '1');
                    respMotion.setAttribute('fill', 'freeze');
                    respMotion.setAttribute('keyPoints', '1;0');
                    respMotion.setAttribute('keyTimes', '0;1');
                    respMotion.setAttribute('calcMode', 'linear');

                    const respMpath = document.createElementNS(svgNS, 'mpath');
                    respMpath.setAttribute('href', '#path-grpc-line');
                    respMotion.appendChild(respMpath);
                    respG.appendChild(respMotion);
                    if (container) container.appendChild(respG);

                    // Step 4: Server -> Client
                    const t4 = setTimeout(() => {
                        pulseNode('node-grpc-client', 'grpc');
                        logToTerminal(`Stream #${streamId}: Frame DATA diterima. status: <span class="text-cyan-400">HEADERS(200) + DATA(${window.currentPayloadSizes.grpc} B)</span>`, 'grpc');
                        respG.remove();
                    }, 400 / parseFloat(speedSel.value));
                    simTimeouts.push(t4);

                }, 200 / parseFloat(speedSel.value));
                simTimeouts.push(t3);

            }, 200 / parseFloat(speedSel.value));
            simTimeouts.push(t2);

        }, 400 / parseFloat(speedSel.value));
        simTimeouts.push(t1);
    }
}
