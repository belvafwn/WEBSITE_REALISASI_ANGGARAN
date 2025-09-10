// Supabase Configuration
// IMPORTANT: Ganti dengan kredensial Supabase Anda sendiri
const SUPABASE_URL = 'https://scernchnrrfmdxtqrxrd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjZXJuY2hucnJmbWR4dHFyeHJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3OTYxNDYsImV4cCI6MjA3MjM3MjE0Nn0.UWUcsuPl5JJ7Batu6PBt4gMyTiosTqTQJ6Ile0eFV_U';

// Initialize Supabase client
let supabase;
if (typeof window !== 'undefined' && window.supabase) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Admin credentials (akan divalidasi dengan data di Supabase)
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD_HASH = 'admin123'; // Dalam produksi, gunakan hash yang aman

// Table name in Supabase
const TABLE_NAME = 'apbd_data';

// Database functions
async function fetchAllData() {
    try {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('*')
            .order('tahun', { ascending: false })
            .order('kategori', { ascending: true });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching data:', error);
        return [];
    }
}

async function fetchDataByCategory(category) {
    try {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('*')
            .eq('kategori', category)
            .order('tahun', { ascending: false })
            .order('subkategori', { ascending: true });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching category data:', error);
        return [];
    }
}

async function addData(dataObj) {
    try {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .insert([dataObj])
            .select();
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error adding data:', error);
        return { success: false, error: error.message };
    }
}

async function deleteData(id) {
    try {
        const { error } = await supabase
            .from(TABLE_NAME)
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error deleting data:', error);
        return { success: false, error: error.message };
    }
}

async function getYears() {
    try {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('tahun')
            .order('tahun', { ascending: false });
        
        if (error) throw error;
        
        // Get unique years
        const years = [...new Set(data.map(item => item.tahun))];
        return years;
    } catch (error) {
        console.error('Error fetching years:', error);
        return [];
    }
}

// Initialize database table if not exists
async function initializeDatabase() {
    // This function would normally create the table if it doesn't exist
    // But Supabase handles this through the dashboard
    // Make sure you have a table with the following structure:
    /*
    CREATE TABLE apbd_data (
        id SERIAL PRIMARY KEY,
        tahun INTEGER NOT NULL,
        kategori VARCHAR(50) NOT NULL,
        subkategori VARCHAR(255) NOT NULL,
        jumlah BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
    );
    */
    console.log('Database initialized');
}

// Helper function to format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Authentication functions
function isAuthenticated() {
    return sessionStorage.getItem('adminLoggedIn') === 'true';
}

function setAuthenticated(value) {
    if (value) {
        sessionStorage.setItem('adminLoggedIn', 'true');
    } else {
        sessionStorage.removeItem('adminLoggedIn');
    }
}

function validateLogin(username, password) {
    // Simple validation - in production, use proper authentication
    return username === ADMIN_USERNAME && password === ADMIN_PASSWORD_HASH;
}

// Export functions for use in other scripts
if (typeof window !== 'undefined') {
    window.dbFunctions = {
        fetchAllData,
        fetchDataByCategory,
        addData,
        deleteData,
        getYears,
        initializeDatabase,
        formatCurrency,
        isAuthenticated,
        setAuthenticated,
        validateLogin
    };
}