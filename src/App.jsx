import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  DollarSign, 
  Briefcase, 
  Package, 
  Menu, 
  X, 
  Plus, 
  Search, 
  Bell,
  Wifi,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Sparkles,
  Bot,
  Trash2,
  Clock,
  ClipboardPaste,
  CheckCircle,
  XCircle,
  Wrench,
  Inbox,
  Gift,
  CalendarDays,
  Edit2,
  Fingerprint,
  UserMinus,
  FileText,
  Edit,
  Send,
  Undo2,
  CheckCircle2
} from 'lucide-react';

// === إعدادات Firebase ===
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

const userFirebaseConfig = {
  apiKey: "AIzaSyAbesliUC0cUW4HUYBrDsjFUc3A2GFpJD8",
  authDomain: "fly-net-b2a2b.firebaseapp.com",
  projectId: "fly-net-b2a2b",
  storageBucket: "fly-net-b2a2b.firebasestorage.app",
  messagingSenderId: "198169621602",
  appId: "1:198169621602:web:0ad3a2ff22da9b7daf8d3b"
};

// استخدمنا إعداداتك الخاصة (مع دعم بيئة المعاينة في حال وجودها)
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : userFirebaseConfig;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'flynet-app';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // --- حالات قواعد البيانات (الآن تبدأ فارغة لتجلب البيانات الحقيقية من Firebase) ---
  const [customers, setCustomers] = useState([]);
  const [finances, setFinances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [techInventory, setTechInventory] = useState([]);
  const [materialRequests, setMaterialRequests] = useState([]);

  // --- دوال Firebase للمزامنة ---
  useEffect(() => {
    // 1. تسجيل الدخول لقاعدة البيانات
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth); // دخول مخفي لشركتك
        }
      } catch (error) {
        console.error("Auth error:", error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // 2. جلب البيانات بشكل لحظي (Real-time) بمجرد تسجيل الدخول
    if (!user) return;

    const getColRef = (colName) => collection(db, 'artifacts', appId, 'public', 'data', colName);
    const unsubs = [];

    unsubs.push(onSnapshot(getColRef('customers'), (snap) => setCustomers(snap.docs.map(d => ({ ...d.data(), id: d.id }))), console.error));
    unsubs.push(onSnapshot(getColRef('finances'), (snap) => setFinances(snap.docs.map(d => ({ ...d.data(), id: d.id }))), console.error));
    unsubs.push(onSnapshot(getColRef('employees'), (snap) => setEmployees(snap.docs.map(d => ({ ...d.data(), id: d.id }))), console.error));
    unsubs.push(onSnapshot(getColRef('inventory'), (snap) => setInventory(snap.docs.map(d => ({ ...d.data(), id: d.id }))), console.error));
    unsubs.push(onSnapshot(getColRef('techInventory'), (snap) => setTechInventory(snap.docs.map(d => ({ ...d.data(), id: d.id }))), console.error));
    unsubs.push(onSnapshot(getColRef('materialRequests'), (snap) => setMaterialRequests(snap.docs.map(d => ({ ...d.data(), id: d.id }))), console.error));

    return () => unsubs.forEach(unsub => unsub());
  }, [user]);

  // دالة مساعدة لحفظ وحذف المستندات في Firebase
  const saveDoc = (colName, id, data) => {
    if (!user) return;
    const ref = doc(db, 'artifacts', appId, 'public', 'data', colName, id.toString());
    setDoc(ref, data).catch(console.error);
  };
  const delDoc = (colName, id) => {
    if (!user) return;
    const ref = doc(db, 'artifacts', appId, 'public', 'data', colName, id.toString());
    deleteDoc(ref).catch(console.error);
  };

  // --- دوال مساعدة لمعالجة التواريخ ---
  const parseDateString = (dateStr) => {
    if (!dateStr || dateStr === 'غير محدد') return null;
    let d = new Date(dateStr);
    if (isNaN(d.getTime()) && dateStr.match(/^\d{2,4}[\/\-\.]\d{2}[\/\-\.]\d{2,4}$/)) {
      const parts = dateStr.split(/[\/\-\.]/);
      let year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      d = new Date(`${year}-${parts[1]}-${parts[0]}`); 
    }
    return isNaN(d.getTime()) ? null : d;
  };

  const checkIsExpired = (dateStr) => {
    const d = parseDateString(dateStr);
    if (!d) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    return d < today;
  };

  // --- حالات الواجهة (UI States) ---
  const [inventoryTab, setInventoryTab] = useState('general');
  const [inventoryFilter, setInventoryFilter] = useState('all');
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({ techName: '', itemName: '', quantity: 1 });
  const [invItemModal, setInvItemModal] = useState({ open: false, isEdit: false, id: null, itemName: '', category: 'أجهزة بث', quantity: '', unitPrice: '' });
  const [dispenseModal, setDispenseModal] = useState({ open: false, item: null, techName: '', quantity: '' });
  const [returnModal, setReturnModal] = useState({ open: false, techItem: null, quantity: '' });
  const [aiModal, setAiModal] = useState({ isOpen: false, title: '', content: '', isLoading: false });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [notifications, setNotifications] = useState([{ id: 1, title: 'النظام جاهز', message: 'مرحباً بك في نظام إدارة FLY NET وتم الربط بقاعدة البيانات.', time: 'الآن', read: false, type: 'success' }]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  // Employee Modals
  const [empModalOpen, setEmpModalOpen] = useState(false);
  const [currentEmp, setCurrentEmp] = useState({ name: '', role: '', baseSalary: 0, phone: '', status: 'مداوم', offDay: 'الجمعة' });
  const [empActionModal, setEmpActionModal] = useState({ open: false, type: '', empId: null, amount: '', note: '' });
  const [fingerprintModalOpen, setFingerprintModalOpen] = useState(false);
  const [attendanceData, setAttendanceData] = useState({ empId: '', status: 'absent', penaltyAmount: 0 });
  const [empDetailsModal, setEmpDetailsModal] = useState({ open: false, employee: null });

  const daysOfWeek = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const todayName = daysOfWeek[new Date().getDay()];

  // --- الحسابات العامة ---
  const totalIncome = finances.filter(f => f.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = finances.filter(f => f.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const netProfit = totalIncome - totalExpense;

  const totalCustomersCount = customers.length;
  const expiredCustomersCount = customers.filter(c => checkIsExpired(c.expiryDate)).length;
  const activeCustomersCount = totalCustomersCount - expiredCustomersCount;
  const expiringSoonCount = customers.filter(c => {
    if (checkIsExpired(c.expiryDate)) return false; 
    const d = parseDateString(c.expiryDate);
    if (!d) return false;
    const today = new Date();
    today.setHours(0,0,0,0);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    return d <= nextWeek;
  }).length;

  const showToast = (message, type = 'success') => {
    try {
      const audioUrl = type === 'success' ? 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' : 'https://assets.mixkit.co/active_storage/sfx/2868/2868-preview.mp3';
      const audio = new Audio(audioUrl);
      audio.volume = 0.5; audio.play().catch(()=>{});
    } catch(e) {}
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
    setNotifications(prev => [{ id: Date.now(), title: type === 'success' ? 'إجراء ناجح' : 'تنبيه النظام', message: message, time: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }), read: false, type: type }, ...prev].slice(0, 50));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setIsNotifOpen(false);
  };

  // ==========================================
  // --- دوال المخزن ---
  // ==========================================
  const handleSaveInvItem = () => {
    if (!invItemModal.itemName || invItemModal.quantity === '' || invItemModal.unitPrice === '') return showToast('يرجى تعبئة جميع الحقول', 'error');
    const data = { itemName: invItemModal.itemName, category: invItemModal.category, quantity: Number(invItemModal.quantity), unitPrice: Number(invItemModal.unitPrice) };
    if (invItemModal.isEdit) {
      saveDoc('inventory', invItemModal.id, { ...data, id: invItemModal.id });
      showToast('تم تعديل المادة بنجاح', 'success');
    } else {
      const newId = Date.now().toString();
      saveDoc('inventory', newId, { ...data, id: newId });
      showToast('تمت إضافة المادة بنجاح', 'success');
    }
    setInvItemModal({ open: false, isEdit: false, id: null, itemName: '', category: 'أجهزة بث', quantity: '', unitPrice: '' });
  };

  const handleDirectDispense = () => {
    const q = Number(dispenseModal.quantity);
    if (!dispenseModal.techName || q <= 0 || q > dispenseModal.item.quantity) return showToast('خطأ: تأكد من صحة البيانات', 'error');
    saveDoc('inventory', dispenseModal.item.id, { ...dispenseModal.item, quantity: dispenseModal.item.quantity - q });
    const existing = techInventory.find(i => i.techName === dispenseModal.techName && i.itemName === dispenseModal.item.itemName);
    if (existing) {
      saveDoc('techInventory', existing.id, { ...existing, quantity: existing.quantity + q });
    } else {
      const newId = Date.now().toString();
      saveDoc('techInventory', newId, { id: newId, techName: dispenseModal.techName, itemName: dispenseModal.item.itemName, quantity: q, category: dispenseModal.item.category });
    }
    showToast(`تم صرف ${q} من ${dispenseModal.item.itemName} للفني ${dispenseModal.techName} بنجاح`, 'success');
    setDispenseModal({ open: false, item: null, techName: '', quantity: '' });
  };

  const handlePartialReturn = () => {
    const q = Number(returnModal.quantity);
    if (q <= 0 || q > returnModal.techItem.quantity) return showToast('خطأ: الكمية المرجعة غير صحيحة', 'error');
    const existingGen = inventory.find(i => i.itemName === returnModal.techItem.itemName);
    if (existingGen) {
      saveDoc('inventory', existingGen.id, { ...existingGen, quantity: existingGen.quantity + q });
    } else {
      const newId = Date.now().toString();
      saveDoc('inventory', newId, { id: newId, itemName: returnModal.techItem.itemName, quantity: q, unitPrice: 0, category: returnModal.techItem.category });
    }
    const newTechQ = returnModal.techItem.quantity - q;
    if (newTechQ > 0) saveDoc('techInventory', returnModal.techItem.id, { ...returnModal.techItem, quantity: newTechQ });
    else delDoc('techInventory', returnModal.techItem.id);
    showToast(`تم استرجاع ${q} من ${returnModal.techItem.itemName} إلى المخزن العام`, 'success');
    setReturnModal({ open: false, techItem: null, quantity: '' });
  };

  const handleApproveRequest = (req) => {
    const genItem = inventory.find(i => i.itemName === req.itemName);
    if (!genItem || genItem.quantity < req.requestedQuantity) return showToast('الكمية في المخزن العام غير كافية لتلبية الطلب!', 'error');
    saveDoc('inventory', genItem.id, { ...genItem, quantity: genItem.quantity - req.requestedQuantity });
    const existingItem = techInventory.find(item => item.techName === req.techName && item.itemName === req.itemName);
    if (existingItem) {
      saveDoc('techInventory', existingItem.id, { ...existingItem, quantity: existingItem.quantity + req.requestedQuantity });
    } else {
      const newId = Date.now().toString();
      saveDoc('techInventory', newId, { id: newId, techName: req.techName, itemName: req.itemName, quantity: req.requestedQuantity, category: genItem.category });
    }
    delDoc('materialRequests', req.id);
    showToast(`تمت الموافقة وتم صرف ${req.requestedQuantity} ${req.itemName} للفني ${req.techName}`, 'success');
  };

  const handleRejectRequest = (reqId) => { delDoc('materialRequests', reqId); showToast('تم رفض الطلب', 'success'); };

  const handleSubmitRequest = () => {
    if (!newRequest.techName || !newRequest.itemName || newRequest.quantity < 1) return showToast('يرجى تعبئة الحقول', 'error');
    const newId = Date.now().toString();
    saveDoc('materialRequests', newId, { id: newId, techName: newRequest.techName, itemName: newRequest.itemName, requestedQuantity: Number(newRequest.quantity), date: new Date().toISOString().split('T')[0], status: 'pending' });
    showToast('تم إرسال الطلب بنجاح', 'success');
    setRequestModalOpen(false); setNewRequest({ techName: '', itemName: '', quantity: 1 });
  };

  // ==========================================
  // --- الاستيراد الذكي (Smart Paste) ---
  // ==========================================
  const handleSmartPaste = () => {
    if (!pastedText.trim()) return showToast('الرجاء لصق البيانات أولاً.', 'error');
    const newCustomersMap = new Map();
    const parser = new DOMParser();
    const docHTML = parser.parseFromString(pastedText, 'text/html');
    const namesNodes = docHTML.querySelectorAll('[data-test-id^="sub-list-item-cst-name-"]');
    const datesNodes = docHTML.querySelectorAll('[data-test-id^="sub-list-item-expire-date-"]');
    const plansNodes = docHTML.querySelectorAll('[data-test-id^="sub-list-item-services-"][data-test-id$="_0"]');

    if (namesNodes.length > 0) {
      namesNodes.forEach((nameNode, index) => {
        let name = nameNode.innerText.replace(/\s*بلا\s*/g, ' ').replace(/\s+/g, ' ').trim();
        let expDateRaw = datesNodes[index] ? datesNodes[index].innerText.trim() : '';
        let plan = plansNodes[index] ? plansNodes[index].innerText.trim() : 'FTTH Basic';
        let formattedDate = expDateRaw;
        if (expDateRaw.match(/\d{2}[\.\/\-]\d{2}[\.\/\-]\d{2,4}/)) {
          const parts = expDateRaw.split(/[\.\/\-]/);
          let year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
          formattedDate = `${year}-${parts[1]}-${parts[0]}`;
        }
        if (name && name.length > 2) {
          const uniqueKey = name + "_" + formattedDate;
          newCustomersMap.set(uniqueKey, { id: uniqueKey, name, plan: plan || 'غير محدد', status: 'نشط', paymentStatus: 'مدفوع', joinDate: new Date().toISOString().split('T')[0], expiryDate: formattedDate || 'غير محدد' });
        }
      });
    } else {
      pastedText.split('\n').forEach((line) => {
        let nameParts = []; let plan = ''; let expDate = '';
        line.split(/[\t, ]+/).forEach(val => {
          val = val.trim();
          if (!val) return;
          if (val.match(/^\d{2,4}[\/\-\.]\d{2}[\/\-\.]\d{2,4}$/)) expDate = val; 
          else if (val.toUpperCase().match(/FIBER|FTTH|BASIC|MBPS/)) plan = val; 
          else if (val.match(/[\u0600-\u06FF]/) && !val.includes(':')) {
              const excludedWords = ['دينار', 'نشط', 'مدفوع', 'غير محدد', 'متصل', 'غير متصل', 'محفظة', 'بطاقة', 'دفعة', 'شهر', 'سنة', 'يوم', 'نيسان', 'آذار', 'شباط', 'كانون', 'تموز', 'أيلول', 'تشرين', 'حزيران', 'أيار', 'آب', 'ص', 'م'];
              if (!excludedWords.some(w => val === w || val.includes(w)) && !val.match(/\d/)) nameParts.push(val);
          }
        });
        let name = nameParts.join(' ').replace(/\s*بلا\s*/g, ' ').replace(/\s+/g, ' ').trim();
        if (expDate.match(/\d{2}[\.\/\-]\d{2}[\.\/\-]\d{2,4}/)) {
          const parts = expDate.split(/[\.\/\-]/);
          let year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
          expDate = `${year}-${parts[1]}-${parts[0]}`;
        }
        if (name && name.length > 2 && expDate) {
          const uniqueKey = name + "_" + expDate;
          newCustomersMap.set(uniqueKey, { id: uniqueKey, name, plan: plan || 'غير محدد', status: 'نشط', paymentStatus: 'مدفوع', joinDate: new Date().toISOString().split('T')[0], expiryDate: expDate });
        }
      });
    }

    const newCustomers = Array.from(newCustomersMap.values());
    if (newCustomers.length > 0) {
      let addedCount = 0;
      newCustomers.forEach(nc => {
        if (!customers.find(c => c.name === nc.name && c.expiryDate === nc.expiryDate)) {
          saveDoc('customers', nc.id, nc);
          addedCount++;
        }
      });
      showToast(`نجاح! تم استخراج وإضافة ${addedCount} مشترك جديد لقاعدة البيانات.`, 'success');
      setIsPasteModalOpen(false); setPastedText('');
    } else {
      showToast('لم يتم العثور على بيانات صالحة للمشتركين.', 'error');
    }
  };

  // ==========================================
  // --- دوال الموظفين (HR) ---
  // ==========================================
  const handleSaveEmployee = () => {
    if (!currentEmp.name || !currentEmp.role || currentEmp.baseSalary <= 0) return showToast('يرجى تعبئة الحقول الأساسية للموظف', 'error');
    if (currentEmp.id) {
      saveDoc('employees', currentEmp.id, { ...currentEmp });
      showToast('تم تعديل بيانات الموظف بنجاح', 'success');
    } else {
      const newId = Date.now().toString();
      saveDoc('employees', newId, { ...currentEmp, id: newId, bonus: 0, deduction: 0, attendancePenalty: 0, absentDays: 0, leaves: 0, history: [] });
      showToast('تمت إضافة الموظف بنجاح', 'success');
    }
    setEmpModalOpen(false);
  };

  const handleDeleteEmployee = (empId) => { delDoc('employees', empId); showToast('تم حذف الموظف بنجاح', 'success'); };

  const handleFingerprintSubmit = () => {
    if (!attendanceData.empId) return showToast('يرجى اختيار الموظف', 'error');
    const emp = employees.find(e => e.id.toString() === attendanceData.empId.toString());
    if(!emp) return;
    let updated = { ...emp };
    const dailyWage = Math.round(emp.baseSalary / 30);
    const dateStr = new Date().toISOString().split('T')[0];
    let historyLog = null;
    
    if (attendanceData.status === 'absent') {
      updated.absentDays += 1; updated.attendancePenalty += dailyWage;
      historyLog = { id: Date.now(), date: dateStr, type: 'absent', amount: dailyWage, note: 'غياب تم تسجيله من نظام البصمة' };
      showToast(`تم تسجيل غياب وخصم ${dailyWage.toLocaleString()} د.ع من ${emp.name}`, 'success');
    } else if (attendanceData.status === 'late') {
      updated.attendancePenalty += Number(attendanceData.penaltyAmount);
      historyLog = { id: Date.now(), date: dateStr, type: 'late', amount: Number(attendanceData.penaltyAmount), note: 'تأخير تم تسجيله من نظام البصمة' };
      showToast(`تم تسجيل تأخير وخصم ${Number(attendanceData.penaltyAmount).toLocaleString()} د.ع من ${emp.name}`, 'success');
    }
    if (historyLog) updated.history = [historyLog, ...(updated.history || [])];
    
    saveDoc('employees', emp.id, updated);
    setFingerprintModalOpen(false); setAttendanceData({ empId: '', status: 'absent', penaltyAmount: 0 });
  };

  const handleEmployeeAction = () => {
    if (Number(empActionModal.amount) <= 0 && empActionModal.type !== 'leave') return showToast('يرجى إدخال قيمة صحيحة', 'error');
    const emp = employees.find(e => e.id === empActionModal.empId);
    if(!emp) return;
    let updated = { ...emp };
    const dateStr = new Date().toISOString().split('T')[0];
    let amountNum = Number(empActionModal.amount);
    
    if (empActionModal.type === 'bonus') updated.bonus += amountNum;
    if (empActionModal.type === 'deduction') updated.deduction += amountNum;
    if (empActionModal.type === 'leave') { updated.leaves += amountNum; if(amountNum > 0) updated.status = 'إجازة'; }
    const historyLog = { id: Date.now(), date: dateStr, type: empActionModal.type, amount: amountNum, note: empActionModal.note || 'بدون ملاحظات' };
    updated.history = [historyLog, ...(updated.history || [])];

    saveDoc('employees', emp.id, updated);
    
    if (empActionModal.type === 'bonus') {
       const finId = Date.now().toString();
       saveDoc('finances', finId, { id: finId, type: 'expense', amount: amountNum, date: dateStr, description: `مكافأة للموظف: ${emp.name} - ${empActionModal.note}` });
    }
    showToast('تم تسجيل الإجراء بنجاح', 'success');
    setEmpActionModal({ open: false, type: '', empId: null, amount: '', note: '' });
  };

  // --- Gemini AI ---
  const callGeminiAPI = async (prompt) => {
    const apiKey = ""; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    for (let i = 0; i < 6; i++) {
      try {
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
        if (!response.ok) throw new Error('API Error');
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "لم يتم توليد أي نص.";
      } catch (error) {
        if (i === 5) return "عذراً، حدث خطأ أثناء الاتصال.";
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  };

  const handleGenerateMessage = async (customer) => {
    setAiModal({ isOpen: true, title: `✨ رسالة ذكية لـ: ${customer.name}`, content: '', isLoading: true });
    const prompt = `اكتب رسالة SMS قصيرة وودية للمشترك "${customer.name}". نوع اشتراكه: "${customer.plan}". تاريخ انتهاء الاشتراك: "${customer.expiryDate}". تذكره بالتجديد.`;
    const response = await callGeminiAPI(prompt);
    setAiModal({ isOpen: true, title: `✨ رسالة المشترك: ${customer.name}`, content: response, isLoading: false });
  };

  const handleFinancialAnalysis = async () => {
    setAiModal({ isOpen: true, title: `✨ المستشار المالي الذكي`, content: '', isLoading: true });
    const prompt = `إجمالي الإيرادات: ${totalIncome}. المصروفات: ${totalExpense}. الأرباح: ${netProfit}. أعطني تحليلاً مالياً قصيراً جداً.`;
    const response = await callGeminiAPI(prompt);
    setAiModal({ isOpen: true, title: `✨ التحليل المالي والنصيحة`, content: response, isLoading: false });
  };

  // --- مكونات الواجهة (Views) ---
  const SidebarItem = ({ icon: Icon, label, id }) => (
    <button onClick={() => setActiveTab(id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${activeTab === id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
      <Icon size={20} /><span className={`font-medium ${!isSidebarOpen && 'hidden md:block'}`}>{label}</span>
    </button>
  );

  const CircularProgress = ({ label, value, color, percent }) => {
    const radius = 18; const circumference = 2 * Math.PI * radius; const strokeDashoffset = circumference - (percent / 100) * circumference;
    return (
      <div className="flex flex-col items-center justify-center">
        <p className="text-xs text-slate-500 mb-2 font-medium">{label}</p>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-slate-800">{value}</span>
          <svg className="w-10 h-10 transform -rotate-90">
            <circle cx="20" cy="20" r="18" stroke="#f1f5f9" strokeWidth="4" fill="transparent" />
            <circle cx="20" cy="20" r="18" stroke={color} strokeWidth="4" fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className="transition-all duration-1000 ease-out" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    );
  };

  const DashboardView = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-800 border-b-2 border-blue-500 pb-1 inline-block">الاشتراكات</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 divide-x divide-x-reverse divide-slate-100">
          <CircularProgress label="فعال" value={activeCustomersCount} color="#22c55e" percent={(activeCustomersCount/totalCustomersCount)*100 || 0} />
          <CircularProgress label="انتهاء الصلاحية عن قريب" value={expiringSoonCount} color="#eab308" percent={(expiringSoonCount/totalCustomersCount)*100 || 0} />
          <CircularProgress label="منتهي الصلاحية" value={expiredCustomersCount} color="#ef4444" percent={(expiredCustomersCount/totalCustomersCount)*100 || 0} />
          <CircularProgress label="إجمالي" value={totalCustomersCount} color="#3b82f6" percent={100} />
        </div>
      </div>
    </div>
  );

  const CustomersView = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">إدارة المشتركين</h2>
        <div className="flex gap-2">
          <button onClick={() => { customers.forEach(c => delDoc('customers', c.id)); showToast('تم تفريغ المشتركين','success')}} className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm text-sm">
            <Trash2 size={18} /><span className="hidden sm:inline">تفريغ</span>
          </button>
          <button onClick={() => setIsPasteModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm text-sm">
            <ClipboardPaste size={18} /><span>استيراد سريع (نسخ ولصق)</span>
          </button>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-100 sticky top-0 z-10">
              <tr>
                <th className="p-4 font-medium">اسم المشترك</th>
                <th className="p-4 font-medium">نوع الاشتراك</th>
                <th className="p-4 font-medium">تاريخ الانتهاء</th>
                <th className="p-4 font-medium">الحالة</th>
                <th className="p-4 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c, idx) => (
                <tr key={`${c.id}_${idx}`} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-medium text-slate-800">{c.name}</td>
                  <td className="p-4 text-slate-600">{c.plan}</td>
                  <td className="p-4"><span className={`font-medium ${checkIsExpired(c.expiryDate) ? 'text-red-600' : 'text-slate-600'}`}>{c.expiryDate}</span></td>
                  <td className="p-4">{checkIsExpired(c.expiryDate) ? <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 shadow-sm">منتهي الصلاحية</span> : <span className="px-3 py-1 rounded-full text-xs font-medium shadow-sm bg-green-100 text-green-700">نشط</span>}</td>
                  <td className="p-4 flex gap-2">
                    <button onClick={() => handleGenerateMessage(c)} className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-2 py-1 rounded text-xs flex items-center gap-1 transition-colors shadow-sm"><Sparkles size={14} /> رسالة ✨</button>
                    <button onClick={() => delDoc('customers', c.id)} className="text-red-500 px-2"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-slate-500">لا يوجد مشتركون حالياً. اضغط على "استيراد سريع" لإضافة البيانات.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const FinanceView = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">الحسابات المالية</h2>
        <button onClick={handleFinancialAnalysis} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm text-sm"><Bot size={18} /><span>✨ تحليل ذكي</span></button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 p-6 rounded-xl"><p className="text-green-800 mb-2 font-medium">إجمالي الإيرادات</p><h3 className="text-2xl font-bold text-green-600">{totalIncome.toLocaleString()} د.ع</h3></div>
        <div className="bg-red-50 border border-red-200 p-6 rounded-xl"><p className="text-red-800 mb-2 font-medium">إجمالي المصروفات</p><h3 className="text-2xl font-bold text-red-600">{totalExpense.toLocaleString()} د.ع</h3></div>
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl"><p className="text-blue-800 mb-2 font-medium">صافي الأرباح</p><h3 className="text-2xl font-bold text-blue-600">{netProfit.toLocaleString()} د.ع</h3></div>
      </div>
    </div>
  );

  const EmployeesView = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">إدارة الموظفين (الرواتب والحضور)</h2>
        <div className="flex gap-2">
          <button onClick={() => setFingerprintModalOpen(true)} className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm text-sm font-bold"><Fingerprint size={18} /><span>نظام البصمة</span></button>
          <button onClick={() => { setCurrentEmp({ name: '', role: '', baseSalary: '', phone: '', status: 'مداوم', offDay: 'الجمعة' }); setEmpModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm text-sm"><Plus size={18} /><span>إضافة موظف</span></button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map(emp => {
          const totalDeductions = emp.deduction + (emp.attendancePenalty || 0);
          const netSalary = emp.baseSalary + emp.bonus - totalDeductions;
          const isTodayOff = emp.offDay === todayName;
          const displayStatus = isTodayOff ? 'إجازة دورية' : emp.status;

          return (
          <div key={emp.id} className={`bg-white rounded-xl border ${isTodayOff ? 'border-slate-300 opacity-80' : 'border-slate-100'} shadow-sm p-6 flex flex-col gap-4 hover:shadow-md transition-all relative overflow-hidden`}>
            <div className={`absolute top-0 right-0 w-1 h-full ${isTodayOff ? 'bg-slate-400' : emp.status === 'مداوم' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-bold text-xl">{emp.name.charAt(0)}</div>
                <div><h3 className="text-lg font-bold text-slate-800">{emp.name}</h3><p className="text-blue-600 font-medium text-xs">{emp.role}</p></div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${isTodayOff ? 'bg-slate-100 text-slate-600 border border-slate-200' : emp.status === 'مداوم' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{displayStatus}</span>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-lg space-y-3 border border-slate-100 mt-2">
              <div className="flex justify-between text-sm"><span className="text-slate-500">الراتب الاسمي:</span><span className="font-bold text-slate-700">{emp.baseSalary.toLocaleString()} د.ع</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">المكافآت:</span><span className="font-bold text-green-600">+{emp.bonus.toLocaleString()} د.ع</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500 cursor-help" title={`سلف وخصومات يدوية: ${emp.deduction}\nغيابات وتأخير (بصمة): ${emp.attendancePenalty}`}>إجمالي الخصم:</span><span className="font-bold text-red-600">-{totalDeductions.toLocaleString()} د.ع</span></div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm"><span className="text-slate-800 font-bold">الصافي للدفع:</span><span className="font-black text-blue-700 text-base">{netSalary.toLocaleString()} د.ع</span></div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs px-1">
              <div className="flex items-center gap-1 text-slate-600 bg-slate-100 p-2 rounded-md"><CalendarDays size={14}/><span>إجازات: <strong>{emp.leaves}</strong></span></div>
              <div className="flex items-center gap-1 text-slate-600 bg-red-50 p-2 rounded-md"><UserMinus size={14} className="text-red-500"/><span>غيابات: <strong className="text-red-600">{emp.absentDays || 0}</strong></span></div>
              <div className="col-span-2 text-slate-500 mt-1 flex justify-between items-center px-1"><span>الهاتف: {emp.phone}</span><span className="font-bold text-slate-400">عطلته: {emp.offDay}</span></div>
            </div>

            <div className="flex justify-between gap-2 pt-3 border-t border-slate-100 mt-auto">
              <div className="flex gap-1">
                <button onClick={() => setEmpActionModal({ open: true, type: 'bonus', empId: emp.id, amount: '', note: '' })} className="bg-green-50 text-green-600 hover:bg-green-100 p-2 rounded-lg" title="إضافة مكافأة"><Gift size={16} /></button>
                <button onClick={() => setEmpActionModal({ open: true, type: 'deduction', empId: emp.id, amount: '', note: '' })} className="bg-red-50 text-red-600 hover:bg-red-100 p-2 rounded-lg" title="سلفة"><TrendingDown size={16} /></button>
                <button onClick={() => setEmpActionModal({ open: true, type: 'leave', empId: emp.id, amount: '1', note: '' })} className="bg-yellow-50 text-yellow-600 hover:bg-yellow-100 p-2 rounded-lg" title="تسجيل إجازة"><CalendarDays size={16} /></button>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setEmpDetailsModal({ open: true, employee: emp })} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg" title="السجل"><FileText size={16} /></button>
                <button onClick={() => { setCurrentEmp(emp); setEmpModalOpen(true); }} className="text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 p-2 rounded-lg" title="تعديل"><Edit2 size={16}/></button>
                <button onClick={() => handleDeleteEmployee(emp.id)} className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-lg" title="حذف"><Trash2 size={16}/></button>
              </div>
            </div>
          </div>
          );
        })}
        {employees.length === 0 && <p className="col-span-3 text-center text-slate-500 py-10">لا يوجد موظفون في قاعدة البيانات حالياً.</p>}
      </div>
    </div>
  );

  const InventoryView = () => {
    const filteredInventory = inventoryFilter === 'all' ? inventory : inventory.filter(item => item.category === inventoryFilter);
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-slate-800">إدارة المخزن والمواد</h2>
          <div className="flex bg-slate-200/50 p-1 rounded-lg">
            <button onClick={() => setInventoryTab('general')} className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${inventoryTab === 'general' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'}`}>المخزن العام</button>
            <button onClick={() => setInventoryTab('technicians')} className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${inventoryTab === 'technicians' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'}`}>مخزن الفنيين</button>
            <button onClick={() => setInventoryTab('requests')} className={`px-4 py-2 rounded-md text-sm font-bold transition-colors relative ${inventoryTab === 'requests' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'}`}>
              طلبات المواد
              {materialRequests.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{materialRequests.length}</span>}
            </button>
          </div>
        </div>

        {inventoryTab === 'general' && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <select value={inventoryFilter} onChange={(e) => setInventoryFilter(e.target.value)} className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm shadow-sm outline-none">
                <option value="all">جميع الأصناف</option>
                <option value="أجهزة بث">أجهزة بث</option>
                <option value="كابلات">كابلات</option>
                <option value="أجهزة شبكة">أجهزة شبكة</option>
              </select>
              <div className="flex gap-2">
                <button onClick={() => setRequestModalOpen(true)} className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold"><Inbox size={18} />محاكاة طلب فني</button>
                <button onClick={() => setInvItemModal({ open: true, isEdit: false, id: null, itemName: '', category: 'أجهزة بث', quantity: '', unitPrice: '' })} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold"><Plus size={18} />إضافة مادة</button>
              </div>
            </div>
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-100 sticky top-0 z-10">
                  <tr><th className="p-4 font-medium">اسم المادة</th><th className="p-4 font-medium">الصنف</th><th className="p-4 font-medium">الرصيد المتوفر</th><th className="p-4 font-medium">إجراءات</th></tr>
                </thead>
                <tbody>
                  {filteredInventory.map(item => (
                    <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="p-4 font-bold text-slate-800">{item.itemName}</td>
                      <td className="p-4 text-slate-600">{item.category}</td>
                      <td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${item.quantity < 10 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{item.quantity}</span></td>
                      <td className="p-4 flex gap-2">
                         <button onClick={() => setDispenseModal({ open: true, item: item, techName: '', quantity: 1 })} className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-md flex items-center gap-1 font-bold text-xs"><Send size={14} /> صرف لفني</button>
                         <button onClick={() => setInvItemModal({ open: true, isEdit: true, id: item.id, itemName: item.itemName, category: item.category, quantity: item.quantity, unitPrice: item.unitPrice })} className="text-slate-500 hover:bg-slate-200 p-1.5 rounded-md"><Edit size={14} /></button>
                         <button onClick={() => delDoc('inventory', item.id)} className="text-red-500 hover:bg-red-100 p-1.5 rounded-md"><Trash2 size={14}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {inventoryTab === 'technicians' && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
             <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center"><span className="font-bold text-slate-700">المواد بعهدة الفنيين</span></div>
             <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-100 sticky top-0 z-10">
                  <tr><th className="p-4 font-medium">اسم الفني</th><th className="p-4 font-medium">المادة / الجهاز</th><th className="p-4 font-medium">الكمية</th><th className="p-4 font-medium">إجراءات</th></tr>
                </thead>
                <tbody>
                  {techInventory.map(item => (
                    <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="p-4 font-bold text-blue-700">{item.techName}</td>
                      <td className="p-4 font-medium text-slate-800">{item.itemName}</td>
                      <td className="p-4 font-bold text-slate-800">{item.quantity}</td>
                      <td className="p-4"><button onClick={() => setReturnModal({ open: true, techItem: item, quantity: 1 })} className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1"><Undo2 size={14}/> إرجاع</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {inventoryTab === 'requests' && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
             <div className="p-4 border-b border-slate-100 bg-slate-50/50"><span className="font-bold text-slate-700">طلبات التجهيز المعلقة</span></div>
             <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-100 sticky top-0 z-10">
                  <tr><th className="p-4 font-medium">الفني</th><th className="p-4 font-medium">المادة المطلوبة</th><th className="p-4 font-medium">الكمية</th><th className="p-4 font-medium">الإجراء</th></tr>
                </thead>
                <tbody>
                  {materialRequests.map(req => (
                    <tr key={req.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="p-4 font-bold text-slate-800">{req.techName}</td>
                      <td className="p-4 font-medium text-slate-700">{req.itemName}</td>
                      <td className="p-4 font-bold text-blue-600">{req.requestedQuantity}</td>
                      <td className="p-4 flex gap-2">
                        <button onClick={() => handleApproveRequest(req)} className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1 rounded flex items-center gap-1 text-xs font-bold"><CheckCircle size={14} /> موافقة</button>
                        <button onClick={() => handleRejectRequest(req.id)} className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded flex items-center gap-1 text-xs font-bold"><XCircle size={14} /> رفض</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 flex text-slate-800 font-sans relative">
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all duration-300 ease-in-out fixed h-full z-20`}>
        <div className="p-4 flex justify-between items-center border-b border-slate-800 h-16">
          {isSidebarOpen && <div className="flex items-center gap-2 text-xl font-bold text-blue-400"><Wifi size={28} /><span>FLY NET</span></div>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-300">{isSidebarOpen ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
        <nav className="p-4 space-y-2 mt-4">
          <SidebarItem icon={LayoutDashboard} label="لوحة القيادة" id="dashboard" />
          <SidebarItem icon={Users} label="المشتركين" id="customers" />
          <SidebarItem icon={DollarSign} label="الحسابات المالية" id="finance" />
          <SidebarItem icon={Briefcase} label="الموظفين" id="employees" />
          <SidebarItem icon={Package} label="المخزن" id="inventory" />
        </nav>
      </aside>

      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'mr-64' : 'mr-20'}`}>
        <header className="bg-white h-16 border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4 text-slate-500"><span className="hidden sm:inline font-medium">مرحباً بك في نظام إدارة FLY NET (متصل بـ Firebase 🟢)</span></div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="relative p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
                <Bell size={20} />
                {unreadCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white text-[10px] text-white flex items-center justify-center font-bold">{unreadCount}</span>}
              </button>
              {isNotifOpen && (
                <div className="absolute top-12 left-0 w-80 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-200">
                  <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">الإشعارات</h3>
                    {unreadCount > 0 && <button onClick={markAllAsRead} className="text-xs text-blue-600 hover:text-blue-800 font-bold transition-colors">تحديد كـ مقروء</button>}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map(notif => (
                      <div key={notif.id} className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!notif.read ? 'bg-blue-50/30' : ''}`}>
                        <div className="flex gap-3">
                          <div className={`mt-1 shrink-0 ${notif.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>{notif.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}</div>
                          <div>
                            <p className={`text-sm font-bold ${!notif.read ? 'text-slate-800' : 'text-slate-600'}`}>{notif.title}</p>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{notif.message}</p>
                            <p className="text-[10px] text-slate-400 mt-2">{notif.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 border-slate-200 pr-4">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">م</div>
              <span className="font-medium text-sm hidden sm:inline text-slate-700">مدير النظام</span>
            </div>
          </div>
        </header>

        <div className="p-6">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'customers' && <CustomersView />}
          {activeTab === 'finance' && <FinanceView />}
          {activeTab === 'employees' && <EmployeesView />}
          {activeTab === 'inventory' && <InventoryView />}
        </div>
      </main>

      {/* نوافذ النظام المتعددة */}
      {invItemModal.open && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-blue-50">
              <h3 className="font-bold text-blue-800 flex items-center gap-2 text-lg"><Package size={20} />{invItemModal.isEdit ? 'تعديل المادة' : 'إضافة مادة جديدة'}</h3>
              <button onClick={() => setInvItemModal({...invItemModal, open: false})} className="text-slate-400 bg-white rounded-full p-1"><X size={20} /></button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div><label className="block text-sm font-medium mb-1">اسم المادة</label><input type="text" className="w-full border rounded-lg px-4 py-2 outline-none" value={invItemModal.itemName} onChange={e => setInvItemModal({...invItemModal, itemName: e.target.value})} /></div>
              <div>
                <label className="block text-sm font-medium mb-1">الصنف</label>
                <select className="w-full border rounded-lg px-4 py-2 outline-none" value={invItemModal.category} onChange={e => setInvItemModal({...invItemModal, category: e.target.value})}>
                  <option value="أجهزة بث">أجهزة بث</option><option value="كابلات">كابلات</option><option value="أجهزة شبكة">أجهزة شبكة</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">الكمية</label><input type="number" min="0" className="w-full border rounded-lg px-4 py-2 outline-none" value={invItemModal.quantity} onChange={e => setInvItemModal({...invItemModal, quantity: e.target.value})} /></div>
                <div><label className="block text-sm font-medium mb-1">السعر (د.ع)</label><input type="number" min="0" className="w-full border rounded-lg px-4 py-2 outline-none" value={invItemModal.unitPrice} onChange={e => setInvItemModal({...invItemModal, unitPrice: e.target.value})} /></div>
              </div>
            </div>
            <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setInvItemModal({...invItemModal, open: false})} className="bg-white border px-4 py-2 rounded-lg text-sm font-bold">إلغاء</button>
              <button onClick={handleSaveInvItem} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold">حفظ المادة</button>
            </div>
          </div>
        </div>
      )}

      {dispenseModal.open && dispenseModal.item && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-5 border-b flex justify-between items-center bg-blue-50">
              <h3 className="font-bold text-blue-800 flex items-center gap-2"><Send size={20} /> صرف مباشر لفني</h3>
              <button onClick={() => setDispenseModal({...dispenseModal, open: false})} className="text-slate-400 bg-white rounded-full p-1"><X size={20} /></button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="bg-blue-100/50 text-blue-800 p-3 rounded-lg text-sm border border-blue-200"><strong>المادة:</strong> {dispenseModal.item.itemName} <br/><strong>المتاح:</strong> {dispenseModal.item.quantity} قطعة</div>
              <div>
                <label className="block text-sm font-medium mb-1">اختر الفني</label>
                <select className="w-full border rounded-lg px-4 py-2 outline-none" value={dispenseModal.techName} onChange={e => setDispenseModal({...dispenseModal, techName: e.target.value})}>
                  <option value="">-- اختر الفني --</option>
                  {employees.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium mb-1">الكمية المصروفة</label><input type="number" min="1" max={dispenseModal.item.quantity} className="w-full border rounded-lg px-4 py-2 outline-none font-bold" value={dispenseModal.quantity} onChange={e => setDispenseModal({...dispenseModal, quantity: e.target.value})} /></div>
            </div>
            <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setDispenseModal({...dispenseModal, open: false})} className="bg-white border px-4 py-2 rounded-lg text-sm font-bold">إلغاء</button>
              <button onClick={handleDirectDispense} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold">تأكيد الصرف</button>
            </div>
          </div>
        </div>
      )}

      {returnModal.open && returnModal.techItem && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-5 border-b flex justify-between items-center bg-red-50">
              <h3 className="font-bold text-red-800 flex items-center gap-2"><Undo2 size={20} />إرجاع للمخزن العام</h3>
              <button onClick={() => setReturnModal({...returnModal, open: false})} className="text-slate-400 bg-white rounded-full p-1"><X size={20} /></button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="bg-red-50 text-red-800 p-3 rounded-lg text-sm border border-red-200"><strong>الفني:</strong> {returnModal.techItem.techName} <br/><strong>المادة:</strong> {returnModal.techItem.itemName} <br/><strong>بعهدته:</strong> {returnModal.techItem.quantity} قطعة</div>
              <div><label className="block text-sm font-medium mb-1">الكمية المسترجعة</label><input type="number" min="1" max={returnModal.techItem.quantity} className="w-full border-red-300 border rounded-lg px-4 py-2 outline-none font-bold" value={returnModal.quantity} onChange={e => setReturnModal({...returnModal, quantity: e.target.value})} /></div>
            </div>
            <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setReturnModal({...returnModal, open: false})} className="bg-white border px-4 py-2 rounded-lg text-sm font-bold">إلغاء</button>
              <button onClick={handlePartialReturn} className="bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-bold">تأكيد الإرجاع</button>
            </div>
          </div>
        </div>
      )}

      {requestModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-5 border-b bg-blue-50 flex justify-between"><h3 className="font-bold text-blue-800 flex gap-2"><Inbox size={20} />محاكاة طلب فني</h3><button onClick={() => setRequestModalOpen(false)} className="text-slate-400 bg-white p-1 rounded-full"><X size={20} /></button></div>
            <div className="p-6 flex flex-col gap-4">
              <select className="w-full border rounded-lg px-4 py-2 outline-none" value={newRequest.techName} onChange={e => setNewRequest({...newRequest, techName: e.target.value})}><option value="">-- اختر الفني --</option>{employees.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}</select>
              <select className="w-full border rounded-lg px-4 py-2 outline-none" value={newRequest.itemName} onChange={e => setNewRequest({...newRequest, itemName: e.target.value})}><option value="">-- اختر المادة --</option>{inventory.map(i => <option key={i.id} value={i.itemName}>{i.itemName}</option>)}</select>
              <input type="number" min="1" className="w-full border rounded-lg px-4 py-2 outline-none" value={newRequest.quantity} onChange={e => setNewRequest({...newRequest, quantity: e.target.value})} placeholder="الكمية المطلوبة"/>
            </div>
            <div className="p-4 border-t bg-slate-50 flex justify-end gap-3"><button onClick={() => setRequestModalOpen(false)} className="bg-white border px-4 py-2 rounded-lg text-sm font-bold">إلغاء</button><button onClick={handleSubmitRequest} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold">إرسال</button></div>
          </div>
        </div>
      )}

      {isPasteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b flex justify-between bg-green-50"><h3 className="font-bold text-green-800 flex gap-2"><ClipboardPaste size={20} />استيراد سريع</h3><button onClick={() => setIsPasteModalOpen(false)} className="text-slate-400 bg-white rounded-full p-1"><X size={20} /></button></div>
            <div className="p-6 flex flex-col gap-4 bg-slate-50"><textarea value={pastedText} onChange={(e) => setPastedText(e.target.value)} placeholder="الصق هنا (Ctrl + V)..." className="w-full h-48 p-4 rounded-lg border-2 focus:border-green-500 outline-none resize-none"></textarea></div>
            <div className="p-4 border-t bg-white flex justify-end gap-3"><button onClick={() => setIsPasteModalOpen(false)} className="bg-white border px-6 py-2 rounded-lg text-sm font-bold">إلغاء</button><button onClick={handleSmartPaste} className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-bold flex gap-2"><Sparkles size={18} />إضافة البيانات</button></div>
          </div>
        </div>
      )}

      {empModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-5 border-b flex justify-between bg-blue-50"><h3 className="font-bold text-blue-800 flex gap-2"><Briefcase size={20} />{currentEmp.id ? 'تعديل موظف' : 'إضافة موظف'}</h3><button onClick={() => setEmpModalOpen(false)} className="bg-white p-1 rounded-full"><X size={20} /></button></div>
            <div className="p-6 flex flex-col gap-4">
              <input type="text" className="w-full border rounded-lg px-4 py-2 outline-none" value={currentEmp.name} onChange={e => setCurrentEmp({...currentEmp, name: e.target.value})} placeholder="الاسم" />
              <input type="text" className="w-full border rounded-lg px-4 py-2 outline-none" value={currentEmp.role} onChange={e => setCurrentEmp({...currentEmp, role: e.target.value})} placeholder="الوظيفة" />
              <input type="number" className="w-full border rounded-lg px-4 py-2 outline-none" value={currentEmp.baseSalary} onChange={e => setCurrentEmp({...currentEmp, baseSalary: Number(e.target.value)})} placeholder="الراتب الاسمي" />
              <select className="w-full border rounded-lg px-4 py-2 outline-none" value={currentEmp.offDay} onChange={e => setCurrentEmp({...currentEmp, offDay: e.target.value})}>{daysOfWeek.map(d => <option key={d} value={d}>{d}</option>)}</select>
            </div>
            <div className="p-4 border-t flex justify-end gap-3"><button onClick={() => setEmpModalOpen(false)} className="bg-white border px-4 py-2 rounded-lg font-bold text-sm">إلغاء</button><button onClick={handleSaveEmployee} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold text-sm">حفظ</button></div>
          </div>
        </div>
      )}

      {fingerprintModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-5 border-b flex justify-between bg-purple-50"><h3 className="font-bold text-purple-800 flex gap-2"><Fingerprint size={20} />نظام البصمة</h3><button onClick={() => setFingerprintModalOpen(false)} className="bg-white p-1 rounded-full"><X size={20} /></button></div>
            <div className="p-6 flex flex-col gap-4">
              <select className="w-full border rounded-lg px-4 py-2 outline-none focus:border-purple-500" value={attendanceData.empId} onChange={e => setAttendanceData({...attendanceData, empId: e.target.value})}><option value="">-- اختر الموظف --</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
              <select className="w-full border rounded-lg px-4 py-2 outline-none focus:border-purple-500" value={attendanceData.status} onChange={e => setAttendanceData({...attendanceData, status: e.target.value})}><option value="absent">غائب</option><option value="late">تأخير</option></select>
              {attendanceData.status === 'late' && <input type="number" min="0" className="w-full border rounded-lg px-4 py-2 outline-none focus:border-purple-500" value={attendanceData.penaltyAmount} onChange={e => setAttendanceData({...attendanceData, penaltyAmount: e.target.value})} placeholder="مبلغ الخصم"/>}
            </div>
            <div className="p-4 border-t flex justify-end gap-3"><button onClick={() => setFingerprintModalOpen(false)} className="bg-white border px-4 py-2 rounded-lg text-sm font-bold">إلغاء</button><button onClick={handleFingerprintSubmit} className="bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-bold">تسجيل</button></div>
          </div>
        </div>
      )}

      {empActionModal.open && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className={`p-5 border-b border-slate-100 flex justify-between items-center ${empActionModal.type === 'bonus' ? 'bg-green-50' : empActionModal.type === 'deduction' ? 'bg-red-50' : 'bg-yellow-50'}`}>
              <h3 className={`font-bold flex items-center gap-2 text-lg ${empActionModal.type === 'bonus' ? 'text-green-800' : empActionModal.type === 'deduction' ? 'text-red-800' : 'text-yellow-800'}`}>
                {empActionModal.type === 'bonus' ? <Gift size={20}/> : empActionModal.type === 'deduction' ? <TrendingDown size={20}/> : <CalendarDays size={20}/>}
                {empActionModal.type === 'bonus' ? 'صرف مكافأة' : empActionModal.type === 'deduction' ? 'تسجيل خصم/سلفة' : 'تسجيل إجازة'}
              </h3>
              <button onClick={() => setEmpActionModal({ ...empActionModal, open: false })} className="text-slate-400 bg-white rounded-full p-1"><X size={20} /></button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <input type="number" min="0" className="w-full border rounded-lg px-4 py-2 outline-none font-bold" value={empActionModal.amount} onChange={e => setEmpActionModal({...empActionModal, amount: e.target.value})} placeholder={empActionModal.type === 'leave' ? 'عدد الأيام' : 'المبلغ'} />
              <textarea className="w-full border rounded-lg px-4 py-2 outline-none resize-none" value={empActionModal.note} onChange={e => setEmpActionModal({...empActionModal, note: e.target.value})} rows="2" placeholder="ملاحظات..."></textarea>
            </div>
            <div className="p-4 border-t flex justify-end gap-3"><button onClick={() => setEmpActionModal({ ...empActionModal, open: false })} className="bg-white border px-4 py-2 rounded-lg font-bold text-sm">إلغاء</button><button onClick={handleEmployeeAction} className={`${empActionModal.type === 'bonus' ? 'bg-green-600' : empActionModal.type === 'deduction' ? 'bg-red-600' : 'bg-yellow-500'} text-white px-6 py-2 rounded-lg font-bold text-sm`}>تأكيد</button></div>
          </div>
        </div>
      )}

      {empDetailsModal.open && empDetailsModal.employee && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b flex justify-between bg-slate-50"><h3 className="font-bold text-slate-800 flex gap-2"><FileText size={20} className="text-blue-600" />السجل المالي: {empDetailsModal.employee.name}</h3><button onClick={() => setEmpDetailsModal({ open: false, employee: null })} className="bg-white rounded-full p-1"><X size={20} /></button></div>
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
              {empDetailsModal.employee.history && empDetailsModal.employee.history.length > 0 ? (
                <div className="space-y-4">
                  {empDetailsModal.employee.history.map((log, index) => (
                    <div key={index} className="bg-white border rounded-lg p-4 flex gap-4">
                      <div className={`p-3 rounded-full shrink-0 ${log.type === 'bonus' ? 'bg-green-100 text-green-600' : log.type === 'leave' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}`}>
                        {log.type === 'bonus' ? <Gift size={20} /> : log.type === 'leave' ? <CalendarDays size={20} /> : <TrendingDown size={20} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between"><h4 className="font-bold">{log.type === 'bonus' ? 'مكافأة' : log.type === 'deduction' ? 'خصم/سلفة' : log.type === 'leave' ? 'إجازة' : log.type === 'absent' ? 'غياب' : 'تأخير'}</h4><span className="text-xs bg-slate-100 px-2 py-1">{log.date}</span></div>
                        <p className="text-sm text-slate-600 mb-2">{log.note}</p>
                        {log.amount > 0 && <p className={`text-sm font-bold ${log.type === 'bonus' ? 'text-green-600' : 'text-red-600'}`}>{log.type === 'bonus' ? '+' : '-'}{log.amount.toLocaleString()} {log.type === 'leave' ? 'أيام' : 'د.ع'}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : <div className="text-center py-12 text-slate-400">لا يوجد سجل حركات.</div>}
            </div>
            <div className="p-4 border-t bg-white flex justify-end"><button onClick={() => setEmpDetailsModal({ open: false, employee: null })} className="bg-slate-100 border px-6 py-2 rounded-lg font-bold">إغلاق</button></div>
          </div>
        </div>
      )}

      {toast.show && (
        <div className={`fixed bottom-6 left-6 px-6 py-3 rounded-xl shadow-lg text-white font-medium z-50 flex items-center gap-3 text-sm animate-in slide-in-from-bottom-5 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <TrendingUp size={20} /> : <AlertCircle size={20} />}
          {toast.message}
        </div>
      )}

    </div>
  );
}