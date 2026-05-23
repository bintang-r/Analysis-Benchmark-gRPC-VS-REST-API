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

// Initialize Page using jQuery
$(document).ready(() => {
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

// Navigation Logic using jQuery
function initNavigation() {
    const navItems = $('.nav-item');
    const sections = $('.content-section');
    const mainContent = $('main');

    navItems.on('click', function() {
        const $this = $(this);
        // Remove active classes
        navItems.removeClass('active');
        sections.addClass('hidden').removeClass('block');

        // Add active class to clicked item
        $this.addClass('active');

        // Show corresponding section
        const targetSection = $('#' + $this.attr('data-target'));
        if (targetSection.length) {
            targetSection.removeClass('hidden').addClass('block');
        }

        // Scroll main content to top
        mainContent.scrollTop(0);

        // Trigger chart updates if returning to dashboard
        if ($this.attr('id') === 'btn-nav-dashboard') {
            Object.values(chartsInstance).forEach(chart => {
                chart.resize();
                chart.update('active');
            });
        }
    });
}

// Code Snippet Explorer Logic using jQuery
function initCodeExplorer() {
    const codeTabBtns = $('.code-tab-btn');
    const filenameEl = $('#code-filename');
    const codeContentEl = $('#code-content');
    const copyBtn = $('#btn-copy-code');

    // Load Default Snippet
    loadSnippet('proto-definition');

    codeTabBtns.on('click', function() {
        const $this = $(this);
        codeTabBtns.removeClass('active');
        $this.addClass('active');

        const fileKey = $this.attr('data-file');
        loadSnippet(fileKey);
        filenameEl.text($this.text().trim());
    });

    function loadSnippet(key) {
        if (codeSnippets[key]) {
            codeContentEl.text(codeSnippets[key]);
        }
    }

    // Copy to clipboard
    copyBtn.on('click', function() {
        const text = codeContentEl.text();
        navigator.clipboard.writeText(text).then(() => {
            copyBtn.text('Copied!');
            copyBtn.removeClass('bg-slate-800/50 text-slate-300 border-slate-700/60')
                   .addClass('bg-emerald-500/10 text-emerald-400 border-emerald-500/20');

            setTimeout(() => {
                copyBtn.text('Copy Code');
                copyBtn.removeClass('bg-emerald-500/10 text-emerald-400 border-emerald-500/20')
                       .addClass('bg-slate-800/50 text-slate-300 border-slate-700/60');
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    });
}

// Paper Table of Contents Active Highlighting using jQuery
function initPaperTOC() {
    const tocLinks = $('.toc-link');
    const paperSections = $('.paper-sub-section');
    const mainContent = $('main');

    tocLinks.on('click', function(e) {
        e.preventDefault();
        const $this = $(this);
        const targetId = $this.attr('href');
        const targetSection = $(targetId);

        if (targetSection.length) {
            // Scroll main content to target section
            const offset = targetSection.position().top + mainContent.scrollTop() - 50;
            mainContent.animate({
                scrollTop: offset
            }, 500);

            tocLinks.removeClass('active');
            $this.addClass('active');
        }
    });

    // Detect scroll position to highlight TOC link
    mainContent.on('scroll', function() {
        let currentSectionId = '';
        const scrollPosition = mainContent.scrollTop() + 100;

        paperSections.each(function() {
            const $sec = $(this);
            const sectionTop = $sec.position().top + mainContent.scrollTop();
            const sectionHeight = $sec.outerHeight();

            if (scrollPosition >= sectionTop && scrollPosition < (sectionTop + sectionHeight)) {
                currentSectionId = $sec.attr('id');
            }
        });

        if (currentSectionId) {
            tocLinks.removeClass('active');
            $(`.toc-link[href="#${currentSectionId}"]`).addClass('active');
        }
    });
}

// Parameter Controls Input Sync & Chart Update using jQuery
function initParameterControls() {
    $('input[id^="p-"]').on('input', function() {
        syncDataFromInputs();
        updateDashboardUI();
    });
}

function syncDataFromInputs() {
    const runs = [100, 500, 1000, 5000];

    runs.forEach((run, rIdx) => {
        // Read REST inputs
        benchmarkData.rest.responseTime[rIdx] = parseFloat($(`#p-rest-rt-${run}`).val()) || 0;
        benchmarkData.rest.throughput[rIdx] = parseFloat($(`#p-rest-tp-${run}`).val()) || 0;
        benchmarkData.rest.cpu[rIdx] = parseFloat($(`#p-rest-cpu-${run}`).val()) || 0;
        benchmarkData.rest.memory[rIdx] = parseFloat($(`#p-rest-mem-${run}`).val()) || 0;

        // Read gRPC inputs
        benchmarkData.grpc.responseTime[rIdx] = parseFloat($(`#p-grpc-rt-${run}`).val()) || 0;
        benchmarkData.grpc.throughput[rIdx] = parseFloat($(`#p-grpc-tp-${run}`).val()) || 0;
        benchmarkData.grpc.cpu[rIdx] = parseFloat($(`#p-grpc-cpu-${run}`).val()) || 0;
        benchmarkData.grpc.memory[rIdx] = parseFloat($(`#p-grpc-mem-${run}`).val()) || 0;
    });
}

// Updates UI Elements & Chart Instances using jQuery
function updateDashboardUI() {
    // 1. Update card text values
    const lastIdx = benchmarkData.concurrency.length - 1; // 5000 req

    const restMaxRt = benchmarkData.rest.responseTime[lastIdx];
    const grpcMaxRt = benchmarkData.grpc.responseTime[lastIdx];
    const restMaxTp = benchmarkData.rest.throughput[lastIdx];
    const grpcMaxTp = benchmarkData.grpc.throughput[lastIdx];

    $('#val-rest-rt').text(`${restMaxRt} ms`);
    $('#val-grpc-rt').text(`${grpcMaxRt} ms`);

    // Performance diff percentage
    const rtDiffPercent = restMaxRt > 0 ? ((restMaxRt - grpcMaxRt) / restMaxRt * 100).toFixed(1) : 0;
    $('#metric-grpc-diff').text(`${rtDiffPercent}% Faster`);
    $('#txt-latency-diff').text(`${restMaxRt - grpcMaxRt} ms`);
    $('#txt-rest-rt').text(`${restMaxRt} ms`);

    // Throughput speed ratio
    const tpRatio = restMaxTp > 0 ? (grpcMaxTp / restMaxTp).toFixed(1) : 0;
    $('#val-win-ratio').text(`${tpRatio}x`);
    $('#txt-grpc-tp').text(`${grpcMaxTp} req/s`);
    $('#txt-rest-tp').text(`${restMaxTp} req/s`);

    // 1.5 Update values inside the Academic Paper (Tabel 2 & Tabel 3)
    const runs = [100, 500, 1000, 5000];
    runs.forEach((run, idx) => {
        $(`#paper-rest-rt-${run}`).text(`${benchmarkData.rest.responseTime[idx]} ms`);
        $(`#paper-grpc-rt-${run}`).text(`${benchmarkData.grpc.responseTime[idx]} ms`);
        $(`#paper-rest-tp-${run}`).text(`${benchmarkData.rest.throughput[idx]} req/s`);
        $(`#paper-grpc-tp-${run}`).text(`${benchmarkData.grpc.throughput[idx]} req/s`);
    });

    // Update dynamic averages inside Paper Tabel 4 (CPU & Memory)
    const restCpuAvg = (benchmarkData.rest.cpu.reduce((a, b) => a + b, 0) / 4).toFixed(0);
    const grpcCpuAvg = (benchmarkData.grpc.cpu.reduce((a, b) => a + b, 0) / 4).toFixed(0);
    const restMemAvg = (benchmarkData.rest.memory.reduce((a, b) => a + b, 0) / 4).toFixed(0);
    const grpcMemAvg = (benchmarkData.grpc.memory.reduce((a, b) => a + b, 0) / 4).toFixed(0);

    $('#paper-rest-cpu-avg').text(`${restCpuAvg}%`);
    $('#paper-grpc-cpu-avg').text(`${grpcCpuAvg}%`);
    $('#paper-rest-mem-avg').text(`${restMemAvg} MB`);
    $('#paper-grpc-mem-avg').text(`${grpcMemAvg} MB`);

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

// // Interactive Network Simulator Logic using jQuery
function initSimulator() {
    const runBtn = $('#btn-run-sim');
    const resetBtn = $('#btn-reset-sim');
    const concurrencySel = $('#sim-concurrency');
    const speedSel = $('#sim-speed');
    const statusLabel = $('#sim-status-text');
    const termLog = $('#terminal-log-output');

    // Input fields for payload editor
    const payloadIdInp = $('#sim-payload-id');
    const payloadNameInp = $('#sim-payload-name');
    const payloadEmailInp = $('#sim-payload-email');
    const payloadRoleInp = $('#sim-payload-role');

    // Stats elements
    const restBar = $('#rest-progress-bar');
    const restTimeEl = $('#sim-rest-time');
    const restDoneEl = $('#sim-rest-done');

    const grpcBar = $('#grpc-progress-bar');
    const grpcTimeEl = $('#sim-grpc-time');
    const grpcDoneEl = $('#sim-grpc-done');

    // Queue text
    const restQueueText = $('#sim-rest-queue-text');

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
    $('#sim-payload-id, #sim-payload-name, #sim-payload-email, #sim-payload-role').on('input', updatePayloadVisuals);

    // Run first update to sync HTML with inputs on load
    updatePayloadVisuals();

    function updatePayloadVisuals() {
        const id = payloadIdInp.length ? payloadIdInp.val() : 'USR-9988223';
        const name = payloadNameInp.length ? payloadNameInp.val() : 'Muhammad Bintang';
        const email = payloadEmailInp.length ? payloadEmailInp.val() : 'mbintang23@mhs.unitama.ac.id';
        const role = payloadRoleInp.length ? payloadRoleInp.val() : 'Administrator';

        // 1. REST (JSON) representation and size
        const restObj = { id, name, email, role };
        const restJson = JSON.stringify(restObj, null, 2);
        const restColored = restJson
            .replace(/"(id|name|email|role)"/g, '<span class="text-rose-400">"$1"</span>')
            .replace(/: "(.*)"/g, ': <span class="text-emerald-400">"$1"</span>');
        
        $('#rest-payload-block').html(restColored);

        const restBytes = new TextEncoder().encode(restJson).length;
        $('#rest-payload-size').text(`Ukuran Payload: ~${restBytes} bytes (Teks JSON Formatted)`);

        // 2. gRPC (Protobuf) representation and size
        const protobufResult = calculateProtobuf(id, name, email, role);
        const grpcColored = `<span class="text-slate-500">// Serialized Binary (Hexadecimal representation)</span>\n` +
            protobufResult.hex.split(' ').map(h => `<span class="text-cyan-400">${h}</span>`).join(' ');
        
        $('#grpc-payload-block').html(grpcColored);
        $('#grpc-payload-size').text(`Ukuran Payload: ~${protobufResult.size} bytes (Biner terkompresi Protobuf)`);

        // Save sizes globally
        window.currentPayloadSizes = {
            rest: restBytes,
            grpc: protobufResult.size
        };
    }

    resetBtn.on('click', resetSimulation);

    runBtn.on('click', () => {
        if (simulatorRunning) return;
        runSimulation();
    });

    function logToTerminal(message, type = 'sys') {
        const $span = $('<span>');
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;

        let typeSpan = '';
        if (type === 'sys') typeSpan = `<span class="text-emerald-400">[SYS]</span>`;
        else if (type === 'rest') typeSpan = `<span class="text-rose-400">[REST-HTTP/1.1]</span>`;
        else if (type === 'grpc') typeSpan = `<span class="text-cyan-400">[gRPC-HTTP/2]</span>`;
        else if (type === 'warn') typeSpan = `<span class="text-yellow-500">[WARN]</span>`;

        $span.html(`[${timeStr}] ${typeSpan} ${message}<br>`);
        termLog.append($span);
        termLog.scrollTop(termLog[0].scrollHeight);
    }

    function pulseNode(nodeId, type) {
        const selector = `#${nodeId} circle, #${nodeId} path, #${nodeId} ellipse`;
        const $elements = $(selector);
        const className = `pulse-${type}`;
        
        $elements.addClass(className);
        const timeoutId = setTimeout(() => {
            $elements.removeClass(className);
        }, 300);
        simTimeouts.push(timeoutId);
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
        if (restBar.length) restBar.css('width', '0%');
        if (grpcBar.length) grpcBar.css('width', '0%');
        $('#sim-rest-pct').text('0%');
        $('#sim-grpc-pct').text('0%');

        restTimeEl.text('0 ms');
        restDoneEl.text('0/0 req');
        grpcTimeEl.text('0 ms');
        grpcDoneEl.text('0/0 req');

        $('#sim-rest-conns').text('0');
        $('#sim-grpc-conns').text('0');
        $('#sim-rest-bandwidth').text('0.0 KB');
        $('#sim-grpc-bandwidth').text('0.0 KB');

        if (restQueueText.length) {
            restQueueText.text('Queue: 0').addClass('hidden');
        }

        // Remove active glows from payload boxes
        $('#rest-payload-block').removeClass('glow-active-rest');
        $('#grpc-payload-block').removeClass('glow-active-grpc');

        // Reset SVG packets container
        $('#packet-container').empty();

        // Reset status
        statusLabel.text('Ready');
        termLog.html(`<span class="text-emerald-400">[SYS]</span> Simulation reset. Select concurrency and run again.<br>`);
    }

    function runSimulation() {
        resetSimulation();
        
        simulatorRunning = true;
        restRunning = true;
        grpcRunning = true;
        statusLabel.text('Running');

        const target = parseInt(concurrencySel.val()) || 100;
        const speed = parseFloat(speedSel.val()) || 1.0;
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
        $('#sim-grpc-conns').text('1');

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
                if (restBar.length) restBar.css('width', `${pct}%`);
                $('#sim-rest-pct').text(`${pct}%`);
                restDoneEl.text(`${Math.floor(restCompleted)}/${target} req`);
                restTimeEl.text(`${Math.floor(restTimeElapsed)} ms`);
                $('#sim-rest-bandwidth').text(`${restBandwidth.toFixed(1)} KB`);

                if (restCompleted >= target) {
                    restRunning = false;
                    restActiveConns = 0;
                    $('#sim-rest-conns').text('0');
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
                if (grpcBar.length) grpcBar.css('width', `${pct}%`);
                $('#sim-grpc-pct').text(`${pct}%`);
                grpcDoneEl.text(`${Math.floor(grpcCompleted)}/${target} req`);
                grpcTimeEl.text(`${Math.floor(grpcTimeElapsed)} ms`);
                $('#sim-grpc-bandwidth').text(`${grpcBandwidth.toFixed(1)} KB`);

                if (grpcCompleted >= target) {
                    grpcRunning = false;
                    grpcActiveConns = 0;
                    $('#sim-grpc-conns').text('0');
                    logToTerminal(`gRPC simulasi selesai! Total waktu: ${Math.floor(grpcTimeElapsed)} ms. Bandwidth: ${grpcBandwidth.toFixed(1)} KB`, 'grpc');
                }
            }

            // Check simulation completion
            if (!restRunning && !grpcRunning) {
                clearInterval(tickInterval);
                statusLabel.text('Finished');
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
        const userId = payloadIdInp.length ? payloadIdInp.val() : 'USR-9988223';
        
        if (restActiveConns < 6) {
            // Find available path index (0-5)
            let pathIdx = restPathsOccupied.indexOf(false);
            if (pathIdx === -1) pathIdx = 0;

            restPathsOccupied[pathIdx] = true;
            restActiveConns++;
            $('#sim-rest-conns').text(restActiveConns);

            // Trigger packet anim from Client to Server using jQuery wrapper for SVG
            const $packet = $(document.createElementNS(svgNS, 'circle')).attr({
                r: '5.5',
                fill: 'url(#rest-grad)',
                class: 'packet rest-packet',
                filter: 'url(#glow-rest)'
            });

            const $motion = $(document.createElementNS(svgNS, 'animateMotion')).attr({
                dur: `${400 / parseFloat(speedSel.val())}ms`,
                repeatCount: '1',
                fill: 'freeze'
            });

            const $mpath = $(document.createElementNS(svgNS, 'mpath')).attr('href', `#path-rest-${pathIdx}`);
            $motion.append($mpath);
            $packet.append($motion);
            $('#packet-container').append($packet);

            // Step 1 timeout: Client -> Server
            const t1 = setTimeout(() => {
                pulseNode('node-rest-server', 'rest');
                const $restBlock = $('#rest-payload-block');
                if ($restBlock.length) {
                    $restBlock.addClass('glow-active-rest');
                    const tGlow = setTimeout(() => $restBlock.removeClass('glow-active-rest'), 350 / parseFloat(speedSel.val()));
                    simTimeouts.push(tGlow);
                }
                logToTerminal(`Conn #${pathIdx+1}: HTTP GET request diterima Server. Mengambil data dari DB...`, 'rest');
                
                // Remove client packet
                $packet.remove();

                // DB hop query packet
                const $dbPack = $(document.createElementNS(svgNS, 'circle')).attr({
                    r: '4',
                    fill: '#fbbf24',
                    class: 'packet'
                });

                const $dbMotion = $(document.createElementNS(svgNS, 'animateMotion')).attr({
                    dur: `${200 / parseFloat(speedSel.val())}ms`,
                    repeatCount: '1',
                    fill: 'freeze'
                });
                
                const $dbMpath = $(document.createElementNS(svgNS, 'mpath')).attr('href', '#path-rest-db');
                $dbMotion.append($dbMpath);
                $dbPack.append($dbMotion);
                $('#packet-container').append($dbPack);

                // Step 2 timeout: Server -> DB
                const t2 = setTimeout(() => {
                    pulseNode('node-rest-db', 'db');
                    logToTerminal(`Conn #${pathIdx+1}: Database query: <span class="text-yellow-500">SELECT * FROM users WHERE id = '${userId}';</span>`, 'rest');
                    
                    $dbPack.remove();

                    // DB hop response packet (reverse path)
                    const $dbRespPack = $(document.createElementNS(svgNS, 'circle')).attr({
                        r: '4',
                        fill: '#fbbf24',
                        class: 'packet'
                    });

                    const $dbRespMotion = $(document.createElementNS(svgNS, 'animateMotion')).attr({
                        dur: `${200 / parseFloat(speedSel.val())}ms`,
                        repeatCount: '1',
                        fill: 'freeze',
                        keyPoints: '1;0',
                        keyTimes: '0;1',
                        calcMode: 'linear'
                    });
                    
                    const $dbRespMpath = $(document.createElementNS(svgNS, 'mpath')).attr('href', '#path-rest-db');
                    $dbRespMotion.append($dbRespMpath);
                    $dbRespPack.append($dbRespMotion);
                    $('#packet-container').append($dbRespPack);

                    // Step 3 timeout: DB -> Server
                    const t3 = setTimeout(() => {
                        pulseNode('node-rest-server', 'rest');
                        logToTerminal(`Conn #${pathIdx+1}: Data ditemukan. Server menyusun payload JSON (${window.currentPayloadSizes.rest} Bytes)...`, 'rest');
                        
                        $dbRespPack.remove();

                        // Response packet Server -> Client (reverse along same connection line)
                        const $respPack = $(document.createElementNS(svgNS, 'circle')).attr({
                            r: '5.5',
                            fill: 'url(#rest-grad)',
                            class: 'packet rest-packet',
                            filter: 'url(#glow-rest)'
                        });

                        const $respMotion = $(document.createElementNS(svgNS, 'animateMotion')).attr({
                            dur: `${400 / parseFloat(speedSel.val())}ms`,
                            repeatCount: '1',
                            fill: 'freeze',
                            keyPoints: '1;0',
                            keyTimes: '0;1',
                            calcMode: 'linear'
                        });

                        const $respMpath = $(document.createElementNS(svgNS, 'mpath')).attr('href', `#path-rest-${pathIdx}`);
                        $respMotion.append($respMpath);
                        $respPack.append($respMotion);
                        $('#packet-container').append($respPack);

                        // Step 4 timeout: Server -> Client
                        const t4 = setTimeout(() => {
                            pulseNode('node-rest-client', 'rest');
                            logToTerminal(`Conn #${pathIdx+1}: Response diterima Client. <span class="text-rose-400">200 OK</span> (${window.currentPayloadSizes.rest} Bytes)`, 'rest');
                            
                            $respPack.remove();

                            // Free connection slot
                            restPathsOccupied[pathIdx] = false;
                            restActiveConns = Math.max(0, restActiveConns - 1);
                            $('#sim-rest-conns').text(restActiveConns);

                            // Check queue to process next
                            if (restQueueCount > 0) {
                                restQueueCount--;
                                if (restQueueCount > 0) {
                                    restQueueText.text(`Queue: ${restQueueCount}`);
                                } else {
                                    restQueueText.addClass('hidden');
                                }
                                sendRestRequest();
                            }
                        }, 400 / parseFloat(speedSel.val()));
                        simTimeouts.push(t4);

                    }, 200 / parseFloat(speedSel.val()));
                    simTimeouts.push(t3);

                }, 200 / parseFloat(speedSel.val()));
                simTimeouts.push(t2);

            }, 400 / parseFloat(speedSel.val()));
            simTimeouts.push(t1);

        } else {
            // Queue request
            restQueueCount++;
            restQueueText.text(`Queue: ${restQueueCount}`).removeClass('hidden');
            logToTerminal(`Batas koneksi tercapai (6/6). Request diantrekan (Queue size: ${restQueueCount}) [Head-of-Line Blocking]`, 'warn');
        }
    }

    function sendGrpcRequest() {
        const userId = payloadIdInp.length ? payloadIdInp.val() : 'USR-9988223';

        // Generate odd Stream ID (e.g. S1, S3, S5...)
        const streamId = 2 * Math.floor(Math.random() * 50) + 1;

        // Group containing circle and text label using jQuery
        const $packetG = $(document.createElementNS(svgNS, 'g')).attr('class', 'packet grpc-packet');

        const $circle = $(document.createElementNS(svgNS, 'circle')).attr({
            r: '5.5',
            fill: 'url(#grpc-grad)',
            filter: 'url(#glow-grpc)'
        });
        $packetG.append($circle);

        const $text = $(document.createElementNS(svgNS, 'text')).attr({
            'text-anchor': 'middle',
            y: '-9',
            fill: '#22d3ee',
            'font-family': 'Outfit',
            'font-size': '7px',
            'font-weight': 'bold'
        }).text(`S${streamId}`);
        $packetG.append($text);

        const $motion = $(document.createElementNS(svgNS, 'animateMotion')).attr({
            dur: `${400 / parseFloat(speedSel.val())}ms`,
            repeatCount: '1',
            fill: 'freeze'
        });

        const $mpath = $(document.createElementNS(svgNS, 'mpath')).attr('href', '#path-grpc-line');
        $motion.append($mpath);
        $packetG.append($motion);

        $('#packet-container').append($packetG);

        // Step 1: Client -> Server multiplexed
        const t1 = setTimeout(() => {
            pulseNode('node-grpc-server', 'grpc');
            const $grpcBlock = $('#grpc-payload-block');
            if ($grpcBlock.length) {
                $grpcBlock.addClass('glow-active-grpc');
                const tGlow = setTimeout(() => $grpcBlock.removeClass('glow-active-grpc'), 350 / parseFloat(speedSel.val()));
                simTimeouts.push(tGlow);
            }
            logToTerminal(`Stream #${streamId}: Frame HEADERS & DATA biner diterima gRPC Server.`, 'grpc');

            $packetG.remove();

            // DB Hop query packet
            const $dbPack = $(document.createElementNS(svgNS, 'circle')).attr({
                r: '4',
                fill: '#fbbf24',
                class: 'packet'
            });

            const $dbMotion = $(document.createElementNS(svgNS, 'animateMotion')).attr({
                dur: `${200 / parseFloat(speedSel.val())}ms`,
                repeatCount: '1',
                fill: 'freeze'
            });
            
            const $dbMpath = $(document.createElementNS(svgNS, 'mpath')).attr('href', '#path-grpc-db');
            $dbMotion.append($dbMpath);
            $dbPack.append($dbMotion);
            $('#packet-container').append($dbPack);

            // Step 2: Server -> DB
            const t2 = setTimeout(() => {
                pulseNode('node-grpc-db', 'db');
                logToTerminal(`Stream #${streamId}: DB Query: <span class="text-yellow-500">SELECT * FROM users WHERE id = '${userId}';</span>`, 'grpc');
                
                $dbPack.remove();

                // DB hop response
                const $dbRespPack = $(document.createElementNS(svgNS, 'circle')).attr({
                    r: '4',
                    fill: '#fbbf24',
                    class: 'packet'
                });

                const $dbRespMotion = $(document.createElementNS(svgNS, 'animateMotion')).attr({
                    dur: `${200 / parseFloat(speedSel.val())}ms`,
                    repeatCount: '1',
                    fill: 'freeze',
                    keyPoints: '1;0',
                    keyTimes: '0;1',
                    calcMode: 'linear'
                });
                
                const $dbRespMpath = $(document.createElementNS(svgNS, 'mpath')).attr('href', '#path-grpc-db');
                $dbRespMotion.append($dbRespMpath);
                $dbRespPack.append($dbRespMotion);
                $('#packet-container').append($dbRespPack);

                // Step 3: DB -> Server
                const t3 = setTimeout(() => {
                    pulseNode('node-grpc-server', 'grpc');
                    logToTerminal(`Stream #${streamId}: Menghasilkan biner Protobuf (${window.currentPayloadSizes.grpc} Bytes)...`, 'grpc');
                    
                    $dbRespPack.remove();

                    // Response group Server -> Client multiplexed
                    const $respG = $(document.createElementNS(svgNS, 'g')).attr('class', 'packet grpc-packet');

                    const $respCircle = $(document.createElementNS(svgNS, 'circle')).attr({
                        r: '5.5',
                        fill: 'url(#grpc-grad)',
                        filter: 'url(#glow-grpc)'
                    });
                    $respG.append($respCircle);

                    const $respText = $(document.createElementNS(svgNS, 'text')).attr({
                        'text-anchor': 'middle',
                        y: '-9',
                        fill: '#22d3ee',
                        'font-family': 'Outfit',
                        'font-size': '7px',
                        'font-weight': 'bold'
                    }).text(`S${streamId}`);
                    $respG.append($respText);

                    const $respMotion = $(document.createElementNS(svgNS, 'animateMotion')).attr({
                        dur: `${400 / parseFloat(speedSel.val())}ms`,
                        repeatCount: '1',
                        fill: 'freeze',
                        keyPoints: '1;0',
                        keyTimes: '0;1',
                        calcMode: 'linear'
                    });

                    const $respMpath = $(document.createElementNS(svgNS, 'mpath')).attr('href', '#path-grpc-line');
                    $respMotion.append($respMpath);
                    $respG.append($respMotion);
                    $('#packet-container').append($respG);

                    // Step 4: Server -> Client
                    const t4 = setTimeout(() => {
                        pulseNode('node-grpc-client', 'grpc');
                        logToTerminal(`Stream #${streamId}: Frame DATA diterima. status: <span class="text-cyan-400">HEADERS(200) + DATA(${window.currentPayloadSizes.grpc} B)</span>`, 'grpc');
                        $respG.remove();
                    }, 400 / parseFloat(speedSel.val()));
                    simTimeouts.push(t4);

                }, 200 / parseFloat(speedSel.val()));
                simTimeouts.push(t3);

            }, 200 / parseFloat(speedSel.val()));
            simTimeouts.push(t2);

        }, 400 / parseFloat(speedSel.val()));
        simTimeouts.push(t1);
    }
}
