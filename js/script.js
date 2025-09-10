// Global variables
let currentData = [];
let deleteId = null;
let chartInstances = {};

// Initialize functions when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize database
    if (window.dbFunctions) {
        window.dbFunctions.initializeDatabase();
    }
});

// Home page functions
async function loadHomeSummary() {
    try {
        const data = await window.dbFunctions.fetchAllData();
        
        // Calculate totals by category
        const totals = {
            Pendapatan: 0,
            Pembelanjaan: 0,
            Pembiayaan: 0
        };
        
        data.forEach(item => {
            if (totals.hasOwnProperty(item.kategori)) {
                totals[item.kategori] += parseInt(item.jumlah);
            }
        });
        
        // Update UI
        document.getElementById('totalPendapatan').textContent = window.dbFunctions.formatCurrency(totals.Pendapatan);
        document.getElementById('totalPembelanjaan').textContent = window.dbFunctions.formatCurrency(totals.Pembelanjaan);
        document.getElementById('totalPembiayaan').textContent = window.dbFunctions.formatCurrency(totals.Pembiayaan);
        
        // Load years for filter
        const years = await window.dbFunctions.getYears();
        const yearSelect = document.getElementById('yearSelect');
        if (yearSelect) {
            years.forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                yearSelect.appendChild(option);
            });
            
            yearSelect.addEventListener('change', () => {
                loadHomeSummary();
            });
        }
        
        // Create overview chart
        createOverviewChart(totals);
        
    } catch (error) {
        console.error('Error loading home summary:', error);
    }
}

function createOverviewChart(totals) {
    const ctx = document.getElementById('overviewChart');
    if (!ctx) return;
    
    // Destroy existing chart if any
    if (chartInstances.overview) {
        chartInstances.overview.destroy();
    }
    
    chartInstances.overview = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(totals),
            datasets: [{
                label: 'Total (Rp)',
                data: Object.values(totals),
                backgroundColor: [
                    'rgba(46, 204, 113, 0.8)',
                    'rgba(231, 76, 60, 0.8)',
                    'rgba(52, 152, 219, 0.8)'
                ],
                borderColor: [
                    'rgba(46, 204, 113, 1)',
                    'rgba(231, 76, 60, 1)',
                    'rgba(52, 152, 219, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return window.dbFunctions.formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return window.dbFunctions.formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

// Category page functions
async function loadCategoryData(category) {
    try {
        const data = await window.dbFunctions.fetchDataByCategory(category);
        currentData = data;
        
        // Calculate total
        const total = data.reduce((sum, item) => sum + parseInt(item.jumlah), 0);
        const totalElement = document.getElementById('totalAmount');
        if (totalElement) {
            totalElement.textContent = window.dbFunctions.formatCurrency(total);
        }
        
        // Load years for filter
        const years = [...new Set(data.map(item => item.tahun))].sort((a, b) => b - a);
        const yearFilter = document.getElementById('yearFilter');
        if (yearFilter) {
            yearFilter.innerHTML = '<option value="all">Semua Tahun</option>';
            years.forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                yearFilter.appendChild(option);
            });
            
            yearFilter.addEventListener('change', (e) => {
                filterDataByYear(e.target.value, category);
            });
        }
        
        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                loadCategoryData(category);
            });
        }
        
        // Create charts
        createCategoryChart(data, category);
        createTrendChart(data);
        
        // Populate table
        populateDataTable(data);
        
    } catch (error) {
        console.error('Error loading category data:', error);
    }
}

function filterDataByYear(year, category) {
    let filteredData = currentData;
    
    if (year !== 'all') {
        filteredData = currentData.filter(item => item.tahun == year);
    }
    
    // Update total
    const total = filteredData.reduce((sum, item) => sum + parseInt(item.jumlah), 0);
    document.getElementById('totalAmount').textContent = window.dbFunctions.formatCurrency(total);
    
    // Update charts
    createCategoryChart(filteredData, category);
    createTrendChart(filteredData);
    
    // Update table
    populateDataTable(filteredData);
}

function createCategoryChart(data, category) {
    const chartId = category.toLowerCase() + 'Chart';
    const ctx = document.getElementById(chartId);
    if (!ctx) return;
    
    // Group data by subkategori
    const groupedData = {};
    data.forEach(item => {
        if (!groupedData[item.subkategori]) {
            groupedData[item.subkategori] = 0;
        }
        groupedData[item.subkategori] += parseInt(item.jumlah);
    });
    
    // Sort by value
    const sortedData = Object.entries(groupedData)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15); // Limit to top 15 for readability
    
    // Destroy existing chart
    if (chartInstances[chartId]) {
        chartInstances[chartId].destroy();
    }
    
    chartInstances[chartId] = new Chart(ctx, {
        type: 'horizontalBar',
        data: {
            labels: sortedData.map(item => item[0]),
            datasets: [{
                label: 'Jumlah (Rp)',
                data: sortedData.map(item => item[1]),
                backgroundColor: 'rgba(52, 152, 219, 0.8)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return window.dbFunctions.formatCurrency(context.parsed.x);
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return window.dbFunctions.formatCurrency(value);
                        }
                    }
                },
                y: {
                    ticks: {
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    });
}

function createTrendChart(data) {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;
    
    // Group data by year
    const yearlyData = {};
    data.forEach(item => {
        if (!yearlyData[item.tahun]) {
            yearlyData[item.tahun] = 0;
        }
        yearlyData[item.tahun] += parseInt(item.jumlah);
    });
    
    const sortedYears = Object.keys(yearlyData).sort();
    
    // Destroy existing chart
    if (chartInstances.trend) {
        chartInstances.trend.destroy();
    }
    
    chartInstances.trend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedYears,
            datasets: [{
                label: 'Trend per Tahun',
                data: sortedYears.map(year => yearlyData[year]),
                borderColor: 'rgba(46, 204, 113, 1)',
                backgroundColor: 'rgba(46, 204, 113, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return window.dbFunctions.formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return window.dbFunctions.formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

function populateDataTable(data) {
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) return;
    
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" class="text-center">Tidak ada data</td></tr>';
        return;
    }
    
    tableBody.innerHTML = data.map(item => `
        <tr>
            <td>${item.tahun}</td>
            <td>${item.subkategori}</td>
            <td>${window.dbFunctions.formatCurrency(item.jumlah)}</td>
        </tr>
    `).join('');
}

// Admin functions
function initAdmin() {
    const loginForm = document.getElementById('loginForm');
    const loginSection = document.getElementById('loginSection');
    const adminPanel = document.getElementById('adminPanel');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Check if already logged in
    if (window.dbFunctions.isAuthenticated()) {
        showAdminPanel();
    }
    
    // Login form handler
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            if (window.dbFunctions.validateLogin(username, password)) {
                window.dbFunctions.setAuthenticated(true);
                showAdminPanel();
            } else {
                document.getElementById('loginError').textContent = 'Username atau password salah!';
            }
        });
    }
    
    // Logout handler
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            window.dbFunctions.setAuthenticated(false);
            showLoginForm();
        });
    }
    
    // Add data form handler
    const addDataForm = document.getElementById('addDataForm');
    if (addDataForm) {
        addDataForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const dataObj = {
                tahun: parseInt(document.getElementById('tahun').value),
                kategori: document.getElementById('kategori').value,
                subkategori: document.getElementById('subkategori').value,
                jumlah: parseInt(document.getElementById('jumlah').value)
            };
            
            const result = await window.dbFunctions.addData(dataObj);
            
            const messageEl = document.getElementById('addMessage');
            if (result.success) {
                messageEl.className = 'message success show';
                messageEl.textContent = 'Data berhasil ditambahkan!';
                addDataForm.reset();
                loadAdminData();
            } else {
                messageEl.className = 'message error show';
                messageEl.textContent = 'Gagal menambah data: ' + result.error;
            }
            
            setTimeout(() => {
                messageEl.className = 'message';
            }, 3000);
        });
    }
    
    // Filter handlers
    const filterKategori = document.getElementById('filterKategori');
    const filterTahun = document.getElementById('filterTahun');
    const refreshData = document.getElementById('refreshData');
    
    if (filterKategori) {
        filterKategori.addEventListener('change', filterAdminData);
    }
    
    if (filterTahun) {
        filterTahun.addEventListener('change', filterAdminData);
    }
    
    if (refreshData) {
        refreshData.addEventListener('click', loadAdminData);
    }
    
    // Delete modal handlers
    const confirmDelete = document.getElementById('confirmDelete');
    const cancelDelete = document.getElementById('cancelDelete');
    
    if (confirmDelete) {
        confirmDelete.addEventListener('click', async () => {
            if (deleteId) {
                const result = await window.dbFunctions.deleteData(deleteId);
                if (result.success) {
                    loadAdminData();
                }
                closeDeleteModal();
            }
        });
    }
    
    if (cancelDelete) {
        cancelDelete.addEventListener('click', closeDeleteModal);
    }
}

function showAdminPanel() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    loadAdminData();
}

function showLoginForm() {
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('adminPanel').style.display = 'none';
}

async function loadAdminData() {
    try {
        const data = await window.dbFunctions.fetchAllData();
        currentData = data;
        
        // Load years for filter
        const years = await window.dbFunctions.getYears();
        const filterTahun = document.getElementById('filterTahun');
        if (filterTahun && filterTahun.children.length === 1) {
            years.forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                filterTahun.appendChild(option);
            });
        }
        
        populateAdminTable(data);
        
    } catch (error) {
        console.error('Error loading admin data:', error);
    }
}

function filterAdminData() {
    const kategori = document.getElementById('filterKategori').value;
    const tahun = document.getElementById('filterTahun').value;
    
    let filteredData = currentData;
    
    if (kategori !== 'all') {
        filteredData = filteredData.filter(item => item.kategori === kategori);
    }
    
    if (tahun !== 'all') {
        filteredData = filteredData.filter(item => item.tahun == tahun);
    }
    
    populateAdminTable(filteredData);
}

function populateAdminTable(data) {
    const tableBody = document.getElementById('adminTableBody');
    if (!tableBody) return;
    
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Tidak ada data</td></tr>';
        return;
    }
    
    tableBody.innerHTML = data.map(item => `
        <tr>
            <td>${item.id}</td>
            <td>${item.tahun}</td>
            <td>${item.kategori}</td>
            <td>${item.subkategori}</td>
            <td>${window.dbFunctions.formatCurrency(item.jumlah)}</td>
            <td>
                <button class="btn btn-danger" onclick="showDeleteModal(${item.id})">Hapus</button>
            </td>
        </tr>
    `).join('');
}

function showDeleteModal(id) {
    deleteId = id;
    document.getElementById('deleteModal').classList.add('show');
}

function closeDeleteModal() {
    deleteId = null;
    document.getElementById('deleteModal').classList.remove('show');
}

// Make functions available globally
window.showDeleteModal = showDeleteModal;