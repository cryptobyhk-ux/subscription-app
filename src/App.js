import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, Calendar, User, Clock, AlertTriangle, CheckCircle, Search, CreditCard, Save, Loader } from 'lucide-react';

// --- CONFIGURATION ---
// Step 1: Niche diye gaye URL ko apne Google Apps Script Web App URL se replace karein
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyAcE3S7UF_DkOrCVf9x_7ECUGCeehRGZ2_S1MdsNHzTfzPTy-WNqozZ2K3v6bRUMfDOw/exec"; 

const App = () => {
  // --- State Management ---
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    service: 'Diamond Plan ($100)', 
    startDate: '',
    endDate: ''
  });
  const [view, setView] = useState('dashboard'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // Loading state for sheet upload

  // --- Load Data from LocalStorage on mount ---
  useEffect(() => {
    const savedData = localStorage.getItem('subscriptionData');
    if (savedData) {
      setUsers(JSON.parse(savedData));
    }
  }, []);

  // --- Save Data to LocalStorage whenever users change ---
  useEffect(() => {
    localStorage.setItem('subscriptionData', JSON.stringify(users));
  }, [users]);

  // --- Helper Functions ---
  const calculateDaysLeft = (endDate) => {
    const today = new Date();
    const end = new Date(endDate);
    const timeDiff = end.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff;
  };

  const getStatus = (endDate) => {
    const days = calculateDaysLeft(endDate);
    if (days < 0) return { label: 'Expired', color: 'bg-red-100 text-red-700 border-red-200', icon: <AlertTriangle size={16}/> };
    if (days <= 3) return { label: 'Expiring Soon', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: <Clock size={16}/> };
    return { label: 'Active', color: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle size={16}/> };
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- GOOGLE SHEETS SUBMISSION ---
  const saveToGoogleSheet = async (data) => {
    if (GOOGLE_SCRIPT_URL === "YOUR_GOOGLE_SCRIPT_WEB_APP_URL_HERE") {
      alert("Please configure the Google Script URL in the code first!");
      return false;
    }

    try {
      // mode: 'no-cors' is important to avoid browser blocking the request
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', 
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      return true;
    } catch (error) {
      console.error("Error saving to sheet:", error);
      alert("Failed to save to Google Sheet. Check console.");
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.endDate) return;

    setIsSubmitting(true);

    const newUser = {
      id: Date.now(),
      ...formData
    };

    // 1. Local Update
    setUsers([...users, newUser]);

    // 2. Google Sheet Update
    const sheetData = {
      timestamp: new Date().toISOString(),
      name: formData.name,
      service: formData.service,
      startDate: formData.startDate,
      endDate: formData.endDate,
      status: 'Active'
    };

    await saveToGoogleSheet(sheetData);

    setIsSubmitting(false);
    
    // Reset form
    setFormData({ name: '', service: 'Diamond Plan ($100)', startDate: '', endDate: '' });
    setView('dashboard');
    alert("User added and saved to Google Sheet!");
  };

  const handleDelete = (id) => {
    // FIX: window.confirm use karna zaroori hai
    if (window.confirm('Are you sure you want to delete this user? (This only deletes from the app, not the Google Sheet)')) {
      setUsers(users.filter(user => user.id !== id));
    }
  };

  // --- Notifications Logic ---
  const expiringUsers = users.filter(user => {
    const days = calculateDaysLeft(user.endDate);
    return days <= 3 && days >= 0;
  });

  const expiredUsers = users.filter(user => calculateDaysLeft(user.endDate) < 0);

  const totalNotifications = expiringUsers.length + expiredUsers.length;

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.service.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      {/* --- Header --- */}
      <header className="bg-indigo-600 text-white p-4 shadow-lg sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Inspired analyst Subscription
          </h1>
          <div className="relative cursor-pointer" onClick={() => setView('dashboard')}>
            <Bell className="h-6 w-6" />
            {totalNotifications > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                {totalNotifications}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        
        {/* --- Alert Section (Top Priority Notifications) --- */}
        {view === 'dashboard' && totalNotifications > 0 && (
          <div className="mb-6 space-y-3">
            {expiredUsers.map(user => (
              <div key={user.id} className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm flex justify-between items-center">
                <div>
                  <p className="font-bold text-red-700">Subscription Expired!</p>
                  <p className="text-sm text-red-600">{user.name}'s {user.service} has expired.</p>
                </div>
                <button onClick={() => handleDelete(user.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">Clear</button>
              </div>
            ))}
            {expiringUsers.map(user => (
              <div key={user.id} className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded shadow-sm">
                <p className="font-bold text-yellow-700">Expiring Soon</p>
                <p className="text-sm text-yellow-600">{user.name}'s {user.service} expires in {calculateDaysLeft(user.endDate)} days.</p>
              </div>
            ))}
          </div>
        )}

        {/* --- Tabs --- */}
        <div className="flex gap-4 mb-6">
          <button 
            onClick={() => setView('dashboard')}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${view === 'dashboard' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setView('add')}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${view === 'add' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
          >
            <Plus size={18} /> Add New User
          </button>
        </div>

        {/* --- Add Form View --- */}
        {view === 'add' && (
          <div className="bg-white rounded-xl shadow-md p-6 animate-fade-in">
            <h2 className="text-xl font-bold mb-4 text-gray-700">Add New Subscriber</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter customer name"
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Tier / Plan</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-3 text-gray-400" size={18} />
                  <select
                    name="service"
                    value={formData.service}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    required
                  >
                    <option value="Diamond Plan ($100)">Diamond Plan ($100)</option>
                    <option value="Platinum Plan ($60)">Platinum Plan ($60)</option>
                    <option value="Premium Plan ($20)">Premium Plan ($20)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input 
                    type="date" 
                    name="startDate" 
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input 
                    type="date" 
                    name="endDate" 
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    required 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-all transform active:scale-95 shadow-lg flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? (
                  <>
                    <Loader className="animate-spin" size={20} /> Saving to Sheet...
                  </>
                ) : (
                  <>
                    <Save size={20} /> Save Subscription
                  </>
                )}
              </button>
            </form>
            <p className="text-xs text-center text-gray-400 mt-4">Data will be saved locally and to Google Sheets.</p>
          </div>
        )}

        {/* --- Dashboard View --- */}
        {view === 'dashboard' && (
          <div className="space-y-4">
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search user or plan..." 
                className="w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* List */}
            {filteredUsers.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <p>No data found. Click "Add New User" to get started.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredUsers.map(user => {
                  const status = getStatus(user.endDate);
                  const daysLeft = calculateDaysLeft(user.endDate);
                  
                  return (
                    <div key={user.id} className="bg-white p-4 rounded-xl shadow hover:shadow-md transition-shadow border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between sm:justify-start gap-3 mb-1">
                          <h3 className="text-lg font-bold text-gray-800">{user.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${status.color}`}>
                            {status.icon} {status.label}
                          </span>
                        </div>
                        <p className="text-indigo-600 text-sm font-medium flex items-center gap-1">
                           <CreditCard size={14} /> {user.service}
                        </p>
                        <div className="text-xs text-gray-400 mt-2 flex gap-4">
                          <span>Start: {user.startDate}</span>
                          <span className="font-semibold text-gray-500">End: {user.endDate}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="text-center bg-gray-50 px-3 py-1 rounded-lg">
                          <span className={`block text-xl font-bold ${daysLeft < 0 ? 'text-red-600' : daysLeft <= 3 ? 'text-yellow-600' : 'text-indigo-600'}`}>
                            {daysLeft < 0 ? Math.abs(daysLeft) : daysLeft}
                          </span>
                          <span className="text-[10px] uppercase text-gray-500">{daysLeft < 0 ? 'Days Ago' : 'Days Left'}</span>
                        </div>
                        
                        <button 
                          onClick={() => handleDelete(user.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
